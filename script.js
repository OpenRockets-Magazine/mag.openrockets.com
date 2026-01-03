// Initialize Supabase client
if (typeof supabase === 'undefined' || typeof supabase.from !== 'function') {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        // Supabase library not loaded yet — set placeholder and try to initialize later
        var supabase = null;
    }
}

// Display today's date as release date
function displayReleaseDate() {
    const dateElement = document.getElementById('currentDate');
    if (!dateElement) return;
    
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = `Release: ${today.toLocaleDateString('en-US', options)}`;
}

// Load categories for navigation with arrow navigation
async function loadCategories() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .neq('slug', '__admin_config__') // Exclude admin config
            .order('name');
        
        if (error) throw error;
        
        const navList = document.getElementById('navList');
        const navContainer = document.querySelector('.nav .container');
        
        if (data && data.length > 0) {
            // Store categories for navigation
            window.allCategories = data;
            window.categoryPage = 0;
            window.categoriesPerPage = 5;
            
            renderCategoryPage();
            
            // Add navigation arrows if needed
            if (data.length > window.categoriesPerPage) {
                addCategoryNavigation(navContainer);
            }
        } else {
            navList.innerHTML = '<li><a href="#">No categories yet</a></li>';
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Render current page of categories
function renderCategoryPage() {
    const navList = document.getElementById('navList');
    const start = window.categoryPage * window.categoriesPerPage;
    const end = start + window.categoriesPerPage;
    const pageCategories = window.allCategories.slice(start, end);
    
    navList.innerHTML = pageCategories.map(cat => 
        `<li><a href="#${cat.slug}">${cat.name}</a></li>`
    ).join('');
    
    updateCategoryArrows();
}

// Add navigation arrows
function addCategoryNavigation(container) {
    // Check if arrows already exist
    if (container.querySelector('.nav-arrow')) return;
    
    const leftArrow = document.createElement('button');
    leftArrow.className = 'nav-arrow nav-arrow-left';
    leftArrow.innerHTML = '<i class="bi bi-chevron-left"></i>';
    leftArrow.onclick = () => {
        if (window.categoryPage > 0) {
            window.categoryPage--;
            renderCategoryPage();
        }
    };
    
    const rightArrow = document.createElement('button');
    rightArrow.className = 'nav-arrow nav-arrow-right';
    rightArrow.innerHTML = '<i class="bi bi-chevron-right"></i>';
    rightArrow.onclick = () => {
        const maxPage = Math.ceil(window.allCategories.length / window.categoriesPerPage) - 1;
        if (window.categoryPage < maxPage) {
            window.categoryPage++;
            renderCategoryPage();
        }
    };
    
    container.insertBefore(leftArrow, container.firstChild);
    container.appendChild(rightArrow);
}

// Update arrow visibility
function updateCategoryArrows() {
    const leftArrow = document.querySelector('.nav-arrow-left');
    const rightArrow = document.querySelector('.nav-arrow-right');
    
    if (!leftArrow || !rightArrow) return;
    
    const maxPage = Math.ceil(window.allCategories.length / window.categoriesPerPage) - 1;
    
    leftArrow.disabled = window.categoryPage === 0;
    leftArrow.style.opacity = window.categoryPage === 0 ? '0.3' : '1';
    
    rightArrow.disabled = window.categoryPage >= maxPage;
    rightArrow.style.opacity = window.categoryPage >= maxPage ? '0.3' : '1';
}

// Hide articles loading skeleton
function hideArticlesLoading() {
    const loadingEl = document.getElementById('articlesLoading');
    if (loadingEl) {
        loadingEl.classList.add('hidden');
    }
}

// Load articles progressively for homepage (one by one)
async function loadArticles() {
    const featuredSection = document.getElementById('featuredSection');
    const articleGrid = document.getElementById('articleGrid');
    
    // Hide shimmer immediately and show content areas
    hideArticlesLoading();
    
    let sidebarArticles = [];
    
    try {
        // Get total count first
        const { count, error: countError } = await supabase
            .from('articles')
            .select('*', { count: 'exact', head: true })
            .eq('published', true);
        
        if (countError) throw countError;
        
        if (!count || count === 0) {
            featuredSection.innerHTML = 
                '<p class="no-content-message">No articles published yet. Visit the <a href="/admin.html" style="color: #0066cc;">admin panel</a> to create articles.</p>';
            return;
        }
        
        // Load articles one by one
        for (let i = 0; i < count; i++) {
            const { data, error } = await supabase
                .from('articles')
                .select(`
                    *,
                    categories(name, slug),
                    authors(name, verified)
                `)
                .eq('published', true)
                .order('created_at', { ascending: false })
                .range(i, i);
            
            if (error) throw error;
            if (!data || data.length === 0) continue;
            
            const article = data[0];
            
            if (i === 0) {
                // First article - render as featured with fade-in
                renderFeaturedArticle(article);
            } else if (i >= 1 && i <= 3) {
                // Articles 2-4 go to sidebar
                sidebarArticles.push(article);
                renderSidebarArticles(sidebarArticles);
            } else {
                // Remaining articles go to grid one by one
                appendArticleToGrid(article, articleGrid);
            }
            
            // Small delay between each article for progressive feel
            await new Promise(resolve => setTimeout(resolve, 80));
        }
        
    } catch (error) {
        console.error('Error loading articles:', error);
        featuredSection.innerHTML = 
            '<p class="no-content-message" style="color: red;">Error loading articles.</p>';
    }
}

// Append a single article to the grid with fade-in
function appendArticleToGrid(article, grid) {
    const imageUrl = article.image_url;
    const categoryName = article.categories?.name || 'Uncategorized';
    const authorName = article.authors?.name || 'Unknown';
    const verified = article.authors?.verified ? ' <i class="bi bi-patch-check-fill verified-badge"></i>' : '';
    const views = getDisplayViews(article.views);
    
    const imageHtml = imageUrl ? `
        <a href="/p/?article=${article.slug}">
            <img src="${imageUrl}" alt="${article.title}" class="article-image">
        </a>
    ` : '';
    
    const articleEl = document.createElement('article');
    articleEl.className = `grid-article ${!imageUrl ? 'no-image' : ''} fade-in`;
    articleEl.innerHTML = `
        ${imageHtml}
        <span class="category">${categoryName}</span>
        <h3><a href="/p/?article=${article.slug}">${article.title}</a></h3>
        <p class="article-excerpt">${article.excerpt || ''}</p>
        <div class="article-meta">
            <span class="author">${authorName}${verified}</span>
            <span class="date">${formatDate(article.created_at)}</span>
            <span class="views"><svg class="views-icon" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="10" width="3" height="5" rx="0.5"/><rect x="6" y="6" width="3" height="9" rx="0.5"/><rect x="11" y="2" width="3" height="13" rx="0.5"/></svg> ${views}</span>
        </div>
    `;
    
    grid.appendChild(articleEl);
    
    // Trigger fade-in animation
    requestAnimationFrame(() => {
        articleEl.classList.add('visible');
    });
}

// Render featured article with fade-in
function renderFeaturedArticle(article) {
    const section = document.getElementById('featuredSection');
    const imageUrl = article.image_url;
    const categoryName = article.categories?.name || 'Uncategorized';
    const authorName = article.authors?.name || 'Unknown';
    const verified = article.authors?.verified ? ' <i class="bi bi-patch-check-fill verified-badge"></i>' : '';
    const views = getDisplayViews(article.views);
    
    const imageHtml = imageUrl ? `
        <a href="/p/?article=${article.slug}">
            <img src="${imageUrl}" alt="${article.title}" class="featured-image">
        </a>
    ` : '';
    
    section.innerHTML = `
        <article class="featured-article fade-in ${!imageUrl ? 'no-image' : ''}">
            ${imageHtml}
            <div class="featured-content">
                <span class="category">${categoryName}</span>
                <h2 class="featured-title">
                    <a href="/p/?article=${article.slug}">${article.title}</a>
                </h2>
                <p class="featured-excerpt">${article.excerpt || ''}</p>
                <div class="article-meta">
                    <span class="author">${authorName}${verified}</span>
                    <span class="divider">|</span>
                    <span class="date">${formatDate(article.created_at)}</span>
                    <span class="divider">|</span>
                    <span class="views"><svg class="views-icon" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="10" width="3" height="5" rx="0.5"/><rect x="6" y="6" width="3" height="9" rx="0.5"/><rect x="11" y="2" width="3" height="13" rx="0.5"/></svg> ${views}</span>
                </div>
            </div>
        </article>
        <div class="featured-sidebar" id="sidebarArticles"></div>
    `;
    
    // Trigger fade-in
    requestAnimationFrame(() => {
        section.querySelector('.featured-article').classList.add('visible');
    });
}

// Render sidebar articles
function renderSidebarArticles(articles) {
    const sidebar = document.getElementById('sidebarArticles');
    if (!articles || articles.length === 0) {
        sidebar.innerHTML = '';
        return;
    }
    
    sidebar.innerHTML = articles.map(article => `
        <article class="sidebar-article">
            <h3><a href="/p/?article=${article.slug}">${article.title}</a></h3>
            <p class="article-excerpt">${article.excerpt || ''}</p>
            <span class="date">${getTimeAgo(article.created_at)}</span>
        </article>
    `).join('');
}

// Render article grid
function renderArticleGrid(articles) {
    const grid = document.getElementById('articleGrid');
    
    if (!articles || articles.length === 0) {
        grid.innerHTML = '';
        return;
    }
    
    grid.innerHTML = articles.map(article => {
        const imageUrl = article.image_url;
        const categoryName = article.categories?.name || 'Uncategorized';
        const authorName = article.authors?.name || 'Unknown';
        const verified = article.authors?.verified ? ' <i class="bi bi-patch-check-fill verified-badge"></i>' : '';
        const views = getDisplayViews(article.views);
        
        const imageHtml = imageUrl ? `
            <a href="/p/?article=${article.slug}">
                <img src="${imageUrl}" alt="${article.title}" class="article-image">
            </a>
        ` : '';
        
        return `
            <article class="grid-article ${!imageUrl ? 'no-image' : ''}">
                ${imageHtml}
                <span class="category">${categoryName}</span>
                <h3><a href="/p/?article=${article.slug}">${article.title}</a></h3>
                <p class="article-excerpt">${article.excerpt || ''}</p>
                <div class="article-meta">
                    <span class="author">${authorName}${verified}</span>
                    <span class="date">${formatDate(article.created_at)}</span>
                    <span class="views"><svg class="views-icon" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="10" width="3" height="5" rx="0.5"/><rect x="6" y="6" width="3" height="9" rx="0.5"/><rect x="11" y="2" width="3" height="13" rx="0.5"/></svg> ${views}</span>
                </div>
            </article>
        `;
    }).join('');
}

// Load sponsors
async function loadSponsors() {
    try {
        const { data, error } = await supabase
            .from('sponsors')
            .select('*')
            .order('name');
        
        if (error) throw error;
        
        const grid = document.getElementById('sponsorsGrid');
        
        if (data && data.length > 0) {
            // Check if we need marquee (more than 4 sponsors)
            const needsMarquee = data.length > 4;
            
            if (needsMarquee) {
                grid.classList.add('marquee');
                // Duplicate items for seamless loop
                const items = [...data, ...data];
                grid.innerHTML = items.map(sponsor => {
                    const logoUrl = sponsor.logo_url || 'https://via.placeholder.com/200x100?text=' + encodeURIComponent(sponsor.name);
                    const link = sponsor.url || '#';
                    
                    return `
                        <div class="sponsor-item">
                            <a href="${link}" target="_blank" rel="noopener noreferrer">
                                <img src="${logoUrl}" alt="${sponsor.name}">
                            </a>
                        </div>
                    `;
                }).join('');
            } else {
                grid.classList.remove('marquee');
                grid.innerHTML = data.map(sponsor => {
                    const logoUrl = sponsor.logo_url || 'https://via.placeholder.com/200x100?text=' + encodeURIComponent(sponsor.name);
                    const link = sponsor.url || '#';
                    
                    return `
                        <div class="sponsor-item">
                            <a href="${link}" target="_blank" rel="noopener noreferrer">
                                <img src="${logoUrl}" alt="${sponsor.name}">
                            </a>
                        </div>
                    `;
                }).join('');
            }
        } else {
            grid.innerHTML = '<p class="no-content-message">No sponsors yet</p>';
        }
    } catch (error) {
        console.error('Error loading sponsors:', error);
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Get time ago
function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return formatDate(dateString);
}

// Get display views (random 10-20 if zero, otherwise actual)
function getDisplayViews(views) {
    if (!views || views === 0) {
        // Generate random between 10-20 for display only
        return Math.floor(Math.random() * 11) + 10;
    }
    return views;
}

// Mobile menu toggle
function initMobileMenu() {
    const menuToggle = document.getElementById('mobileMenuToggle');
    const nav = document.getElementById('mainNav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
}

// Smooth scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href.length > 1) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}

// Article hover effect
function initArticleHoverEffects() {
    const articles = document.querySelectorAll('.grid-article, .sidebar-article, .opinion-article');
    
    articles.forEach(article => {
        article.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        article.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Sticky header on scroll - shrink logo when scrolling down
function initStickyHeader() {
    const header = document.querySelector('.header');
    const scrollThreshold = 50;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > scrollThreshold) {
            // Scrolling past threshold - shrink header
            header.classList.add('scrolled');
        } else {
            // Back to top - restore normal header
            header.classList.remove('scrolled');
        }
    });
}

// Search functionality
function initSearch() {
    const searchBtn = document.getElementById('searchBtn');
    const searchDropdown = document.getElementById('searchDropdown');
    const searchClose = document.getElementById('searchClose');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    if (searchBtn && searchDropdown) {
        // Toggle search dropdown
        searchBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const isActive = searchDropdown.classList.contains('active');
            
            if (isActive) {
                closeSearch();
            } else {
                searchDropdown.classList.add('active');
                searchInput.focus();
            }
        });
        
        // Close search dropdown
        function closeSearch() {
            searchDropdown.classList.remove('active');
            searchInput.value = '';
            searchResults.innerHTML = '';
        }
        
        if (searchClose) {
            searchClose.addEventListener('click', function(e) {
                e.stopPropagation();
                closeSearch();
            });
        }
        
        // Close on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && searchDropdown.classList.contains('active')) {
                closeSearch();
            }
        });
        
        // Close on click outside
        document.addEventListener('click', function(e) {
            if (searchDropdown.classList.contains('active') && 
                !searchDropdown.contains(e.target) && 
                e.target !== searchBtn) {
                closeSearch();
            }
        });
        
        // Prevent dropdown close when clicking inside
        searchDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
        
        // Search on input
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim();
            
            if (query.length < 2) {
                searchResults.innerHTML = '';
                return;
            }
            
            // Show loading
            searchResults.innerHTML = '<div class="search-loading"><i class="bi bi-hourglass-split"></i> Searching...</div>';
            
            searchTimeout = setTimeout(async () => {
                await performSearch(query, searchResults);
            }, 300);
        });
    }
}

