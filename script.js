// ===============================
// INICIALIZACIÓN
// ===============================

document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeReadingProgress();
    initializeDashboard();
    initializeFilters();
    initializeSearch();
    initializeSmoothScroll();
    initializeNewsCards();
    initializeCopyButtons();
    initializeBreadcrumbs();
    initializeAnimations();
});

// ===============================
// DARK MODE / LIGHT MODE
// ===============================

function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Animación del botón
        themeToggle.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            themeToggle.style.transform = 'rotate(0deg)';
        }, 300);
    });
}

// ===============================
// BARRA DE PROGRESO DE LECTURA
// ===============================

function initializeReadingProgress() {
    const progressBar = document.querySelector('.reading-progress');
    
    window.addEventListener('scroll', () => {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const scrolled = window.scrollY;
        const progress = (scrolled / documentHeight) * 100;
        
        progressBar.style.width = `${progress}%`;
    });
}

// ===============================
// DASHBOARD - CONTADORES ANIMADOS
// ===============================

function initializeDashboard() {
    const allNews = document.querySelectorAll('.news-card');
    const nationalNews = document.querySelectorAll('[data-scope="Nacional"]');
    const internationalNews = document.querySelectorAll('[data-scope="Internacional"]');
    
    // Actualizar targets
    document.getElementById('totalNews').setAttribute('data-target', allNews.length);
    document.getElementById('nationalNews').setAttribute('data-target', nationalNews.length);
    document.getElementById('internationalNews').setAttribute('data-target', internationalNews.length);
    
    // Animar contadores
    animateCounters();
}

function animateCounters() {
    const counters = document.querySelectorAll('.dashboard-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000; // 2 segundos
        const increment = target / (duration / 16); // 60 FPS
        let current = 0;
        
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };
        
        // Iniciar animación cuando sea visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(counter);
    });
}

// ===============================
// FILTROS POR CATEGORÍA Y ALCANCE
// ===============================

function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const scopeButtons = document.querySelectorAll('.scope-btn');
    const categorySections = document.querySelectorAll('.category-section');
    const newsCards = document.querySelectorAll('.news-card');
    const resetBtn = document.getElementById('resetFilters');

    let activeCategory = 'all';
    let activeScope = 'all';

    // Filtro por categoría
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            activeCategory = button.getAttribute('data-category');
            applyFilters();
            updateBreadcrumbs(button.textContent.trim());
        });
    });

    // Filtro por alcance
    scopeButtons.forEach(button => {
        button.addEventListener('click', () => {
            scopeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            activeScope = button.getAttribute('data-scope');
            applyFilters();
        });
    });

    // Reset filters
    resetBtn.addEventListener('click', () => {
        activeCategory = 'all';
        activeScope = 'all';
        filterButtons.forEach(btn => btn.classList.remove('active'));
        filterButtons[0].classList.add('active');
        scopeButtons.forEach(btn => btn.classList.remove('active'));
        scopeButtons[0].classList.add('active');
        document.getElementById('searchInput').value = '';
        applyFilters();
        resetBreadcrumbs();
        
        // Animación de feedback
        resetBtn.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            resetBtn.style.transform = 'rotate(0deg)';
        }, 300);
    });

    function applyFilters() {
        let visibleCount = 0;

        categorySections.forEach(section => {
            const sectionCategory = section.getAttribute('data-category');
            let sectionVisible = false;

            if (activeCategory === 'all' || sectionCategory === activeCategory) {
                section.classList.remove('hidden');
                
                const cardsInSection = section.querySelectorAll('.news-card');
                let visibleCardsInSection = 0;

                cardsInSection.forEach(card => {
                    const cardScope = card.getAttribute('data-scope');
                    
                    if (activeScope === 'all' || cardScope === activeScope) {
                        card.style.display = 'grid';
                        visibleCardsInSection++;
                        visibleCount++;
                    } else {
                        card.style.display = 'none';
                    }
                });

                // Ocultar sección si no tiene cards visibles
                if (visibleCardsInSection === 0) {
                    section.classList.add('hidden');
                } else {
                    sectionVisible = true;
                }
            } else {
                section.classList.add('hidden');
            }
        });

        updateSearchResults(visibleCount);
        
        // Scroll suave a la primera sección visible
        if (activeCategory !== 'all') {
            const firstVisible = document.querySelector(`.category-section[data-category="${activeCategory}"]`);
            if (firstVisible && !firstVisible.classList.contains('hidden')) {
                firstVisible.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }
}

// ===============================
// BÚSQUEDA
// ===============================

function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const newsCards = document.querySelectorAll('.news-card');
    const categorySections = document.querySelectorAll('.category-section');

    searchInput.addEventListener('input', debounce(performSearch, 300));

    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        let visibleCount = 0;

        if (searchTerm === '') {
            // Si no hay búsqueda, mostrar todo según filtros activos
            newsCards.forEach(card => {
                if (card.style.display !== 'none') {
                    visibleCount++;
                }
            });
            updateSearchResults(visibleCount);
            
            // Remover highlights
            removeHighlights();
            return;
        }

        newsCards.forEach(card => {
            const title = card.querySelector('.news-title').textContent.toLowerCase();
            const source = card.querySelector('.news-source span').textContent.toLowerCase();
            const summary = card.querySelector('.news-summary') ? 
                           card.querySelector('.news-summary').textContent.toLowerCase() : '';
            const highlights = Array.from(card.querySelectorAll('.highlight-item span'))
                                   .map(el => el.textContent.toLowerCase())
                                   .join(' ');

            const matchesSearch = title.includes(searchTerm) || 
                                 source.includes(searchTerm) || 
                                 summary.includes(searchTerm) ||
                                 highlights.includes(searchTerm);

            if (matchesSearch) {
                card.style.display = 'grid';
                visibleCount++;
                highlightText(card, searchTerm);
            } else {
                card.style.display = 'none';
            }
        });

        // Ocultar secciones sin resultados
        categorySections.forEach(section => {
            const visibleCards = section.querySelectorAll('.news-card[style="display: grid;"]');
            if (visibleCards.length === 0) {
                section.classList.add('hidden');
            } else {
                section.classList.remove('hidden');
            }
        });

        updateSearchResults(visibleCount);
    }
}

