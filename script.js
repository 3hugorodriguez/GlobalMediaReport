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
// STICKY NAV EFFECT
// ===============================

function initializeStickyNav() {
    const filterNav = document.getElementById('filterNav');
    if (!filterNav) return;
    
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        
        if (currentScroll > 100) {
            filterNav.classList.add('scrolled');
        } else {
            filterNav.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
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
        document.querySelectorAll('.news-card, .month-section').forEach((el, index) => {
            if (!el.dataset.observed) {
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                el.style.transition = `opacity 0.6s ease ${index * 0.05}s, transform 0.6s ease ${index * 0.05}s`;
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
// LAZY LOAD IMAGES
// ===============================

function initializeLazyLoad() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    
                    img.style.opacity = '0';
                    img.style.transition = 'opacity 0.5s ease';
                    
                    img.onload = () => {
                        img.style.opacity = '1';
                        img.classList.add('loaded');
                    };
                    
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '100px'
        });

        const observeImages = () => {
            document.querySelectorAll('.news-image img:not(.loaded)').forEach(img => {
                imageObserver.observe(img);
            });
        };

        const containerObserver = new MutationObserver(observeImages);
        const container = document.getElementById('newsContainer');
        if (container) {
            containerObserver.observe(container, {
                childList: true,
                subtree: true
            });
        }

        observeImages();
    }
}

// ===============================
// SMOOTH SCROLL
// ===============================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offset = 180;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
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
    
    initializeStickyNav();
    initializeScrollAnimations();
    initializeLazyLoad();
});

// ===============================
// ERROR HANDLING GLOBAL
// ===============================

window.addEventListener('error', (e) => {
    console.error('Error global capturado:', e.error);
    if (typeof showToast === 'function') {
        showToast('Ha ocurrido un error inesperado', 'error');
    }
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Promise rechazada:', e.reason);
    if (typeof showToast === 'function') {
        showToast('Error al procesar la solicitud', 'error');
    }
});

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
// FOCUS VISIBLE (ACCESIBILIDAD)
// ===============================

document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
    }
});

document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
});

// ===============================
// ANALYTICS (OPCIONAL)
// ===============================

function trackEvent(category, action, label) {
    console.log('📊 Event:', category, action, label);
}

document.addEventListener('click', (e) => {
    const card = e.target.closest('.news-card');
    if (card) {
        const title = card.querySelector('.news-title')?.textContent;
        if (title) {
            trackEvent('News', 'Click', title);
        }
    }
});

let searchTimeout;
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (e.target.value.length > 2) {
                trackEvent('Search', 'Query', e.target.value);
            }
        }, 1000);
    });
}

// ===============================
// COPY TO CLIPBOARD
// ===============================

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            if (typeof showToast === 'function') {
                showToast('¡Copiado al portapapeles!', 'success');
            }
        }).catch(() => {
            if (typeof showToast === 'function') {
                showToast('Error al copiar', 'error');
            }
        });
    } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        if (typeof showToast === 'function') {
            showToast('¡Copiado al portapapeles!', 'success');
        }
    }
}

document.addEventListener('contextmenu', (e) => {
    const card = e.target.closest('.news-card');
    if (card) {
        e.preventDefault();
        const url = card.getAttribute('data-url');
        if (url) {
            copyToClipboard(url);
        }
    }
});

// ===============================
// CONSOLE STYLING
// ===============================

console.log(
    '%c🏢 Global Media Report %cv2.0 Premium',
    'background: linear-gradient(135deg, #122864, #006cb1); color: white; padding: 10px 20px; border-radius: 8px 0 0 8px; font-weight: bold; font-size: 16px;',
    'background: linear-gradient(135deg, #3d73f1, #28bdc7); color: white; padding: 10px 20px; border-radius: 0 8px 8px 0; font-weight: bold; font-size: 16px;'
);

console.log(
    '%c💡 Atajos de teclado:\n' +
    '   • Cmd/Ctrl + K → Búsqueda\n' +
    '   • Cmd/Ctrl + D → Dark Mode\n' +
    '   • Cmd/Ctrl + R → Reset Filtros\n' +
    '   • Esc → Limpiar búsqueda\n' +
    '   • Home → Volver al inicio',
    'color: #64748b; font-size: 12px; line-height: 1.6;'
);

// ===============================
// INICIALIZACIÓN FINAL
// ===============================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando Global Media Report Premium...');
    
    if (!document.getElementById('newsContainer')) {
        console.error('❌ Contenedor principal no encontrado');
        return;
    }
    
    initializeTheme();
    initializeReadingProgress();
    
    console.log('✅ Sistema de temas inicializado');
    console.log('✅ Barra de progreso inicializada');
    console.log('⏳ Esperando carga de datos desde api-handler-simple.js...');
});