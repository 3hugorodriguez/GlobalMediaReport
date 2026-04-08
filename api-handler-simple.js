/* ============================================================
   GMR v5.0 — Data Service + Renderer
   ============================================================ */

const CONFIG = {
    dataPath: './data/gmr-data.json',
    newsDays: 7,

    months: {
        '01':'Enero',   '02':'Febrero', '03':'Marzo',
        '04':'Abril',   '05':'Mayo',    '06':'Junio',
        '07':'Julio',   '08':'Agosto',  '09':'Septiembre',
        '10':'Octubre', '11':'Noviembre','12':'Diciembre'
    },

    catColors: {
        'grupo-global':         '#122864',
        'sector-cambiario':     '#2251c0',
        'sector-aeroportuario': '#7c3aed',
        'medios-efectivo':      '#059669',
        'medios-digital':       '#d97706',
        'otros-medios-pago':    '#6366f1'
    },

    /* Unsplash fallbacks — one per category, always loads */
    fallbacks: {
        'grupo-global':         'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=900&q=80',
        'sector-cambiario':     'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=900&q=80',
        'sector-aeroportuario': 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=900&q=80',
        'medios-efectivo':      'https://images.unsplash.com/photo-1554768804-50c1e2b50a6e?w=900&q=80',
        'medios-digital':       'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=900&q=80',
        'otros-medios-pago':    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=80'
    }
};

/* ─────────────────────────────────────
   HELPERS
───────────────────────────────────── */
function validImg(url) {
    if (!url) return false;
    const s = String(url).trim();
    return s.length > 0
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
    return CONFIG.months[m] + ' ' + y;
}

