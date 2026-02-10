// ===============================
// VERSIÓN SIMPLE: Lee JSON local
// ===============================

class GMRDataService {
    constructor(jsonPath) {
        this.jsonPath = jsonPath;
    }

    async fetchData() {
        try {
            console.log('🔄 Cargando datos...');
            
            const response = await fetch(this.jsonPath + '?t=' + Date.now());
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error('Datos inválidos');
            }

            console.log('✅ Datos cargados:', result.data);
            return result.data;

        } catch (error) {
            console.error('❌ Error:', error);
            throw error;
        }
    }
}

// Renderizador (el mismo de antes)
class GMRRenderer {
    constructor(data) {
        this.data = data;
    }

    renderDashboard() {
        const stats = this.calculateStats();
        
        document.getElementById('totalNews').setAttribute('data-target', stats.total);
        document.getElementById('nationalNews').setAttribute('data-target', stats.nacional);
        document.getElementById('internationalNews').setAttribute('data-target', stats.internacional);
        document.getElementById('categoriesCount').setAttribute('data-target', this.data.categorias.length);
        
        animateCounters();
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
            }, {})
        };
    }

    renderHeader() {
        const headerDate = document.querySelector('.header-date');
        if (headerDate && this.data.config.mes_actual) {
            headerDate.textContent = this.data.config.mes_actual;
        }
    }

    renderQuickIndex() {
        const container = document.querySelector('.category-chips');
        if (!container) return;

        const stats = this.calculateStats();
        container.innerHTML = '';

        this.data.categorias.forEach(cat => {
            const count = stats.porCategoria[cat.Slug] || 0;
            if (count === 0) return;
            
            const chip = document.createElement('a');
            chip.href = `#${cat.Slug}`;
            chip.className = 'category-chip';
            chip.innerHTML = `
                <i class="fas ${cat.Icono}"></i>
                <span class="chip-text">${cat.Nombre}</span>
                <span class="chip-badge">${count}</span>
            `;
            container.appendChild(chip);
        });
    }

    renderFilterButtons() {
        const filterContainer = document.querySelector('.filters');
        if (!filterContainer) return;

        const stats = this.calculateStats();
        const existingButtons = filterContainer.querySelectorAll('.filter-btn:not(:first-child)');
        existingButtons.forEach(btn => btn.remove());

        this.data.categorias.forEach(cat => {
            const count = stats.porCategoria[cat.Slug] || 0;
            if (count === 0) return;

            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.setAttribute('data-category', cat.Slug);
            button.innerHTML = `<i class="fas ${cat.Icono}"></i> ${cat.Nombre}`;
            filterContainer.appendChild(button);
        });
    }

    renderNewsSections() {
        const mainContainer = document.querySelector('.main-container');
        if (!mainContainer) return;

        mainContainer.innerHTML = '';

        const noticiasPorCategoria = this.data.noticias.reduce((acc, noticia) => {
            if (!acc[noticia.categoria]) acc[noticia.categoria] = [];
            acc[noticia.categoria].push(noticia);
            return acc;
        }, {});

        this.data.categorias.forEach(cat => {
            const noticias = noticiasPorCategoria[cat.Slug] || [];
            if (noticias.length === 0) return;

            const section = this.createCategorySection(cat, noticias);
            mainContainer.appendChild(section);
        });
    }

    createCategorySection(categoria, noticias) {
        const section = document.createElement('section');
        section.id = categoria.Slug;
        section.className = 'category-section';
        section.setAttribute('data-category', categoria.Slug);

        section.innerHTML = `
            <div class="category-header">
                <h2 class="category-title">
                    <i class="fas ${categoria.Icono}"></i>
                    ${categoria.Nombre}
                </h2>
                <span class="category-count">${noticias.length} noticia${noticias.length !== 1 ? 's' : ''}</span>
            </div>
        `;

        noticias.forEach(noticia => {
            const card = this.createNewsCard(noticia);
            section.appendChild(card);
        });

        return section;
    }

    createNewsCard(noticia) {
        const article = document.createElement('article');
        article.className = 'news-card';
        article.setAttribute('data-scope', noticia.alcance);
        article.setAttribute('data-url', noticia.url);

        const badgeClass = noticia.alcance === 'Nacional' ? 'badge-nacional' : 'badge-internacional';
        const badgeIcon = noticia.alcance === 'Nacional' ? 'fa-map-marker-alt' : 'fa-globe';
        
        const fecha = new Date(noticia.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });

        const highlightsHTML = Array.isArray(noticia.highlights) && noticia.highlights.length > 0
            ? noticia.highlights.map(h => `
                <div class="highlight-item">
                    <i class="fas fa-check-circle"></i>
                    <span>${h}</span>
                </div>
            `).join('')
            : '';

        const tagsHTML = Array.isArray(noticia.tags) && noticia.tags.length > 0
            ? noticia.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
            : '';

        article.innerHTML = `
            <div class="news-content">
                <div class="news-header">
                    <div class="news-meta">
                        <span class="news-badge ${badgeClass}">
                            <i class="fas ${badgeIcon}"></i> ${noticia.alcance}
                        </span>
                        <span class="news-date">
                            <i class="far fa-calendar"></i> ${fechaFormateada}
                        </span>
                    </div>
                    <button class="copy-link-btn" title="Copiar enlace">
                        <i class="fas fa-link"></i>
                    </button>
                </div>

                <h3 class="news-title">${noticia.titulo}</h3>
                
                ${highlightsHTML ? `<div class="news-highlights">${highlightsHTML}</div>` : ''}

                ${noticia.resumen ? `
                <div class="news-summary">
                    <strong>Resumen:</strong> ${noticia.resumen}
                </div>
                ` : ''}

                <div class="news-footer">
                    <div class="news-source">
                        <i class="fas fa-newspaper source-icon"></i>
                        <span>${noticia.medio}</span>
                    </div>
                    ${tagsHTML ? `<div class="news-tags">${tagsHTML}</div>` : ''}
                </div>
            </div>
            
            ${noticia.imagen ? `
            <div class="news-image">
                <img src="${noticia.imagen}" alt="${noticia.titulo}" loading="lazy">
                <div class="image-overlay">
                    <i class="fas fa-external-link-alt"></i>
                    <span>Ver noticia completa</span>
                </div>
            </div>
            ` : ''}
        `;

        return article;
    }

    renderAll() {
        this.renderHeader();
        this.renderDashboard();
        this.renderQuickIndex();
        this.renderFilterButtons();
        this.renderNewsSections();
    }
}

