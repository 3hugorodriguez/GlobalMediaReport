// ===============================
// THEME TOGGLE
// ===============================

function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        
        // Animación
        themeToggle.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            themeToggle.style.transform = '';
        }, 300);
    });
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// ===============================
// READING PROGRESS
// ===============================

function initializeReadingProgress() {
    const progressBar = document.querySelector('.reading-progress');
    
    window.addEventListener('scroll', () => {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const scrolled = window.scrollY;
        const progress = (scrolled / documentHeight) * 100;
        
        progressBar.style.width = `${Math.min(progress, 100)}%`;
    });
}

// ===============================
// STICKY NAV EFFECT
// ===============================

function initializeStickyNav() {
    const mainNav = document.getElementById('mainNav');
    const header = document.querySelector('.header');
    
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        
        if (currentScroll > header.offsetHeight) {
            mainNav.style.boxShadow = 'var(--shadow-md)';
        } else {
            mainNav.style.boxShadow = 'var(--shadow-sm)';
        }
        
        lastScroll = currentScroll;
    });
}

// Inicializar sticky nav al cargar
document.addEventListener('DOMContentLoaded', () => {
    initializeStickyNav();
});

// ===============================
// KEYBOARD SHORTCUTS
// ===============================

document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K para búsqueda
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
    
    // Escape para limpiar búsqueda
    if (e.key === 'Escape') {
        const searchInput = document.getElementById('searchInput');
        if (searchInput.value) {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
        }
    }
    
    // Ctrl/Cmd + D para dark mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        document.getElementById('themeToggle').click();
    }
});

// ===============================
// LAZY LOAD IMAGES (mejorado)
// ===============================

if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px'
    });

    // Observar imágenes cuando se creen
    const observeImages = () => {
        document.querySelectorAll('.news-image img').forEach(img => {
            imageObserver.observe(img);
        });
    };

    // Observer para nuevas imágenes (cuando se filtran)
    const containerObserver = new MutationObserver(observeImages);
    containerObserver.observe(document.getElementById('newsContainer'), {
        childList: true,
        subtree: true
    });
}

// ===============================
// SMOOTH SCROLL POLYFILL
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
// PERFORMANCE MONITORING
// ===============================

window.addEventListener('load', () => {
    if (performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        console.log(`⚡ Página cargada en ${loadTime}ms`);
    }
});

// ===============================
// ERROR HANDLING GLOBAL
// ===============================

window.addEventListener('error', (e) => {
    console.error('Error global capturado:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Promise rechazada:', e.reason);
});