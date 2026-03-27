/* ============================================================
   GMR v5.0 — Controller
   ============================================================ */

/* ── INIT ──────────────────────────────────────────────── */
async function initGMR() {
    try {
        _data     = await GMRData.load();
        _renderer = new GMRRenderer(_data);
        _renderer.renderAll();

        requestAnimationFrame(() => {
            setupFilters();
            setupSearch();
            setupScrollEffects();
            setupCursor();
            setupTheme();
            setupViewToggle();
            setupBriefing();
            setupKeys();
            toast(`${_data.noticias.length} noticias cargadas`);
        });

    } catch (err) {
        console.error('GMR Error:', err);
        const skel = document.getElementById('skeletonLoader');
        if (skel) skel.innerHTML = `
            <div style="padding:4rem; text-align:center; color:var(--ink-3);">
                <p style="font-size:1.25rem; margin-bottom:1rem;">Error al cargar datos</p>
                <button onclick="location.reload()"
                        style="padding:10px 24px; background:var(--ink); color:var(--bg);
                               border-radius:9999px; font-size:0.875rem; font-weight:600;">
                    Reintentar
                </button>
            </div>
        `;
    }
}

/* ── FILTERS ───────────────────────────────────────────── */
function setupFilters() {
    let activeCat   = 'all';
    let activeMonth = 'all';

    document.getElementById('catFilters')?.addEventListener('click', e => {
        const btn = e.target.closest('.filter-chip');
        if (!btn) return;
        document.querySelectorAll('#catFilters .filter-chip')
            .forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCat = btn.getAttribute('data-category');
        applyFilters(activeCat, activeMonth);
    });

    document.getElementById('monthFilters')?.addEventListener('click', e => {
        const btn = e.target.closest('.filter-chip');
        if (!btn) return;
        document.querySelectorAll('#monthFilters .filter-chip')
            .forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeMonth = btn.getAttribute('data-month');
        if (activeMonth !== 'all') {
            document.getElementById(`m-${activeMonth}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        applyFilters(activeCat, activeMonth);
    });

    document.getElementById('resetFilters')?.addEventListener('click', resetAllFilters);
}

function applyFilters(cat, month) {
    let count = 0;

    /* Hero */
    const hero = document.getElementById('heroSection');
    if (hero) {
        const showHero = cat === 'all' || cat === 'grupo-global';
        hero.style.display = showHero ? 'block' : 'none';
    }

    document.querySelectorAll('.month-block').forEach(mb => {
        const mMatch = month === 'all' || mb.getAttribute('data-month') === month;
        if (!mMatch) { mb.style.display = 'none'; return; }

        let visInMonth = 0;
        mb.querySelectorAll('.cat-block').forEach(cb => {
            const cMatch = cat === 'all' || cb.getAttribute('data-category') === cat;
            cb.style.display = cMatch ? '' : 'none';
            if (cMatch) visInMonth += cb.querySelectorAll('.card').length;
        });

        mb.style.display = visInMonth > 0 ? '' : 'none';
        count += visInMonth;
    });

    toggleEmpty(count === 0);
    if (count > 0) toast(`${count} noticia${count !== 1 ? 's' : ''}`);
}

/* ── SEARCH ────────────────────────────────────────────── */
function setupSearch() {
    const toggle = document.getElementById('searchToggle');
    const bar    = document.getElementById('searchBar');
    const input  = document.getElementById('searchInput');
    if (!toggle || !bar || !input) return;

    toggle.addEventListener('click', () => {
        const open = bar.classList.toggle('open');
        toggle.classList.toggle('active', open);
        if (open) setTimeout(() => input.focus(), 200);
        else { input.value = ''; clearSearch(); }
    });

    let t;
    input.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => runSearch(input.value.trim().toLowerCase()), 280);
    });
}

function runSearch(term) {
    clearHighlights();

    if (!term) {
        clearSearch();
        return;
    }

    let count = 0;
    document.querySelectorAll('.card').forEach(card => {
        const titleEl = card.querySelector('.card-title');
        const hlEl    = card.querySelector('.card-highlights');
        const srcEl   = card.querySelector('.card-source');

        const hay = [titleEl, hlEl, srcEl]
            .map(e => e?.textContent.toLowerCase() || '')
            .join(' ');

        const match = hay.includes(term);
        card.style.display = match ? '' : 'none';
        if (match) {
            count++;
            if (titleEl) highlight(titleEl, term);
        }
    });

    /* Hide empty sections */
    document.querySelectorAll('.cat-block').forEach(cb => {
        cb.style.display = cb.querySelectorAll('.card:not([style*="none"])').length ? '' : 'none';
    });
    document.querySelectorAll('.month-block').forEach(mb => {
        mb.style.display = mb.querySelectorAll('.cat-block:not([style*="none"])').length ? '' : 'none';
    });

    /* Hero */
    const heroEl = document.getElementById('heroSection');
    if (heroEl) {
        const heroTitle = heroEl.querySelector('.hero-title')?.textContent.toLowerCase() || '';
        heroEl.style.display = heroTitle.includes(term) ? '' : 'none';
    }

    toggleEmpty(count === 0);
}

function clearSearch() {
    clearHighlights();
    document.querySelectorAll('.card, .cat-block, .month-block').forEach(el => el.style.display = '');
    if (document.getElementById('heroSection'))
        document.getElementById('heroSection').style.display = 'block';
    toggleEmpty(false);
}

function highlight(el, term) {
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let n;
    while (n = walk.nextNode()) {
        if (n.nodeValue.toLowerCase().includes(term)) nodes.push(n);
    }
    nodes.forEach(node => {
        const parts = node.nodeValue.split(new RegExp(`(${term})`, 'gi'));
        const frag = document.createDocumentFragment();
        parts.forEach(p => {
            if (p.toLowerCase() === term) {
                const mark = document.createElement('mark');
                mark.className = 'hl';
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
    document.querySelectorAll('.hl').forEach(m => {
        m.parentNode?.replaceChild(document.createTextNode(m.textContent), m);
    });
    document.querySelectorAll('.card-title, .card-highlights').forEach(e => e.normalize());
}

/* ── SCROLL ────────────────────────────────────────────── */
function setupScrollEffects() {
    const header   = document.getElementById('header');
    const filters  = document.getElementById('filtersStrip');
    const progress = document.getElementById('progressBar');
    const backTop  = document.getElementById('backTop');

    let last = 0;

    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;

        /* Progress */
        if (progress) progress.style.width = `${(y / max) * 100}%`;

        /* Header hide/show */
        if (y > 80) {
            header?.classList.add('scrolled');
            if (y > last + 10) {
                header?.classList.add('hidden');
                filters?.classList.add('header-hidden');
            } else if (y < last - 10) {
                header?.classList.remove('hidden');
                filters?.classList.remove('header-hidden');
            }
        } else {
            header?.classList.remove('hidden', 'scrolled');
            filters?.classList.remove('header-hidden');
        }

        /* Back to top */
        backTop?.classList.toggle('show', y > 400);

        last = y;
    }, { passive: true });

    backTop?.addEventListener('click', () =>
        window.scrollTo({ top: 0, behavior: 'smooth' })
    );
}

/* ── CURSOR ────────────────────────────────────────────── */
function setupCursor() {
    const cursor   = document.getElementById('cursor');
    const follower = document.getElementById('cursorFollower');
    if (!cursor || !follower) return;

    let fx = 0, fy = 0, cx = 0, cy = 0;

    document.addEventListener('mousemove', e => {
        cx = e.clientX; cy = e.clientY;
        cursor.style.left = cx + 'px';
        cursor.style.top  = cy + 'px';
    });

    /* Smooth follower */
    (function loop() {
        fx += (cx - fx) * 0.12;
        fy += (cy - fy) * 0.12;
        follower.style.left = fx + 'px';
        follower.style.top  = fy + 'px';
        requestAnimationFrame(loop);
    })();

    /* Hover states */
    const hoverTargets = 'a, button, .card, .filter-chip, .hero-card';
    document.addEventListener('mouseover', e => {
        if (e.target.closest(hoverTargets)) {
            cursor.classList.add('hovering');
            follower.classList.add('hovering');
        }
    });
    document.addEventListener('mouseout', e => {
        if (e.target.closest(hoverTargets)) {
            cursor.classList.remove('hovering');
            follower.classList.remove('hovering');
        }
    });
    document.addEventListener('mousedown', () => cursor.classList.add('clicking'));
    document.addEventListener('mouseup',   () => cursor.classList.remove('clicking'));
}

/* ── THEME ─────────────────────────────────────────────── */
function setupTheme() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;

    const saved = localStorage.getItem('gmr-theme') || 'light';
    document.body.setAttribute('data-theme', saved);

    btn.addEventListener('click', () => {
        const cur  = document.body.getAttribute('data-theme');
        const next = cur === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', next);
        localStorage.setItem('gmr-theme', next);
        toast(next === 'dark' ? 'Modo oscuro' : 'Modo claro');
    });
}

/* ── VIEW TOGGLE ───────────────────────────────────────── */
function setupViewToggle() {
    const btn = document.getElementById('viewToggle');
    if (!btn) return;

    const saved = localStorage.getItem('gmr-view') === 'compact';
    document.body.classList.toggle('compact', saved);
    btn.classList.toggle('active', saved);

    btn.addEventListener('click', () => {
        const isCompact = document.body.classList.toggle('compact');
        btn.classList.toggle('active', isCompact);
        localStorage.setItem('gmr-view', isCompact ? 'compact' : 'full');
        toast(isCompact ? 'Vista compacta' : 'Vista completa');
    });
}

/* ── BRIEFING ──────────────────────────────────────────── */
function setupBriefing() {
    const toggle  = document.getElementById('briefingToggle');
    const panel   = document.getElementById('briefingPanel');
    const overlay = document.getElementById('panelOverlay');
    const close   = document.getElementById('panelClose');
    if (!toggle || !panel) return;

    const open  = () => { panel.classList.add('open'); overlay?.classList.add('open'); toggle.classList.add('active'); };
    const close_ = () => { panel.classList.remove('open'); overlay?.classList.remove('open'); toggle.classList.remove('active'); };

    toggle.addEventListener('click', () => panel.classList.contains('open') ? close_() : open());
    close?.addEventListener('click', close_);
    overlay?.addEventListener('click', close_);
}

/* ── KEYBOARD ──────────────────────────────────────────── */
function setupKeys() {
    document.addEventListener('keydown', e => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchToggle')?.click();
        }
        if (e.key === 'Escape') {
            const bar = document.getElementById('searchBar');
            if (bar?.classList.contains('open')) {
                document.getElementById('searchToggle')?.click();
            }
            document.getElementById('panelClose')?.click();
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
            e.preventDefault();
            document.getElementById('themeToggle')?.click();
        }
    });
}