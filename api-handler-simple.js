/* ============================================================
   GMR v5.0 — Data Service + Renderer
   ============================================================ */

const GMR_CONFIG = {
    dataPath: './data/gmr-data.json',
    newsDays: 7,
    months: {
        '01':'Enero','02':'Febrero','03':'Marzo','04':'Abril',
        '05':'Mayo','06':'Junio','07':'Julio','08':'Agosto',
        '09':'Septiembre','10':'Octubre','11':'Noviembre','12':'Diciembre'
    },
    catColors: {
        'grupo-global':          '#122864',
        'sector-cambiario':      '#0ea5e9',
        'sector-aeroportuario':  '#7c3aed',
        'medios-efectivo':       '#059669',
        'medios-digital':        '#d97706'
    }
};

/* ── DATA SERVICE ──────────────────────────────────────── */
class GMRData {
    static async load() {
        const res = await fetch(`${GMR_CONFIG.dataPath}?t=${Date.now()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.success || !json.data) throw new Error('Datos inválidos');

        const data = json.data;
        const now = new Date();

        data.noticias
            .filter(n => !n.hidden)
            .forEach(n => {
                const d = Math.floor((now - new Date(n.fecha)) / 86400000);
                n.isNew = d >= 0 && d <= GMR_CONFIG.newsDays;
            });

        data.noticias = data.noticias.filter(n => !n.hidden);
        data.noticias.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        data.timestamp = json.timestamp;
        return data;
    }
}

/* ── RENDERER ──────────────────────────────────────────── */
class GMRRenderer {
    constructor(data) {
        this.data  = data;
        this.cats  = data.categorias;
    }

    color(slug) {
        return GMR_CONFIG.catColors[slug]
            || this.cats.find(c => c.Slug === slug)?.Color
            || '#122864';
    }

    fmtMonth(key) {
        const [y, m] = key.split('-');
        return `${GMR_CONFIG.months[m]} ${y}`;
    }

    fmtDate(str) {
        return new Date(str).toLocaleDateString('es-ES', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    }

    /* Header */
    renderHeader() {
        const cfg = this.data.config || {};
        const el = document.getElementById('headerMonth');
        const cnt = document.getElementById('headerCount');
        if (el)  el.textContent = cfg.mes_actual || '—';
        if (cnt) cnt.textContent = `${this.data.noticias.length} noticias`;
    }

    /* Hero — primera noticia de grupo-global */
    renderHero() {
        const section = document.getElementById('heroSection');
        if (!section) return;

        const n = this.data.noticias.find(x => x.categoria === 'grupo-global');
        if (!n) return;

        const color  = this.color('grupo-global');
        const hasImg = n.imagen && !n.imagen.includes('placehold.co');
        const cat    = this.cats.find(c => c.Slug === n.categoria);

        section.style.display = 'block';
        section.innerHTML = `
            <article class="hero-card" data-url="${n.url}">
                <div class="hero-image">
                    ${hasImg
                        ? `<img src="${n.imagen}" alt="${n.titulo}" loading="eager"
                               onerror="this.parentElement.innerHTML='<div class=\\"hero-image-placeholder\\"><i class=\\"fas ${cat?.Icono || 'fa-building'}\\"></i></div>'">`
                        : `<div class="hero-image-placeholder">
                               <i class="fas ${cat?.Icono || 'fa-building'}"></i>
                           </div>`
                    }
                    <span class="hero-tag">Grupo Global</span>
                </div>
                <div class="hero-content">
                    <div class="hero-eyebrow">Destacado del mes</div>
                    <h2 class="hero-title">${this.#breakTitle(n.titulo)}</h2>
                    ${n.resumen ? `<p class="hero-summary">${n.resumen}</p>` : ''}
                    <div class="hero-footer">
                        <div class="hero-meta">
                            <span class="hero-source">${n.medio}</span>
                            <span class="hero-date">${this.fmtDate(n.fecha)}</span>
                        </div>
                        <a href="${n.url}" target="_blank" class="hero-cta"
                           onclick="event.stopPropagation()">
                            Leer <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            </article>
        `;

        section.querySelector('.hero-card')
            ?.addEventListener('click', () => window.open(n.url, '_blank'));
    }

    /* Breaks long title with em for style */
    #breakTitle(title) {
        const words = title.split(' ');
        if (words.length <= 5) return title;
        const half = Math.ceil(words.length / 2);
        return words.slice(0, half).join(' ') +
               ` <em>${words.slice(half).join(' ')}</em>`;
    }

    /* Filters */
    renderFilters() {
        const catContainer   = document.getElementById('catFilters');
        const monthContainer = document.getElementById('monthFilters');
        if (!catContainer || !monthContainer) return;

        const catCounts   = {};
        const monthCounts = {};

        this.data.noticias.forEach(n => {
            catCounts[n.categoria] = (catCounts[n.categoria] || 0) + 1;
            const d = new Date(n.fecha);
            const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
            monthCounts[k] = (monthCounts[k] || 0) + 1;
        });

        /* Category chips */
        const allCatBtn = catContainer.querySelector('[data-category="all"]');
        if (allCatBtn) {
            allCatBtn.innerHTML = `
                <span class="chip-dot" style="background:var(--ink)"></span>
                Todo <sup>${this.data.noticias.length}</sup>
            `;
        }

        this.cats.forEach(cat => {
            if (!catCounts[cat.Slug]) return;
            const color = this.color(cat.Slug);
            const btn = document.createElement('button');
            btn.className = 'filter-chip';
            btn.setAttribute('data-category', cat.Slug);
            btn.innerHTML = `
                <span class="chip-dot" style="background:${color}"></span>
                ${cat.Nombre}
                <sup>${catCounts[cat.Slug]}</sup>
            `;
            catContainer.appendChild(btn);
        });

        /* Month chips */
        const months = Object.keys(monthCounts).sort((a,b) => new Date(b)-new Date(a));
        months.forEach(m => {
            const btn = document.createElement('button');
            btn.className = 'filter-chip';
            btn.setAttribute('data-month', m);
            btn.textContent = this.fmtMonth(m);
            monthContainer.appendChild(btn);
        });
    }

    /* All news */
    renderNews() {
        const container = document.getElementById('newsContainer');
        if (!container) return;

        const skel = document.getElementById('skeletonLoader');
        if (skel) { skel.style.opacity='0'; setTimeout(()=>skel.remove(),300); }

        container.innerHTML = '';

        /* Group by month */
        const byMonth = {};
        this.data.noticias.forEach(n => {
            const d = new Date(n.fecha);
            const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
            (byMonth[k] = byMonth[k] || []).push(n);
        });

        Object.keys(byMonth)
            .sort((a,b) => new Date(b)-new Date(a))
            .forEach(month => {
                container.appendChild(this.#monthBlock(month, byMonth[month]));
            });
    }

    #monthBlock(month, noticias) {
        const block = document.createElement('div');
        block.className = 'month-block';
        block.setAttribute('data-month', month);
        block.id = `m-${month}`;

        block.innerHTML = `
            <div class="month-label">
                <span class="month-label-text">${this.fmtMonth(month)}</span>
                <span class="month-label-count">${noticias.length} noticias</span>
            </div>
        `;

        /* Group by category */
        const byCat = {};
        noticias.forEach(n => (byCat[n.categoria] = byCat[n.categoria] || []).push(n));

        this.cats
            .filter(c => byCat[c.Slug])
            .forEach(cat => {
                block.appendChild(this.#catBlock(cat, byCat[cat.Slug]));
            });

        return block;
    }

    #catBlock(cat, noticias) {
        const color = this.color(cat.Slug);
        const block = document.createElement('div');
        block.className = 'cat-block';
        block.setAttribute('data-category', cat.Slug);

        block.innerHTML = `
            <div class="cat-label">
                <span class="cat-name" style="color:${color}">
                    <i class="fas ${cat.Icono}"></i>
                    ${cat.Nombre}
                </span>
                <span class="cat-count">${noticias.length}</span>
                <div class="cat-line"></div>
            </div>
        `;

        const grid = document.createElement('div');
        grid.className = 'news-grid';

        noticias.forEach((n, i) => {
            const card = this.#card(n, cat, color);
            /* Tercera card → full row */
            if (i === 2 && noticias.length > 2) card.classList.add('full-row');
            grid.appendChild(card);
        });

        block.appendChild(grid);
        return block;
    }

    #card(n, cat, color) {
        const article = document.createElement('article');
        article.className = 'card';
        article.setAttribute('data-url', n.url);
        article.style.setProperty('--cat-color', color);

        const hasImg = n.imagen && !n.imagen.includes('placehold.co');
        const isInt  = n.alcance === 'Internacional';

        article.innerHTML = `
            <div class="card-img">
                ${hasImg
                    ? `<img src="${n.imagen}" alt="${n.titulo}" loading="lazy"
                           onerror="this.parentElement.innerHTML='<div class=\\"card-img-placeholder\\"><i class=\\"fas ${cat.Icono}\\"></i></div>'">`
                    : `<div class="card-img-placeholder">
                           <i class="fas ${cat.Icono}"></i>
                       </div>`
                }
                ${n.isNew ? '<div class="card-new-badge"></div>' : ''}
            </div>
            <div class="card-body">
                <div class="card-top">
                    <span class="card-scope ${isInt ? 'int' : ''}">
                        ${n.alcance}
                    </span>
                    <span class="card-date">${this.fmtDate(n.fecha)}</span>
                </div>
                <h3 class="card-title">${n.titulo}</h3>
                ${n.highlights?.length ? `
                    <ul class="card-highlights">
                        ${n.highlights.slice(0,3).map(h=>`<li>${h}</li>`).join('')}
                    </ul>
                ` : ''}
                ${n.resumen ? `
                    <button class="card-summary-toggle"
                            onclick="toggleSummary(this, event)">
                        Ver resumen
                    </button>
                    <div class="card-summary">${n.resumen}</div>
                ` : ''}
                <div class="card-foot">
                    <span class="card-source">${n.medio}</span>
                    <span class="card-read">
                        Leer <i class="fas fa-arrow-right"></i>
                    </span>
                </div>
            </div>
        `;

        article.addEventListener('click', e => {
            if (e.target.closest('.card-summary-toggle')) return;
            window.open(n.url, '_blank');
        });

        return article;
    }

    /* Briefing */
    renderBriefing() {
        const body = document.getElementById('briefingBody');
        if (!body) return;

        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);

        const noticias = [...this.data.noticias]
            .filter(n => new Date(n.fecha) >= cutoff)
            .sort((a, b) => {
                if (a.categoria === 'grupo-global') return -1;
                if (b.categoria === 'grupo-global') return 1;
                return new Date(b.fecha) - new Date(a.fecha);
            });

        const cfg = this.data.config || {};

        body.innerHTML = `
            <div style="padding:1rem 0 1.5rem; border-bottom: 1px solid var(--line); margin-bottom: 1rem;">
                <p style="font-size:0.6875rem; font-weight:700; text-transform:uppercase;
                           letter-spacing:0.08em; color:var(--ink-4); margin-bottom:6px;">
                    Global Exchange · Comunicación Corporativa
                </p>
                <p style="font-family:var(--serif); font-size:1.25rem; color:var(--ink);">
                    ${cfg.mes_actual || 'Informe mensual'}
                </p>
                <p style="font-size:0.8125rem; color:var(--ink-4); margin-top:4px;">
                    ${noticias.length} noticias seleccionadas
                </p>
            </div>
            ${noticias.map(n => {
                const color = this.color(n.categoria);
                const cat   = this.cats.find(c => c.Slug === n.categoria);
                return `
                    <div class="briefing-entry">
                        <div class="briefing-dot" style="background:${color}"></div>
                        <div class="briefing-entry-body">
                            <div class="briefing-entry-title">${n.titulo}</div>
                            <div class="briefing-entry-meta">
                                ${cat?.Nombre || n.categoria} · ${n.medio} ·
                                ${this.fmtDate(n.fecha)}
                            </div>
                            ${n.resumen
                                ? `<div class="briefing-entry-summary">${n.resumen}</div>`
                                : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        `;
    }

    renderAll() {
        this.renderHeader();
        this.renderHero();
        this.renderFilters();
        this.renderNews();
        this.renderBriefing();
    }
}

/* ── GLOBALS ───────────────────────────────────────────── */
let _data, _renderer;

function toggleSummary(btn, e) {
    e.stopPropagation();
    const summary = btn.nextElementSibling;
    const open = summary.classList.toggle('open');
    btn.textContent = open ? 'Ocultar' : 'Ver resumen';
}

function resetAllFilters() {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    document.querySelector('[data-category="all"]')?.classList.add('active');
    document.querySelector('[data-month="all"]')?.classList.add('active');

    const si = document.getElementById('searchInput');
    if (si) si.value = '';

    document.querySelectorAll('.month-block, .cat-block, .card')
        .forEach(el => el.style.display = '');

    document.querySelector('.hero-section') && 
        (document.getElementById('heroSection').style.display = 'block');

    toggleEmpty(false);
    toast('Filtros restablecidos');
}

function toggleEmpty(show) {
    const el = document.getElementById('emptyState');
    if (el) el.style.display = show ? 'flex' : 'none';
}

function toast(msg, icon = 'fa-check') {
    const wrap = document.getElementById('toasts');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<i class="fas ${icon}"></i>${msg}`;
    wrap.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(8px)';
        el.style.transition = '0.3s ease';
        setTimeout(() => el.remove(), 300);
    }, 2800);
}