function highlightText(card, searchTerm) {
    const title = card.querySelector('.news-title');
    const originalText = title.textContent;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    title.innerHTML = originalText.replace(regex, '<mark style="background: #fef08a; padding: 2px 4px; border-radius: 3px;">$1</mark>');
}

function removeHighlights() {
    document.querySelectorAll('.news-title mark').forEach(mark => {
        const parent = mark.parentNode;
        parent.textContent = parent.textContent;
    });
}

function updateSearchResults(count) {
    const searchResults = document.getElementById('searchResults');
    if (count === 0) {
        searchResults.textContent = 'Sin resultados';
        searchResults.style.color = '#dc2626';
        searchResults.style.background = '#fee2e2';
    } else {
        searchResults.textContent = `${count} resultado${count !== 1 ? 's' : ''}`;
        searchResults.style.color = '#10b981';
        searchResults.style.background = '#d1fae5';
    }
}

// ===============================
// SMOOTH SCROLL
// ===============================

function initializeSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                const offset = 80; // Espacio para el breadcrumb sticky
                const targetPosition = targetSection.offsetTop - offset;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Actualizar breadcrumbs
                const categoryName = targetSection.querySelector('.category-title').textContent.trim();
                updateBreadcrumbs(categoryName);
            }
        });
    });
}

// ===============================
// BREADCRUMBS
// ===============================

function initializeBreadcrumbs() {
    const sections = document.querySelectorAll('.category-section');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const categoryName = entry.target.querySelector('.category-title').textContent.trim();
                updateBreadcrumbs(categoryName);
            }
        });
    }, { 
        threshold: 0.3,
        rootMargin: '-80px 0px 0px 0px'
    });
    
    sections.forEach(section => observer.observe(section));
}

function updateBreadcrumbs(categoryName) {
    const breadcrumbsContainer = document.querySelector('.breadcrumbs-container');
    
    // Limpiar breadcrumbs existentes excepto el home
    const existingBreadcrumbs = breadcrumbsContainer.querySelectorAll('.breadcrumb-item:not(:first-child)');
    existingBreadcrumbs.forEach(item => item.remove());
    
    // Remover active del home
    const homeItem = breadcrumbsContainer.querySelector('.breadcrumb-item:first-child');
    homeItem.classList.remove('active');
    
    // Añadir nuevo breadcrumb si no es "Todas"
    if (categoryName && !categoryName.includes('Todas')) {
        const newBreadcrumb = document.createElement('a');
        newBreadcrumb.href = '#';
        newBreadcrumb.className = 'breadcrumb-item active';
        newBreadcrumb.innerHTML = `<i class="fas fa-folder-open"></i> ${categoryName}`;
        breadcrumbsContainer.appendChild(newBreadcrumb);
    } else {
        homeItem.classList.add('active');
    }
}

function resetBreadcrumbs() {
    const breadcrumbsContainer = document.querySelector('.breadcrumbs-container');
    const existingBreadcrumbs = breadcrumbsContainer.querySelectorAll('.breadcrumb-item:not(:first-child)');
    existingBreadcrumbs.forEach(item => item.remove());
    
    const homeItem = breadcrumbsContainer.querySelector('.breadcrumb-item:first-child');
    homeItem.classList.add('active');
}

// ===============================
// CLICK EN TARJETAS DE NOTICIAS
// ===============================

