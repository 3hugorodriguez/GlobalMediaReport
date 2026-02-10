// ===============================
// THEME TOGGLE PREMIUM
// ===============================

function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        // Animación de transición suave
        document.documentElement.style.transition = 'none';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        
        // Animación del botón
        themeToggle.style.transform = 'rotate(360deg) scale(1.2)';
        setTimeout(() => {
            themeToggle.style.transform = '';
            document.documentElement.style.transition = '';
        }, 300);
        
        showToast(`Modo ${newTheme === 'dark' ? 'oscuro' : 'claro'} activado`, 'success');
    });
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// ===============================
// READING PROGRESS PREMIUM
// ===============================

function initializeReadingProgress() {
    const progressBar = document.querySelector('.reading-progress');
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
// KEYBOARD SHORTCUTS PREMIUM
// ===============================

document.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + K para búsqueda
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        searchInput.focus();
        searchInput.select();
        showToast('Búsqueda activada', 'info');
    }
    
    // Escape para limpiar búsqueda
    if (e.key === 'Escape') {
        const searchInput = document.getElementById('searchInput');
        if (searchInput.value) {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
            searchInput.blur();
            showToast('Búsqueda limpiada', 'info');
        }
    }
    
    // Cmd/Ctrl + D para dark mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        document.getElementById('themeToggle').click();
    }
    
    // Cmd/Ctrl + R para reset filters
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        resetAllFilters();
    }
    
    // Flecha arriba para volver al inicio
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

    // Observar elementos cuando se crean
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

    // Observer para nuevos elementos
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
// LAZY LOAD IMAGES PREMIUM
// ===============================

function initializeLazyLoad() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    
                    // Fade in effect
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

        // Observar nuevas imágenes
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
// SMOOTH SCROLL POLYFILL
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
    
    // Inicializar animaciones después de cargar
    initializeStickyNav();
    initializeScrollAnimations();
    initializeLazyLoad();
});

// ===============================
// ERROR HANDLING GLOBAL
// ===============================

window.addEventListener('error', (e) => {
    console.error('Error global capturado:', e.error);
    showToast('Ha ocurrido un error inesperado', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Promise rechazada:', e.reason);
    showToast('Error al procesar la solicitud', 'error');
});

// ===============================
// NETWORK STATUS
// ===============================

window.addEventListener('online', () => {
    showToast('Conexión restaurada', 'success');
});

window.addEventListener('offline', () => {
    showToast('Sin conexión a Internet', 'error');
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
    // Implementar tracking si es necesario
    console.log('📊 Event:', category, action, label);
}

// Track clicks en noticias
document.addEventListener('click', (e) => {
    const card = e.target.closest('.news-card');
    if (card) {
        const title = card.querySelector('.news-title').textContent;
        trackEvent('News', 'Click', title);
    }
});

// Track búsquedas
let searchTimeout;
document.getElementById('searchInput')?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        if (e.target.value.length > 2) {
            trackEvent('Search', 'Query', e.target.value);
        }
    }, 1000);
});

// ===============================
// COPY TO CLIPBOARD (BONUS)
// ===============================

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('¡Copiado al portapapeles!', 'success');
        }).catch(() => {
            showToast('Error al copiar', 'error');
        });
    } else {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('¡Copiado al portapapeles!', 'success');
    }
}

// Agregar botón de compartir a las tarjetas (opcional)
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
// SERVICE WORKER (PWA - OPCIONAL)
// ===============================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Descomentar para activar PWA
        /*
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('SW registrado:', registration);
        }).catch(error => {
            console.log('SW falló:', error);
        });
        */
    });
}

// ===============================
// CONSOLE STYLING (BRANDING)
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
    
    // Verificar dependencias
    if (!document.getElementById('newsContainer')) {
        console.error('❌ Contenedor principal no encontrado');
        return;
    }
    
    // Inicializar todo
    initializeTheme();
    initializeReadingProgress();
    
    console.log('✅ Sistema de temas inicializado');
    console.log('✅ Barra de progreso inicializada');
    console.log('⏳ Cargando datos...');
});



// ===============================
// UTILIDADES DE FECHA
// ===============================

function getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    // Si es más de 7 días, mostrar fecha formateada
    const options = { day: 'numeric', month: 'short' };
    return date.toLocaleDateString('es-ES', options);
}

function getLatestNewsDate(newsData) {
    if (!newsData || Object.keys(newsData).length === 0) return null;
    
    let latestDate = null;
    
    Object.values(newsData).forEach(months => {
        Object.values(months).forEach(categories => {
            Object.values(categories).forEach(newsList => {
                newsList.forEach(news => {
                    const newsDate = new Date(news.date || news.fecha);
                    if (!latestDate || newsDate > latestDate) {
                        latestDate = newsDate;
                    }
                });
            });
        });
    });
    
    return latestDate;
}