// Perform search
async function performSearch(query, resultsContainer) {
    try {
        const { data: articles, error } = await supabase
            .from('articles')
            .select('id, title, excerpt, slug, created_at, authors(name)')
            .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`)
            .limit(10);
        
        if (error) throw error;
        
        if (!articles || articles.length === 0) {
            resultsContainer.innerHTML = '<p class="search-no-results">No results found</p>';
            return;
        }
        
        resultsContainer.innerHTML = articles.map(article => {
            const authorName = article.authors?.name || 'Unknown Author';
            const publishDate = article.created_at ? formatDate(new Date(article.created_at)) : '';
            const excerpt = article.excerpt ? article.excerpt.substring(0, 80) + '...' : '';
            
            return `
                <a href="/p/?article=${article.slug}" class="search-result-item">
                    <div class="search-result-title">${article.title}</div>
                    ${excerpt ? `<div class="search-result-excerpt">${excerpt}</div>` : ''}
                    <div class="search-result-meta">
                        <span class="author">${authorName}</span>
                        ${publishDate ? `<span class="separator">•</span><span class="date">${publishDate}</span>` : ''}
                    </div>
                </a>
            `;
        }).join('');
    } catch (error) {
        console.error('Search error:', error);
        resultsContainer.innerHTML = '<p class="search-no-results">Error performing search</p>';
    }
}

// Reading progress indicator
function initReadingProgress() {
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: #0066cc;
        z-index: 9999;
        transition: width 0.1s ease;
        width: 0%;
    `;
    document.body.appendChild(progressBar);
    
    window.addEventListener('scroll', function() {
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (window.pageYOffset / windowHeight) * 100;
        progressBar.style.width = scrolled + '%';
    });
}

// Initialize all functionality when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    // Force scroll to top immediately to show skeleton loaders
    window.scrollTo(0, 0);
    
    // Disable browser scroll restoration
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    
    // Show inline loading spinners first
    showInlineLoaders();
    
    displayReleaseDate();
    await loadCategories();
    await loadSpotlight();
    await loadArticles();
    await loadSponsors();
    await loadFreeAds();
    
    initMobileMenu();
    initSmoothScroll();
    initStickyHeader();
    initSearch();
    initReadingProgress();
    
    // Wait for articles to be rendered before attaching hover effects
    requestAnimationFrame(() => {
        setTimeout(() => {
            initArticleHoverEffects();
        }, 100);
    });
    
    console.log('OpenRockets Magazine loaded successfully!');
});

