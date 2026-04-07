// ===============================
// THEME SYSTEM
// ===============================
function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    const currentTheme = localStorage.getItem('gmr-theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('gmr-theme', newTheme);
        updateThemeIcon(newTheme);

        themeToggle.style.transform = 'rotate(360deg) scale(1.2)';
        setTimeout(() => {
            themeToggle.style.transform = '';
        }, 400);

        if (typeof showToast === 'function') {
            showToast(`Modo ${newTheme === 'dark' ? 'oscuro' : 'claro'}`, 'success');
        }
    });
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// ===============================
// EXPORT TO PDF
// ===============================
function initializeExport() {
    const exportBtn = document.getElementById('exportBtn');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', () => {
        if (typeof showToast === 'function') {
            showToast('Preparando documento...', 'info');
        }
        setTimeout(() => {
            window.print();
        }, 500);
    });
}

// ===============================
// KEYBOARD SHORTCUTS
// ===============================
document.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + K → Búsqueda
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    // Escape → Limpiar búsqueda
    if (e.key === 'Escape') {
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value) {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
            searchInput.blur();
        }
    }

    // Cmd/Ctrl + D → Dark mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) themeToggle.click();
    }

    // Cmd/Ctrl + P → Imprimir
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
    }

    // Cmd/Ctrl + R → Resetear filtros
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        if (typeof resetAllFilters === 'function') {
            resetAllFilters();
        }
    }
});

// ===============================
// NETWORK STATUS
// ===============================
let wasOffline = false;

window.addEventListener('online', () => {
    if (wasOffline && typeof showToast === 'function') {
        showToast('Conexión restaurada', 'success');
    }
    wasOffline = false;
});

window.addEventListener('offline', () => {
    wasOffline = true;
    if (typeof showToast === 'function') {
        showToast('Sin conexión a Internet', 'error');
    }
});

// ===============================
// PERFORMANCE
// ===============================
window.addEventListener('load', () => {
    if (performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        console.log(`⚡ Carga: ${loadTime}ms`);
    }
});

// ===============================
// CONSOLE
// ===============================
console.log(
    '%c📊 GMR Executive v3.7',
    'font-size: 20px; font-weight: bold; color: #122864; padding: 10px;'
);
console.log(
    '%c⌨️ Atajos:\n' +
    '  • ⌘/Ctrl + K → Buscar\n' +
    '  • ⌘/Ctrl + D → Modo oscuro\n' +
    '  • ⌘/Ctrl + P → Imprimir\n' +
    '  • ⌘/Ctrl + R → Resetear\n' +
    '  • Esc → Limpiar búsqueda',
    'color: #6b7a8f; font-size: 12px; line-height: 1.8;'
);
console.log(
    '%c✨ Novedades v3.7:\n' +
    '  • Header oculto al scroll\n' +
    '  • Búsqueda con z-index correcto\n' +
    '  • Categorías con mejor separación\n' +
    '  • Dark mode legible\n' +
    '  • Resumen ejecutivo eliminado',
    'color: #10b981; font-size: 11px; line-height: 1.6;'
);

// ===============================
// INICIALIZACIÓN
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando GMR Executive...');
    initializeTheme();
    initializeExport();
    console.log('✅ Módulos cargados');
});