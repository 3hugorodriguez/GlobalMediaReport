/* ============================================================
   GMR v4.0 — Data + Renderer
   ============================================================ */

const CONFIG = {
    dataPath: './data/gmr-data.json',
    newsDays: 7,
    months: {
        '01':'Enero','02':'Febrero','03':'Marzo','04':'Abril',
        '05':'Mayo','06':'Junio','07':'Julio','08':'Agosto',
        '09':'Septiembre','10':'Octubre','11':'Noviembre','12':'Diciembre'
    },
    catColors: {
        'grupo-global':         '#122864',
        'sector-cambiario':     '#0ea5e9',
        'sector-aeroportuario': '#7c3aed',
        'medios-efectivo':      '#059669',
        'medios-digital':       '#d97706'
    },
    // Fallbacks Unsplash por categoría — se usan si no hay imagen en el JSON
    fallbackImages: {
        'grupo-global':         'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=75',
        'sector-cambiario':     'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=800&q=75',
        'sector-aeroportuario': 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800&q=75',
        'medios-efectivo':      'https://images.unsplash.com/photo-1554768804-50c1e2b50a6e?w=800&q=75',
        'medios-digital':       'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=75'
    }
};

/* ── HELPERS ───────────────────────────────────────────── */
function validImage(url) {
    if (!url) return false;
    const s = url.trim();
    return s !== ''
        && s !== 'null'
        && !s.includes('placehold.co')
        && !s.includes('placeholder');
}

