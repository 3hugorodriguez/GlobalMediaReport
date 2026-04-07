/* ============================================================
   GMR v4.0 — Controller
   ============================================================ */

/* ── TEMA ──────────────────────────────────────────────── */
function initializeTheme() {
    const btn   = document.getElementById('themeToggle');
    if (!btn) return;

    const saved = localStorage.getItem('gmr-theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);

    btn.addEventListener('click', () => {
        const cur  = document.documentElement.getAttribute('data-theme');
        const next = cur === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('gmr-theme', next);
        updateThemeIcon(next);
        if (typeof showToast === 'function')
            showToast(next === 'dark' ? 'Modo oscuro' : 'Modo claro');
    });
}

function updateThemeIcon(theme) {
    const i = document.querySelector('#themeToggle i');
    if (i) i.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

/* ── VISTA COMPACTA ────────────────────────────────────── */
function initializeViewToggle() {
    const btn = document.getElementById('viewToggle');
    if (!btn) return;

    const saved = localStorage.getItem('gmr-view') === 'compact';
    apply(saved);

    btn.addEventListener('click', () => {
        const isCompact = document.body.classList.contains('compact-view');
        apply(!isCompact);
        if (typeof showToast === 'function')
            showToast(!isCompact ? 'Vista compacta' : 'Vista completa');
    });

    function apply(compact) {
        document.body.classList.toggle('compact-view', compact);
        btn.classList.toggle('active', compact);
        localStorage.setItem('gmr-view', compact ? 'compact' : 'full');
        const i = btn.querySelector('i');
        if (i) i.className = compact ? 'fas fa-th-large' : 'fas fa-grip-lines';
    }
}

/* ── BRIEFING ──────────────────────────────────────────── */
function initializeBriefing() {
    const toggle   = document.getElementById('briefingBtn');
    const panel    = document.getElementById('briefingPanel');
    const backdrop = document.getElementById('panelBackdrop');
    const close    = document.getElementById('panelClose');
    if (!toggle || !panel) return;

    const open  = () => {
        panel.classList.add('open');
        backdrop?.classList.add('open');
        toggle.classList.add('active');
    };
    const close_ = () => {
        panel.classList.remove('open');
        backdrop?.classList.remove('open');
        toggle.classList.remove('active');
    };

    toggle.addEventListener('click', () =>
        panel.classList.contains('open') ? close_() : open()
    );
    close?.addEventListener('click', close_);
    backdrop?.addEventListener('click', close_);
}

/* ── EXPORT ────────────────────────────────────────────── */
function initializeExport() {
    const btn = document.getElementById('exportBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        if (typeof showToast === 'function') showToast('Preparando impresión...');
        setTimeout(() => window.print(), 400);
    });
}

/* ── KEYBOARD ──────────────────────────────────────────── */
function initializeKeys() {
    document.addEventListener('keydown', e => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            const si = document.getElementById('searchInput');
            si?.focus(); si?.select();
        }
        if (e.key === 'Escape') {
            const si = document.getElementById('searchInput');
            if (si?.value) {
                si.value = '';
                si.dispatchEvent(new Event('input'));
                si.blur();
            }
            document.getElementById('panelClose')?.click();
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
            e.preventDefault();
            document.getElementById('themeToggle')?.click();
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
            e.preventDefault();
            window.print();
        }
    });
}

/* ── NETWORK ───────────────────────────────────────────── */
let wasOffline = false;
window.addEventListener('online',  () => {
    if (wasOffline && typeof showToast === 'function')
        showToast('Conexión restaurada', 'success');
    wasOffline = false;
});
window.addEventListener('offline', () => {
    wasOffline = true;
    if (typeof showToast === 'function')
        showToast('Sin conexión', 'error');
});

/* ── INIT ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeViewToggle();
    initializeBriefing();
    initializeExport();
    initializeKeys();

    console.log('%c📊 GMR v4.0', 'font-size:16px;font-weight:700;color:#122864;');
    console.log('%c⌨  ⌘K buscar · ⌘D tema · ⌘P imprimir · Esc cerrar',
        'color:#666;font-size:11px;');
});