// Show inline loading spinners in content areas
function showInlineLoaders() {
    const featuredSection = document.getElementById('featuredSection');
    const articleGrid = document.getElementById('articleGrid');
    const sponsorsGrid = document.getElementById('sponsorsGrid');
    
    const loaderHtml = '<div class="inline-loader"><div class="spinner"></div><span>Loading...</span></div>';
    
    if (featuredSection && !featuredSection.innerHTML.trim()) {
        featuredSection.innerHTML = loaderHtml;
    }
    if (articleGrid && !articleGrid.innerHTML.trim()) {
        articleGrid.innerHTML = loaderHtml;
    }
    if (sponsorsGrid && !sponsorsGrid.innerHTML.trim()) {
        sponsorsGrid.innerHTML = loaderHtml;
    }
}

// Handle window resize
let resizeTimer;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        const nav = document.getElementById('mainNav');
        if (window.innerWidth > 768 && nav) {
            nav.classList.remove('active');
        }
    }, 250);
});

// =================================================================
// Spotlight Section
// =================================================================

// Load spotlight (only shows the latest one)
async function loadSpotlight() {
    const section = document.getElementById('spotlightSection');
    const loading = document.getElementById('spotlightLoading');
    
    if (!section) return;
    
    try {
        const { data, error } = await supabase
            .from('spotlight')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);
        
        if (error) throw error;
        
        // Hide loading skeleton
        if (loading) loading.classList.add('hidden');
        
        if (data && data.length > 0) {
            const spotlight = data[0];
            section.innerHTML = `
                <div class="spotlight-container">
                    <img src="${spotlight.image_url}" alt="Spotlight" class="spotlight-image">
                    ${spotlight.caption ? `
                    <div class="spotlight-content">
                        <div class="spotlight-caption">${spotlight.caption}</div>
                        <a href="${spotlight.link_url}" class="spotlight-btn" target="_blank" rel="noopener noreferrer">Read More</a>
                    </div>
                    ` : `
                    <div class="spotlight-content">
                        <a href="${spotlight.link_url}" class="spotlight-btn" target="_blank" rel="noopener noreferrer">Read More</a>
                    </div>
                    `}
                </div>
            `;
        } else {
            // No spotlight - hide section completely
            section.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading spotlight:', error);
        if (loading) loading.classList.add('hidden');
        section.style.display = 'none';
    }
}

