// ===============================
// CONFIGURACIÓN
// ===============================
const CONFIG = {
    dataPath: './data/gmr-data.json',
    newsDaysThreshold: 7,
    monthNames: {
        '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
        '05': 'Mayo',  '06': 'Junio',   '07': 'Julio', '08': 'Agosto',
        '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
    },
    // ✅ MEJORA 7: Colores diferenciados por categoría
    categoryColors: {
        'grupo-global':        '#122864',
        'sector-cambiario':    '#0ea5e9',
        'sector-aeroportuario':'#8b5cf6',
        'medios-efectivo':     '#10b981',
        'medios-digital':      '#f59e0b'
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
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const result = await response.json();
            if (!result.success || !result.data) throw new Error('Estructura inválida');
            console.log(`✅ ${result.data.noticias.length} noticias cargadas`);
            return this.processData(result.data, result.timestamp);
        } catch (error) {
            console.error('❌ Error:', error);
            throw error;
        }
    }

    processData(data, timestamp) {
        data.noticias.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        const now = new Date();
        data.noticias.forEach(n => {
            const diff = Math.floor((now - new Date(n.fecha)) / 86400000);
            n.isNew = diff >= 0 && diff <= CONFIG.newsDaysThreshold;
        });
        data.timestamp = timestamp;
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

    // ✅ MEJORA 1: Actualiza el splash con datos reales
    updateSplash() {
        const stats = this.calculateStats();
        const config = this.data.config || {};

        const splashMonth = document.getElementById('splashMonth');
        const splashTotal = document.getElementById('splashTotal');
        const splashCats  = document.getElementById('splashCats');
        const splashNew   = document.getElementById('splashNew');

        if (splashMonth) splashMonth.textContent = config.mes_actual || 'Informe mensual';

        // ✅ MEJORA 13: countUp animado
        if (splashTotal) this.countUp(splashTotal, stats.total, 1800);
        if (splashCats)  this.countUp(splashCats, this.data.categorias.length, 1200);
        if (splashNew)   this.countUp(splashNew, stats.new, 1500);
    }

    // ✅ MEJORA 13: Animación countUp
    countUp(el, target, duration = 1500) {
        const start = Date.now();
        const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(ease * target);
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    updateHeaderStats() {
        const statsInfo = document.getElementById('statsInfo');
        if (!statsInfo) return;
        const stats = this.calculateStats();
        const ts = this.data.timestamp ? new Date(this.data.timestamp) : new Date();
        const fmt = ts.toLocaleString('es-ES', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
        statsInfo.innerHTML = `
            ${stats.total} noticias • ${stats.new} nuevas &nbsp;
            <span class="last-update-badge">
                <i class="fas fa-sync-alt"></i>
                ${fmt}
            </span>
        `;
    }

    calculateStats() {
        const n = this.data.noticias;
        return {
            total: n.length,
            nacional: n.filter(x => x.alcance === 'Nacional').length,
            internacional: n.filter(x => x.alcance === 'Internacional').length,
            new: n.filter(x => x.isNew).length,
            porCategoria: n.reduce((acc, x) => { acc[x.categoria] = (acc[x.categoria]||0)+1; return acc; }, {}),
            porMes: this.groupByMonth(n),
            porDia: this.groupByDay(n)
        };
    }

    groupByMonth(noticias) {
        return noticias.reduce((acc, n) => {
            const d = new Date(n.fecha);
            const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
            acc[k] = (acc[k]||0)+1;
            return acc;
        }, {});
    }

    groupByDay(noticias) {
        return noticias.reduce((acc, n) => {
            acc[n.fecha] = (acc[n.fecha]||0)+1;
            return acc;
        }, {});
    }

    renderMonthFilters() {
        const container = document.getElementById('monthFilters');
        if (!container) return;
        const stats = this.calculateStats();
        const months = Object.keys(stats.porMes).sort((a,b) => new Date(b)-new Date(a));
        container.querySelector('.pill-compact[data-month="all"] .count').textContent = stats.total;
        months.forEach(month => {
            const pill = document.createElement('button');
            pill.className = 'pill-compact';
            pill.setAttribute('data-month', month);
            pill.innerHTML = `${this.formatMonth(month)} <span class="count">${stats.porMes[month]}</span>`;
            container.appendChild(pill);
        });
    }

    renderCategoryFilters() {
        const container = document.getElementById('categoryFilters');
        if (!container) return;
        const stats = this.calculateStats();
        container.querySelector('.pill-compact[data-category="all"] .count').textContent = stats.total;
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

    // ✅ MEJORA 10: Barras proporcionales
    renderCategoryBars() {
        const container = document.getElementById('categoryBars');
        if (!container) return;
        const stats = this.calculateStats();
        const total = stats.total;
        const maxCount = Math.max(...Object.values(stats.porCategoria));

        this.data.categorias.forEach(cat => {
            const count = stats.porCategoria[cat.Slug] || 0;
            if (count === 0) return;
            const pct = Math.round((count / maxCount) * 100);
            const color = CONFIG.categoryColors[cat.Slug] || cat.Color;

            const item = document.createElement('div');
            item.className = 'cat-bar-item';
            item.setAttribute('data-category', cat.Slug);
            item.innerHTML = `
                <span class="cat-bar-label">${cat.Nombre}</span>
                <div class="cat-bar-track">
                    <div class="cat-bar-fill" style="background: ${color}; width: 0%;" data-width="${pct}"></div>
                </div>
                <span class="cat-bar-num">${count}</span>
            `;
            container.appendChild(item);

            // Animar al cargar
            requestAnimationFrame(() => {
                setTimeout(() => {
                    const fill = item.querySelector('.cat-bar-fill');
                    if (fill) fill.style.width = pct + '%';
                }, 300);
            });
        });
    }

    // ✅ MEJORA 11: Heatmap
    renderHeatmap() {
        const container = document.getElementById('heatmapContainer');
        const grid = document.getElementById('heatmapGrid');
        if (!container || !grid) return;

        const stats = this.calculateStats();
        const porDia = stats.porDia;

        if (Object.keys(porDia).length === 0) return;

        // Determinar rango de fechas del mes actual
        const fechas = Object.keys(porDia).sort();
        const primerFecha = new Date(fechas[0]);
        const ultimaFecha = new Date(fechas[fechas.length - 1]);
        const maxCount = Math.max(...Object.values(porDia));

        // Generar todos los días del mes
        const start = new Date(primerFecha.getFullYear(), primerFecha.getMonth(), 1);
        const end   = new Date(ultimaFecha.getFullYear(), ultimaFecha.getMonth() + 1, 0);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const key = d.toISOString().split('T')[0];
            const count = porDia[key] || 0;
            let level = 0;
            if (count > 0) level = count <= 1 ? 1 : count <= 3 ? 2 : 3;

            const day = document.createElement('div');
            day.className = 'heatmap-day';
            day.setAttribute('data-count', count);
            day.setAttribute('data-level', level);
            day.setAttribute('data-tooltip', `${key}: ${count} noticia${count !== 1 ? 's' : ''}`);
            day.textContent = d.getDate();
            grid.appendChild(day);
        }

        container.style.display = 'block';
    }

    formatMonth(monthKey) {
        const [year, month] = monthKey.split('-');
        return `${CONFIG.monthNames[month]} ${year}`;
    }

    renderNews() {
        const container = document.getElementById('newsContainer');
        if (!container) return;
        const skeleton = document.getElementById('skeletonLoader');
        if (skeleton) {
            skeleton.style.opacity = '0';
            setTimeout(() => skeleton.remove(), 300);
        }
        container.innerHTML = '';

        const porMes = this.groupNewsByMonth(this.data.noticias);
        const meses = Object.keys(porMes).sort((a,b) => new Date(b)-new Date(a));
        meses.forEach(mes => {
            container.appendChild(this.createMonthSection(mes, porMes[mes]));
        });

        this.renderTimeline(meses);
    }

    groupNewsByMonth(noticias) {
        return noticias.reduce((acc, n) => {
            const d = new Date(n.fecha);
            const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
            if (!acc[k]) acc[k] = [];
            acc[k].push(n);
            return acc;
        }, {});
    }

    createMonthSection(mes, noticias) {
        const section = document.createElement('section');
        section.className = 'month-section';
        section.setAttribute('data-month', mes);
        section.id = `month-${mes}`;
        section.innerHTML = `
            <div class="month-header">
                <h2 class="month-title">
                    <i class="far fa-calendar"></i>
                    ${this.formatMonth(mes)}
                </h2>
                <span class="month-count">${noticias.length}</span>
            </div>
        `;
        const porCat = this.groupNewsByCategory(noticias);
        this.data.categorias
            .filter(cat => porCat[cat.Slug])
            .forEach(cat => {
                section.appendChild(this.createCategorySection(cat.Slug, porCat[cat.Slug]));
            });
        return section;
    }

    groupNewsByCategory(noticias) {
        return noticias.reduce((acc, n) => {
            if (!acc[n.categoria]) acc[n.categoria] = [];
            acc[n.categoria].push(n);
            return acc;
        }, {});
    }

    createCategorySection(categorySlug, noticias) {
        const cat = this.data.categorias.find(c => c.Slug === categorySlug);
        if (!cat) return document.createElement('div');

        // ✅ MEJORA 7: Color diferenciado
        const color = CONFIG.categoryColors[categorySlug] || cat.Color;

        const section = document.createElement('div');
        section.className = 'category-section';
        section.setAttribute('data-category', categorySlug);
        section.style.setProperty('--cat-color', color);

        section.innerHTML = `
            <div class="category-header">
                <div class="category-icon" style="background: ${color}">
                    <i class="fas ${cat.Icono}"></i>
                </div>
                <h3 class="category-name">${cat.Nombre}</h3>
                <span class="category-count">${noticias.length}</span>
            </div>
            <div class="news-grid"></div>
        `;

        const grid = section.querySelector('.news-grid');
        noticias.forEach((noticia, idx) => {
            const card = this.createExecutiveCard(noticia, cat, color);
            // ✅ MEJORA 3: Primera card de grupo-global es Hero
            if (categorySlug === 'grupo-global' && idx === 0) {
                card.classList.add('hero-card');
            }
            grid.appendChild(card);
        });

        return section;
    }

    createExecutiveCard(noticia, categoryData, color) {
        const article = document.createElement('article');
        article.className = 'card-executive';
        article.setAttribute('data-url', noticia.url);
        article.setAttribute('data-category', noticia.categoria);
        article.style.setProperty('--cat-color', color);

        const fecha = new Date(noticia.fecha);
        const fechaFmt = fecha.toLocaleDateString('es-ES', { day:'numeric', month:'short', year:'numeric' });
        const badgeClass = noticia.alcance === 'Nacional' ? 'nacional' : 'internacional';
        const highlights = (noticia.highlights || []).slice(0, 3);
        const hasImage = noticia.imagen && !noticia.imagen.includes('placehold.co') && noticia.imagen.trim() !== '';

        const imageHTML = hasImage
            ? `<div class="card-image-exec">
                   <img src="${noticia.imagen}" alt="${noticia.titulo}" loading="lazy"
                        onerror="this.parentElement.classList.add('placeholder'); this.style.display='none';">
                   ${noticia.isNew ? `<div class="card-badge-new"><i class="fas fa-star"></i> Nueva</div>` : ''}
               </div>`
            : `<div class="card-image-exec placeholder">
                   <div class="placeholder-content">
                       <div class="placeholder-icon"><i class="fas ${categoryData.Icono}"></i></div>
                       <div class="placeholder-text">${categoryData.Nombre}</div>
                   </div>
                   ${noticia.isNew ? `<div class="card-badge-new"><i class="fas fa-star"></i> Nueva</div>` : ''}
               </div>`;

        // ✅ MEJORA 2: Resumen expandible
        const summaryHTML = noticia.resumen
            ? `<button class="card-expand-btn" onclick="toggleSummary(this)" data-expanded="false">
                   <i class="fas fa-chevron-down"></i> Ver resumen
               </button>
               <div class="card-summary-expanded">${noticia.resumen}</div>`
            : '';

        article.innerHTML = `
            ${imageHTML}
            <div class="card-content-exec">
                <div class="card-meta-exec">
                    <span class="card-badge-exec ${badgeClass}">
                        <i class="fas ${noticia.alcance === 'Nacional' ? 'fa-map-marker-alt' : 'fa-globe'}"></i>
                        ${noticia.alcance}
                    </span>
                    <span><i class="far fa-clock"></i> ${fechaFmt}</span>
                </div>
                <h3 class="card-title-exec">${noticia.titulo}</h3>
                ${highlights.length > 0 ? `
                    <ul class="card-highlights-exec">
                        ${highlights.map(h => `<li>${h}</li>`).join('')}
                    </ul>
                ` : ''}
                ${summaryHTML}
                <div class="card-footer-exec">
                    <span class="card-source-exec">
                        <i class="fas fa-newspaper"></i>
                        ${noticia.medio}
                    </span>
                    <a href="${noticia.url}" target="_blank" class="card-link-exec"
                       onclick="event.stopPropagation()">
                        Leer <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        `;

        return article;
    }

    renderTimeline(meses) {
        const stats = this.calculateStats();
        const timeline = document.createElement('aside');
        timeline.className = 'timeline-sidebar';
        timeline.id = 'timelineSidebar';
        timeline.innerHTML = `
            <div class="timeline-title"><i class="fas fa-stream"></i> Timeline</div>
            <ul class="timeline-list">
                ${meses.map(mes => `
                    <li class="timeline-item" data-timeline-month="${mes}">
                        <span class="timeline-month">${this.formatMonth(mes)}</span>
                        <span class="timeline-count">${stats.porMes[mes]}</span>
                    </li>
                `).join('')}
            </ul>
        `;
        document.body.appendChild(timeline);
        setTimeout(() => timeline.classList.add('visible'), 500);
    }

    renderAll() {
        console.log('🎨 Renderizando...');
        this.updateSplash();
        this.updateHeaderStats();
        this.renderMonthFilters();
        this.renderCategoryFilters();
        this.renderCategoryBars();
        this.renderHeatmap();
        this.renderNews();
        console.log('✅ Listo');
    }
}

// ===============================
// GLOBALES
// ===============================
let dataService, renderer, allData;

// ✅ MEJORA 2: Toggle resumen inline
function toggleSummary(btn) {
    event.stopPropagation();
    const expanded = btn.getAttribute('data-expanded') === 'true';
    const summary = btn.nextElementSibling;
    if (!summary) return;
    if (expanded) {
        summary.classList.remove('open');
        btn.setAttribute('data-expanded', 'false');
        btn.innerHTML = '<i class="fas fa-chevron-down"></i> Ver resumen';
    } else {
        summary.classList.add('open');
        btn.setAttribute('data-expanded', 'true');
        btn.innerHTML = '<i class="fas fa-chevron-up"></i> Ocultar resumen';
    }
}

// ===============================
// INICIALIZACIÓN
// ===============================
async function initializeGMR() {
    try {
        console.log('🚀 GMR v4.0...');
        dataService = new GMRDataService(CONFIG.dataPath);
        allData = await dataService.fetchData();
        renderer = new ExecutiveRenderer(allData);
        renderer.renderAll();

        setTimeout(() => {
            initializeFilters();
            initializeSearch();
            initializeCards();
            initializeScrollEffects();
            initializeTimelineScroll();
            initializeBriefing();
            hideSplash();
            showToast('Informe cargado correctamente', 'success');
        }, 2200); // Tiempo del splash

    } catch (error) {
        console.error('❌', error);
        showToast('Error al cargar el sistema', 'error');
        showErrorState();
        hideSplash();
    }
}

// ✅ MEJORA 1: Ocultar splash
function hideSplash() {
    const splash = document.getElementById('splashScreen');
    if (splash) splash.classList.add('hidden');
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
            <p>Verifica tu conexión</p>
            <button class="btn-primary-exec" onclick="location.reload()">
                <i class="fas fa-redo"></i> Recargar
            </button>
        </div>
    `;
}

// ===============================
// FILTROS
// ===============================
function initializeFilters() {
    let activeMonth = 'all', activeCategory = 'all';
    const monthFilters = document.getElementById('monthFilters');
    const categoryFilters = document.getElementById('categoryFilters');
    const resetBtn = document.getElementById('resetFilters');
    if (!monthFilters || !categoryFilters || !resetBtn) return;

    monthFilters.addEventListener('click', e => {
        const pill = e.target.closest('.pill-compact');
        if (!pill) return;
        monthFilters.querySelectorAll('.pill-compact').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeMonth = pill.getAttribute('data-month');
        if (activeMonth !== 'all') {
            document.getElementById(`month-${activeMonth}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        applyFilters(activeMonth, activeCategory);
    });

    categoryFilters.addEventListener('click', e => {
        const pill = e.target.closest('.pill-compact');
        if (!pill) return;
        categoryFilters.querySelectorAll('.pill-compact').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeCategory = pill.getAttribute('data-category');
        applyFilters(activeMonth, activeCategory);
    });

    // ✅ MEJORA 10: clic en barras también filtra
    const catBars = document.getElementById('categoryBars');
    if (catBars) {
        catBars.addEventListener('click', e => {
            const item = e.target.closest('.cat-bar-item');
            if (!item) return;
            const cat = item.getAttribute('data-category');
            categoryFilters.querySelectorAll('.pill-compact').forEach(p => {
                p.classList.toggle('active', p.getAttribute('data-category') === cat);
            });
            activeCategory = cat;
            applyFilters(activeMonth, activeCategory);
        });
    }

    resetBtn.addEventListener('click', resetAllFilters);

    function applyFilters(month, category) {
        let visibleCount = 0;
        document.querySelectorAll('.month-section').forEach(section => {
            const sectionMonth = section.getAttribute('data-month');
            const showMonth = month === 'all' || sectionMonth === month;
            if (showMonth) {
                let visibleInMonth = 0;
                section.querySelectorAll('.category-section').forEach(catSec => {
                    const slug = catSec.getAttribute('data-category');
                    const showCat = category === 'all' || slug === category;
                    catSec.style.display = showCat ? '' : 'none';
                    if (showCat) {
                        visibleInMonth += catSec.querySelectorAll('.card-executive').length;
                        visibleCount += catSec.querySelectorAll('.card-executive').length;
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
    let timeout;
    searchInput.addEventListener('input', e => {
        clearTimeout(timeout);
        timeout = setTimeout(() => performSearch(e.target.value.toLowerCase().trim()), 300);
    });

    function performSearch(term) {
        const cards = document.querySelectorAll('.card-executive');
        clearHighlights();
        if (term === '') {
            cards.forEach(c => c.style.display = '');
            document.querySelectorAll('.month-section, .category-section').forEach(s => s.style.display = '');
            toggleEmptyState(cards.length);
            return;
        }
        let visible = 0;
        cards.forEach(card => {
            const title = card.querySelector('.card-title-exec');
            const source = card.querySelector('.card-source-exec');
            const highlights = card.querySelector('.card-highlights-exec');
            const found = [title, source, highlights].some(el => el?.textContent.toLowerCase().includes(term));
            card.style.display = found ? '' : 'none';
            if (found) {
                visible++;
                if (title?.textContent.toLowerCase().includes(term)) highlightText(title, term);
                if (highlights?.textContent.toLowerCase().includes(term)) highlightText(highlights, term);
            }
        });
        document.querySelectorAll('.category-section').forEach(cs => {
            cs.style.display = cs.querySelectorAll('.card-executive:not([style*="display: none"])').length > 0 ? '' : 'none';
        });
        document.querySelectorAll('.month-section').forEach(ms => {
            ms.style.display = ms.querySelectorAll('.category-section:not([style*="display: none"])').length > 0 ? '' : 'none';
        });
        toggleEmptyState(visible);
    }

    function clearHighlights() {
        document.querySelectorAll('.search-highlight').forEach(el => {
            el.parentNode?.replaceChild(document.createTextNode(el.textContent), el);
        });
        document.querySelectorAll('.card-title-exec, .card-highlights-exec').forEach(el => el.normalize());
    }

    function highlightText(element, term) {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const nodes = [];
        let node;
        while (node = walker.nextNode()) {
            if (node.nodeValue.toLowerCase().includes(term)) nodes.push(node);
        }
        nodes.forEach(n => {
            const text = n.nodeValue;
            const regex = new RegExp(`(${term})`, 'gi');
            const parts = text.split(regex);
            const frag = document.createDocumentFragment();
            parts.forEach(part => {
                if (part.toLowerCase() === term) {
                    const mark = document.createElement('span');
                    mark.className = 'search-highlight';
                    mark.textContent = part;
                    frag.appendChild(mark);
                } else {
                    frag.appendChild(document.createTextNode(part));
                }
            });
            n.parentNode.replaceChild(frag, n);
        });
    }
}

// ===============================
// CARDS
// ===============================
function initializeCards() {
    const container = document.getElementById('newsContainer');
    if (!container) return;
    container.addEventListener('click', e => {
        const card = e.target.closest('.card-executive');
        if (!card) return;
        if (e.target.closest('.card-link-exec') || e.target.closest('.card-expand-btn')) return;
        const url = card.getAttribute('data-url');
        if (url) window.open(url, '_blank');
    });
}

// ===============================
// SCROLL EFFECTS + MEJORA 16
// ===============================
function initializeScrollEffects() {
    const header = document.getElementById('mainHeader');
    const backToTop = document.getElementById('backToTop');
    const progressBar = document.getElementById('scrollProgress');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const scroll = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;

        // ✅ MEJORA 16: Barra de progreso
        if (progressBar) {
            progressBar.style.width = `${Math.min((scroll / docHeight) * 100, 100)}%`;
        }

        if (scroll > 100) {
            if (scroll > lastScroll) {
                header?.classList.add('hidden');
                document.body.classList.add('header-hidden');
            } else {
                header?.classList.remove('hidden');
                document.body.classList.remove('header-hidden');
            }
        } else {
            header?.classList.remove('hidden');
            document.body.classList.remove('header-hidden');
        }

        if (scroll > 500) backToTop?.classList.add('visible');
        else backToTop?.classList.remove('visible');

        lastScroll = scroll;
    });

    backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ===============================
// TIMELINE
// ===============================
function initializeTimelineScroll() {
    const items = document.querySelectorAll('.timeline-item');
    items.forEach(item => {
        item.addEventListener('click', () => {
            const month = item.getAttribute('data-timeline-month');
            document.getElementById(`month-${month}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            items.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const month = entry.target.getAttribute('data-month');
                document.querySelectorAll('.timeline-item').forEach(i => i.classList.remove('active'));
                document.querySelector(`.timeline-item[data-timeline-month="${month}"]`)?.classList.add('active');
            }
        });
    }, { threshold: 0.3 });

    document.querySelectorAll('.month-section').forEach(s => observer.observe(s));
}

// ===============================
// MEJORA 28: BRIEFING
// ===============================
function initializeBriefing() {
    const btn = document.getElementById('briefingBtn');
    if (!btn || !allData) return;
    btn.addEventListener('click', generateBriefing);
}

function generateBriefing() {
    const overlay = document.getElementById('briefingOverlay');
    const content = document.getElementById('briefingContent');
    if (!overlay || !content || !allData) return;

    // Últimas noticias (últimos 30 días), grupo-global primero
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const noticias = [...allData.noticias]
        .filter(n => new Date(n.fecha) >= cutoff)
        .sort((a, b) => {
            if (a.categoria === 'grupo-global' && b.categoria !== 'grupo-global') return -1;
            if (b.categoria === 'grupo-global' && a.categoria !== 'grupo-global') return 1;
            return new Date(b.fecha) - new Date(a.fecha);
        });

    const config = allData.config || {};
    const date = new Date().toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' });

    content.innerHTML = `
        <div style="text-align:center; padding: 1rem 0 2rem; border-bottom: 2px solid var(--gray-200); margin-bottom: 1.5rem;">
            <p style="font-size: 0.8125rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--gray-500);">
                Global Exchange · Comunicación Corporativa
            </p>
            <h2 style="font-size: 1.5rem; font-weight: 900; color: var(--gray-900); margin: 0.5rem 0;">
                Briefing Ejecutivo — ${config.mes_actual || date}
            </h2>
            <p style="color: var(--gray-500); font-size: 0.875rem;">${noticias.length} noticias seleccionadas</p>
        </div>
        ${noticias.map(n => {
            const cat = allData.categorias.find(c => c.Slug === n.categoria);
            const color = CONFIG.categoryColors[n.categoria] || cat?.Color || '#122864';
            const fecha = new Date(n.fecha).toLocaleDateString('es-ES', { day:'numeric', month:'short' });
            return `
                <div class="briefing-item">
                    <div class="briefing-cat-dot" style="background: ${color}"></div>
                    <div>
                        <div class="briefing-item-title">${n.titulo}</div>
                        <div class="briefing-item-meta">
                            ${cat?.Nombre || n.categoria} · ${n.medio} · ${fecha}
                        </div>
                        ${n.resumen ? `<p style="font-size:0.8125rem; color: var(--gray-600); margin-top: 4px; line-height:1.5;">${n.resumen}</p>` : ''}
                    </div>
                </div>
            `;
        }).join('')}
    `;

    overlay.style.display = 'flex';
}

function closeBriefing() {
    const overlay = document.getElementById('briefingOverlay');
    if (overlay) overlay.style.display = 'none';
}

function printBriefing() {
    window.print();
}

// ===============================
// UTILIDADES
// ===============================
function toggleEmptyState(count) {
    const el = document.getElementById('emptyState');
    if (el) el.style.display = count === 0 ? 'flex' : 'none';
}

function resetAllFilters() {
    document.querySelectorAll('.pill-compact').forEach(p => p.classList.remove('active'));
    document.querySelector('.pill-compact[data-month="all"]')?.classList.add('active');
    document.querySelector('.pill-compact[data-category="all"]')?.classList.add('active');
    const si = document.getElementById('searchInput');
    if (si) si.value = '';
    document.querySelectorAll('.search-highlight').forEach(el => {
        el.parentNode?.replaceChild(document.createTextNode(el.textContent), el);
    });
    document.querySelectorAll('.card-executive, .month-section, .category-section').forEach(el => el.style.display = '');
    toggleEmptyState(document.querySelectorAll('.card-executive').length);
    showToast('Filtros restablecidos', 'success');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}