function monthKey(fecha) {
    const d = new Date(fecha);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

function groupBy(arr, fn) {
    return arr.reduce((acc, item) => {
        const k = fn(item);
        (acc[k] = acc[k] || []).push(item);
        return acc;
    }, {});
}

function catColor(slug) {
    return CONFIG.catColors[slug] || '#122864';
}

function imgSrc(noticia) {
    return validImg(noticia.imagen)
        ? noticia.imagen
        : (CONFIG.fallbacks[noticia.categoria] || CONFIG.fallbacks['sector-cambiario']);
}

function fallbackImg(slug) {
    return CONFIG.fallbacks[slug] || CONFIG.fallbacks['sector-cambiario'];
}

/* ─────────────────────────────────────
   DATA LOADING
───────────────────────────────────── */
async function loadData() {
    const res = await fetch(CONFIG.dataPath + '?t=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (!json.success || !json.data) throw new Error('Formato de datos inválido');

    const data = json.data;
    const now  = new Date();

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

/* ─────────────────────────────────────
   HERO SECTION
───────────────────────────────────── */
function renderHero(data) {
    /* Get most recent grupo-global article */
    const noticia = data.noticias.find(n => n.categoria === 'grupo-global');
    if (!noticia) return;

    const section = document.getElementById('heroSection');
    if (!section) return;

    const img    = imgSrc(noticia);
    const isInt  = noticia.alcance === 'Internacional';
    const color  = catColor(noticia.categoria);
    const cat    = data.categorias.find(c => c.Slug === noticia.categoria);

    section.innerHTML =
        '<div class="hero-card" id="heroCard" tabindex="0" role="article" ' +
             'aria-label="Noticia destacada: ' + noticia.titulo + '">' +

            /* Image */
            '<img class="hero-img" src="' + img + '" ' +
                 'alt="' + noticia.titulo + '" ' +
                 'loading="eager" ' +
                 'onerror="this.src=\'' + fallbackImg(noticia.categoria) + '\'">' +

            /* Gradient overlay */
            '<div class="hero-overlay" aria-hidden="true"></div>' +

            /* Glass badge */
            '<div class="hero-badge" aria-hidden="true">' +
                '<span class="hero-badge-dot"></span>' +
                '<span>' + (cat ? cat.Nombre : 'Global Exchange') + '</span>' +
            '</div>' +

            /* New badge */
            (noticia.isNew ? '<div class="hero-new-tag" aria-hidden="true">Nuevo</div>' : '') +

            /* Content */
            '<div class="hero-content">' +
                '<div class="hero-meta">' +
                    '<span class="hero-scope">' +
                        '<i class="fas ' + (isInt ? 'fa-globe' : 'fa-map-marker-alt') + '"></i>' +
                        noticia.alcance +
                    '</span>' +
                    '<span class="hero-date">' + fmtDate(noticia.fecha) + '</span>' +
                '</div>' +
                '<h1 class="hero-title">' + noticia.titulo + '</h1>' +
                (noticia.resumen
                    ? '<p class="hero-excerpt">' +
                        noticia.resumen.slice(0, 180) + (noticia.resumen.length > 180 ? '…' : '') +
                      '</p>'
                    : '') +
                '<div class="hero-footer">' +
                    '<span class="hero-source">' +
                        '<i class="fas fa-newspaper"></i>' +
                        noticia.medio +
                    '</span>' +
                    '<a href="' + noticia.url + '" target="_blank" ' +
                       'class="hero-cta" ' +
                       'onclick="event.stopPropagation()">' +
                        'Leer artículo <i class="fas fa-arrow-right"></i>' +
                    '</a>' +
                '</div>' +
            '</div>' +

        '</div>';

    /* Click on whole card (except CTA) */
    const card = document.getElementById('heroCard');
    if (card) {
        card.addEventListener('click', function(e) {
            if (!e.target.closest('.hero-cta')) window.open(noticia.url, '_blank');
        });
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') window.open(noticia.url, '_blank');
        });
    }
}

/* ─────────────────────────────────────
   HEADER STATS
───────────────────────────────────── */
function renderHeader(data) {
    const el = document.getElementById('statsInfo');
    if (!el) return;
    const cfg      = data.config || {};
    const newCount = data.noticias.filter(n => n.isNew).length;

    el.innerHTML =
        data.noticias.length + ' noticias' +
        (newCount > 0
            ? ' · <strong style="color:rgba(255,255,255,0.95)">' + newCount + ' nuevas</strong>'
            : '') +
        ' · ' + (cfg.mes_actual || '');
}

/* ─────────────────────────────────────
   FILTERS
───────────────────────────────────── */
function renderFilters(data) {
    const catEl   = document.getElementById('categoryFilters');
    const monthEl = document.getElementById('monthFilters');
    if (!catEl || !monthEl) return;

    const catCounts   = {};
    const monthCounts = {};

    data.noticias.forEach(n => {
        catCounts[n.categoria] = (catCounts[n.categoria] || 0) + 1;
        const mk = monthKey(n.fecha);
        monthCounts[mk] = (monthCounts[mk] || 0) + 1;
    });

    catEl.querySelector('[data-category="all"] .chip-n').textContent  = data.noticias.length;
    monthEl.querySelector('[data-month="all"] .chip-n').textContent   = data.noticias.length;

    data.categorias.forEach(cat => {
        const n = catCounts[cat.Slug] || 0;
        if (!n) return;
        const btn = document.createElement('button');
        btn.className = 'chip';
        btn.setAttribute('data-category', cat.Slug);
        btn.innerHTML = cat.Nombre + ' <span class="chip-n">' + n + '</span>';
        catEl.appendChild(btn);
    });

    Object.keys(monthCounts)
        .sort((a, b) => new Date(b) - new Date(a))
        .forEach(mk => {
            const btn = document.createElement('button');
            btn.className = 'chip';
            btn.setAttribute('data-month', mk);
            btn.innerHTML = fmtMonth(mk) + ' <span class="chip-n">' + monthCounts[mk] + '</span>';
            monthEl.appendChild(btn);
        });
}

/* ─────────────────────────────────────
   NEWS RENDER
───────────────────────────────────── */
function renderNews(data) {
    const container = document.getElementById('newsContainer');
    if (!container) return;

    /* Remove skeleton */
    const skel = document.getElementById('skeletonLoader');
    if (skel) {
        skel.style.opacity = '0';
        skel.style.transition = '0.25s ease';
        setTimeout(() => skel.remove(), 260);
    }

    container.innerHTML = '';

    const byMonth = groupBy(data.noticias, n => monthKey(n.fecha));

    Object.keys(byMonth)
        .sort((a, b) => new Date(b) - new Date(a))
        .forEach(mk => {
            container.appendChild(buildMonthBlock(mk, byMonth[mk], data.categorias));
        });

    buildTimeline(data);
}

/* ─── Month block ──────────────────── */
function buildMonthBlock(mk, noticias, categorias) {
    const block = document.createElement('section');
    block.className = 'month-block';
    block.setAttribute('data-month', mk);
    block.id = 'month-' + mk;

    block.innerHTML =
        '<div class="month-header">' +
            '<h2 class="month-title">' + fmtMonth(mk) + '</h2>' +
            '<span class="month-count">' + noticias.length + '</span>' +
        '</div>';

    const byCat = groupBy(noticias, n => n.categoria);

    /* Respect category order from config */
    categorias
        .filter(c => byCat[c.Slug] && byCat[c.Slug].length > 0)
        .forEach(cat => {
            block.appendChild(buildCatBlock(cat, byCat[cat.Slug]));
        });

    return block;
}

/* ─── Category block ───────────────── */
function buildCatBlock(cat, noticias) {
    const color = catColor(cat.Slug);

    const block = document.createElement('div');
    block.className = 'cat-block';
    block.setAttribute('data-category', cat.Slug);
    block.style.setProperty('--cat-color', color);

    block.innerHTML =
        '<div class="cat-header">' +
            '<div class="cat-icon" style="background:' + color + '">' +
                '<i class="fas ' + cat.Icono + '"></i>' +
            '</div>' +
            '<span class="cat-name">' + cat.Nombre + '</span>' +
            '<span class="cat-count">' + noticias.length + ' noticias</span>' +
        '</div>' +
        '<div class="news-grid"></div>';

    const grid = block.querySelector('.news-grid');
    noticias.forEach(n => grid.appendChild(buildCard(n, cat, color)));

    return block;
}

/* ─── Card ─────────────────────────── */
function buildCard(noticia, cat, color) {
    const article = document.createElement('article');
    article.className = 'card-executive';
    article.setAttribute('data-url', noticia.url);
    article.setAttribute('data-category', noticia.categoria);
    article.setAttribute('tabindex', '0');
    article.setAttribute('role', 'article');
    article.style.setProperty('--cat-color', color);

    const isInt  = noticia.alcance === 'Internacional';
    const img    = imgSrc(noticia);
    const fb     = fallbackImg(noticia.categoria);
    const hlList = (noticia.highlights || []).slice(0, 3);

    const highlightsHTML = hlList.length
        ? '<ul class="card-highlights">' +
              hlList.map(h => '<li>' + h + '</li>').join('') +
          '</ul>'
        : '';

    const summaryHTML = noticia.resumen
        ? '<button class="card-expand" onclick="toggleSummary(this,event)" ' +
                 'aria-expanded="false">Ver resumen</button>' +
          '<div class="card-summary" role="region">' + noticia.resumen + '</div>'
        : '';

    article.innerHTML =
        /* Image */
        '<div class="card-img" aria-hidden="true">' +
            '<img src="' + img + '" alt="' + noticia.titulo + '" ' +
                 'loading="lazy" onerror="this.src=\'' + fb + '\'">' +
            (noticia.isNew ? '<div class="card-new" title="Novedad"></div>' : '') +
        '</div>' +

        /* Body */
        '<div class="card-body">' +
            '<div class="card-meta">' +
                '<span class="scope-badge ' + (isInt ? 'int' : 'nat') + '">' +
                    '<i class="fas ' + (isInt ? 'fa-globe' : 'fa-map-marker-alt') + '"></i>' +
                    noticia.alcance +
                '</span>' +
                '<span class="card-date">' + fmtDate(noticia.fecha) + '</span>' +
            '</div>' +
            '<h3 class="card-title">' + noticia.titulo + '</h3>' +
            highlightsHTML +
            summaryHTML +
        '</div>' +

        /* Footer */
        '<div class="card-foot">' +
            '<span class="card-source">' +
                '<i class="fas fa-newspaper"></i>' +
                noticia.medio +
            '</span>' +
            '<a href="' + noticia.url + '" target="_blank" rel="noopener" ' +
               'class="card-link" onclick="event.stopPropagation()" ' +
               'aria-label="Leer en ' + noticia.medio + '">' +
                'Leer <i class="fas fa-arrow-right"></i>' +
            '</a>' +
        '</div>';

    /* Click anywhere except link/expand = open URL */
    article.addEventListener('click', function(e) {
        if (e.target.closest('.card-link') || e.target.closest('.card-expand')) return;
        window.open(noticia.url, '_blank');
    });

    article.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') window.open(noticia.url, '_blank');
    });

    return article;
}