function initializeNewsCards() {
    const newsCards = document.querySelectorAll('.news-card');

    newsCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Evitar que el click en el botón de copiar active el link
            if (e.target.closest('.copy-link-btn')) {
                return;
            }

            const url = card.getAttribute('data-url');
            if (url) {
                // Añadir animación de click
                card.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    card.style.transform = '';
                    window.open(url, '_blank');
                }, 100);
            }
        });

        // Cambiar cursor
        card.style.cursor = 'pointer';
        
        // Tooltip en hover
        card.setAttribute('title', 'Click para abrir la noticia completa');
    });
}

// ===============================
// BOTONES COPIAR ENLACE
// ===============================

function initializeCopyButtons() {
    const copyButtons = document.querySelectorAll('.copy-link-btn');

    copyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const newsCard = button.closest('.news-card');
            const url = newsCard.getAttribute('data-url');

            if (url) {
                navigator.clipboard.writeText(url).then(() => {
                    // Feedback visual mejorado
                    const originalHTML = button.innerHTML;
                    button.innerHTML = '<i class="fas fa-check"></i>';
                    button.style.background = '#10b981';
                    button.style.color = 'white';
                    button.style.transform = 'scale(1.2)';

                    // Mostrar tooltip
                    showTooltip(button, '¡Enlace copiado!');

                    setTimeout(() => {
                        button.innerHTML = originalHTML;
                        button.style.background = '';
                        button.style.color = '';
                        button.style.transform = '';
                    }, 2000);
                }).catch(err => {
                    console.error('Error al copiar:', err);
                    showTooltip(button, 'Error al copiar', true);
                });
            }
        });
    });
}

function showTooltip(element, message, isError = false) {
    const tooltip = document.createElement('div');
    tooltip.textContent = message;
    tooltip.style.cssText = `
        position: absolute;
        top: -40px;
        left: 50%;
        transform: translateX(-50%);
        background: ${isError ? '#ef4444' : '#10b981'};
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 0.85rem;
        white-space: nowrap;
        z-index: 1000;
        animation: fadeInDown 0.3s ease;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    `;
    
    element.style.position = 'relative';
    element.appendChild(tooltip);
    
    setTimeout(() => {
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translateX(-50%) translateY(-10px)';
        setTimeout(() => tooltip.remove(), 300);
    }, 1500);
}

// ===============================
// ANIMACIONES AL SCROLL
// ===============================

function initializeAnimations() {
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

    // Observar tarjetas de noticias
    document.querySelectorAll('.news-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
    
    // Observar mini charts para animarlos
    document.querySelectorAll('.chart-bar').forEach((bar, index) => {
        bar.style.transform = 'scaleY(0)';
        bar.style.transformOrigin = 'bottom';
        bar.style.transition = `transform 0.6s ease ${index * 0.1}s`;
        
        const chartObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    bar.style.transform = 'scaleY(1)';
                    chartObserver.unobserve(bar);
                }
            });
        }, { threshold: 0.5 });
        
        chartObserver.observe(bar);
    });
}

// ===============================
// UTILIDADES
// ===============================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===============================
// ATAJOS DE TECLADO (OPCIONAL)
// ===============================

document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K para focus en búsqueda
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
    
    // Ctrl/Cmd + D para toggle dark mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        document.getElementById('themeToggle').click();
    }
});

// ===============================
// MANEJO DE ERRORES DE IMÁGENES
// ===============================

document.querySelectorAll('.news-image img').forEach(img => {
    img.addEventListener('error', function() {
        this.src = 'https://placehold.co/400x300/122864/FFFFFF?text=Imagen+no+disponible';
    });
});

// ===============================
// LOG DE ESTADÍSTICAS (OPCIONAL)
// ===============================

function logStatistics() {
    const stats = {
        totalNews: document.querySelectorAll('.news-card').length,
        categories: document.querySelectorAll('.category-section').length,
        nacional: document.querySelectorAll('[data-scope="Nacional"]').length,
        internacional: document.querySelectorAll('[data-scope="Internacional"]').length,
        theme: localStorage.getItem('theme') || 'light'
    };
    
    console.log('📊 Estadísticas del Report:', stats);
}

// Ejecutar al cargar
logStatistics();

// ===============================
// DETECCIÓN DE MOBILE
// ===============================

function isMobile() {
    return window.innerWidth <= 768;
}

// Ajustes específicos para mobile
if (isMobile()) {
    // Reducir animaciones en mobile para mejor rendimiento
    document.querySelectorAll('.particle').forEach(particle => {
        particle.style.display = 'none';
    });
}

// ===============================
// PERFORMANCE MONITORING
// ===============================

window.addEventListener('load', () => {
    // Tiempo de carga
    const loadTime = performance.now();
    console.log(`⚡ Página cargada en ${Math.round(loadTime)}ms`);
    
    // Lazy loading para imágenes
    if ('loading' in HTMLImageElement.prototype) {
        const images = document.querySelectorAll('img[loading="lazy"]');
        console.log(`🖼️ ${images.length} imágenes con lazy loading`);
    }
});