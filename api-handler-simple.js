// ===============================
// API HANDLER - VERSIÓN CORREGIDA
// ===============================

class GMRDataService {
    constructor(jsonPath) {
        this.jsonPath = jsonPath;
    }

    async fetchData() {
        try {
            console.log('🔄 Cargando datos desde:', this.jsonPath);
            const response = await fetch(this.jsonPath + '?t=' + Date.now());
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error('Datos inválidos en el JSON');
            }
            
            console.log('✅ Datos cargados correctamente');
            console.log('📊 Total noticias:', result.data.noticias.length);
            
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
// RENDERIZADOR CORREGIDO
// ===============================

class GMRRenderer {
    constructor(data) {
        this.data = data;
        this.currentView = 'grid';
    }

    // ===============================
    // STATS PARA HERO HEADER
    // ===============================
    
    renderHeroStats() {
        const stats = this.calculateStats();
        
        // Total noticias con animación
        this.animateCounter('totalNewsHero', stats.total);
        
        // Conteo internacional
        this.animateCounter('internationalCount', stats.internacional);
        
        // Categoría destacada
        const topCat = Object.entries(stats.porCategoria)
            .sort((a, b) => b[1] - a[1])[0];
        
        if (topCat) {
            const topCatName = this.getCategoryName(topCat[0]);
            document.getElementById('topCategoryHero').textContent = topCatName;
        }
        
        // Última actualización (noticia más reciente)
        if (this.data.noticias.length > 0) {
            const lastDate = new Date(this.data.noticias[0].fecha);
            document.getElementById('lastUpdateHero').textContent = this.getRelativeTime(lastDate);
            
            // Actualizar cada minuto
            setInterval(() => {
                document.getElementById('lastUpdateHero').textContent = this.getRelativeTime(lastDate);
            }, 60000);
        }
        
        // Periodo dinámico
        const periodEl = document.getElementById('currentPeriod');
        if (periodEl) {
            periodEl.textContent = this.getPeriodRange();
        }
        
        // Indicador "En vivo"
        this.updateLiveIndicator();
    }

    getRelativeTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Ahora mismo';
        if (diffMins < 60) return `Hace ${diffMins}m`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;
        
        const options = { day: 'numeric', month: 'short' };
        return date.toLocaleDateString('es-ES', options);
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
        
        // Si es el mismo mes
        if (oldestStr === newestStr) {
            return capitalize(oldestStr);
        }
        
        // Calcular diferencia en meses
        const diffMonths = (newestDate.getFullYear() - oldestDate.getFullYear()) * 12 
                         + (newestDate.getMonth() - oldestDate.getMonth());
        
        // Si hay más de 6 meses, es perpetuo
        if (diffMonths > 6) {
            return 'Feed perpetuo';
        }
        
        return `${capitalize(oldestStr)} - ${capitalize(newestStr)}`;
    }

    updateLiveIndicator() {
        if (this.data.noticias.length === 0) return;
        
        const latestDate = new Date(this.data.noticias[0].fecha);
        const liveIndicator = document.querySelector('.live-indicator');
        
        if (liveIndicator) {
            const diffHours = (new Date() - latestDate) / 3600000;
            
            if (diffHours < 24) {
                liveIndicator.style.display = 'inline-flex';
            } else {
                liveIndicator.style.display = 'none';
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

    // ===============================
    // FILTROS DE MES
    // ===============================
    
    renderMonthFilters() {
    const container = document.getElementById('monthTimeline');
    const stats = this.calculateStats();
    const months = Object.keys(stats.porMes).sort((a, b) => new Date(b) - new Date(a));
    
    // Actualizar el contador del chip "Todos" (que ya existe en HTML)
    const allChip = container.querySelector('.chip[data-month="all"]');
    if (allChip) {
        const allCount = allChip.querySelector('.chip-count');
        if (allCount) {
            allCount.textContent = this.data.noticias.length;
        }
    }
    
    // Agregar chips de meses dinámicos
    months.forEach(month => {
        const count = stats.porMes[month];
        const monthName = this.formatMonth(month);
        
        const chip = document.createElement('button');
        chip.className = 'chip';
        chip.setAttribute('data-month', month);
        chip.innerHTML = `
            <span>${monthName}</span>
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

    // ===============================
    // FILTROS DE CATEGORÍA
    // ===============================
    
    renderCategoryFilters() {
        const container = document.getElementById('categoryFilters');
        const stats = this.calculateStats();
        
        // Actualizar conteo de "Todas"
        document.getElementById('countAll').textContent = stats.total;
        
        // Renderizar chips de categorías
        this.data.categorias.forEach(cat => {
            const count = stats.porCategoria[cat.Slug] || 0;
            if (count === 0) return;
            
            const chip = document.createElement('button');
            chip.className = 'chip';
            chip.setAttribute('data-category', cat.Slug);
            chip.innerHTML = `
                <span>${cat.Nombre}</span>
                <span class="chip-count">${count}</span>
            `;
            
            container.appendChild(chip);
        });
    }

    // ===============================
    // RENDERIZADO DE NOTICIAS
    // ===============================
    
    renderNews() {
        const container = document.getElementById('newsContainer');
        
        // Ocultar skeleton
        const skeleton = document.getElementById('skeletonLoader');
        if (skeleton) {
            skeleton.style.opacity = '0';
            setTimeout(() => skeleton.remove(), 300);
        }
        
        container.innerHTML = '';
        
        // Agrupar noticias por mes
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
        
        // Agrupar por categoría
        const noticiasPorCategoria = noticias.reduce((acc, noticia) => {
            if (!acc[noticia.categoria]) acc[noticia.categoria] = [];
            acc[noticia.categoria].push(noticia);
            return acc;
        }, {});
        
        // Renderizar cada categoría
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

    getCategoryName(slug) {
        const cat = this.data.categorias.find(c => c.Slug === slug);
        return cat ? cat.Nombre : slug;
    }

    renderAll() {
        console.log('🎨 Renderizando todo...');
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
        console.log('🚀 Inicializando GMR...');
        
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
            showToast('Datos cargados correctamente', 'success');
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
        <div class="empty-state" style="display: block;">
            <div class="empty-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3 class="empty-title">Error al cargar datos</h3>
            <p class="empty-text">No se pudieron cargar las noticias. Verifica la consola para más detalles.</p>
            <button class="btn-primary" onclick="location.reload()">
                <i class="fas fa-redo"></i>
                Recargar página
            </button>
        </div>
    `;
}

// ===============================
// FILTROS INTERACTIVOS
// ===============================

function initializeFilters() {
    let activeMonth = 'all';
    let activeCategory = 'all';
    
    // Filtros de mes
    document.getElementById('monthTimeline').addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        
        document.querySelectorAll('#monthTimeline .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        
        activeMonth = chip.getAttribute('data-month');
        applyFilters(activeMonth, activeCategory);
    });
    
    // Filtros de categoría
    document.getElementById('categoryFilters').addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        
        document.querySelectorAll('#categoryFilters .chip').forEach(c => c.classList.remove('active'));
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
                    const offset = 180;
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
    
    function performSearch(term) {
        const cards = document.querySelectorAll('.news-card');
        let visibleCount = 0;
        
        if (term === '') {
            cards.forEach(card => card.style.display = '');
            searchBadge.classList.remove('visible');
            
            document.querySelectorAll('.category-group, .month-section').forEach(el => {
                el.style.display = 'block';
            });
            
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
            } else {
                card.style.display = 'none';
            }
        });
        
        searchBadge.textContent = `${visibleCount}`;
        searchBadge.classList.add('visible');
        
        document.querySelectorAll('.category-group').forEach(group => {
            const visibleCards = group.querySelectorAll('.news-card:not([style*="display: none"])').length;
            group.style.display = visibleCards > 0 ? 'block' : 'none';
        });
        
        document.querySelectorAll('.month-section').forEach(section => {
            const visibleGroups = section.querySelectorAll('.category-group:not([style*="display: none"])').length;
            section.style.display = visibleGroups > 0 ? 'block' : 'none';
        });
        
        toggleEmptyState(visibleCount);
    }
}

// ===============================
// INTERACCIONES DE NOTICIAS
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
            showToast('Vista compacta activada', 'info');
        } else {
            container.classList.remove('compact-view');
            toggleBtn.innerHTML = '<i class="fas fa-th-large"></i>';
            showToast('Vista grid activada', 'info');
        }
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
    } else {
        emptyState.style.display = 'none';
        newsContainer.style.opacity = '1';
    }
}

function resetAllFilters() {
    document.querySelectorAll('#monthTimeline .chip').forEach(chip => {
        chip.classList.remove('active');
    });
    document.querySelector('#monthTimeline .chip[data-month="all"]')?.classList.add('active');
    
    document.querySelectorAll('#categoryFilters .chip').forEach(chip => {
        chip.classList.remove('active');
    });
    document.querySelector('#categoryFilters .chip[data-category="all"]')?.classList.add('active');
    
    document.getElementById('searchInput').value = '';
    document.getElementById('searchBadge').classList.remove('visible');
    
    document.querySelectorAll('.news-card').forEach(card => {
        card.style.display = '';
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