// Inicialización
async function initializeGMR() {
    showLoading();

    try {
        const dataService = new GMRDataService('./data/gmr-data.json');
        const data = await dataService.fetchData();
        
        const renderer = new GMRRenderer(data);
        renderer.renderAll();
        
        initializeFilters();
        initializeSearch();
        initializeNewsCards();
        initializeCopyButtons();
        initializeBreadcrumbs();
        initializeAnimations();
        
        hideLoading();
        console.log('✅ GMR inicializado');
        
    } catch (error) {
        console.error('❌ Error:', error);
        showError('No se pudieron cargar los datos');
    }
}

function showLoading() {
    document.body.insertAdjacentHTML('beforeend', `
        <div id="gmr-loader" style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(18, 40, 100, 0.95); display: flex;
            flex-direction: column; justify-content: center; align-items: center;
            z-index: 10000; color: white;">
            <div style="width: 60px; height: 60px; border: 4px solid rgba(255,255,255,0.3);
                border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 20px; font-size: 1.2rem; font-weight: 600;">
                Cargando Global Media Report...
            </p>
        </div>
        <style>@keyframes spin { to { transform: rotate(360deg); }}</style>
    `);
}

function hideLoading() {
    const loader = document.getElementById('gmr-loader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 300);
    }
}

function showError(message) {
    hideLoading();
    document.body.insertAdjacentHTML('beforeend', `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: white; padding: 40px; border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3); text-align: center; z-index: 10001;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 20px;"></i>
            <h3 style="margin-bottom: 15px; color: #122864;">Error</h3>
            <p style="color: #6c757d; margin-bottom: 25px;">${message}</p>
            <button onclick="location.reload()" style="padding: 14px 28px; background: #122864;
                color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                Reintentar
            </button>
        </div>
    `);
}