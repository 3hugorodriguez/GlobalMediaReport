import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { readFileSync, writeFileSync } from 'fs';

// ── CONFIG ────────────────────────────────────────────────
const JSON_PATH = './data/gmr-data.json';
const DELAY_MS  = 1200;
const TIMEOUT   = 8000;

// Imágenes de fallback por categoría — búsqueda en Unsplash
const FALLBACKS = {
    'grupo-global':          'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80',
    'sector-cambiario':      'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=800&q=80',
    'sector-aeroportuario':  'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800&q=80',
    'medios-efectivo':       'https://images.unsplash.com/photo-1554768804-50c1e2b50a6e?w=800&q=80',
    'medios-digital':        'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80'
};

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                  'Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
};

// ── HELPERS ───────────────────────────────────────────────
function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function needsImage(noticia) {
    const img = (noticia.imagen || '').trim();
    return !img
        || img === 'null'
        || img.includes('placehold.co')
        || img.includes('placeholder');
}

function resolveUrl(base, relative) {
    if (!relative) return null;
    if (relative.startsWith('http')) return relative;
    try {
        return new URL(relative, base).href;
    } catch {
        return null;
    }
}

// ── EXTRACTOR ─────────────────────────────────────────────
async function extractImage(url) {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT);

        const res = await fetch(url, {
            headers: HEADERS,
            signal: controller.signal,
            redirect: 'follow'
        });

        clearTimeout(timer);

        if (!res.ok) return null;

        const html = await res.text();
        const $    = cheerio.load(html);

        // Prioridad de extracción
        const candidates = [
            $('meta[property="og:image"]').attr('content'),
            $('meta[name="og:image"]').attr('content'),
            $('meta[property="twitter:image"]').attr('content'),
            $('meta[name="twitter:image"]').attr('content'),
            $('meta[name="twitter:image:src"]').attr('content'),
            $('link[rel="image_src"]').attr('href'),
        ].filter(Boolean);

        // Si ninguna meta tag, buscar primera imagen grande en el artículo
        if (candidates.length === 0) {
            $('article img, .article img, .post img, main img').each((_, el) => {
                const src    = $(el).attr('src') || $(el).attr('data-src');
                const width  = parseInt($(el).attr('width') || '0');
                const height = parseInt($(el).attr('height') || '0');
                if (src && (width >= 400 || height >= 300 || (!width && !height))) {
                    candidates.push(src);
                    return false; // break
                }
            });
        }

        if (candidates.length === 0) return null;

        const resolved = resolveUrl(url, candidates[0]);
        return resolved;

    } catch (err) {
        if (err.name === 'AbortError') {
            console.log(`  ⏱  Timeout: ${url}`);
        } else {
            console.log(`  ⚠️  Error: ${err.message}`);
        }
        return null;
    }
}

// ── MAIN ──────────────────────────────────────────────────
async function main() {
    console.log('🖼️  GMR Image Enricher — arrancando...\n');

    const raw  = readFileSync(JSON_PATH, 'utf-8');
    const data = JSON.parse(raw);
    const noticias = data.data.noticias;

    const toProcess = noticias.filter(needsImage);
    console.log(`📋 Total noticias: ${noticias.length}`);
    console.log(`🔍 Sin imagen válida: ${toProcess.length}\n`);

    if (toProcess.length === 0) {
        console.log('✅ Todas las noticias ya tienen imagen. Nada que hacer.');
        return;
    }

    let enriched = 0;
    let fallback  = 0;
    let failed    = 0;

    for (let i = 0; i < toProcess.length; i++) {
        const n = toProcess[i];
        const title = n.titulo.slice(0, 55);
        console.log(`[${i + 1}/${toProcess.length}] ${title}...`);

        // 1. Intentar URL principal
        let imagen = await extractImage(n.url);

        // 2. Si falla, intentar otros medios
        if (!imagen && n.otros_medios?.length) {
            for (const medio of n.otros_medios) {
                if (!medio.url) continue;
                console.log(`  🔄 Intentando: ${medio.nombre}`);
                imagen = await extractImage(medio.url);
                if (imagen) break;
                await sleep(500);
            }
        }

        // 3. Fallback por categoría (Unsplash)
        if (!imagen) {
            imagen = FALLBACKS[n.categoria] || FALLBACKS['sector-cambiario'];
            console.log(`  🎨 Fallback por categoría: ${n.categoria}`);
            fallback++;
        } else {
            console.log(`  ✅ Imagen: ${imagen.slice(0, 70)}`);
            enriched++;
        }

        // Actualizar en el array original (por referencia)
        const original = noticias.find(x => x.url === n.url && x.titulo === n.titulo);
        if (original) original.imagen = imagen;

        await sleep(DELAY_MS);
    }

    // Actualizar timestamp
    data.timestamp = new Date().toISOString();

    writeFileSync(JSON_PATH, JSON.stringify(data, null, 2), 'utf-8');

    console.log('\n── RESUMEN ──────────────────────────');
    console.log(`✅ Imágenes extraídas:  ${enriched}`);
    console.log(`🎨 Fallbacks usados:    ${fallback}`);
    console.log(`❌ Sin imagen:          ${failed}`);
    console.log(`💾 JSON actualizado: ${JSON_PATH}`);
}

main().catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
});