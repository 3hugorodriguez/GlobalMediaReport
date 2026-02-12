// ===============================
// CONFIGURACIÓN CRYSTAL
// ===============================

const CONFIG = {
    dataPath: './data/gmr-data.json',
    newsDaysThreshold: 7,
    monthNames: {
        '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
        '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
        '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
    },
    fallbackImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400"%3E%3Cdefs%3E%3ClinearGradient id="grad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23122864;stop-opacity:1" /%3E%3Cstop offset="50%25" style="stop-color:%23006cb1;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%2328bdc7;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="800" height="400" fill="url(%23grad)"/%3E%3Ctext x="400" y="200" font-family="Inter, sans-serif" font-size="80" font-weight="bold" fill="rgba(255,255,255,0.9)" text-anchor="middle" dominant-baseline="middle"%3EGE%3C/text%3E%3C/svg%3E'
};

// ===============================
// SERVICIO DE DATOS
// ===============================

class GMRDataService {
    constructor(jsonPath) {
        this.jsonPath = jsonPath;
    }

    async fetchData() {
        try {
            console.log('📡 Cargando datos GMR Crystal...');
            const response = await fetch(`${this.jsonPath}?t=${Date.now()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success || !result.data) {
                throw new Error('Estructura de datos inválida');
            }
            
            console.log(`✅ ${result.data.noticias.length} noticias cargadas`);
            return this.processData(result.data);
            
        } catch (error) {
            console.error('❌ Error al cargar datos:', error);
            throw error;
        }
    }

    processData(data) {
        data.noticias.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        const now = new Date();
        data.noticias.forEach(noticia => {
            const newsDate = new Date(noticia.fecha);
            const diffDays = Math.floor((now - newsDate) / (1000 * 60 * 60 * 24));
            noticia.isNew = diffDays >= 0 && diffDays <= CONFIG.newsDaysThreshold;
            
            // Fallback de imagen
            if (!noticia.imagen || noticia.imagen.includes('placehold.co')) {
                noticia.imagen = CONFIG.fallbackImage;
                noticia.useFallback = true;
            }
        });
        
        return data;
    }
}

// ===============================
// CRYSTAL RENDERER
// ===============================

class CrystalRenderer {
    constructor(data) {
        this.data = data;
    }

    updateHeaderMeta() {
        const meta = document.getElementById('headerMeta');
        if (!meta) return;
        
        const stats = this.calculateStats();
        let lastUpdate = 'Sin datos';
        
        if (this.data.noticias.length > 0) {
            const lastDate = new Date(this.data.noticias[0].fecha);
            lastUpdate = this.getRelativeTime(lastDate);
        }
        
        meta.innerHTML = `
            <span class="pulse-dot"></span>
            ${stats.total} noticias • ${stats.internacional} internacionales • ${lastUpdate}
        `;
    }

    updateStatsBar() {
        const stats = this.calculateStats();
        
        this.animateCounter('totalStat', stats.total);
        this.animateCounter('intlStat', stats.internacional);
        this.animateCounter('newStat', stats.new);
        
        // Top category
        const topCat = Object.entries(stats.porCategoria)
            .sort((a, b) => b[1] - a[1])[0];
        
        if (topCat) {
            const catName = this.getCategoryName(topCat[0]);
            const topCatEl = document.getElementById('topCat');
            if (topCatEl) {
                topCatEl.textContent = catName.split(' ').slice(0, 2).join(' ');
            }
        }
    }

    animateCounter(elementId, target) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const duration = 1500;
        const increment = target / (duration / 16);
        let current = 0;
        
        const animate = () => {
            current += increment;
            if (current < target) {
                element.textContent = Math.floor(current);
                requestAnimationFrame(animate);
            } else {
                element.textContent = target;
            }
        };
        
        animate();
    }

    getRelativeTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Ahora mismo';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 30) return `Hace ${diffDays}d`;
        
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }

    calculateStats() {
        const noticias = this.data.noticias;
        
        return {
            total: noticias.length,
            nacional: noticias.filter(n => n.alcance === 'Nacional').length,
            internacional: noticias.filter(n => n.alcance === 'Internacional').length,
            new: noticias.filter(n => n.isNew).length,
            porCategoria: noticias.reduce((acc, n) => {
                acc[n.categoria] = (acc[n.categoria] || 0) + 1;
                return acc;
            }, {}),
            porMes: this.groupByMonth(noticias)
        };
    }

    groupByMonth(noticias) {
        return noticias.reduce((acc, noticia) => {
            const date = new Date(noticia.fecha);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
    }

    renderMonthFilters() {
        const container = document.getElementById('monthFilters');
        if (!container) return;
        
        const stats = this.calculateStats();
        const months = Object.keys(stats.porMes).sort((a, b) => new Date(b) - new Date(a));
        
        // Actualizar "Todos"
        const allPill = container.querySelector('.glass-pill[data-month="all"]');
        if (allPill) {
            allPill.querySelector('.pill-count').textContent = stats.total;
        }
        
        // Crear pills de meses
        months.forEach((month, index) => {
            const count = stats.porMes[month];
            const monthName = this.formatMonth(month);
            
            const pill = document.createElement('button');
            pill.className = 'glass-pill';
            pill.setAttribute('data-month', month);
            pill.style.animationDelay = `${index * 0.05}s`;
            pill.innerHTML = `
                <span>${monthName}</span>
                <span class="pill-count">${count}</span>
            `;
            
            container.appendChild(pill);
        });
    }

    renderCategoryFilters() {
        const container = document.getElementById('categoryFilters');
        if (!container) return;
        
        const stats = this.calculateStats();
        
        // Actualizar "Todas"
        const allPill = container.querySelector('.glass-pill[data-category="all"]');
        if (allPill) {
            allPill.querySelector('.pill-count').textContent = stats.total;
        }
        
        // Crear pills de categorías
        this.data.categorias.forEach((cat, index) => {
            const count = stats.porCategoria[cat.Slug] || 0;
            if (count === 0) return;
            
            const pill = document.createElement('button');
            pill.className = 'glass-pill';
            pill.setAttribute('data-category', cat.Slug);
            pill.style.animationDelay = `${index * 0.05}s`;
            pill.innerHTML = `
                <span>${cat.Nombre}</span>
                <span class="pill-count">${count}</span>
            `;
            
            container.appendChild(pill);
        });
    }

    formatMonth(monthKey) {
        const [year, month] = monthKey.split('-');
        return `${CONFIG.monthNames[month]} ${year}`;
    }

    renderNews() {
        const container = document.getElementById('newsContainer');
        if (!container) return;
        
        // Ocultar skeleton con fade
        const skeleton = document.getElementById('skeletonLoader');
        if (skeleton) {
            skeleton.style.opacity = '0';
            setTimeout(() => skeleton.remove(), 400);
        }
        
        container.innerHTML = '';
        
        // Agrupar por mes → categoría
        const noticiasPorMes = this.groupNewsByMonth(this.data.noticias);
        const mesesOrdenados = Object.keys(noticiasPorMes).sort((a, b) => new Date(b) - new Date(a));
        
        mesesOrdenados.forEach((mes, index) => {
            const monthSection = this.createMonthSection(mes, noticiasPorMes[mes]);
            monthSection.style.animationDelay = `${index * 0.1}s`;
            container.appendChild(monthSection);
        });
    }

    groupNewsByMonth(noticias) {
        return noticias.reduce((acc, noticia) => {
            const date = new Date(noticia.fecha);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(noticia);
            return acc;
        }, {});
    }

    createMonthSection(mes, noticias) {
        const section = document.createElement('section');
        section.className = 'month-section';
        section.setAttribute('data-month', mes);
        
        const monthName = this.formatMonth(mes);
        
        section.innerHTML = `
            <div class="month-header">
                <h2 class="month-title">
                    <i class="far fa-calendar"></i>
                    ${monthName}
                </h2>
                <span class="month-count">${noticias.length}</span>
            </div>
        `;
        
        // Agrupar por categoría
        const noticiasPorCategoria = this.groupNewsByCategory(noticias);
        
        // Ordenar categorías
        const categoriasOrdenadas = this.data.categorias
            .filter(cat => noticiasPorCategoria[cat.Slug])
            .map(cat => cat.Slug);
        
        categoriasOrdenadas.forEach(catSlug => {
            const categorySection = this.createCategorySection(
                catSlug, 
                noticiasPorCategoria[catSlug]
            );
            section.appendChild(categorySection);
        });
        
        return section;
    }

    groupNewsByCategory(noticias) {
        return noticias.reduce((acc, noticia) => {
            if (!acc[noticia.categoria]) acc[noticia.categoria] = [];
            acc[noticia.categoria].push(noticia);
            return acc;
        }, {});
    }

    createCategorySection(categorySlug, noticias) {
        const categoryData = this.data.categorias.find(c => c.Slug === categorySlug);
        
        if (!categoryData) {
            console.warn(`Categoría no encontrada: ${categorySlug}`);
            return document.createElement('div');
        }
        
        const section = document.createElement('div');
        section.className = 'category-section';
        section.setAttribute('data-category', categorySlug);
        
        section.innerHTML = `
            <div class="category-header" style="--cat-color: ${categoryData.Color}">
                <div class="category-icon">
                    <i class="fas ${categoryData.Icono}"></i>
                </div>
                <h3 class="category-name">${categoryData.Nombre}</h3>
                <span class="category-count">${noticias.length}</span>
            </div>
            <div class="news-grid"></div>
        `;
        
        const grid = section.querySelector('.news-grid');
        
        noticias.forEach((noticia, index) => {
            const card = this.createCrystalCard(noticia, categoryData);
            card.style.animationDelay = `${index * 0.08}s`;
            grid.appendChild(card);
        });
        
        return section;
    }

    createCrystalCard(noticia, categoryData) {
        const article = document.createElement('article');
        article.className = 'crystal-card';
        article.setAttribute('data-url', noticia.url);
        article.setAttribute('data-category', noticia.categoria);
        article.setAttribute('data-scope', noticia.alcance);
        article.style.setProperty('--cat-color', categoryData.Color);
        
        const fecha = new Date(noticia.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        
        const badgeClass = noticia.alcance === 'Nacional' ? 'nacional' : 'internacional';
        
        // Limitar highlights a 3 para mejor UX
        const highlightsLimited = noticia.highlights ? noticia.highlights.slice(0, 3) : [];
        
        article.innerHTML = `
            <div class="card-image">
                <img src="${noticia.imagen}" 
                     alt="${noticia.titulo}"
                     loading="lazy"
                     onerror="this.src='${CONFIG.fallbackImage}'">
                <div class="card-image-overlay"></div>
                ${noticia.isNew ? `
                    <div class="card-badge-new">
                        <i class="fas fa-star"></i>
                        Nueva
                    </div>
                ` : ''}
            </div>
            
            <div class="card-content">
                <div class="card-meta">
                    <span class="card-badge ${badgeClass}">
                        <i class="fas ${noticia.alcance === 'Nacional' ? 'fa-map-marker-alt' : 'fa-globe'}"></i>
                        ${noticia.alcance}
                    </span>
                    <span class="card-date">
                        <i class="far fa-clock"></i>
                        ${fechaFormateada}
                    </span>
                    <span class="card-source">
                        <i class="fas fa-newspaper"></i>
                        ${noticia.medio}
                    </span>
                </div>
                
                <h3 class="card-title">${noticia.titulo}</h3>
                
                ${noticia.resumen ? `
                    <p class="card-summary">${noticia.resumen}</p>
                ` : ''}
                
                ${highlightsLimited.length > 0 ? `
                    <ul class="card-highlights">
                        ${highlightsLimited.map(h => `<li>${h}</li>`).join('')}
                    </ul>
                ` : ''}
                
                <div class="card-footer">
                    <div class="card-tags">
                        ${noticia.tags ? noticia.tags.slice(0, 3).map(tag => 
                            `<span class="card-tag">${tag}</span>`
                        ).join('') : ''}
                    </div>
                    <a href="${noticia.url}" 
                       target="_blank" 
                       class="card-link"
                       onclick="event.stopPropagation()">
                        Leer más
                        <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        `;
        
        return article;
    }

    getCategoryName(slug) {
        const cat = this.data.categorias.find(c => c.Slug === slug);
        return cat ? cat.Nombre : slug;
    }

    renderAll() {
        console.log('🎨 Renderizando Crystal UI...');
        this.updateHeaderMeta();
        this.updateStatsBar();
        this.renderMonthFilters();
        this.renderCategoryFilters();
        this.renderNews();
        console.log('✅ Crystal UI renderizado');
    }
}

// ===============================
// INICIALIZACIÓN
// ===============================

let dataService;
let renderer;
let allData;

async function initializeGMR() {
    try {
        console.log('🔮 Iniciando GMR Crystal v3.0...');
        
        dataService = new GMRDataService(CONFIG.dataPath);
        allData = await dataService.fetchData();
        
        renderer = new CrystalRenderer(allData);
        renderer.renderAll();
        
        setTimeout(() => {
            initializeFilters();
            initializeSearch();
            initializeCrystalCards();
            initializeScrollEffects();
            
            console.log('✨ Sistema Crystal listo');
            showToast('Sistema cargado correctamente', 'success');
        }, 100);
        
    } catch (error) {
        console.error('❌ Error crítico:', error);
        showToast('Error al cargar el sistema', 'error');
        showErrorState();
    }
}

function showErrorState() {
    const container = document.getElementById('newsContainer');
    const skeleton = document.getElementById('skeletonLoader');
    
    if (skeleton) skeleton.remove();
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-state-crystal" style="display: flex;">
            <div class="empty-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3>Error al cargar datos</h3>
            <p>No se pudieron cargar las noticias. Verifica tu conexión.</p>
            <button class="crystal-btn primary" onclick="location.reload()">
                <i class="fas fa-redo"></i>
                Recargar página
            </button>
        </div>
    `;
}

// ===============================
// FILTROS
// ===============================

function initializeFilters() {
    let activeMonth = 'all';
    let activeCategory = 'all';
    
    const monthFilters = document.getElementById('monthFilters');
    const categoryFilters = document.getElementById('categoryFilters');
    const resetBtn = document.getElementById('resetFilters');
    
    if (!monthFilters || !categoryFilters || !resetBtn) {
        console.warn('⚠️ Elementos de filtros no encontrados');
        return;
    }
    
    // Month filters
    monthFilters.addEventListener('click', (e) => {
        const pill = e.target.closest('.glass-pill');
        if (!pill) return;
        
        monthFilters.querySelectorAll('.glass-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        
        activeMonth = pill.getAttribute('data-month');
        applyFilters(activeMonth, activeCategory);
    });
    
    // Category filters
    categoryFilters.addEventListener('click', (e) => {
        const pill = e.target.closest('.glass-pill');
        if (!pill) return;
        
        categoryFilters.querySelectorAll('.glass-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        
        activeCategory = pill.getAttribute('data-category');
        applyFilters(activeMonth, activeCategory);
    });
    
    // Reset
    resetBtn.addEventListener('click', () => {
        resetAllFilters();
    });
    
    function applyFilters(month, category) {
        const sections = document.querySelectorAll('.month-section');
        let visibleCount = 0;
        
        sections.forEach(section => {
            const sectionMonth = section.getAttribute('data-month');
            const shouldShowMonth = month === 'all' || sectionMonth === month;
            
            if (shouldShowMonth) {
                const categorySections = section.querySelectorAll('.category-section');
                let visibleInMonth = 0;
                
                categorySections.forEach(catSec => {
                    const catSlug = catSec.getAttribute('data-category');
                    const shouldShowCat = category === 'all' || catSlug === category;
                    
                    if (shouldShowCat) {
                        catSec.style.display = '';
                        const cards = catSec.querySelectorAll('.crystal-card');
                        visibleInMonth += cards.length;
                        visibleCount += cards.length;
                    } else {
                        catSec.style.display = 'none';
                    }
                });
                
                section.style.display = visibleInMonth > 0 ? '' : 'none';
            } else {
                section.style.display = 'none';
            }
        });
        
        toggleEmptyState(visibleCount);
        showToast(`${visibleCount} noticia${visibleCount !== 1 ? 's' : ''} encontrada${visibleCount !== 1 ? 's' : ''}`, 'info');
    }
}

// ===============================
// BÚSQUEDA MEJORADA
// ===============================

function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    
    if (!searchInput) {
        console.warn('⚠️ Input de búsqueda no encontrado');
        return;
    }
    
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(e.target.value.toLowerCase().trim());
        }, 300);
    });
    
