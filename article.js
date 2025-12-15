// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Get article slug from URL
function getArticleSlug() {
    const path = window.location.pathname;
    // Extract slug from /p/article-slug or /p/article-slug/
    const match = path.match(/\/p\/([^\/]+)/);
    return match ? match[1] : null;
}

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
                `<li><a href="/#${cat.slug}">${cat.name}</a></li>`
            ).join('');
        } else {
            navList.innerHTML = '<li><a href="/">Home</a></li>';
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load article
async function loadArticle() {
    const slug = getArticleSlug();
    
    if (!slug) {
        document.getElementById('articleContainer').innerHTML = 
            '<p style="text-align: center; padding: 60px; color: red;">Article not found.</p>';
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('articles')
            .select(`
                *,
                categories(name, slug),
                authors(name, verified, bio)
            `)
            .eq('slug', slug)
            .eq('published', true)
            .single();
        
        if (error) throw error;
        
        if (!data) {
            document.getElementById('articleContainer').innerHTML = 
                '<p style="text-align: center; padding: 60px; color: red;">Article not found.</p>';
            return;
        }
        
        renderArticle(data);
    } catch (error) {
        console.error('Error loading article:', error);
        document.getElementById('articleContainer').innerHTML = 
            '<p style="text-align: center; padding: 60px; color: red;">Error loading article.</p>';
    }
}

// Render article
function renderArticle(article) {
    document.title = `${article.title} - OpenRockets Magazine`;
    document.getElementById('articleTitle').textContent = `${article.title} - OpenRockets Magazine`;
    
    const categoryName = article.categories?.name || 'Uncategorized';
    const authorName = article.authors?.name || 'Unknown';
    const verified = article.authors?.verified ? ' ✓' : '';
    const imageUrl = article.image_url;
    
    const container = document.getElementById('articleContainer');
    container.innerHTML = `
        <header class="article-header">
            <div class="article-category">${categoryName}</div>
            <h1 class="article-heading">${article.title}</h1>
            ${article.excerpt ? `<p class="article-excerpt">${article.excerpt}</p>` : ''}
            <div class="article-meta-header">
                <span class="article-author">By ${authorName}${verified}</span>
                <span class="divider">|</span>
                <span class="date">${formatDate(article.created_at)}</span>
            </div>
            <div class="share-buttons">
                <button class="share-btn twitter" onclick="shareOnTwitter()">Share on X</button>
                <button class="share-btn facebook" onclick="shareOnFacebook()">Share on Facebook</button>
                <button class="share-btn linkedin" onclick="shareOnLinkedIn()">Share on LinkedIn</button>
                <button class="share-btn" onclick="copyLink()">Copy Link</button>
            </div>
        </header>
        
        ${imageUrl ? `
        <div class="article-image-container">
            <img src="${imageUrl}" alt="${article.title}" class="article-featured-image">
        </div>
        ` : ''}
        
        <div class="article-body">
            ${article.content || ''}
        </div>
        
        <footer class="article-footer">
            <div class="share-buttons">
                <button class="share-btn twitter" onclick="shareOnTwitter()">Share on X</button>
                <button class="share-btn facebook" onclick="shareOnFacebook()">Share on Facebook</button>
                <button class="share-btn linkedin" onclick="shareOnLinkedIn()">Share on LinkedIn</button>
                <button class="share-btn" onclick="copyLink()">Copy Link</button>
            </div>
        </footer>
    `;
}

// Share functions
function shareOnTwitter() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(document.querySelector('.article-heading').textContent);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
}

function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

function shareOnLinkedIn() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
}

function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Link copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy link');
    });
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
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    displayCurrentDate();
    await loadCategories();
    await loadArticle();
    await loadSponsors();
    initMobileMenu();
    
    console.log('Article page loaded successfully!');
});
