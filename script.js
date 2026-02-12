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
        
        // Animación de transición suave
        document.body.style.transition = 'background-color 0.4s ease, color 0.4s ease';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('gmr-theme', newTheme);
        updateThemeIcon(newTheme);
        
        // Efecto de rotación en el botón
        themeToggle.style.transform = 'rotate(360deg) scale(1.2)';
        setTimeout(() => {
            themeToggle.style.transform = '';
        }, 400);
        
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
// EXPORT TO PDF
// ===============================

function initializeExport() {
    const exportBtn = document.getElementById('exportBtn');
    if (!exportBtn) return;
    
    exportBtn.addEventListener('click', () => {
        if (typeof showToast === 'function') {
            showToast('Preparando documento para impresión...', 'info');
        }
        
        // Añadir clase temporal para estilos de impresión
        document.body.classList.add('print-mode');
        
        setTimeout(() => {
            window.print();
            document.body.classList.remove('print-mode');
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
            
            // Efecto visual
            searchInput.parentElement.style.transform = 'scale(1.05)';
            setTimeout(() => {
                searchInput.parentElement.style.transform = '';
            }, 200);
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
    
    // Cmd/Ctrl + D para dark mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) themeToggle.click();
    }
    
    // Cmd/Ctrl + R para resetear
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        if (typeof resetAllFilters === 'function') {
            resetAllFilters();
        }
    }
    
    // Cmd/Ctrl + P para imprimir
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
    }
});

// ===============================
// PARALLAX EFFECT (SUTIL)
// ===============================

function initializeParallax() {
    const cards = document.querySelectorAll('.crystal-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            card.style.transform = `
                perspective(1000px) 
                rotateX(${rotateX}deg) 
                rotateY(${rotateY}deg) 
                translateY(-8px)
            `;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

// ===============================
// LAZY LOADING IMAGES
// ===============================

function initializeLazyLoad() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                    }
                    
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '100px'
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

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
// PERFORMANCE MONITORING
// ===============================

window.addEventListener('load', () => {
    if (performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        
        console.log(`⚡ Carga completa: ${loadTime}ms`);
        
        if (loadTime < 1000) {
            console.log('🚀 Rendimiento excelente');
        } else if (loadTime < 2500) {
            console.log('✅ Rendimiento bueno');
        } else {
            console.log('⚠️ Considera optimizar recursos');
        }
    }
    
    // Inicializar efectos adicionales después de carga
    setTimeout(() => {
        initializeParallax();
        initializeLazyLoad();
    }, 1000);
});

// ===============================
// CONSOLE STYLING
// ===============================

console.log(
    '%c🔮 GMR Crystal v3.0',
    `
        font-size: 24px;
        font-weight: bold;
        background: linear-gradient(135deg, #122864, #006cb1, #28bdc7);
        padding: 20px 40px;
        border-radius: 12px;
        color: white;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    `
);

console.log(
    '%c✨ Atajos de teclado:\n' +
    '   • ⌘/Ctrl + K → Búsqueda\n' +
    '   • ⌘/Ctrl + D → Modo oscuro\n' +
    '   • ⌘/Ctrl + P → Imprimir\n' +
    '   • ⌘/Ctrl + R → Resetear filtros\n' +
    '   • Esc → Limpiar búsqueda',
    'color: #6b7a8f; font-size: 13px; line-height: 1.8; font-family: monospace;'
);

// ===============================
// INICIALIZACIÓN
// ===============================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando Crystal Executive...');
    
    initializeTheme();
    initializeExport();
    
    console.log('✅ Módulos base cargados');
});