/* ─────────────────────────────────────
   TIMELINE
───────────────────────────────────── */
function buildTimeline(data) {
    const byMonth = groupBy(data.noticias, n => monthKey(n.fecha));
    const months  = Object.keys(byMonth).sort((a, b) => new Date(b) - new Date(a));

    const existing = document.getElementById('timelineSidebar');
    if (existing) existing.remove();

    const sidebar = document.createElement('aside');
    sidebar.className = 'timeline-sidebar';
    sidebar.id = 'timelineSidebar';
    sidebar.setAttribute('aria-label', 'Navegación por meses');

    sidebar.innerHTML =
        '<div class="timeline-label">' +
            '<i class="fas fa-clock"></i> Archivo' +
        '</div>' +
        '<ul class="timeline-list">' +
            '<div class="timeline-track" aria-hidden="true"></div>' +
            months.map(mk =>
                '<li class="timeline-item" data-tm="' + mk + '" ' +
                    'tabindex="0" role="button" ' +
                    'aria-label="Ir a ' + fmtMonth(mk) + '">' +
                    '<div class="timeline-node" aria-hidden="true"></div>' +
                    '<div class="timeline-row">' +
                        '<span class="timeline-month">' + fmtMonth(mk) + '</span>' +
                        '<span class="timeline-n">' + byMonth[mk].length + '</span>' +
                    '</div>' +
                '</li>'
            ).join('') +
        '</ul>';

    document.body.appendChild(sidebar);
    requestAnimationFrame(() => {
        setTimeout(() => sidebar.classList.add('visible'), 120);
    });
}

