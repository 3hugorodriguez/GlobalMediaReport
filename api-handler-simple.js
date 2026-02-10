// ===============================
// API HANDLER - VERSIÓN PREMIUM
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
// RENDERIZADOR PREMIUM
// ===============================

class GMRRenderer {
    constructor(data) {
        this.data = data;
        this.currentView = 'grid';
    }

    // Stats para hero header
    renderHeroStats() {
        const stats = this.calculateStats();
        
        // Total noticias
        this.animateCounter('totalNewsHero', stats.total);
        
        // Categoría destacada
        const topCat = Object.entries(stats.porCategoria)
            .sort((a, b) => b[1] - a[1])[0];
        const topCatName = this.getCategoryName(topCat[0]);
        document.getElementById('topCategoryHero').textContent = topCatName;
        
        // Última actualización
        const lastDate = new Date(this.data.noticias[0].fecha);
        const today = new Date();
        const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
        
        let updateText = 'Hoy';
        if (diffDays === 1) updateText = 'Ayer';
        else if (diffDays > 1) updateText = `Hace ${diffDays}d`;
        
        document.getElementById('lastUpdateHero').textContent = updateText;
    }

    animateCounter(elementId, target) {
        const element = document.getElementById(elementId);
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

    // Filtros de mes
    renderMonthFilters() {
        const container = document.getElementById('monthTimeline');
        const stats = this.calculateStats();
        const months = Object.keys(stats.porMes).sort((a, b) => new Date(b) - new Date(a));

        months.forEach(month => {
            const count = stats.porMes[month];
            const monthName = this.formatMonth(month);
            
            const chip = document.createElement('button');
            chip.className = 'timeline-chip';
            chip.setAttribute('data-month', month);
            chip.innerHTML = `
                <i class="far fa-calendar"></i>
                <span>${monthName}</span>
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

    // Filtros de categoría
    renderCategoryFilters() {
        const container = document.getElementById('categoryFilters');
        const stats = this.calculateStats();

        document.getElementById('countAll').textContent = stats.total;

        this.data.categorias.forEach(cat => {
            const count = stats.porCategoria[cat.Slug] || 0;
            if (count === 0) return;

            const chip = document.createElement('button');
            chip.className = 'category-chip';
            chip.setAttribute('data-category', cat.Slug);
            chip.innerHTML = `
                <div class="chip-icon">
                    <i class="fas ${cat.Icono}"></i>
                </div>
                <div class="chip-content">
                    <span class="chip-label">${cat.Nombre}</span>
                    <span class="chip-count">${count}</span>
                </div>
            `;
            
            container.appendChild(chip);
        });
    }

    // Renderizado de noticias
    renderNews() {
        const container = document.getElementById('newsContainer');
        
        // Ocultar skeleton
        const skeleton = document.getElementById('skeletonLoader');
        if (skeleton) {
            skeleton.style.opacity = '0';
            setTimeout(() => skeleton.remove(), 300);
        }
        
        container.innerHTML = '';

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

        const noticiasPorCategoria = noticias.reduce((acc, noticia) => {
            if (!acc[noticia.categoria]) acc[noticia.categoria] = [];
            acc[noticia.categoria].push(noticia);
            return acc;
        }, {});

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
                <img src="${noticia.imagen || 'https://placehold.co/400x240/122864/FFFFFF?text=Global+Exchange'}" 
                     alt="${noticia.titulo}" 
                     loading="lazy"
                     onerror="this.src='https://placehold.co/400x240/122864/FFFFFF?text=Sin+Imagen'">
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

    renderHeader() {
        const config = this.data.config;
        if (config && config.mes_actual) {
            document.getElementById('currentPeriod').textContent = config.mes_actual;
        }
    }

    getCategoryName(slug) {
        const cat = this.data.categorias.find(c => c.Slug === slug);
        return cat ? cat.Nombre : slug;
    }

    renderAll() {
        this.renderHeader();
        this.renderHeroStats();
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
    try {
        dataService = new GMRDataService('./data/gmr-data.json');
        allData = await dataService.fetchData();
        
        renderer = new GMRRenderer(allData);
        renderer.renderAll();
        
        // Esperar un tick para que el DOM esté listo
        setTimeout(() => {
            initializeFilters();
            initializeSearch();
            initializeNewsCards();
            initializeViewToggle();
            initializeBackToTop();
            console.log('✅ GMR Premium inicializado correctamente');
        }, 100);
        
    } catch (error) {
        console.error('❌ Error crítico:', error);
        showToast('Error al cargar los datos', 'error');
    }
}

// ===============================
// FILTROS INTERACTIVOS
// ===============================

function initializeFilters() {
    let activeMonth = 'all';
    let activeCategory = 'all';

    // Filtros de mes
    document.getElementById('monthTimeline').addEventListener('click', (e) => {
        const chip = e.target.closest('.timeline-chip');
        if (!chip) return;

        document.querySelectorAll('#monthTimeline .timeline-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        activeMonth = chip.getAttribute('data-month');
        applyFilters(activeMonth, activeCategory);
    });

    // Filtros de categoría
    document.getElementById('categoryFilters').addEventListener('click', (e) => {
        const chip = e.target.closest('.category-chip');
        if (!chip) return;

        document.querySelectorAll('#categoryFilters .category-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        activeCategory = chip.getAttribute('data-category');
        applyFilters(activeMonth, activeCategory);
    });

    // Reset filters
    document.getElementById('resetFilters').addEventListener('click', () => {
        resetAllFilters();
    });

    function applyFilters(month, category) {
        const monthSections = document.querySelectorAll('.month-section');
        let visibleCount = 0;

        monthSections.forEach(section => {
            const sectionMonth = section.getAttribute('data-month');
            const shouldShowMonth = month === 'all' || sectionMonth === month;
            
            if (shouldShowMonth) {
                section.style.display = 'block';
                
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

                if (visibleGroupsInSection === 0) {
                    section.style.display = 'none';
                }
            } else {
                section.style.display = 'none';
            }
        });

        toggleEmptyState(visibleCount);

        if (month !== 'all' || category !== 'all') {
            const firstVisible = document.querySelector('.month-section[style="display: block;"]');
            if (firstVisible) {
                setTimeout(() => {
                    const offset = 180; // Height of fixed headers
                    const elementPosition = firstVisible.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }, 100);
            }
        }

        showToast(`Mostrando ${visibleCount} noticia${visibleCount !== 1 ? 's' : ''}`, 'info');
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

    // Expandir búsqueda al hacer focus
    searchInput.addEventListener('focus', () => {
        searchInput.parentElement.style.transform = 'scale(1.02)';
    });

    searchInput.addEventListener('blur', () => {
        searchInput.parentElement.style.transform = 'scale(1)';
    });

    function performSearch(term) {
        const cards = document.querySelectorAll('.news-card');
        let visibleCount = 0;

        if (term === '') {
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

        searchBadge.textContent = `${visibleCount}`;
        searchBadge.classList.add('visible');

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
        element.innerHTML = originalText.replace(regex, '<mark style="background: linear-gradient(135deg, #fef08a, #fde047); padding: 2px 6px; border-radius: 4px; font-weight: 700;">$1</mark>');
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
            // Feedback visual
            card.style.transform = 'scale(0.98)';
            
            setTimeout(() => {
                window.open(url, '_blank');
                card.style.transform = '';
                showToast('Abriendo noticia...', 'success');
            }, 150);
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
            showToast('Vista compacta activada', 'info');
        } else {
            container.classList.remove('compact-view');
            toggleBtn.innerHTML = '<i class="fas fa-list"></i>';
            toggleBtn.title = 'Vista lista';
            showToast('Vista grid activada', 'info');
        }

        toggleBtn.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            toggleBtn.style.transform = '';
        }, 300);
    });
}

// ===============================
// BACK TO TOP
// ===============================

function initializeBackToTop() {
    const btn = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
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
        newsContainer.style.opacity = '0';
        setTimeout(() => newsContainer.style.display = 'none', 300);
    } else {
        emptyState.style.display = 'none';
        newsContainer.style.display = 'block';
        setTimeout(() => newsContainer.style.opacity = '1', 10);
    }
}

function resetAllFilters() {
    document.querySelectorAll('#monthTimeline .timeline-chip').forEach(chip => {
        chip.classList.remove('active');
    });
    document.querySelector('#monthTimeline .timeline-chip[data-month="all"]').classList.add('active');

    document.querySelectorAll('#categoryFilters .category-chip').forEach(chip => {
        chip.classList.remove('active');
    });
    document.querySelector('#categoryFilters .category-chip[data-category="all"]').classList.add('active');

    document.getElementById('searchInput').value = '';
    document.getElementById('searchBadge').classList.remove('visible');

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
    showToast('Filtros restablecidos', 'success');
}

// ===============================
// TOAST NOTIFICATIONS
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
        <div class="toast-icon">
            <i class="fas ${icons[type]}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}