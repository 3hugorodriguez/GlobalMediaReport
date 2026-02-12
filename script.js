// ===============================
// THEME TOGGLE
// ===============================

function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        
        themeToggle.style.transform = 'rotate(360deg) scale(1.2)';
        setTimeout(() => {
            themeToggle.style.transform = '';
        }, 300);
        
        if (typeof showToast === 'function') {
            showToast(`Modo ${newTheme === 'dark' ? 'oscuro' : 'claro'} activado`, 'success');
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
// VIEW SWITCHER
// ===============================

function initializeViewSwitcher() {
    const viewBtns = document.querySelectorAll('.view-btn');
    const container = document.getElementById('newsContainer');
    
    if (!viewBtns.length || !container) return;
    
    // Cargar vista guardada
    const savedView = localStorage.getItem('gmr-view') || 'timeline';
    switchView(savedView);
    
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            switchView(view);
            localStorage.setItem('gmr-view', view);
            
            if (typeof showToast === 'function') {
                const viewNames = {
                    timeline: 'Timeline',
                    grid: 'Tarjetas',
                    compact: 'Compacta'
                };
                showToast(`Vista ${viewNames[view]}`, 'info');
            }
        });
    });
    
    function switchView(view) {
        container.setAttribute('data-view', view);
        
        // Actualizar botón activo
        viewBtns.forEach(btn => {
            if (btn.getAttribute('data-view') === view) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}

// ===============================
// READING PROGRESS
// ===============================

function initializeReadingProgress() {
    const progressBar = document.querySelector('.reading-progress');
    if (!progressBar) return;
    
    let ticking = false;
    
    function updateProgress() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const scrolled = window.scrollY;
        const progress = Math.min((scrolled / documentHeight) * 100, 100);
        
        progressBar.style.width = `${progress}%`;
        ticking = false;
    }
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateProgress();
            });
            ticking = true;
        }
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
            if (typeof showToast === 'function') {
                showToast('Búsqueda activada', 'info');
            }
        }
    }
    
    // Escape para limpiar búsqueda
    if (e.key === 'Escape') {
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value) {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
            searchInput.blur();
            if (typeof showToast === 'function') {
                showToast('Búsqueda limpiada', 'info');
            }
        }
    }
    
    // Cmd/Ctrl + D para dark mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) themeToggle.click();
    }
    
    // Cmd/Ctrl + R para reset filters
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        if (typeof resetAllFilters === 'function') {
            resetAllFilters();
        }
    }
    
    // 1, 2, 3 para cambiar vista
    if (['1', '2', '3'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
        const views = ['timeline', 'grid', 'compact'];
        const viewBtn = document.querySelector(`.view-btn[data-view="${views[parseInt(e.key) - 1]}"]`);
        if (viewBtn) viewBtn.click();
    }
    
    // Home para volver al inicio
    if (e.key === 'Home') {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
});

// ===============================
// INTERSECTION OBSERVER ANIMATIONS
// ===============================

function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const observeElements = () => {
        document.querySelectorAll('.news-card, .month-section, .category-section').forEach((el, index) => {
            if (!el.dataset.observed) {
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                el.style.transition = `opacity 0.6s ease ${index * 0.02}s, transform 0.6s ease ${index * 0.02}s`;
                observer.observe(el);
                el.dataset.observed = 'true';
            }
        });
    };

    const containerObserver = new MutationObserver(observeElements);
    const container = document.getElementById('newsContainer');
    if (container) {
        containerObserver.observe(container, {
            childList: true,
            subtree: true
        });
    }
}

// ===============================
// EXPORT FUNCTIONALITY
// ===============================

function initializeExport() {
    const exportBtn = document.getElementById('exportBtn');
    if (!exportBtn) return;
    
    exportBtn.addEventListener('click', () => {
        if (typeof showToast === 'function') {
            showToast('Preparando exportación...', 'info');
        }
        
        setTimeout(() => {
            window.print();
        }, 500);
    });
}

// ===============================
// NETWORK STATUS
// ===============================

window.addEventListener('online', () => {
    if (typeof showToast === 'function') {
        showToast('Conexión restaurada', 'success');
    }
});

window.addEventListener('offline', () => {
    if (typeof showToast === 'function') {
        showToast('Sin conexión a Internet', 'error');
    }
});

// ===============================
// CONSOLE STYLING
// ===============================

console.log(
    '%c🏢 Global Media Report %cv2.0',
    'background: linear-gradient(135deg, #122864, #006cb1); color: white; padding: 10px 20px; border-radius: 8px 0 0 8px; font-weight: bold; font-size: 16px;',
    'background: linear-gradient(135deg, #3d73f1, #28bdc7); color: white; padding: 10px 20px; border-radius: 0 8px 8px 0; font-weight: bold; font-size: 16px;'
);

console.log(
    '%c💡 Atajos de teclado:\n' +
    '   • Cmd/Ctrl + K → Búsqueda\n' +
    '   • Cmd/Ctrl + D → Dark Mode\n' +
    '   • Cmd/Ctrl + R → Reset Filtros\n' +
    '   • 1/2/3 → Cambiar vista\n' +
    '   • Esc → Limpiar búsqueda\n' +
    '   • Home → Volver al inicio',
    'color: #64748b; font-size: 12px; line-height: 1.6;'
);

// ===============================
// INICIALIZACIÓN FINAL
// ===============================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando Global Media Report v2.0...');
    
    if (!document.getElementById('newsContainer')) {
        console.error('❌ Contenedor principal no encontrado');
        return;
    }
    
    initializeTheme();
    initializeReadingProgress();
    initializeViewSwitcher();
    initializeExport();
    
    console.log('✅ Sistema de temas inicializado');
    console.log('✅ Selector de vistas inicializado');
    console.log('⏳ Esperando carga de datos...');
});

window.addEventListener('load', () => {
    initializeScrollAnimations();
    
    if (performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        console.log(`⚡ Página cargada en ${loadTime}ms`);
    }
});