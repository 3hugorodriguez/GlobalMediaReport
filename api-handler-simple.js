// ===============================
// API HANDLER - Versión 2.0
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

            console.log('✅ Datos cargados correctamente');
            return this.processData(result.data);

        } catch (error) {
            console.error('❌ Error al cargar datos:', error);
            throw error;
        }
    }

    processData(data) {
        // Ordenar noticias por fecha descendente
        data.noticias.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        // Marcar noticias nuevas (< 7 días)
        const now = new Date();
        data.noticias.forEach(noticia => {
            const newsDate = new Date(noticia.fecha);
            const diffDays = Math.floor((now - newsDate) / (1000 * 60 * 60 * 24));
            noticia.isNew = diffDays <= 7;
        });

        return data;
    }
}

// ===============================
// RENDERIZADOR PRINCIPAL
// ===============================

class GMRRenderer {
    constructor(data) {
        this.data = data;
        this.currentView = 'grid'; // 'grid' o 'compact'
    }

    // ============================
    // STATS ÚTILES
    // ============================
    renderStats() {
        const stats = this.calculateStats();
        
        // Total noticias
        document.getElementById('totalNews').textContent = stats.total;
        
        // Crecimiento (simulado por ahora, puedes calcularlo real si tienes histórico)
        document.getElementById('growthRate').textContent = '+15%';
        
        // Categoría destacada (la que tiene más noticias)
        const topCat = Object.entries(stats.porCategoria)
            .sort((a, b) => b[1] - a[1])[0];
        const topCatName = this.getCategoryName(topCat[0]);
        document.getElementById('topCategory').textContent = topCatName;
        
        // Última actualización
        const lastDate = new Date(this.data.noticias[0].fecha);
        const today = new Date();
        const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
        
        let updateText = 'Hoy';
        if (diffDays === 1) updateText = 'Ayer';
        else if (diffDays > 1) updateText = `Hace ${diffDays}d`;
        
        document.getElementById('lastUpdate').textContent = updateText;
        
        // Animar números
        this.animateCounter('totalNews', stats.total);
    }

