// ===============================
// TEMA
// ===============================
function initializeTheme() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const saved = localStorage.getItem('gmr-theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);

    btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('gmr-theme', next);
        updateThemeIcon(next);
        btn.style.transform = 'rotate(360deg) scale(1.2)';
        setTimeout(() => btn.style.transform = '', 400);
        showToast(`Modo ${next === 'dark' ? 'oscuro' : 'claro'}`, 'success');
    });
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (icon) icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// ===============================
// ✅ MEJORA 6: VISTA COMPACTA
// ===============================
function initializeViewToggle() {
    const btn = document.getElementById('viewToggle');
    if (!btn) return;
    let compact = localStorage.getItem('gmr-view') === 'compact';
    applyView(compact);

    btn.addEventListener('click', () => {
        compact = !compact;
        localStorage.setItem('gmr-view', compact ? 'compact' : 'expanded');
        applyView(compact);
        showToast(`Vista ${compact ? 'compacta' : 'expandida'}`, 'info');
    });

    function applyView(isCompact) {
        document.body.classList.toggle('compact-view', isCompact);
        const icon = btn.querySelector('i');
        if (icon) icon.className = isCompact ? 'fas fa-th-large' : 'fas fa-list';
        btn.classList.toggle('active', isCompact);
    }
}

// ===============================
// EXPORT
// ===============================
function initializeExport() {
    const btn = document.getElementById('exportBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        showToast('Preparando documento...', 'info');
        setTimeout(() => window.print(), 500);
    });
}

// ===============================
// SHORTCUTS
// ===============================
document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
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
        closeBriefing?.();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        document.getElementById('themeToggle')?.click();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        resetAllFilters?.();
    }
});

// ===============================
// NETWORK
// ===============================
let wasOffline = false;
window.addEventListener('online', () => {
    if (wasOffline) showToast('Conexión restaurada', 'success');
    wasOffline = false;
});
window.addEventListener('offline', () => {
    wasOffline = true;
    showToast('Sin conexión a Internet', 'error');
});

// ===============================
// INIT
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    console.log('%c📊 GMR Executive v4.0', 'font-size: 18px; font-weight: bold; color: #122864;');
    initializeTheme();
    initializeViewToggle();
    initializeExport();
    console.log('%c⌨️ Atajos: ⌘K buscar · ⌘D modo · ⌘P imprimir · Esc cerrar', 'color: #6b7a8f;');
});