    // Animación en foco
    searchInput.addEventListener('focus', () => {
        searchInput.parentElement.style.transform = 'scale(1.02)';
    });
    
    searchInput.addEventListener('blur', () => {
        searchInput.parentElement.style.transform = '';
    });
    
    function performSearch(term) {
        const cards = document.querySelectorAll('.crystal-card');
        let visibleCount = 0;
        
        if (term === '') {
            cards.forEach(card => card.style.display = '');
            document.querySelectorAll('.month-section, .category-section').forEach(s => s.style.display = '');
            toggleEmptyState(cards.length);
            return;
        }
        
        cards.forEach(card => {
            const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
            const source = card.querySelector('.card-source')?.textContent.toLowerCase() || '';
            const summary = card.querySelector('.card-summary')?.textContent.toLowerCase() || '';
            const highlights = card.querySelector('.card-highlights')?.textContent.toLowerCase() || '';
            
            const matches = title.includes(term) || source.includes(term) || 
                          summary.includes(term) || highlights.includes(term);
            
            if (matches) {
                card.style.display = '';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Ocultar secciones vacías
        document.querySelectorAll('.category-section').forEach(catSec => {
            const visibleCards = catSec.querySelectorAll('.crystal-card:not([style*="display: none"])').length;
            catSec.style.display = visibleCards > 0 ? '' : 'none';
        });
        
        document.querySelectorAll('.month-section').forEach(section => {
            const visibleCats = section.querySelectorAll('.category-section:not([style*="display: none"])').length;
            section.style.display = visibleCats > 0 ? '' : 'none';
        });
        
        toggleEmptyState(visibleCount);
    }
}

// ===============================
// INTERACCIONES CRYSTAL CARDS
// ===============================

function initializeCrystalCards() {
    const container = document.getElementById('newsContainer');
    if (!container) return;
    
    container.addEventListener('click', (e) => {
        const card = e.target.closest('.crystal-card');
        if (!card) return;
        
        // No abrir si se hizo clic en un enlace
        if (e.target.closest('.card-link')) return;
        
        const url = card.getAttribute('data-url');
        if (url) {
            // Animación antes de abrir
            card.style.transform = 'scale(0.98)';
            setTimeout(() => {
                window.open(url, '_blank');
                card.style.transform = '';
            }, 150);
        }
    });
}

// ===============================
// EFECTOS DE SCROLL
// ===============================

function initializeScrollEffects() {
    const header = document.getElementById('mainHeader');
    const backToTop = document.getElementById('backToTop');
    
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Header sticky effect
        if (currentScroll > 100) {
            header?.classList.add('scrolled');
        } else {
            header?.classList.remove('scrolled');
        }
        
        // Back to top button
        if (currentScroll > 500) {
            backToTop?.classList.add('visible');
        } else {
            backToTop?.classList.remove('visible');
        }
        
        lastScroll = currentScroll;
    });
    
    // Back to top click
    backToTop?.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ===============================
// UTILIDADES
// ===============================

function toggleEmptyState(count) {
    const emptyState = document.getElementById('emptyState');
    if (!emptyState) return;
    
    emptyState.style.display = count === 0 ? 'flex' : 'none';
}

function resetAllFilters() {
    document.querySelectorAll('.glass-pill').forEach(pill => pill.classList.remove('active'));
    document.querySelector('.glass-pill[data-month="all"]')?.classList.add('active');
    document.querySelector('.glass-pill[data-category="all"]')?.classList.add('active');
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    document.querySelectorAll('.crystal-card, .month-section, .category-section').forEach(el => el.style.display = '');
    
    toggleEmptyState(document.querySelectorAll('.crystal-card').length);
    showToast('Filtros restablecidos', 'success');
}

// ===============================
// TOAST SYSTEM
// ===============================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(400px) scale(0.8)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}