    animateCounter(elementId, target) {
        const element = document.getElementById(elementId);
        const duration = 1000;
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

        // Iniciar solo cuando sea visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animate();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        observer.observe(element);
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

    // ============================
    // FILTROS DE MES
    // ============================
    renderMonthFilters() {
        const container = document.getElementById('monthFilters');
        const stats = this.calculateStats();
        const months = Object.keys(stats.porMes).sort((a, b) => new Date(b) - new Date(a));

        months.forEach(month => {
            const count = stats.porMes[month];
            const monthName = this.formatMonth(month);
            
            const chip = document.createElement('button');
            chip.className = 'chip';
            chip.setAttribute('data-month', month);
            chip.innerHTML = `
                ${monthName}
                <span class="chip-count">${count}</span>
            `;
            
            container.appendChild(chip);
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
        return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
            .replace('.', '')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // ============================
    // FILTROS DE CATEGORÍA
    // ============================
    renderCategoryFilters() {
        const container = document.getElementById('categoryFilters');
        const stats = this.calculateStats();

        // Actualizar contador de "Todas"
        document.getElementById('countAll').textContent = stats.total;

        this.data.categorias.forEach(cat => {
            const count = stats.porCategoria[cat.Slug] || 0;
            if (count === 0) return;

            const chip = document.createElement('button');
            chip.className = 'chip';
            chip.setAttribute('data-category', cat.Slug);
            chip.innerHTML = `
                <i class="fas ${cat.Icono}"></i>
                ${cat.Nombre}
                <span class="chip-count">${count}</span>
            `;
            
            container.appendChild(chip);
        });
    }

    // ============================
    // RENDERIZADO DE NOTICIAS
    // ============================
    renderNews() {
        const container = document.getElementById('newsContainer');
        container.innerHTML = '';

        // Agrupar por mes y luego por categoría
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
                    <i class="far fa-calendar-alt"></i>
                    ${monthName}
                </h2>
                <span class="month-count">${noticias.length}</span>
            </div>
        `;

        // Agrupar noticias por categoría dentro del mes
        const noticiasPorCategoria = noticias.reduce((acc, noticia) => {
            if (!acc[noticia.categoria]) acc[noticia.categoria] = [];
            acc[noticia.categoria].push(noticia);
            return acc;
        }, {});

        // Renderizar cada grupo de categoría
        this.data.categorias.forEach(cat => {
            const noticiasCategoria = noticiasPorCategoria[cat.Slug];
            if (!noticiasCategoria || noticiasCategoria.length === 0) return;

            const categoryGroup = this.createCategoryGroup(cat, noticiasCategoria);
            section.appendChild(categoryGroup);
        });

        return section;
    }

    createCategoryGroup(categoria, noticias) {
        const group = document.createElement('div');
        group.className = 'category-group';
        group.setAttribute('data-category', categoria.Slug);

        group.innerHTML = `
            <div class="category-group-header">
                <div class="category-group-icon">
                    <i class="fas ${categoria.Icono}"></i>
                </div>
                <h3 class="category-group-title">${categoria.Nombre}</h3>
                <span class="category-group-count">${noticias.length}</span>
            </div>
            <div class="news-grid"></div>
        `;

        const grid = group.querySelector('.news-grid');
        noticias.forEach(noticia => {
            const card = this.createNewsCard(noticia);
            grid.appendChild(card);
        });

        return group;
    }

    createNewsCard(noticia) {
        const article = document.createElement('article');
        article.className = 'news-card';
        article.setAttribute('data-url', noticia.url);
        article.setAttribute('data-scope', noticia.alcance);
        article.setAttribute('data-category', noticia.categoria);
        article.setAttribute('data-fecha', noticia.fecha);

        const fecha = new Date(noticia.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });

        const badgeClass = noticia.alcance === 'Nacional' ? 'badge-nacional' : 'badge-internacional';
        const badgeIcon = noticia.alcance === 'Nacional' ? 'fa-map-marker-alt' : 'fa-globe';

        const newBadge = noticia.isNew ? `
            <div class="badge-new">
                <i class="fas fa-star"></i> Nueva
            </div>
        ` : '';

        const tagsHTML = Array.isArray(noticia.tags) && noticia.tags.length > 0
            ? noticia.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')
            : '';

        article.innerHTML = `
            <div class="news-image">
                <img src="${noticia.imagen || 'https://placehold.co/400x200/122864/FFFFFF?text=Global+Exchange'}" 
                     alt="${noticia.titulo}" 
                     loading="lazy"
                     onerror="this.src='https://placehold.co/400x200/122864/FFFFFF?text=Imagen+no+disponible'">
                <div class="news-image-overlay">
                    ${newBadge}
                </div>
            </div>

            <div class="news-content">
                <div class="news-meta">
                    <span class="news-badge ${badgeClass}">
                        <i class="fas ${badgeIcon}"></i> ${noticia.alcance}
                    </span>
                    <span class="news-date">
                        <i class="far fa-calendar"></i> ${fechaFormateada}
                    </span>
                </div>

                <h3 class="news-title">${noticia.titulo}</h3>

                ${noticia.resumen ? `
                    <p class="news-summary">${noticia.resumen}</p>
                ` : ''}

                <div class="news-footer">
                    <div class="news-source">
                        <i class="fas fa-newspaper"></i>
                        <span>${noticia.medio}</span>
                    </div>
                    ${tagsHTML ? `
                        <div class="news-tags">${tagsHTML}</div>
                    ` : ''}
                </div>
            </div>
        `;

        return article;
    }

    // ============================
    // HEADER
    // ============================
    renderHeader() {
        const config = this.data.config;
        if (config && config.mes_actual) {
            document.getElementById('currentPeriod').textContent = config.mes_actual;
        }
    }

    // ============================
    // HELPERS
    // ============================
    getCategoryName(slug) {
        const names = {
            'grupo-global': 'Grupo Global',
            'sector-cambiario': 'Sector Cambiario',
            'sector-aeroportuario': 'Aeroportuario',
            'medios-efectivo': 'Medios de Pago'
        };
        return names[slug] || slug;
    }

    // ============================
    // RENDER ALL
    // ============================
    renderAll() {
        this.renderHeader();
        this.renderStats();
        this.renderMonthFilters();
        this.renderCategoryFilters();
        this.renderNews();
    }
}

// ===============================
// INICIALIZACIÓN
// ===============================

let dataService;
let renderer;
let allData;

async function initializeGMR() {
    showLoading();

    try {
        dataService = new GMRDataService('./data/gmr-data.json');
        allData = await dataService.fetchData();
        
        renderer = new GMRRenderer(allData);
        renderer.renderAll();
        
        // Inicializar funcionalidades interactivas
        initializeFilters();
        initializeSearch();
        initializeNewsCards();
        initializeViewToggle();
        
        hideLoading();
        console.log('✅ GMR inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error crítico:', error);
        showError('No se pudieron cargar los datos. Por favor, recarga la página.');
    }
}

// ===============================
// FILTROS INTERACTIVOS
// ===============================

function initializeFilters() {
    let activeMonth = 'all';
    let activeCategory = 'all';

    // Filtros de mes
    document.getElementById('monthFilters').addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;

        // Actualizar activo
        document.querySelectorAll('#monthFilters .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        activeMonth = chip.getAttribute('data-month');
        applyFilters(activeMonth, activeCategory);
    });

    // Filtros de categoría
    document.getElementById('categoryFilters').addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;

        // Actualizar activo
        document.querySelectorAll('#categoryFilters .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        activeCategory = chip.getAttribute('data-category');
        applyFilters(activeMonth, activeCategory);
    });

    function applyFilters(month, category) {
        const monthSections = document.querySelectorAll('.month-section');
        const categoryGroups = document.querySelectorAll('.category-group');
        let visibleCount = 0;

        // Filtrar secciones de mes
        monthSections.forEach(section => {
            const sectionMonth = section.getAttribute('data-month');
            const shouldShowMonth = month === 'all' || sectionMonth === month;
            
            if (shouldShowMonth) {
                section.style.display = 'block';
                
                // Filtrar grupos de categoría dentro del mes
                const groupsInSection = section.querySelectorAll('.category-group');
                let visibleGroupsInSection = 0;

                groupsInSection.forEach(group => {
                    const groupCategory = group.getAttribute('data-category');
                    const shouldShowCategory = category === 'all' || groupCategory === category;
                    
                    if (shouldShowCategory) {
                        group.style.display = 'block';
                        visibleGroupsInSection++;
                        visibleCount += group.querySelectorAll('.news-card').length;
                    } else {
                        group.style.display = 'none';
                    }
                });

                // Ocultar mes si no tiene grupos visibles
                if (visibleGroupsInSection === 0) {
                    section.style.display = 'none';
                }
            } else {
                section.style.display = 'none';
            }
        });

        // Mostrar/ocultar empty state
        toggleEmptyState(visibleCount);

        // Scroll suave a la primera sección visible
        const firstVisible = document.querySelector('.month-section[style="display: block;"]');
        if (firstVisible && (month !== 'all' || category !== 'all')) {
            setTimeout(() => {
                firstVisible.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
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
            // Mostrar todas
            cards.forEach(card => card.style.display = '');
            searchBadge.classList.remove('visible');
            toggleEmptyState(cards.length);
            return;
        }

        cards.forEach(card => {
            const title = card.querySelector('.news-title').textContent.toLowerCase();
            const source = card.querySelector('.news-source span').textContent.toLowerCase();
            const summary = card.querySelector('.news-summary')?.textContent.toLowerCase() || '';

            if (title.includes(term) || source.includes(term) || summary.includes(term)) {
                card.style.display = '';
                visibleCount++;
                highlightText(card.querySelector('.news-title'), term);
            } else {
                card.style.display = 'none';
            }
        });

        // Actualizar badge
        searchBadge.textContent = `${visibleCount} resultado${visibleCount !== 1 ? 's' : ''}`;
        searchBadge.classList.add('visible');

        // Ocultar secciones vacías
        document.querySelectorAll('.category-group').forEach(group => {
            const visibleCards = group.querySelectorAll('.news-card[style=""]').length;
            group.style.display = visibleCards > 0 ? 'block' : 'none';
        });

        document.querySelectorAll('.month-section').forEach(section => {
            const visibleGroups = section.querySelectorAll('.category-group[style="display: block;"]').length;
            section.style.display = visibleGroups > 0 ? 'block' : 'none';
        });

        toggleEmptyState(visibleCount);
    }

    function highlightText(element, term) {
        const originalText = element.getAttribute('data-original') || element.textContent;
        if (!element.getAttribute('data-original')) {
            element.setAttribute('data-original', originalText);
        }

        const regex = new RegExp(`(${term})`, 'gi');
        element.innerHTML = originalText.replace(regex, '<mark style="background: #fef08a; padding: 2px 4px; border-radius: 3px;">$1</mark>');
    }
}

// ===============================
// CLICK EN NOTICIAS
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
            }, 100);
        }
    });
}

// ===============================
// TOGGLE DE VISTA
// ===============================

function initializeViewToggle() {
    const toggleBtn = document.getElementById('viewToggle');
    const container = document.getElementById('newsContainer');
    let isCompact = false;

    toggleBtn.addEventListener('click', () => {
        isCompact = !isCompact;
        
        if (isCompact) {
            container.classList.add('compact-view');
            toggleBtn.innerHTML = '<i class="fas fa-th-large"></i>';
            toggleBtn.title = 'Vista en grid';
        } else {
            container.classList.remove('compact-view');
            toggleBtn.innerHTML = '<i class="fas fa-list"></i>';
            toggleBtn.title = 'Vista compacta';
        }

        // Animación del botón
        toggleBtn.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            toggleBtn.style.transform = '';
        }, 300);
    });
}

// ===============================
// EMPTY STATE
// ===============================

function toggleEmptyState(count) {
    const emptyState = document.getElementById('emptyState');
    const newsContainer = document.getElementById('newsContainer');

    if (count === 0) {
        emptyState.style.display = 'block';
        newsContainer.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        newsContainer.style.display = 'block';
    }
}

function resetAllFilters() {
    // Reset filtros de mes
    document.querySelectorAll('#monthFilters .chip').forEach(chip => {
        chip.classList.remove('active');
    });
    document.querySelector('#monthFilters .chip[data-month="all"]').classList.add('active');

    // Reset filtros de categoría
    document.querySelectorAll('#categoryFilters .chip').forEach(chip => {
        chip.classList.remove('active');
    });
    document.querySelector('#categoryFilters .chip[data-category="all"]').classList.add('active');

    // Reset búsqueda
    document.getElementById('searchInput').value = '';
    document.getElementById('searchBadge').classList.remove('visible');

    // Mostrar todo
    document.querySelectorAll('.news-card').forEach(card => {
        card.style.display = '';
        const title = card.querySelector('.news-title');
        if (title.getAttribute('data-original')) {
            title.textContent = title.getAttribute('data-original');
        }
    });

    document.querySelectorAll('.category-group, .month-section').forEach(el => {
        el.style.display = 'block';
    });

    toggleEmptyState(document.querySelectorAll('.news-card').length);
}

// ===============================
// LOADING & ERROR
// ===============================

function showLoading() {
    document.body.insertAdjacentHTML('beforeend', `
        <div id="gmr-loader" style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(135deg, #122864 0%, #010276 100%);
            display: flex; flex-direction: column; justify-content: center;
            align-items: center; z-index: 10000; color: white;">
            <div style="
                width: 60px; height: 60px;
                border: 4px solid rgba(255,255,255,0.2);
                border-top-color: white; border-radius: 50%;
                animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 24px; font-size: 1.2rem; font-weight: 600;">
                Cargando Global Media Report...
            </p>
            <p style="margin-top: 8px; font-size: 0.9rem; opacity: 0.8;">
                Preparando contenido
            </p>
        </div>
        <style>
            @keyframes spin { to { transform: rotate(360deg); }}
        </style>
    `);
}

function hideLoading() {
    const loader = document.getElementById('gmr-loader');
    if (loader) {
        loader.style.opacity = '0';
        loader.style.transition = 'opacity 0.3s ease';
        setTimeout(() => loader.remove(), 300);
    }
}

function showError(message) {
    hideLoading();
    document.body.insertAdjacentHTML('beforeend', `
        <div style="
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: white; padding: 48px; border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3); text-align: center;
            z-index: 10001; max-width: 500px;">
            <i class="fas fa-exclamation-triangle" style="
                font-size: 4rem; color: #ef4444; margin-bottom: 24px;"></i>
            <h3 style="margin-bottom: 16px; color: #122864; font-size: 1.5rem;">
                Error de Conexión
            </h3>
            <p style="color: #64748b; margin-bottom: 32px; line-height: 1.6;">
                ${message}
            </p>
            <button onclick="location.reload()" style="
                padding: 14px 32px; background: linear-gradient(135deg, #3d73f1, #28bdc7);
                color: white; border: none; border-radius: 10px;
                cursor: pointer; font-weight: 600; font-size: 1rem;">
                <i class="fas fa-redo"></i> Reintentar
            </button>
        </div>
    `);
}