function fmtDate(str) {
    return new Date(str).toLocaleDateString('es-ES', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

function fmtMonth(key) {
    const [y, m] = key.split('-');
    return `${CONFIG.months[m]} ${y}`;
}

function groupBy(arr, fn) {
    return arr.reduce((acc, item) => {
        const k = fn(item);
        (acc[k] = acc[k] || []).push(item);
        return acc;
    }, {});
}

function monthKey(fecha) {
    const d = new Date(fecha);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

/* ── DATA ──────────────────────────────────────────────── */
async function loadData() {
    const res = await fetch(`${CONFIG.dataPath}?t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success || !json.data) throw new Error('Datos inválidos');

    const data = json.data;
    const now  = new Date();

    // Filtrar ocultas, marcar nuevas, ordenar
    data.noticias = data.noticias
        .filter(n => !n.hidden)
        .map(n => {
            const diff = Math.floor((now - new Date(n.fecha)) / 86400000);
            n.isNew = diff >= 0 && diff <= CONFIG.newsDays;
            return n;
        })
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    data.timestamp = json.timestamp;
    return data;
}

/* ── RENDERER ──────────────────────────────────────────── */
function renderHeader(data) {
    const el  = document.getElementById('statsInfo');
    const cfg = data.config || {};
    if (!el) return;

    const ts  = data.timestamp ? new Date(data.timestamp) : new Date();
    const fmt = ts.toLocaleString('es-ES', {
        day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'
    });
    const newCount = data.noticias.filter(n => n.isNew).length;

    el.innerHTML = `
        ${data.noticias.length} noticias
        ${newCount > 0 ? `· <strong style="color:rgba(255,255,255,0.9)">${newCount} nuevas</strong>` : ''}
        · ${cfg.mes_actual || fmt}
    `;
}

function renderFilters(data) {
    const catEl   = document.getElementById('categoryFilters');
    const monthEl = document.getElementById('monthFilters');
    if (!catEl || !monthEl) return;

    const catCounts   = {};
    const monthCounts = {};

    data.noticias.forEach(n => {
        catCounts[n.categoria]   = (catCounts[n.categoria]   || 0) + 1;
        const mk = monthKey(n.fecha);
        monthCounts[mk]          = (monthCounts[mk]          || 0) + 1;
    });

    // All chip
    catEl.querySelector('[data-category="all"] .chip-count').textContent   = data.noticias.length;
    monthEl.querySelector('[data-month="all"] .chip-count').textContent    = data.noticias.length;

    // Category chips
    data.categorias.forEach(cat => {
        const n = catCounts[cat.Slug] || 0;
        if (!n) return;
        const btn = document.createElement('button');
        btn.className = 'chip';
        btn.setAttribute('data-category', cat.Slug);
        btn.innerHTML = `${cat.Nombre} <span class="chip-count">${n}</span>`;
        catEl.appendChild(btn);
    });

    // Month chips
    Object.keys(monthCounts)
        .sort((a,b) => new Date(b) - new Date(a))
        .forEach(mk => {
            const btn = document.createElement('button');
            btn.className = 'chip';
            btn.setAttribute('data-month', mk);
            btn.innerHTML = `${fmtMonth(mk)} <span class="chip-count">${monthCounts[mk]}</span>`;
            monthEl.appendChild(btn);
        });
}

function renderNews(data) {
    const container = document.getElementById('newsContainer');
    if (!container) return;

    // Quitar skeleton
    const skel = document.getElementById('skeletonLoader');
    if (skel) { skel.style.opacity = '0'; setTimeout(() => skel.remove(), 250); }

    container.innerHTML = '';

    const byMonth = groupBy(data.noticias, n => monthKey(n.fecha));

    Object.keys(byMonth)
        .sort((a,b) => new Date(b) - new Date(a))
        .forEach(mk => {
            container.appendChild(buildMonthBlock(mk, byMonth[mk], data.categorias));
        });

    buildTimeline(Object.keys(byMonth).sort((a,b) => new Date(b)-new Date(a)));
}

function buildMonthBlock(mk, noticias, categorias) {
    const block = document.createElement('div');
    block.className = 'month-block';
    block.setAttribute('data-month', mk);
    block.id = `month-${mk}`;

    block.innerHTML = `
        <div class="month-header">
            <h2 class="month-title">${fmtMonth(mk)}</h2>
            <span class="month-count">${noticias.length} noticias</span>
        </div>
    `;

    const byCat = groupBy(noticias, n => n.categoria);
    categorias
        .filter(c => byCat[c.Slug])
        .forEach(cat => {
            block.appendChild(buildCatBlock(cat, byCat[cat.Slug]));
        });

    return block;
}

function buildCatBlock(cat, noticias) {
    const color = CONFIG.catColors[cat.Slug] || cat.Color;

    const block = document.createElement('div');
    block.className = 'cat-block';
    block.setAttribute('data-category', cat.Slug);
    block.style.setProperty('--cat-color', color);

    block.innerHTML = `
        <div class="cat-header">
            <div class="cat-icon" style="background:${color}">
                <i class="fas ${cat.Icono}"></i>
            </div>
            <span class="cat-name">${cat.Nombre}</span>
            <span class="cat-count">${noticias.length}</span>
        </div>
        <div class="news-grid"></div>
    `;

    const grid = block.querySelector('.news-grid');
    noticias.forEach((n, i) => {
        const card = buildCard(n, cat, color, i === 0 && cat.Slug === 'grupo-global');
        grid.appendChild(card);
    });

    return block;
}

function buildCard(noticia, cat, color, isHero) {
    const article = document.createElement('article');
    article.className = 'card-executive' + (isHero ? ' hero' : '');
    article.setAttribute('data-url', noticia.url);
    article.setAttribute('data-category', noticia.categoria);
    article.style.setProperty('--cat-color', color);

    const isInt   = noticia.alcance === 'Internacional';
    const imgSrc  = validImage(noticia.imagen)
        ? noticia.imagen
        : CONFIG.fallbackImages[noticia.categoria] || CONFIG.fallbackImages['medios-digital'];

    const highlights = (noticia.highlights || []).slice(0, 3);

    article.innerHTML = `
        <div class="card-img">
            <img src="${imgSrc}"
                 alt="${noticia.titulo}"
                 loading="${isHero ? 'eager' : 'lazy'}"
                 onerror="this.src='${CONFIG.fallbackImages[noticia.categoria]}'">
            ${noticia.isNew ? '<div class="card-new"></div>' : ''}
        </div>
        <div class="card-body">
            <div class="card-meta">
                <span class="card-scope ${isInt ? 'int' : ''}">
                    <i class="fas ${isInt ? 'fa-globe' : 'fa-map-marker-alt'}"></i>
                    ${noticia.alcance}
                </span>
                <span class="card-date">${fmtDate(noticia.fecha)}</span>
            </div>
            <h3 class="card-title">${noticia.titulo}</h3>
            ${highlights.length ? `
                <ul class="card-highlights">
                    ${highlights.map(h => `<li>${h}</li>`).join('')}
                </ul>
            ` : ''}
            ${noticia.resumen ? `
                <button class="card-expand" onclick="toggleSummary(this, event)">
                    Ver resumen
                </button>
                <div class="card-summary">${noticia.resumen}</div>
            ` : ''}
            <div class="card-foot">
                <span class="card-source">
                    <i class="fas fa-newspaper"></i>
                    ${noticia.medio}
                </span>
                <a href="${noticia.url}" target="_blank" class="card-link"
                   onclick="event.stopPropagation()">
                    Leer <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        </div>
    `;

    article.addEventListener('click', e => {
        if (e.target.closest('.card-link') || e.target.closest('.card-expand')) return;
        window.open(noticia.url, '_blank');
    });

    return article;
}

function buildTimeline(months) {
    const sidebar = document.createElement('aside');
    sidebar.className = 'timeline-sidebar';
    sidebar.id = 'timelineSidebar';

    const counts = {};
    document.querySelectorAll('.month-block').forEach(mb => {
        counts[mb.getAttribute('data-month')] =
            mb.querySelectorAll('.card-executive').length;
    });

    sidebar.innerHTML = `
        <div class="timeline-label">Timeline</div>
        <ul class="timeline-list">
            ${months.map(mk => `
                <li class="timeline-item" data-tm="${mk}">
                    <span class="timeline-month">${fmtMonth(mk)}</span>
                    <span class="timeline-n">${counts[mk] || ''}</span>
                </li>
            `).join('')}
        </ul>
    `;

    document.body.appendChild(sidebar);
    setTimeout(() => sidebar.classList.add('visible'), 400);
}

function renderBriefing(data) {
    const body = document.getElementById('briefingBody');
    if (!body) return;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const noticias = [...data.noticias]
        .filter(n => new Date(n.fecha) >= cutoff)
        .sort((a, b) => {
            if (a.categoria === 'grupo-global') return -1;
            if (b.categoria === 'grupo-global') return 1;
            return new Date(b.fecha) - new Date(a.fecha);
        });

    const cfg = data.config || {};

    body.innerHTML = `
        <div style="padding:0 0 1.25rem; border-bottom:1px solid var(--line); margin-bottom:1rem;">
            <p style="font-size:0.6875rem;font-weight:700;text-transform:uppercase;
                      letter-spacing:0.07em;color:var(--ink-4);margin-bottom:4px;">
                Global Exchange · Comunicación Corporativa
            </p>
            <p style="font-family:var(--font-head);font-size:1.125rem;
                      font-weight:700;color:var(--ink);">
                ${cfg.mes_actual || 'Informe mensual'}
            </p>
            <p style="font-size:0.8125rem;color:var(--ink-4);margin-top:3px;">
                ${noticias.length} noticias seleccionadas
            </p>
        </div>
        ${noticias.map(n => {
            const color = CONFIG.catColors[n.categoria] || '#122864';
            const cat   = data.categorias.find(c => c.Slug === n.categoria);
            return `
                <div class="briefing-item">
                    <div class="briefing-dot" style="background:${color}"></div>
                    <div>
                        <div class="briefing-title">${n.titulo}</div>
                        <div class="briefing-meta">
                            ${cat?.Nombre || n.categoria} · ${n.medio} · ${fmtDate(n.fecha)}
                        </div>
                        ${n.resumen ? `<div class="briefing-summary">${n.resumen}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('')}
    `;
}

/* ── GLOBALS ───────────────────────────────────────────── */
let allData;

function toggleSummary(btn, e) {
    e.stopPropagation();
    const summary = btn.nextElementSibling;
    const open = summary.classList.toggle('open');
    btn.textContent = open ? 'Ocultar' : 'Ver resumen';
}

function toggleEmptyState(count) {
    const el = document.getElementById('emptyState');
    if (el) el.style.display = count === 0 ? 'flex' : 'none';
}

function resetAllFilters() {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    document.querySelector('[data-category="all"]')?.classList.add('active');
    document.querySelector('[data-month="all"]')?.classList.add('active');

    const si = document.getElementById('searchInput');
    if (si) si.value = '';

    document.querySelectorAll('.month-block, .cat-block, .card-executive')
        .forEach(el => el.style.display = '');

    toggleEmptyState(document.querySelectorAll('.card-executive').length);
    showToast('Filtros restablecidos');
}

function showToast(msg, type = 'info') {
    const wrap = document.getElementById('toastContainer');
    if (!wrap) return;
    const icons = { success: 'fa-check', error: 'fa-xmark', info: 'fa-info' };
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<i class="fas ${icons[type] || 'fa-info'}"></i>${msg}`;
    wrap.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transition = '0.3s ease';
        setTimeout(() => el.remove(), 300);
    }, 2800);
}

/* ── INIT ──────────────────────────────────────────────── */
async function initializeGMR() {
    try {
        allData = await loadData();
        renderHeader(allData);
        renderFilters(allData);
        renderNews(allData);
        renderBriefing(allData);

        requestAnimationFrame(() => {
            initializeFilters();
            initializeSearch();
            initializeScrollEffects();
            initializeTimeline();
            showToast(`${allData.noticias.length} noticias cargadas`, 'success');
        });

    } catch (err) {
        console.error('GMR Error:', err);
        const skel = document.getElementById('skeletonLoader');
        if (skel) skel.innerHTML = `
            <div class="empty-state" style="display:flex;">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error al cargar</h3>
                <p>${err.message}</p>
                <button class="btn-primary" onclick="location.reload()">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>`;
        showToast('Error al cargar datos', 'error');
    }
}

/* ── FILTERS ───────────────────────────────────────────── */
function initializeFilters() {
    let activeCat   = 'all';
    let activeMonth = 'all';

    document.getElementById('categoryFilters')?.addEventListener('click', e => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        document.querySelectorAll('#categoryFilters .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeCat = chip.getAttribute('data-category');
        applyFilters(activeCat, activeMonth);
    });

    document.getElementById('monthFilters')?.addEventListener('click', e => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        document.querySelectorAll('#monthFilters .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeMonth = chip.getAttribute('data-month');
        if (activeMonth !== 'all') {
            document.getElementById(`month-${activeMonth}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        applyFilters(activeCat, activeMonth);
    });

    document.getElementById('resetFilters')?.addEventListener('click', resetAllFilters);
}

function applyFilters(cat, month) {
    let count = 0;

    document.querySelectorAll('.month-block').forEach(mb => {
        const mMatch = month === 'all' || mb.getAttribute('data-month') === month;
        if (!mMatch) { mb.style.display = 'none'; return; }

        let visInMonth = 0;
        mb.querySelectorAll('.cat-block').forEach(cb => {
            const cMatch = cat === 'all' || cb.getAttribute('data-category') === cat;
            cb.style.display = cMatch ? '' : 'none';
            if (cMatch) visInMonth += cb.querySelectorAll('.card-executive').length;
        });

        mb.style.display = visInMonth > 0 ? '' : 'none';
        count += visInMonth;
    });

    toggleEmptyState(count === 0);
    if (count > 0) showToast(`${count} noticia${count !== 1 ? 's' : ''}`);
}

/* ── SEARCH ────────────────────────────────────────────── */
function initializeSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;

    let t;
    input.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => runSearch(input.value.trim().toLowerCase()), 280);
    });
}

function runSearch(term) {
    clearHighlights();

    if (!term) {
        document.querySelectorAll('.card-executive, .cat-block, .month-block')
            .forEach(el => el.style.display = '');
        toggleEmptyState(false);
        return;
    }

    let count = 0;
    document.querySelectorAll('.card-executive').forEach(card => {
        const text = (card.querySelector('.card-title')?.textContent || '') +
                     (card.querySelector('.card-source')?.textContent || '') +
                     (card.querySelector('.card-highlights')?.textContent || '');
        const found = text.toLowerCase().includes(term);
        card.style.display = found ? '' : 'none';
        if (found) {
            count++;
            const titleEl = card.querySelector('.card-title');
            if (titleEl) hlText(titleEl, term);
        }
    });

    document.querySelectorAll('.cat-block').forEach(cb => {
        cb.style.display = cb.querySelectorAll('.card-executive:not([style*="none"])').length
            ? '' : 'none';
    });
    document.querySelectorAll('.month-block').forEach(mb => {
        mb.style.display = mb.querySelectorAll('.cat-block:not([style*="none"])').length
            ? '' : 'none';
    });

    toggleEmptyState(count === 0);
}

function hlText(el, term) {
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let n;
    while (n = walk.nextNode()) {
        if (n.nodeValue.toLowerCase().includes(term)) nodes.push(n);
    }
    nodes.forEach(node => {
        const parts = node.nodeValue.split(new RegExp(`(${term})`, 'gi'));
        const frag  = document.createDocumentFragment();
        parts.forEach(p => {
            if (p.toLowerCase() === term) {
                const mark = document.createElement('mark');
                mark.className = 'search-highlight';
                mark.textContent = p;
                frag.appendChild(mark);
            } else {
                frag.appendChild(document.createTextNode(p));
            }
        });
        node.parentNode.replaceChild(frag, node);
    });
}

function clearHighlights() {
    document.querySelectorAll('.search-highlight').forEach(m => {
        m.parentNode?.replaceChild(document.createTextNode(m.textContent), m);
    });
    document.querySelectorAll('.card-title').forEach(el => el.normalize());
}

/* ── SCROLL ────────────────────────────────────────────── */
function initializeScrollEffects() {
    const header   = document.getElementById('mainHeader');
    const filters  = document.getElementById('filtersBar');
    const progress = document.getElementById('scrollProgress');
    const fab      = document.getElementById('backToTop');
    let last = 0;

    window.addEventListener('scroll', () => {
        const y   = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;

        if (progress) progress.style.width = `${(y / max) * 100}%`;

        if (y > 80) {
            if (y > last + 8) {
                header?.classList.add('hidden');
                filters?.classList.add('header-hidden');
            } else if (y < last - 8) {
                header?.classList.remove('hidden');
                filters?.classList.remove('header-hidden');
            }
        } else {
            header?.classList.remove('hidden');
            filters?.classList.remove('header-hidden');
        }

        fab?.classList.toggle('visible', y > 400);
        last = y;
    }, { passive: true });

    fab?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ── TIMELINE ──────────────────────────────────────────── */
function initializeTimeline() {
    document.querySelectorAll('.timeline-item').forEach(item => {
        item.addEventListener('click', () => {
            const mk = item.getAttribute('data-tm');
            document.getElementById(`month-${mk}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            document.querySelectorAll('.timeline-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                const mk = e.target.getAttribute('data-month');
                document.querySelectorAll('.timeline-item').forEach(i => i.classList.remove('active'));
                document.querySelector(`.timeline-item[data-tm="${mk}"]`)
                    ?.classList.add('active');
            }
        });
    }, { threshold: 0.25 });

    document.querySelectorAll('.month-block').forEach(mb => obs.observe(mb));
}