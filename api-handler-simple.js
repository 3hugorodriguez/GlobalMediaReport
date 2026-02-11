// ===============================
// API HANDLER - VERSIÓN MEJORADA
// ===============================

const CONFIG = {
    dataPath: './data/gmr-data.json',
    logoFallback: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Cdefs%3E%3ClinearGradient id="grad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23122864;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23006cb1;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="200" height="200" fill="url(%23grad)"/%3E%3Ctext x="100" y="100" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle"%3EGE%3C/text%3E%3C/svg%3E',
    newsDaysThreshold: 7
};

class GMRDataService {
    constructor(jsonPath) {
        this.jsonPath = jsonPath;
    }

    async fetchData() {
        try {
            console.log('📡 Cargando datos...');
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
        // Ordenar por fecha descendente
        data.noticias.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        // Marcar noticias nuevas
        const now = new Date();
        data.noticias.forEach(noticia => {
            const newsDate = new Date(noticia.fecha);
            const diffDays = Math.floor((now - newsDate) / (1000 * 60 * 60 * 24));
            noticia.isNew = diffDays >= 0 && diffDays <= CONFIG.newsDaysThreshold;
            
            // Fallback de imagen
            if (!noticia.imagen || noticia.imagen.includes('placehold.co')) {
                noticia.imagen = CONFIG.logoFallback;
                noticia.useFallback = true;
            }
        });
        
        return data;
    }
}

// ===============================
// RENDERER MEJORADO
// ===============================

class GMRRenderer {
    constructor(data) {
        this.data = data;
    }

    renderHeroStats() {
        const stats = this.calculateStats();
        
        this.animateCounter('totalNewsHero', stats.total);
        this.animateCounter('internationalCount', stats.internacional);
        
        // Top category
        const topCat = Object.entries(stats.porCategoria)
            .sort((a, b) => b[1] - a[1])[0];
        
        if (topCat) {
            const catName = this.getCategoryName(topCat[0]);
            document.getElementById('topCategoryHero').textContent = catName;
        }
        
        // Last update
        if (this.data.noticias.length > 0) {
            const lastDate = new Date(this.data.noticias[0].fecha);
            document.getElementById('lastUpdateHero').textContent = this.getRelativeTime(lastDate);
        }
        
        // Period
        const periodEl = document.getElementById('currentPeriod');
        if (periodEl) {
            periodEl.textContent = this.getPeriodRange();
        }
    }

    getRelativeTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins}m`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 30) return `Hace ${diffDays}d`;
        
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }

    getPeriodRange() {
        if (this.data.noticias.length === 0) return 'Sin datos';
        
        const fechas = this.data.noticias.map(n => new Date(n.fecha));
        const oldestDate = new Date(Math.min(...fechas));
        const newestDate = new Date(Math.max(...fechas));
        
        const optionsMonth = { month: 'long', year: 'numeric' };
        const oldestStr = oldestDate.toLocaleDateString('es-ES', optionsMonth);
        const newestStr = newestDate.toLocaleDateString('es-ES', optionsMonth);
        
        const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
        
        if (oldestStr === newestStr) {
            return capitalize(oldestStr);
        }
        
        return `${capitalize(oldestStr)} - ${capitalize(newestStr)}`;
    }

    animateCounter(elementId, target) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const duration = 1200;
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

    calculateStats() {
        const noticias = this.data.noticias;
        
        return {
            total: noticias.length,
            nacional: noticias.filter(n => n.alcance === 'Nacional').length,
            internacional: noticias.filter(n => n.alcance === 'Internacional').length,
            porCategoria: noticias.reduce((acc, n) => {
                acc[n.categoria] = (acc[n.categoria] || 0) + 1;
                return acc;
            }, {}),
            porMes: this.groupByMonth(noticias)
        };
    }

    renderMonthFilters() {
        const container = document.getElementById('monthTimeline');
        const stats = this.calculateStats();
        const months = Object.keys(stats.porMes).sort((a, b) => new Date(b) - new Date(a));
        
        // Actualizar contador "Todos"
        const allPill = container.querySelector('.pill[data-month="all"]');
        if (allPill) {
            const badge = allPill.querySelector('.pill-badge');
            if (badge) badge.textContent = stats.total;
        }
        
        // Crear pills de meses
        months.forEach(month => {
            const count = stats.porMes[month];
            const monthName = this.formatMonth(month);
            
            const pill = document.createElement('button');
            pill.className = 'pill';
            pill.setAttribute('data-month', month);
            pill.innerHTML = `
                <span>${monthName}</span>
                <span class="pill-badge">${count}</span>
            `;
            
            container.appendChild(pill);
        });
    }

    groupByMonth(noticias) {
        return noticias.reduce((acc, noticia) => {
            const date = new Date(noticia.fecha);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
    }

    formatMonth(monthKey) {
        const [year, month] = monthKey.split('-');
        const date = new Date(year, parseInt(month) - 1);
        const formatted = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
        return formatted.charAt(0).toUpperCase() + formatted.slice(1).replace('.', '');
    }

    renderCategoryFilters() {
        const container = document.getElementById('categoryFilters');
        const stats = this.calculateStats();
        
        // Actualizar "Todas"
        document.getElementById('countAll').textContent = stats.total;
        
        // Crear pills de categorías
        this.data.categorias.forEach(cat => {
            const count = stats.porCategoria[cat.Slug] || 0;
            if (count === 0) return;
            
            const pill = document.createElement('button');
            pill.className = 'pill';
            pill.setAttribute('data-category', cat.Slug);
            pill.innerHTML = `
                <span>${cat.Nombre}</span>
                <span class="pill-badge">${count}</span>
            `;
            
            container.appendChild(pill);
        });
    }

    renderNews() {
        const container = document.getElementById('newsContainer');
        
        // Ocultar skeleton
        const skeleton = document.getElementById('skeletonLoader');
        if (skeleton) {
            skeleton.style.opacity = '0';
            setTimeout(() => skeleton.remove(), 300);
        }
        
        container.innerHTML = '';
        
        // Agrupar por mes
        const noticiasPorMes = this.groupNewsByMonth(this.data.noticias);
        const mesesOrdenados = Object.keys(noticiasPorMes).sort((a, b) => new Date(b) - new Date(a));
        
        mesesOrdenados.forEach(mes => {
            const monthSection = this.createMonthSection(mes, noticiasPorMes[mes]);
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
                <div class="month-title">
                    <i class="far fa-calendar"></i>
                    <h2>${monthName}</h2>
                </div>
                <span class="month-badge">${noticias.length}</span>
            </div>
            <div class="news-grid"></div>
        `;
        
