// ===============================
// CONFIGURACIÓN
// ===============================

const CONFIG = {
    dataPath: './data/gmr-data.json',
    newsDaysThreshold: 7,
    monthNames: {
        '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
        '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
        '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
    }
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
        data.noticias.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        const now = new Date();
        data.noticias.forEach(noticia => {
            const newsDate = new Date(noticia.fecha);
            const diffDays = Math.floor((now - newsDate) / (1000 * 60 * 60 * 24));
            noticia.isNew = diffDays >= 0 && diffDays <= CONFIG.newsDaysThreshold;
        });
        
        return data;
    }
}

// ===============================
// EXECUTIVE RENDERER
// ===============================

class ExecutiveRenderer {
    constructor(data) {
        this.data = data;
    }

    updateHeaderStats() {
        const statsInfo = document.getElementById('statsInfo');
        if (!statsInfo) return;
        
        const stats = this.calculateStats();
        let lastUpdate = 'Sin datos';
        
        if (this.data.noticias.length > 0) {
            const lastDate = new Date(this.data.noticias[0].fecha);
            lastUpdate = this.getRelativeTime(lastDate);
        }
        
        statsInfo.textContent = `${stats.total} noticias • ${stats.new} nuevas • Actualizado ${lastUpdate}`;
    }

    getRelativeTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffHours < 1) return 'ahora';
        if (diffHours < 24) return `hace ${diffHours}h`;
        if (diffDays < 30) return `hace ${diffDays}d`;
        
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
        const allPill = container.querySelector('.pill-compact[data-month="all"]');
        if (allPill) {
            allPill.querySelector('.count').textContent = stats.total;
        }
        
        // Crear pills
        months.forEach(month => {
            const count = stats.porMes[month];
            const monthName = this.formatMonth(month);
            
            const pill = document.createElement('button');
            pill.className = 'pill-compact';
            pill.setAttribute('data-month', month);
            pill.innerHTML = `${monthName} <span class="count">${count}</span>`;
            
            container.appendChild(pill);
        });
    }

    renderCategoryFilters() {
        const container = document.getElementById('categoryFilters');
        if (!container) return;
        
        const stats = this.calculateStats();
        
        // Actualizar "Todas"
        const allPill = container.querySelector('.pill-compact[data-category="all"]');
        if (allPill) {
            allPill.querySelector('.count').textContent = stats.total;
        }
        
        // Crear pills
        this.data.categorias.forEach(cat => {
            const count = stats.porCategoria[cat.Slug] || 0;
            if (count === 0) return;
            
            const pill = document.createElement('button');
            pill.className = 'pill-compact';
            pill.setAttribute('data-category', cat.Slug);
            pill.innerHTML = `${cat.Nombre} <span class="count">${count}</span>`;
            
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
        
        // Ocultar skeleton
        const skeleton = document.getElementById('skeletonLoader');
        if (skeleton) {
            skeleton.style.opacity = '0';
            setTimeout(() => skeleton.remove(), 300);
        }
        
        container.innerHTML = '';
        
        // Agrupar por mes → categoría
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
        
        if (!categoryData) return document.createElement('div');
        
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
        
        noticias.forEach(noticia => {
            const card = this.createExecutiveCard(noticia, categoryData);
            grid.appendChild(card);
        });
        
        return section;
    }

    createExecutiveCard(noticia, categoryData) {
        const article = document.createElement('article');
        article.className = 'card-executive';
        article.setAttribute('data-url', noticia.url);
        article.setAttribute('data-category', noticia.categoria);
        article.style.setProperty('--cat-color', categoryData.Color);
        
        const fecha = new Date(noticia.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        
        const badgeClass = noticia.alcance === 'Nacional' ? 'nacional' : 'internacional';
        
        // Limitar highlights a 3
        const highlightsLimited = noticia.highlights ? noticia.highlights.slice(0, 3) : [];
        
        // Detectar si tiene imagen
        const hasImage = noticia.imagen && 
                        !noticia.imagen.includes('placehold.co') && 
                        noticia.imagen.trim() !== '';
        
        let imageHTML;
        if (hasImage) {
            imageHTML = `
                <div class="card-image-exec">
                    <img src="${noticia.imagen}" 
                         alt="${noticia.titulo}"
                         loading="lazy"
                         onerror="this.parentElement.classList.add('placeholder'); this.style.display='none';">
                    ${noticia.isNew ? `
                        <div class="card-badge-new">
                            <i class="fas fa-star"></i>
                            Nueva
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            // Placeholder personalizado
            imageHTML = `
                <div class="card-image-exec placeholder">
                    <div class="placeholder-content">
                        <div class="placeholder-icon">
                            <i class="fas ${categoryData.Icono}"></i>
                        </div>
                        <div class="placeholder-text">${categoryData.Nombre}</div>
                    </div>
                    ${noticia.isNew ? `
                        <div class="card-badge-new">
                            <i class="fas fa-star"></i>
                            Nueva
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        article.innerHTML = `
            ${imageHTML}
            
            <div class="card-content-exec">
                <div class="card-meta-exec">
                    <span class="card-badge-exec ${badgeClass}">
                        <i class="fas ${noticia.alcance === 'Nacional' ? 'fa-map-marker-alt' : 'fa-globe'}"></i>
                        ${noticia.alcance}
                    </span>
                    <span>
                        <i class="far fa-clock"></i>
                        ${fechaFormateada}
                    </span>
                </div>
                
                <h3 class="card-title-exec">${noticia.titulo}</h3>
                
                ${highlightsLimited.length > 0 ? `
                    <ul class="card-highlights-exec">
                        ${highlightsLimited.map(h => `<li>${h}</li>`).join('')}
                    </ul>
                ` : ''}
                
                <div class="card-footer-exec">
                    <span class="card-source-exec">
                        <i class="fas fa-newspaper"></i>
                        ${noticia.medio}
                    </span>
                    <a href="${noticia.url}" 
                       target="_blank" 
                       class="card-link-exec"
                       onclick="event.stopPropagation()">
                        Leer
                        <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        `;
        
        return article;
    }

    renderAll() {
        console.log('🎨 Renderizando Executive UI...');
        this.updateHeaderStats();
        this.renderMonthFilters();
        this.renderCategoryFilters();
        this.renderNews();
        console.log('✅ Executive UI renderizado');
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
        console.log('🚀 Iniciando GMR Executive v3.5...');
        
        dataService = new GMRDataService(CONFIG.dataPath);
        allData = await dataService.fetchData();
        
        renderer = new ExecutiveRenderer(allData);
        renderer.renderAll();
        
        setTimeout(() => {
            initializeFilters();
            initializeSearch();
            initializeCards();
            initializeScrollEffects();
            
            console.log('✅ Sistema listo');
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
        <div class="empty-executive" style="display: flex;">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error al cargar datos</h3>
            <p>Verifica tu conexión e intenta nuevamente</p>
            <button class="btn-primary-exec" onclick="location.reload()">
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
    
    const monthFilters = document.getElementById('monthFilters');
    const categoryFilters = document.getElementById('categoryFilters');
    const resetBtn = document.getElementById('resetFilters');
    
    if (!monthFilters || !categoryFilters || !resetBtn) return;
    
    monthFilters.addEventListener('click', (e) => {
        const pill = e.target.closest('.pill-compact');
        if (!pill) return;
        
        monthFilters.querySelectorAll('.pill-compact').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        
        activeMonth = pill.getAttribute('data-month');
        applyFilters(activeMonth, activeCategory);
    });
    
    categoryFilters.addEventListener('click', (e) => {
        const pill = e.target.closest('.pill-compact');
        if (!pill) return;
        
        categoryFilters.querySelectorAll('.pill-compact').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        
        activeCategory = pill.getAttribute('data-category');
        applyFilters(activeMonth, activeCategory);
    });
    
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
                        const cards = catSec.querySelectorAll('.card-executive');
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
        showToast(`${visibleCount} noticia${visibleCount !== 1 ? 's' : ''}`, 'info');
    }
}

// ===============================
// BÚSQUEDA
// ===============================

function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(e.target.value.toLowerCase().trim());
        }, 300);
    });
    
    function performSearch(term) {
        const cards = document.querySelectorAll('.card-executive');
        let visibleCount = 0;
        
        if (term === '') {
            cards.forEach(card => card.style.display = '');
            document.querySelectorAll('.month-section, .category-section').forEach(s => s.style.display = '');
            toggleEmptyState(cards.length);
            return;
        }
        
        cards.forEach(card => {
            const title = card.querySelector('.card-title-exec')?.textContent.toLowerCase() || '';
            const source = card.querySelector('.card-source-exec')?.textContent.toLowerCase() || '';
            const highlights = card.querySelector('.card-highlights-exec')?.textContent.toLowerCase() || '';
            
            if (title.includes(term) || source.includes(term) || highlights.includes(term)) {
                card.style.display = '';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Ocultar secciones vacías
        document.querySelectorAll('.category-section').forEach(catSec => {
            const visibleCards = catSec.querySelectorAll('.card-executive:not([style*="display: none"])').length;
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
// INTERACCIONES
// ===============================

function initializeCards() {
    const container = document.getElementById('newsContainer');
    if (!container) return;
    
    container.addEventListener('click', (e) => {
        const card = e.target.closest('.card-executive');
        if (!card) return;
        
        if (e.target.closest('.card-link-exec')) return;
        
        const url = card.getAttribute('data-url');
        if (url) {
            window.open(url, '_blank');
        }
    });
}

function initializeScrollEffects() {
    const header = document.getElementById('mainHeader');
    const backToTop = document.getElementById('backToTop');
    
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Header compacto
        if (currentScroll > 100) {
            header?.classList.add('compact');
        } else {
            header?.classList.remove('compact');
        }
        
        // Back to top
        if (currentScroll > 500) {
            backToTop?.classList.add('visible');
        } else {
            backToTop?.classList.remove('visible');
        }
        
        lastScroll = currentScroll;
    });
    
    backToTop?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
    document.querySelectorAll('.pill-compact').forEach(pill => pill.classList.remove('active'));
    document.querySelector('.pill-compact[data-month="all"]')?.classList.add('active');
    document.querySelector('.pill-compact[data-category="all"]')?.classList.add('active');
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    document.querySelectorAll('.card-executive, .month-section, .category-section').forEach(el => el.style.display = '');
    
    toggleEmptyState(document.querySelectorAll('.card-executive').length);
    showToast('Filtros restablecidos', 'success');
}

// ===============================
// TOAST
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
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}