// ===============================
// CONFIGURACIÓN
// ===============================

const CONFIG = {
    dataPath: './data/gmr-data.json',
    logoFallback: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Cdefs%3E%3ClinearGradient id="grad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23122864;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23006cb1;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="200" height="200" fill="url(%23grad)"/%3E%3Ctext x="100" y="100" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle"%3EGE%3C/text%3E%3C/svg%3E',
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
        // Ordenar por fecha descendente
        data.noticias.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        // Marcar noticias nuevas
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
// RENDERIZADOR COMPACTO
// ===============================

class GMRRenderer {
    constructor(data) {
        this.data = data;
    }

    updateHeaderMeta() {
        const meta = document.getElementById('headerMeta');
        if (!meta) return;
        
        const total = this.data.noticias.length;
        const internacional = this.data.noticias.filter(n => n.alcance === 'Internacional').length;
        
        let lastUpdate = 'Sin datos';
        if (this.data.noticias.length > 0) {
            const lastDate = new Date(this.data.noticias[0].fecha);
            lastUpdate = this.getRelativeTime(lastDate);
        }
        
        meta.textContent = `${total} noticias • ${internacional} internacionales • Actualizado: ${lastUpdate}`;
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

    renderMonthFilters() {
        const container = document.getElementById('monthFilters');
        if (!container) return;
        
        const stats = this.calculateStats();
        const months = Object.keys(stats.porMes).sort((a, b) => new Date(b) - new Date(a));
        
        // Actualizar "Todos"
        const allPill = container.querySelector('.pill[data-month="all"]');
        if (allPill) {
            allPill.querySelector('span').textContent = stats.total;
        }
        
        // Crear pills de meses
        months.forEach(month => {
            const count = stats.porMes[month];
            const monthName = this.formatMonth(month);
            
            const pill = document.createElement('button');
            pill.className = 'pill';
            pill.setAttribute('data-month', month);
            pill.innerHTML = `${monthName} <span>${count}</span>`;
            
            container.appendChild(pill);
        });
    }

    renderCategoryFilters() {
        const container = document.getElementById('categoryFilters');
        if (!container) return;
        
        const stats = this.calculateStats();
        
        // Actualizar "Todas"
        const allPill = container.querySelector('.pill[data-category="all"]');
        if (allPill) {
            allPill.querySelector('span').textContent = stats.total;
        }
        
        // Crear pills de categorías
        this.data.categorias.forEach(cat => {
            const count = stats.porCategoria[cat.Slug] || 0;
            if (count === 0) return;
            
            const pill = document.createElement('button');
            pill.className = 'pill';
            pill.setAttribute('data-category', cat.Slug);
            pill.innerHTML = `${cat.Nombre} <span>${count}</span>`;
            
            container.appendChild(pill);
        });
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
        
        // Agrupar noticias por categoría
        const noticiasPorCategoria = this.groupNewsByCategory(noticias);
        
        // Ordenar categorías según orden definido
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
            <div class="news-list"></div>
        `;
        
        const list = section.querySelector('.news-list');
        
        noticias.forEach(noticia => {
            const item = this.createNewsItem(noticia, categoryData);
            list.appendChild(item);
        });
        
        return section;
    }

    createNewsItem(noticia, categoryData) {
        const item = document.createElement('article');
        item.className = 'news-item';
        item.setAttribute('data-url', noticia.url);
        item.setAttribute('data-category', noticia.categoria);
        item.setAttribute('data-scope', noticia.alcance);
        item.style.setProperty('--cat-color', categoryData.Color);
        
        const fecha = new Date(noticia.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        
        const badgeClass = noticia.alcance === 'Nacional' ? 'nacional' : 'internacional';
        
        // Limitar highlights a 3 para vista compacta
        const highlightsLimited = noticia.highlights ? noticia.highlights.slice(0, 3) : [];
        
        item.innerHTML = `
            <div class="news-item-header">
                <div class="news-meta">
                    <span class="news-badge ${badgeClass}">
                        <i class="fas ${noticia.alcance === 'Nacional' ? 'fa-map-marker-alt' : 'fa-globe'}"></i>
                        ${noticia.alcance}
                    </span>
                    <span class="news-source">
                        <i class="fas fa-newspaper"></i>
                        ${noticia.medio}
                    </span>
                    <span class="news-date">
                        <i class="far fa-clock"></i>
                        ${fechaFormateada}
                    </span>
                </div>
                ${noticia.isNew ? '<span class="badge-new"><i class="fas fa-star"></i> Nueva</span>' : ''}
            </div>
            
            <h3 class="news-title">${noticia.titulo}</h3>
            
            ${noticia.resumen ? `<p class="news-summary">${noticia.resumen}</p>` : ''}
            
            ${highlightsLimited.length > 0 ? `
                <ul class="news-highlights">
                    ${highlightsLimited.map(h => `<li>${h}</li>`).join('')}
                </ul>
            ` : ''}
            
            <div class="news-footer">
                <div class="news-tags">
                    ${noticia.tags ? noticia.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
                </div>
                <a href="${noticia.url}" target="_blank" class="news-link" onclick="event.stopPropagation()">
                    Ver noticia <i class="fas fa-external-link-alt"></i>
                </a>
            </div>
        `;
        
        return item;
    }

    renderAll() {
        console.log('🎨 Renderizando interfaz...');
        this.updateHeaderMeta();
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
        console.log('🚀 Iniciando GMR v2.0...');
        
        dataService = new GMRDataService(CONFIG.dataPath);
        allData = await dataService.fetchData();
        
        renderer = new GMRRenderer(allData);
        renderer.renderAll();
        
        setTimeout(() => {
            initializeFilters();
            initializeSearch();
            initializeNewsItems();
            
            console.log('✅ Sistema listo');
            showToast('Datos cargados correctamente', 'success');
        }, 100);
        
    } catch (error) {
        console.error('❌ Error crítico:', error);
        showToast('Error al cargar datos', 'error');
        showErrorState();
    }
}

function showErrorState() {
    const container = document.getElementById('newsContainer');
    const skeleton = document.getElementById('skeletonLoader');
    
    if (skeleton) skeleton.remove();
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-state" style="display: flex;">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error al cargar datos</h3>
            <p>No se pudieron cargar las noticias. Verifica tu conexión.</p>
            <button class="btn-primary" onclick="location.reload()">
                <i class="fas fa-redo"></i> Recargar
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
        const pill = e.target.closest('.pill');
        if (!pill) return;
        
        monthFilters.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        
        activeMonth = pill.getAttribute('data-month');
        applyFilters(activeMonth, activeCategory);
    });
    
    // Category filters
    categoryFilters.addEventListener('click', (e) => {
        const pill = e.target.closest('.pill');
        if (!pill) return;
        
        categoryFilters.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
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
                        const items = catSec.querySelectorAll('.news-item');
                        visibleInMonth += items.length;
                        visibleCount += items.length;
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
    
    function performSearch(term) {
        const items = document.querySelectorAll('.news-item');
        let visibleCount = 0;
        
        if (term === '') {
            items.forEach(item => item.style.display = '');
            document.querySelectorAll('.month-section, .category-section').forEach(s => s.style.display = '');
            toggleEmptyState(items.length);
            return;
        }
        
        items.forEach(item => {
            const title = item.querySelector('.news-title')?.textContent.toLowerCase() || '';
            const source = item.querySelector('.news-source')?.textContent.toLowerCase() || '';
            const summary = item.querySelector('.news-summary')?.textContent.toLowerCase() || '';
            const highlights = item.querySelector('.news-highlights')?.textContent.toLowerCase() || '';
            
            if (title.includes(term) || source.includes(term) || summary.includes(term) || highlights.includes(term)) {
                item.style.display = '';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });
        
        // Ocultar categorías y meses vacíos
        document.querySelectorAll('.category-section').forEach(catSec => {
            const visibleItems = catSec.querySelectorAll('.news-item:not([style*="display: none"])').length;
            catSec.style.display = visibleItems > 0 ? '' : 'none';
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

function initializeNewsItems() {
    const container = document.getElementById('newsContainer');
    if (!container) return;
    
    container.addEventListener('click', (e) => {
        const item = e.target.closest('.news-item');
        if (!item) return;
        
        // No abrir si se hizo clic en un enlace
        if (e.target.closest('.news-link')) return;
        
        const url = item.getAttribute('data-url');
        if (url) {
            window.open(url, '_blank');
        }
    });
}

function toggleEmptyState(count) {
    const emptyState = document.getElementById('emptyState');
    if (!emptyState) return;
    
    emptyState.style.display = count === 0 ? 'flex' : 'none';
}

function resetAllFilters() {
    document.querySelectorAll('.pill').forEach(pill => pill.classList.remove('active'));
    document.querySelector('.pill[data-month="all"]')?.classList.add('active');
    document.querySelector('.pill[data-category="all"]')?.classList.add('active');
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    document.querySelectorAll('.news-item, .month-section, .category-section').forEach(el => el.style.display = '');
    
    toggleEmptyState(document.querySelectorAll('.news-item').length);
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
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}