        const grid = section.querySelector('.news-grid');
        
        noticias.forEach((noticia, index) => {
            const card = this.createNewsCard(noticia);
            card.style.animationDelay = `${index * 0.05}s`;
            grid.appendChild(card);
        });
        
        return section;
    }

    createNewsCard(noticia) {
        const article = document.createElement('article');
        article.className = 'news-card';
        article.setAttribute('data-url', noticia.url);
        article.setAttribute('data-category', noticia.categoria);
        article.setAttribute('data-scope', noticia.alcance);
        
        const fecha = new Date(noticia.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        
        const categoryData = this.data.categorias.find(c => c.Slug === noticia.categoria);
        const categoryIcon = categoryData ? categoryData.Icono : 'fa-circle';
        const categoryColor = categoryData ? categoryData.Color : '#666';
        
        const badgeClass = noticia.alcance === 'Nacional' ? 'badge-nacional' : 'badge-internacional';
        
        const imageClass = noticia.useFallback ? 'news-img fallback' : 'news-img';
        
        article.innerHTML = `
            <div class="news-img-wrapper">
                <img src="${noticia.imagen}" 
                     alt="${noticia.titulo}" 
                     class="${imageClass}"
                     loading="lazy">
                ${noticia.isNew ? `
                    <div class="badge-new">
                        <i class="fas fa-certificate"></i>
                        Nueva
                    </div>
                ` : ''}
            </div>
            
            <div class="news-body">
                <div class="news-meta">
                    <span class="badge ${badgeClass}">
                        <i class="fas ${noticia.alcance === 'Nacional' ? 'fa-map-marker-alt' : 'fa-globe'}"></i>
                        ${noticia.alcance}
                    </span>
                    <span class="news-date">
                        <i class="far fa-clock"></i>
                        ${fechaFormateada}
                    </span>
                </div>
                
                <h3 class="news-title">${noticia.titulo}</h3>
                
                ${noticia.resumen ? `
                    <p class="news-summary">${noticia.resumen}</p>
                ` : ''}
                
                <div class="news-footer">
                    <div class="news-source">
                        <i class="fas fa-newspaper"></i>
                        ${noticia.medio}
                    </div>
                    
                    <div class="news-category" style="--cat-color: ${categoryColor}">
                        <i class="fas ${categoryIcon}"></i>
                    </div>
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
        console.log('🎨 Renderizando interfaz...');
        this.renderHeroStats();
        this.renderMonthFilters();
        this.renderCategoryFilters();
        this.renderNews();
        console.log('✅ Renderizado completo');
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
        console.log('🚀 Iniciando GMR...');
        
        dataService = new GMRDataService(CONFIG.dataPath);
        allData = await dataService.fetchData();
        
        renderer = new GMRRenderer(allData);
        renderer.renderAll();
        
        setTimeout(() => {
            initializeFilters();
            initializeSearch();
            initializeNewsCards();
            initializeBackToTop();
            
            console.log('✅ Sistema listo');
            showToast('Sistema cargado correctamente', 'success');
        }, 100);
        
    } catch (error) {
        console.error('❌ Error crítico:', error);
        showToast('Error al cargar los datos', 'error');
        showErrorState();
    }
}

function showErrorState() {
    const container = document.getElementById('newsContainer');
    const skeleton = document.getElementById('skeletonLoader');
    
    if (skeleton) skeleton.remove();
    
    container.innerHTML = `
        <div class="empty-state" style="display: flex;">
            <div class="empty-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3 class="empty-title">Error al cargar datos</h3>
            <p class="empty-text">No se pudieron cargar las noticias.</p>
            <button class="btn-primary" onclick="location.reload()">
                <i class="fas fa-redo"></i>
                Recargar
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
    
    // Month filters
    document.getElementById('monthTimeline').addEventListener('click', (e) => {
        const pill = e.target.closest('.pill');
        if (!pill) return;
        
        document.querySelectorAll('#monthTimeline .pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        
        activeMonth = pill.getAttribute('data-month');
        applyFilters(activeMonth, activeCategory);
    });
    
    // Category filters
    document.getElementById('categoryFilters').addEventListener('click', (e) => {
        const pill = e.target.closest('.pill');
        if (!pill) return;
        
        document.querySelectorAll('#categoryFilters .pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        
        activeCategory = pill.getAttribute('data-category');
        applyFilters(activeMonth, activeCategory);
    });
    
    // Reset
    document.getElementById('resetFilters').addEventListener('click', () => {
        resetAllFilters();
    });
    
    function applyFilters(month, category) {
        const sections = document.querySelectorAll('.month-section');
        let visibleCount = 0;
        
        sections.forEach(section => {
            const sectionMonth = section.getAttribute('data-month');
            const shouldShowMonth = month === 'all' || sectionMonth === month;
            
            if (shouldShowMonth) {
                const cards = section.querySelectorAll('.news-card');
                let visibleInSection = 0;
                
                cards.forEach(card => {
                    const cardCategory = card.getAttribute('data-category');
                    const shouldShowCategory = category === 'all' || cardCategory === category;
                    
                    if (shouldShowCategory) {
                        card.style.display = '';
                        visibleInSection++;
                        visibleCount++;
                    } else {
                        card.style.display = 'none';
                    }
                });
                
                section.style.display = visibleInSection > 0 ? '' : 'none';
            } else {
                section.style.display = 'none';
            }
        });
        
        toggleEmptyState(visibleCount);
        showToast(`${visibleCount} noticia${visibleCount !== 1 ? 's' : ''}`, 'info');
    }
}

// ===============================
// BÚSQUEDA
// ===============================

function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBadge = document.getElementById('searchBadge');
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(e.target.value.toLowerCase().trim());
        }, 300);
    });
    
    function performSearch(term) {
        const cards = document.querySelectorAll('.news-card');
        let visibleCount = 0;
        
        if (term === '') {
            cards.forEach(card => card.style.display = '');
            searchBadge.style.display = 'none';
            
            document.querySelectorAll('.month-section').forEach(s => s.style.display = '');
            toggleEmptyState(cards.length);
            return;
        }
        
        cards.forEach(card => {
            const title = card.querySelector('.news-title').textContent.toLowerCase();
            const source = card.querySelector('.news-source').textContent.toLowerCase();
            const summary = card.querySelector('.news-summary')?.textContent.toLowerCase() || '';
            
            if (title.includes(term) || source.includes(term) || summary.includes(term)) {
                card.style.display = '';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        searchBadge.textContent = visibleCount;
        searchBadge.style.display = 'flex';
        
        document.querySelectorAll('.month-section').forEach(section => {
            const visibleCards = section.querySelectorAll('.news-card:not([style*="display: none"])').length;
            section.style.display = visibleCards > 0 ? '' : 'none';
        });
        
        toggleEmptyState(visibleCount);
    }
}

// ===============================
// INTERACCIONES
// ===============================

function initializeNewsCards() {
    document.getElementById('newsContainer').addEventListener('click', (e) => {
        const card = e.target.closest('.news-card');
        if (!card) return;
        
        const url = card.getAttribute('data-url');
        if (url) {
            card.style.transform = 'scale(0.98)';
            setTimeout(() => {
                window.open(url, '_blank');
                card.style.transform = '';
            }, 150);
        }
    });
}

function initializeBackToTop() {
    const btn = document.getElementById('backToTop');
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 500) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });
    
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function toggleEmptyState(count) {
    const emptyState = document.getElementById('emptyState');
    
    if (count === 0) {
        emptyState.style.display = 'flex';
    } else {
        emptyState.style.display = 'none';
    }
}

function resetAllFilters() {
    document.querySelectorAll('.pill').forEach(pill => pill.classList.remove('active'));
    document.querySelector('.pill[data-month="all"]')?.classList.add('active');
    document.querySelector('.pill[data-category="all"]')?.classList.add('active');
    
    document.getElementById('searchInput').value = '';
    document.getElementById('searchBadge').style.display = 'none';
    
    document.querySelectorAll('.news-card, .month-section').forEach(el => el.style.display = '');
    
    toggleEmptyState(document.querySelectorAll('.news-card').length);
    showToast('Filtros restablecidos', 'success');
}

// ===============================
// TOAST
// ===============================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
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
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}