/* ─────────────────────────────────────
   BRIEFING
───────────────────────────────────── */
function renderBriefing(data) {
    const body = document.getElementById('briefingBody');
    if (!body) return;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const noticias = data.noticias
        .filter(n => new Date(n.fecha) >= cutoff)
        .sort((a, b) => {
            if (a.categoria === 'grupo-global') return -1;
            if (b.categoria === 'grupo-global') return 1;
            return new Date(b.fecha) - new Date(a.fecha);
        });

    const cfg = data.config || {};

    body.innerHTML =
        '<div style="padding:0 0 1rem; border-bottom:1px solid var(--line); margin-bottom:.75rem;">' +
            '<p style="font-size:0.625rem; font-weight:800; text-transform:uppercase; ' +
                      'letter-spacing:0.09em; color:var(--ink-4); margin-bottom:2px;">' +
                'Global Exchange · Comunicación Corporativa' +
            '</p>' +
            '<p style="font-family:var(--font-head); font-size:1.0625rem; font-weight:700; color:var(--ink);">' +
                (cfg.mes_actual || 'Informe mensual') +
            '</p>' +
            '<p style="font-size:0.75rem; color:var(--ink-4); margin-top:2px;">' +
                noticias.length + ' noticias · últimos 30 días' +
            '</p>' +
        '</div>' +
        noticias.map(function(n) {
            const color = catColor(n.categoria);
            const cat   = data.categorias.find(c => c.Slug === n.categoria);
            return '<div class="briefing-item">' +
                '<div class="briefing-dot" style="background:' + color + '"></div>' +
                '<div>' +
                    '<div class="briefing-title">' + n.titulo + '</div>' +
                    '<div class="briefing-meta">' +
                        (cat ? cat.Nombre : n.categoria) +
                        ' · ' + n.medio +
                        ' · ' + fmtDate(n.fecha) +
                    '</div>' +
                    (n.resumen
                        ? '<div class="briefing-summary">' +
                            n.resumen.slice(0, 200) + (n.resumen.length > 200 ? '…' : '') +
                          '</div>'
                        : '') +
                '</div>' +
            '</div>';
        }).join('');
}

