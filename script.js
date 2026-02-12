// ===============================
// THEME TOGGLE
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
            showToast('Preparando impresión...', 'info');
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
    // Cmd/Ctrl + K para búsqueda
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
    
    // Escape para limpiar búsqueda
    if (e.key === 'Escape') {
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value) {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
            searchInput.blur();
        }
    }
    
    // Cmd/Ctrl + P para imprimir
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
    }
    
    // Cmd/Ctrl + R para resetear
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        if (typeof resetAllFilters === 'function') {
            resetAllFilters();
        }
    }
});

// ===============================
// SMOOTH SCROLL
// ===============================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===============================
// NETWORK STATUS
// ===============================

let isOnline = navigator.onLine;

window.addEventListener('online', () => {
    if (!isOnline && typeof showToast === 'function') {
        showToast('Conexión restaurada', 'success');
    }
    isOnline = true;
});

window.addEventListener('offline', () => {
    if (typeof showToast === 'function') {
        showToast('Sin conexión', 'error');
    }
    isOnline = false;
});

// ===============================
// PERFORMANCE MONITORING
// ===============================

window.addEventListener('load', () => {
    if (performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        console.log(`⚡ Página cargada en ${loadTime}ms`);
        
        if (loadTime < 1000) {
            console.log('🚀 Rendimiento excelente');
        } else if (loadTime < 3000) {
            console.log('✅ Rendimiento bueno');
        } else {
            console.log('⚠️ Considera optimizar recursos');
        }
    }
});

// ===============================
// ERROR HANDLING
// ===============================

window.addEventListener('error', (e) => {
    console.error('Error global:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Promise rechazada:', e.reason);
});

// ===============================
// INICIALIZACIÓN
// ===============================

document.addEventListener('DOMContentLoaded', () => {
    console.log('%c📊 Global Media Report v2.0', 'font-size: 16px; font-weight: bold; color: #122864;');
    console.log('%cInicializando sistema...', 'color: #6b7280;');
    
    initializeTheme();
    initializeExport();
    
    console.log('✅ Módulos cargados');
});