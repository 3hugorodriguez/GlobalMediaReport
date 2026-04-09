/* ============================================================
   GMR v5.0 — Theme · Export · Keyboard · Network
   ============================================================ */

/* ── THEME ───────────────────────────────────────────── */
function initializeTheme() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;

    const saved = localStorage.getItem('gmr-theme') || 'light';
    applyTheme(saved);

    btn.addEventListener('click', function() {
        const current = document.documentElement.getAttribute('data-theme');
        const next    = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem('gmr-theme', next);

        btn.style.transform  = 'rotate(180deg) scale(1.15)';
        btn.style.transition = 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)';
        setTimeout(function() { btn.style.transform = ''; }, 380);

        if (typeof showToast === 'function') {
            showToast('Modo ' + (next === 'dark' ? 'oscuro' : 'claro'), 'success');
        }
    });
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.querySelector('#themeToggle i');
    if (icon) icon.className = 'fas ' + (theme === 'dark' ? 'fa-sun' : 'fa-moon');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#0b0e18' : '#122864';
}

/* ── EXPORT ──────────────────────────────────────────── */
function initializeExport() {
    const btn = document.getElementById('exportBtn');
    if (!btn) return;
    btn.addEventListener('click', function() {
        if (typeof showToast === 'function') showToast('Preparando documento…', 'info');
        setTimeout(function() { window.print(); }, 450);
    });
}

/* ── KEYBOARD SHORTCUTS ──────────────────────────────── */
document.addEventListener('keydown', function(e) {
    const tag     = document.activeElement && document.activeElement.tagName.toLowerCase();
    const isInput = tag === 'input' || tag === 'textarea';

    /* ⌘/Ctrl + K — Buscar */
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const si = document.getElementById('searchInput');
        if (si) { si.focus(); si.select(); }
    }

    /* Escape — Limpiar búsqueda */
    if (e.key === 'Escape') {
        const panel = document.getElementById('briefingPanel');
        if (panel && panel.classList.contains('open')) return;
        const si = document.getElementById('searchInput');
        if (si && si.value) {
            si.value = '';
            si.dispatchEvent(new Event('input'));
            si.blur();
        }
    }

    /* ⌘/Ctrl + D — Dark mode */
    if (!isInput && (e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        const t = document.getElementById('themeToggle');
        if (t) t.click();
    }

    /* ⌘/Ctrl + P — Imprimir */
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
    }
});

/* ── NETWORK STATUS ──────────────────────────────────── */
let wasOffline = false;

window.addEventListener('online', function() {
    if (wasOffline && typeof showToast === 'function') {
        showToast('Conexión restaurada', 'success');
    }
    wasOffline = false;
});

window.addEventListener('offline', function() {
    wasOffline = true;
    if (typeof showToast === 'function') showToast('Sin conexión a Internet', 'error');
});

/* ── PERFORMANCE LOG ─────────────────────────────────── */
window.addEventListener('load', function() {
    if (performance && performance.timing) {
        const t = performance.timing;
        if (t.loadEventEnd && t.navigationStart) {
            console.log('⚡ Carga total: ' + (t.loadEventEnd - t.navigationStart) + 'ms');
        }
    }
});

/* ── CONSOLE BRANDING ────────────────────────────────── */
console.log(
    '%c GMR v5.0 ',
    'font-size:14px;font-weight:700;color:#fff;' +
    'background:linear-gradient(135deg,#122864,#006cb1);' +
    'padding:6px 14px;border-radius:6px;letter-spacing:0.05em;'
);
console.log(
    '%c⌨  Atajos de teclado\n' +
    '   ⌘/Ctrl + K   Buscar\n' +
    '   ⌘/Ctrl + D   Modo oscuro\n' +
    '   ⌘/Ctrl + P   Imprimir\n' +
    '   Esc           Limpiar búsqueda',
    'color:#8896ab;font-size:11px;line-height:1.9;'
);

/* ── INIT ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeExport();
});