// =================================================================
// Free Ads Section (Nonprofit Ads)
// =================================================================

// Load free ads (random selection)
async function loadFreeAds() {
    const section = document.getElementById('freeAdsSection');
    const loading = document.getElementById('freeAdsLoading');
    
    if (!section) return;
    
    try {
        const { data, error } = await supabase
            .from('free_ads')
            .select('*');
        
        if (error) throw error;
        
        // Hide loading skeleton
        if (loading) loading.classList.add('hidden');
        
        if (data && data.length > 0) {
            // Select random ad
            const randomAd = data[Math.floor(Math.random() * data.length)];
            renderFreeAd(section, randomAd);
        } else {
            // No ads - hide section
            section.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading free ads:', error);
        if (loading) loading.classList.add('hidden');
        section.style.display = 'none';
    }
}

// Render a free ad
function renderFreeAd(container, ad) {
    container.innerHTML = `
        <div class="free-ad-container">
            <a href="${ad.link_url}" class="free-ad-link" target="_blank" rel="noopener noreferrer">
                <img src="${ad.image_url}" alt="${ad.alt_text || ad.nonprofit_name}" class="free-ad-image">
            </a>
            <div class="free-ad-label">
                <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 7v4M8 5v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                <span>Supporting Non-profits with Free Ads</span>
                <button class="free-ad-why" onclick="toggleFreeAdDetails(this)">Why?</button>
            </div>
            <div class="free-ad-details">
                <div class="free-ad-details-inner">
                    We support nonprofits all over the world to make a better impact on the world. OpenRockets Magazine does not publish ads from commercial companies. We only feature nonprofit organizations making a difference for free.<br><br>
                    Want to feature your nonprofit? Send your inquiry to <a href="mailto:admin@openrockets.com">admin@openrockets.com</a>
                </div>
            </div>
        </div>
    `;
}

// Toggle free ad details expansion
function toggleFreeAdDetails(btn) {
    const details = btn.closest('.free-ad-container').querySelector('.free-ad-details');
    if (details.classList.contains('expanded')) {
        details.classList.remove('expanded');
        btn.textContent = 'Why?';
    } else {
        details.classList.add('expanded');
        btn.textContent = 'Hide';
    }
}

// Newsletter subscription handler
async function subscribeNewsletter(event) {
    event.preventDefault();
    
    const form = event.target;
    const emailInput = form.querySelector('input[type="email"]');
    const countrySelect = form.querySelector('select');
    const submitBtn = form.querySelector('button[type="submit"]');
    const successMsg = document.querySelector('.newsletter-success');
    const errorMsg = document.querySelector('.newsletter-error');
    
    const email = emailInput.value.trim();
    const country = countrySelect.value;
    
    // Reset messages
    if (successMsg) successMsg.classList.remove('show');
    if (errorMsg) errorMsg.classList.remove('show');
    
    // Validate
    if (!email) {
        showNewsletterError('Please enter your email address.');
        return;
    }
    
    if (!country) {
        showNewsletterError('Please select your country.');
        return;
    }
    
    // Disable button
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Subscribing...';
    
    try {
        // Check if already subscribed
        const { data: existing } = await supabase
            .from('subscribers')
            .select('id, is_active')
            .eq('email', email)
            .single();
        
        if (existing) {
            if (existing.is_active) {
                showNewsletterError('You are already subscribed!');
            } else {
                // Reactivate subscription
                await supabase
                    .from('subscribers')
                    .update({ is_active: true, country: country })
                    .eq('id', existing.id);
                showNewsletterSuccess('Welcome back! Your subscription has been reactivated.');
                form.reset();
            }
        } else {
            // New subscriber
            const { error } = await supabase
                .from('subscribers')
                .insert({
                    email: email,
                    country: country,
                    subscription_type: 'email',
                    is_active: true
                });
            
            if (error) throw error;
            
            showNewsletterSuccess('Thanks for subscribing! Stay tuned for updates.');
            form.reset();
        }
    } catch (error) {
        console.error('Subscription error:', error);
        showNewsletterError('Something went wrong. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function showNewsletterSuccess(message) {
    const successMsg = document.querySelector('.newsletter-success');
    if (successMsg) {
        successMsg.textContent = message;
        successMsg.classList.add('show');
    }
}

function showNewsletterError(message) {
    const errorMsg = document.querySelector('.newsletter-error');
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.classList.add('show');
    }
}
