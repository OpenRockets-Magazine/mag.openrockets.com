// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Display current date
function displayCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const currentDate = new Date().toLocaleDateString('en-US', options);
    dateElement.textContent = currentDate;
}

// Load categories for navigation
async function loadCategories() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');
        
        if (error) throw error;
        
        const navList = document.getElementById('navList');
        if (data && data.length > 0) {
            navList.innerHTML = data.map(cat => 
                `<li><a href="#${cat.slug}">${cat.name}</a></li>`
            ).join('');
        } else {
            navList.innerHTML = '<li><a href="#">No categories yet</a></li>';
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load articles for homepage
async function loadArticles() {
    try {
        const { data, error } = await supabase
            .from('articles')
            .select(`
                *,
                categories(name, slug),
                authors(name, verified)
            `)
            .eq('published', true)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            renderFeaturedArticle(data[0]);
            renderSidebarArticles(data.slice(1, 4));
            renderArticleGrid(data.slice(0, 9));
        } else {
            // Show placeholder message
            document.getElementById('featuredSection').innerHTML = 
                '<p style="text-align: center; padding: 60px; color: #999;">No articles published yet. Visit the <a href="/admin.html" style="color: #0066cc;">admin panel</a> to create articles.</p>';
        }
    } catch (error) {
        console.error('Error loading articles:', error);
        document.getElementById('featuredSection').innerHTML = 
            '<p style="text-align: center; padding: 60px; color: red;">Error loading articles.</p>';
    }
}

// Render featured article
function renderFeaturedArticle(article) {
    const section = document.getElementById('featuredSection');
    const imageUrl = article.image_url || 'https://via.placeholder.com/800x500?text=No+Image';
    const categoryName = article.categories?.name || 'Uncategorized';
    const authorName = article.authors?.name || 'Unknown';
    const verified = article.authors?.verified ? ' ✓' : '';
    
    section.innerHTML = `
        <article class="featured-article">
            <a href="/p/${article.slug}">
                <img src="${imageUrl}" alt="${article.title}" class="featured-image">
            </a>
            <div class="featured-content">
                <span class="category">${categoryName}</span>
                <h2 class="featured-title">
                    <a href="/p/${article.slug}">${article.title}</a>
                </h2>
                <p class="featured-excerpt">${article.excerpt || ''}</p>
                <div class="article-meta">
                    <span class="author">By ${authorName}${verified}</span>
                    <span class="divider">|</span>
                    <span class="date">${formatDate(article.created_at)}</span>
                </div>
            </div>
        </article>
        <div class="featured-sidebar" id="sidebarArticles"></div>
    `;
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
            <h3><a href="/p/${article.slug}">${article.title}</a></h3>
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
        const imageUrl = article.image_url || 'https://via.placeholder.com/400x250?text=No+Image';
        const categoryName = article.categories?.name || 'Uncategorized';
        const authorName = article.authors?.name || 'Unknown';
        const verified = article.authors?.verified ? ' ✓' : '';
        
        return `
            <article class="grid-article">
                <a href="/p/${article.slug}">
                    <img src="${imageUrl}" alt="${article.title}" class="article-image">
                </a>
                <span class="category">${categoryName}</span>
                <h3><a href="/p/${article.slug}">${article.title}</a></h3>
                <p class="article-excerpt">${article.excerpt || ''}</p>
                <div class="article-meta">
                    <span class="author">${authorName}${verified}</span>
                    <span class="date">${formatDate(article.created_at)}</span>
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
            .limit(4);
        
        if (error) throw error;
        
        const grid = document.getElementById('sponsorsGrid');
        
        if (data && data.length > 0) {
            grid.innerHTML = data.map(sponsor => {
                const logoUrl = sponsor.logo_url || 'https://via.placeholder.com/200x80?text=' + encodeURIComponent(sponsor.name);
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
            // Default placeholder sponsors
            grid.innerHTML = `
                <div class="sponsor-item">
                    <img src="https://via.placeholder.com/200x80?text=Sponsor+1" alt="Sponsor 1">
                </div>
                <div class="sponsor-item">
                    <img src="https://via.placeholder.com/200x80?text=Sponsor+2" alt="Sponsor 2">
                </div>
                <div class="sponsor-item">
                    <img src="https://via.placeholder.com/200x80?text=Sponsor+3" alt="Sponsor 3">
                </div>
                <div class="sponsor-item">
                    <img src="https://via.placeholder.com/200x80?text=Sponsor+4" alt="Sponsor 4">
                </div>
            `;
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

// Sticky header on scroll
function initStickyHeader() {
    const header = document.querySelector('.header');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            header.style.transform = 'translateY(-100%)';
            header.style.transition = 'transform 0.3s ease';
        } else {
            // Scrolling up
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });
}

// Search functionality
function initSearch() {
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const searchTerm = prompt('Enter search term:');
            if (searchTerm) {
                alert(`Searching for: ${searchTerm}\n\nNote: Search functionality would be implemented in a future version.`);
            }
        });
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
    displayCurrentDate();
    await loadCategories();
    await loadArticles();
    await loadSponsors();
    
    initMobileMenu();
    initSmoothScroll();
    // Don't init hover effects immediately since articles are loaded async
    setTimeout(initArticleHoverEffects, 500);
    initStickyHeader();
    initSearch();
    initReadingProgress();
    
    console.log('OpenRockets Magazine loaded successfully!');
});

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