/* ─────────────────────────────────────
   GLOBALS
───────────────────────────────────── */
let allData;

function toggleSummary(btn, e) {
    e.stopPropagation();
    const summary = btn.nextElementSibling;
    const open    = summary.classList.toggle('open');
    btn.textContent = open ? 'Ocultar' : 'Ver resumen';
    btn.setAttribute('aria-expanded', String(open));
}

function toggleEmptyState(count) {
    const el = document.getElementById('emptyState');
    if (el) el.style.display = count === 0 ? 'flex' : 'none';
}

function resetAllFilters() {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    const catAll = document.querySelector('[data-category="all"]');
    const monAll = document.querySelector('[data-month="all"]');
    if (catAll) catAll.classList.add('active');
    if (monAll) monAll.classList.add('active');

    const si = document.getElementById('searchInput');
    if (si) si.value = '';

    document.querySelectorAll('.month-block, .cat-block, .card-executive')
        .forEach(el => { el.style.display = ''; });

    clearHighlights();
    toggleEmptyState(document.querySelectorAll('.card-executive').length);
    showToast('Filtros restablecidos');
}

function showToast(msg, type) {
    type = type || 'info';
    const wrap = document.getElementById('toastContainer');
    if (!wrap) return;

    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    const el    = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.innerHTML = '<i class="fas ' + (icons[type] || 'fa-info-circle') + '"></i>' + msg;
    wrap.appendChild(el);

    setTimeout(function() {
        el.style.opacity   = '0';
        el.style.transform = 'translateY(6px) scale(0.96)';
        el.style.transition = '0.28s ease';
        setTimeout(() => el.remove(), 290);
    }, 2800);
}

/* ─────────────────────────────────────
   INIT
───────────────────────────────────── */
async function initializeGMR() {
    try {
        allData = await loadData();
        renderHero(allData);
        renderHeader(allData);
        renderFilters(allData);
        renderNews(allData);
        renderBriefing(allData);

        requestAnimationFrame(function() {
            initFilters();
            initSearch();
            initScroll();
            initTimeline();
            initBriefingPanel();
            showToast(allData.noticias.length + ' noticias cargadas', 'success');
        });

    } catch (err) {
        console.error('GMR Error:', err);
        const skel = document.getElementById('skeletonLoader');
        if (skel) skel.innerHTML =
            '<div style="display:flex;flex-direction:column;align-items:center;gap:1rem;' +
                       'padding:4rem 2rem;text-align:center;color:var(--ink-3);">' +
                '<i class="fas fa-triangle-exclamation" style="font-size:2.5rem;color:#ef4444;"></i>' +
                '<h3 style="font-family:var(--font-head);font-size:1.125rem;">Error al cargar</h3>' +
                '<p style="font-size:0.875rem;">' + err.message + '</p>' +
                '<button class="btn-primary" onclick="location.reload()">' +
                    '<i class="fas fa-rotate-right"></i> Reintentar' +
                '</button>' +
            '</div>';

        showToast('Error al cargar los datos', 'error');
    }
}