function getPeriodRange(newsData) {
    if (!newsData || Object.keys(newsData).length === 0) {
        return 'Sin datos';
    }
    
    let oldestDate = null;
    let newestDate = null;
    
    Object.values(newsData).forEach(months => {
        Object.values(months).forEach(categories => {
            Object.values(categories).forEach(newsList => {
                newsList.forEach(news => {
                    const newsDate = new Date(news.date || news.fecha);
                    if (!oldestDate || newsDate < oldestDate) {
                        oldestDate = newsDate;
                    }
                    if (!newestDate || newsDate > newestDate) {
                        newestDate = newsDate;
                    }
                });
            });
        });
    });
    
    if (!oldestDate || !newestDate) return 'Sin datos';
    
    const optionsMonth = { month: 'long', year: 'numeric' };
    const oldestStr = oldestDate.toLocaleDateString('es-ES', optionsMonth);
    const newestStr = newestDate.toLocaleDateString('es-ES', optionsMonth);
    
    // Capitalizar primera letra
    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
    
    // Si es el mismo mes, mostrar solo uno
    if (oldestStr === newestStr) {
        return capitalize(oldestStr);
    }
    
    // Si es perpetuo (más de 6 meses), mostrar rango
    const diffMonths = (newestDate.getFullYear() - oldestDate.getFullYear()) * 12 
                     + (newestDate.getMonth() - oldestDate.getMonth());
    
    if (diffMonths > 6) {
        return `Feed perpetuo`;
    }
    
    return `${capitalize(oldestStr)} - ${capitalize(newestStr)}`;
}

// ===============================
// ACTUALIZAR ESTADÍSTICAS DEL HERO
// ===============================

function updateHeroStats(newsData) {
    // Total de noticias
    let totalNews = 0;
    let internationalCount = 0;
    const categoryCounts = {};
    
    Object.values(newsData).forEach(months => {
        Object.values(months).forEach(categories => {
            Object.entries(categories).forEach(([category, newsList]) => {
                totalNews += newsList.length;
                
                // Contar categorías
                categoryCounts[category] = (categoryCounts[category] || 0) + newsList.length;
                
                // Contar internacionales
                newsList.forEach(news => {
                    if (news.ambito?.toLowerCase() === 'internacional' || 
                        news.scope?.toLowerCase() === 'internacional') {
                        internationalCount++;
                    }
                });
            });
        });
    });
    
    // Actualizar total de noticias
    const totalNewsEl = document.getElementById('totalNewsHero');
    if (totalNewsEl) {
        animateNumber(totalNewsEl, 0, totalNews, 1000);
    }
    
    // Actualizar conteo internacional
    const internationalEl = document.getElementById('internationalCount');
    if (internationalEl) {
        animateNumber(internationalEl, 0, internationalCount, 1000);
    }
    
    // Categoría más destacada
    const topCategory = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])[0];
    
    const topCategoryEl = document.getElementById('topCategoryHero');
    if (topCategoryEl && topCategory) {
        topCategoryEl.textContent = topCategory[0];
    }
    
    // Última actualización (fecha de la noticia más reciente)
    const latestDate = getLatestNewsDate(newsData);
    const lastUpdateEl = document.getElementById('lastUpdateHero');
    if (lastUpdateEl && latestDate) {
        lastUpdateEl.textContent = getRelativeTime(latestDate);
        
        // Actualizar cada minuto
        setInterval(() => {
            lastUpdateEl.textContent = getRelativeTime(latestDate);
        }, 60000);
    }
    
    // Periodo dinámico
    const periodEl = document.getElementById('currentPeriod');
    if (periodEl) {
        periodEl.textContent = getPeriodRange(newsData);
    }
}

// ===============================
// ANIMACIÓN DE NÚMEROS
// ===============================

function animateNumber(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.round(current);
    }, 16);
}

// ===============================
// INICIALIZACIÓN MODIFICADA
// ===============================

// En tu función initializeGMR() o donde cargas las noticias, añade:

function initializeGMR() {
    console.log('🚀 Inicializando Global Media Report...');
    
    // Mostrar skeleton
    showSkeleton();
    
    // Cargar datos (ajusta según tu API)
    loadNewsData()
        .then(newsData => {
            // Ocultar skeleton
            hideSkeleton();
            
            // IMPORTANTE: Actualizar estadísticas del hero
            updateHeroStats(newsData);
            
            // Renderizar noticias
            renderNews(newsData);
            
            // Inicializar filtros
            initializeFilters(newsData);
            
            // Inicializar búsqueda
            initializeSearch(newsData);
            
            console.log('✅ Datos cargados correctamente');
        })
        .catch(error => {
            console.error('❌ Error al cargar datos:', error);
            showError();
        });
}

// ===============================
// EJEMPLO DE CARGA DE DATOS
// ===============================

async function loadNewsData() {
    // Ajusta según tu fuente de datos
    // Puede ser desde tu api-handler-simple.js
    
    try {
        const response = await fetch('tu-api-endpoint.json');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching news:', error);
        throw error;
    }
}

// ===============================
// FUNCIONES DE UI
// ===============================

function showSkeleton() {
    const skeleton = document.getElementById('skeletonLoader');
    if (skeleton) skeleton.style.display = 'block';
}

function hideSkeleton() {
    const skeleton = document.getElementById('skeletonLoader');
    if (skeleton) skeleton.style.display = 'none';
}

function showError() {
    const container = document.getElementById('newsContainer');
    if (container) {
        container.innerHTML = `
            <div class="empty-state" style="display: block;">
                <div class="empty-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 class="empty-title">Error al cargar datos</h3>
                <p class="empty-text">No se pudieron cargar las noticias. Intenta recargar la página.</p>
                <button class="btn-primary" onclick="location.reload()">
                    <i class="fas fa-redo"></i>
                    Recargar
                </button>
            </div>
        `;
    }
}