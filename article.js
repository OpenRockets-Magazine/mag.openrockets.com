// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Get article slug from URL query parameter
function getArticleSlug() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('article');
}

// Display today's date as release date
function displayReleaseDate() {
    const dateElement = document.getElementById('currentDate');
    if (!dateElement) return;
    
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = `Release: ${today.toLocaleDateString('en-US', options)}`;
}

// Get display views - returns random 10-20 if views is 0 or null
function getDisplayViews(views) {
    if (!views || views === 0) {
        return Math.floor(Math.random() * 11) + 10; // Random 10-20
    }
    return views;
}

// Increment article views in database
async function incrementViews(articleId) {
    try {
        // First get current views
        const { data: article, error: fetchError } = await supabase
            .from('articles')
            .select('views')
            .eq('id', articleId)
            .single();
        
        if (fetchError) {
            console.error('Error fetching views:', fetchError);
            return;
        }
        
        const currentViews = article?.views || 0;
        
        // Update with incremented value
        const { error: updateError } = await supabase
            .from('articles')
            .update({ views: currentViews + 1 })
            .eq('id', articleId);
        
        if (updateError) {
            console.error('Error incrementing views:', updateError);
        }
    } catch (error) {
        console.error('Error updating views:', error);
    }
}

// Load categories for navigation
async function loadCategories() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .neq('slug', '__admin_config__') // Exclude admin config
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
        
        // Increment views
        incrementViews(data.id);
        
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
    const verified = article.authors?.verified ? ' <i class="bi bi-patch-check-fill verified-badge"></i>' : '';
    const imageUrl = article.image_url;
    const views = getDisplayViews(article.views);
    
    const container = document.getElementById('articleContainer');
    container.innerHTML = `
        <header class="article-header">
            <div class="article-category">${categoryName}</div>
            <h1 class="article-heading">${article.title}</h1>
            ${article.excerpt ? `<p class="article-excerpt">${article.excerpt}</p>` : ''}
            <div class="article-meta-header">
                <span class="article-author">${authorName}${verified}</span>
                <span class="divider">|</span>
                <span class="date">${formatDate(article.created_at)}</span>
                <span class="divider">|</span>
                <span class="views"><svg class="views-icon" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="10" width="3" height="5" rx="0.5"/><rect x="6" y="6" width="3" height="9" rx="0.5"/><rect x="11" y="2" width="3" height="13" rx="0.5"/></svg> ${views}</span>
            </div>
            <div class="share-buttons">
                <button class="share-btn twitter" onclick="shareOnTwitter()" title="Share on X"><i class="bi bi-twitter-x"></i> Share</button>
                <button class="share-btn facebook" onclick="shareOnFacebook()" title="Share on Facebook"><i class="bi bi-facebook"></i> Share</button>
                <button class="share-btn linkedin" onclick="shareOnLinkedIn()" title="Share on LinkedIn"><i class="bi bi-linkedin"></i> Share</button>
                <button class="share-btn copy" onclick="copyLink()" title="Copy Link"><i class="bi bi-link-45deg"></i> Copy</button>
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
        
        <!-- Free Ad in Article -->
        <div class="article-free-ad" id="articleFreeAd">
            <!-- Will be loaded dynamically -->
        </div>
        
        <footer class="article-footer">
            <div class="share-buttons">
                <button class="share-btn twitter" onclick="shareOnTwitter()" title="Share on X"><i class="bi bi-twitter-x"></i> Share</button>
                <button class="share-btn facebook" onclick="shareOnFacebook()" title="Share on Facebook"><i class="bi bi-facebook"></i> Share</button>
                <button class="share-btn linkedin" onclick="shareOnLinkedIn()" title="Share on LinkedIn"><i class="bi bi-linkedin"></i> Share</button>
                <button class="share-btn copy" onclick="copyLink()" title="Copy Link"><i class="bi bi-link-45deg"></i> Copy</button>
            </div>
        </footer>
    `;
    
    // Load free ad after article is rendered
    loadArticleFreeAd();
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

// =================================================================
// Free Ads for Article Page
// =================================================================

// Load free ad for article page
async function loadArticleFreeAd() {
    const container = document.getElementById('articleFreeAd');
    if (!container) return;
    
    try {
        const { data, error } = await supabase
            .from('free_ads')
            .select('*');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            // Select random ad
            const randomAd = data[Math.floor(Math.random() * data.length)];
            container.innerHTML = `
                <div class="free-ad-container">
                    <a href="${randomAd.link_url}" class="free-ad-link" target="_blank" rel="noopener noreferrer">
                        <img src="${randomAd.image_url}" alt="${randomAd.alt_text || randomAd.nonprofit_name}" class="free-ad-image">
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
        } else {
            container.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading article free ad:', error);
        container.style.display = 'none';
    }
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

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    await displayReleaseDate();
    await loadCategories();
    await loadArticle();
    await loadSponsors();
    initMobileMenu();
    
    console.log('Article page loaded successfully!');
});