/* ─────────────────────────────────────
   FILTERS LOGIC
───────────────────────────────────── */
function initFilters() {
    let activeCat   = 'all';
    let activeMonth = 'all';

    const catWrap   = document.getElementById('categoryFilters');
    const monthWrap = document.getElementById('monthFilters');
    const resetBtn  = document.getElementById('resetFilters');

    if (catWrap) {
        catWrap.addEventListener('click', function(e) {
            const chip = e.target.closest('.chip');
            if (!chip) return;
            catWrap.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeCat = chip.getAttribute('data-category');
            applyFilters(activeCat, activeMonth);
        });
    }

    if (monthWrap) {
        monthWrap.addEventListener('click', function(e) {
            const chip = e.target.closest('.chip');
            if (!chip) return;
            monthWrap.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeMonth = chip.getAttribute('data-month');
            if (activeMonth !== 'all') {
                const target = document.getElementById('month-' + activeMonth);
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            applyFilters(activeCat, activeMonth);
        });
    }

    if (resetBtn) resetBtn.addEventListener('click', resetAllFilters);
}

function applyFilters(cat, month) {
    let count = 0;

    document.querySelectorAll('.month-block').forEach(function(mb) {
        const mMatch = month === 'all' || mb.getAttribute('data-month') === month;
        if (!mMatch) { mb.style.display = 'none'; return; }

        let vis = 0;
        mb.querySelectorAll('.cat-block').forEach(function(cb) {
            const cMatch = cat === 'all' || cb.getAttribute('data-category') === cat;
            cb.style.display = cMatch ? '' : 'none';
            if (cMatch) vis += cb.querySelectorAll('.card-executive').length;
        });

        mb.style.display = vis > 0 ? '' : 'none';
        count += vis;
    });

    toggleEmptyState(count === 0);
    if (count > 0 && (cat !== 'all' || month !== 'all')) {
        showToast(count + ' noticia' + (count !== 1 ? 's' : ''));
    }
}

/* ─────────────────────────────────────
   SEARCH
───────────────────────────────────── */
function initSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;

    let timer;
    input.addEventListener('input', function() {
        clearTimeout(timer);
        timer = setTimeout(function() {
            runSearch(input.value.trim().toLowerCase());
        }, 260);
    });
}

function runSearch(term) {
    clearHighlights();

    if (!term) {
        document.querySelectorAll('.card-executive, .cat-block, .month-block')
            .forEach(el => { el.style.display = ''; });
        toggleEmptyState(false);
        return;
    }

    let count = 0;

    document.querySelectorAll('.card-executive').forEach(function(card) {
        const text =
            (card.querySelector('.card-title')?.textContent || '') + ' ' +
            (card.querySelector('.card-source')?.textContent || '') + ' ' +
            (card.querySelector('.card-highlights')?.textContent || '');

        const found = text.toLowerCase().includes(term);
        card.style.display = found ? '' : 'none';

        if (found) {
            count++;
            const titleEl = card.querySelector('.card-title');
            if (titleEl) hlText(titleEl, term);
        }
    });

    document.querySelectorAll('.cat-block').forEach(function(cb) {
        const vis = cb.querySelectorAll('.card-executive:not([style*="display: none"])').length;
        cb.style.display = vis > 0 ? '' : 'none';
    });

    document.querySelectorAll('.month-block').forEach(function(mb) {
        const vis = mb.querySelectorAll('.cat-block:not([style*="display: none"])').length;
        mb.style.display = vis > 0 ? '' : 'none';
    });

    toggleEmptyState(count === 0);
}

function hlText(el, term) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes  = [];
    let node;
    while (node = walker.nextNode()) {
        if (node.nodeValue.toLowerCase().includes(term)) nodes.push(node);
    }
    nodes.forEach(function(n) {
        const parts = n.nodeValue.split(new RegExp('(' + term + ')', 'gi'));
        const frag  = document.createDocumentFragment();
        parts.forEach(function(p) {
            if (p.toLowerCase() === term) {
                const mark       = document.createElement('mark');
                mark.className   = 'search-hl';
                mark.textContent = p;
                frag.appendChild(mark);
            } else {
                frag.appendChild(document.createTextNode(p));
            }
        });
        n.parentNode.replaceChild(frag, n);
    });
}

function clearHighlights() {
    document.querySelectorAll('.search-hl').forEach(function(m) {
        if (m.parentNode) {
            m.parentNode.replaceChild(document.createTextNode(m.textContent), m);
        }
    });
    document.querySelectorAll('.card-title').forEach(el => el.normalize());
}

/* ─────────────────────────────────────
   SCROLL
───────────────────────────────────── */
function initScroll() {
    const header   = document.getElementById('mainHeader');
    const filters  = document.getElementById('filtersBar');
    const progress = document.getElementById('scrollProgress');
    const fab      = document.getElementById('backToTop');
    let   lastY    = 0;

    window.addEventListener('scroll', function() {
        const y   = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;

        /* Progress bar */
        if (progress) progress.style.width = (max > 0 ? (y / max * 100) : 0) + '%';

        /* Auto-hide header */
        if (y > 100) {
            if (y > lastY + 8) {
                header  && header.classList.add('hidden');
                filters && filters.classList.add('header-hidden');
            } else if (y < lastY - 8) {
                header  && header.classList.remove('hidden');
                filters && filters.classList.remove('header-hidden');
            }
        } else {
            header  && header.classList.remove('hidden');
            filters && filters.classList.remove('header-hidden');
        }

        /* FAB */
        fab && fab.classList.toggle('visible', y > 500);
        lastY = y;
    }, { passive: true });

    fab && fab.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* ─────────────────────────────────────
   TIMELINE INTERACTIONS
───────────────────────────────────── */
function initTimeline() {
    /* Click */
    document.addEventListener('click', function(e) {
        const item = e.target.closest('.timeline-item');
        if (!item) return;
        const mk     = item.getAttribute('data-tm');
        const target = document.getElementById('month-' + mk);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.querySelectorAll('.timeline-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
    });

    /* Keyboard */
    document.addEventListener('keydown', function(e) {
        if (e.key !== 'Enter') return;
        const item = e.target.closest('.timeline-item');
        if (!item) return;
        item.click();
    });

    /* Scroll spy via IntersectionObserver */
    const obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                const mk = entry.target.getAttribute('data-month');
                document.querySelectorAll('.timeline-item').forEach(i => i.classList.remove('active'));
                const ti = document.querySelector('.timeline-item[data-tm="' + mk + '"]');
                if (ti) ti.classList.add('active');
            }
        });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });

    document.querySelectorAll('.month-block').forEach(mb => obs.observe(mb));
}

/* ─────────────────────────────────────
   BRIEFING PANEL
───────────────────────────────────── */
function initBriefingPanel() {
    const btn      = document.getElementById('briefingBtn');
    const panel    = document.getElementById('briefingPanel');
    const backdrop = document.getElementById('panelBackdrop');
    const closeBtn = document.getElementById('panelClose');

    function openPanel()  {
        panel    && panel.classList.add('open');
        backdrop && backdrop.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closePanel() {
        panel    && panel.classList.remove('open');
        backdrop && backdrop.classList.remove('open');
        document.body.style.overflow = '';
    }

    btn      && btn.addEventListener('click', openPanel);
    closeBtn && closeBtn.addEventListener('click', closePanel);
    backdrop && backdrop.addEventListener('click', closePanel);

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && panel && panel.classList.contains('open')) closePanel();
    });
}