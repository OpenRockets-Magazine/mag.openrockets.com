// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Display today's date as release date
function displayReleaseDate() {
    const dateElement = document.getElementById('currentDate');
    if (!dateElement) return;
    
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = `Release: ${today.toLocaleDateString('en-US', options)}`;
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

// Load editors
async function loadEditors() {
    const grid = document.getElementById('editorsGrid');
    const loadingSkeleton = document.getElementById('editorsLoading');
    
    try {
        const { data, error } = await supabase
            .from('editors')
            .select('*')
            .order('name');
        
        if (error) throw error;
        
        // Hide loading skeleton
        if (loadingSkeleton) {
            loadingSkeleton.classList.add('hidden');
        }
        
        if (data && data.length > 0) {
            grid.innerHTML = data.map(editor => {
                // Safely get initials with validation
                const nameParts = editor.name.trim().split(/\s+/).filter(part => part.length > 0);
                const initials = nameParts.map(n => n[0]).join('').toUpperCase().substring(0, 3);
                
                // Check if editor has a photo URL
                const photoContent = editor.photo_url 
                    ? `<img src="${editor.photo_url}" alt="${editor.name}" class="editor-photo-img">`
                    : `<span class="editor-initials">${initials || '?'}</span>`;
                
                return `
                    <div class="editor-card">
                        <div class="editor-photo">${photoContent}</div>
                        <h2 class="editor-name">${editor.name}</h2>
                        <p class="editor-role">${editor.role}</p>
                        <p class="editor-bio">${editor.bio || ''}</p>
                    </div>
                `;
            }).join('');
        } else {
            // No editors in database - show message
            grid.innerHTML = '<p style="text-align: center; color: #666; padding: 60px 20px; font-family: Ubuntu, sans-serif;">No editors have been added yet. Add editors through the admin panel.</p>';
        }
    } catch (error) {
        console.error('Error loading editors:', error);
        // Hide loading skeleton even on error
        const loadingSkeleton = document.getElementById('editorsLoading');
        if (loadingSkeleton) {
            loadingSkeleton.classList.add('hidden');
        }
        grid.innerHTML = '<p style="text-align: center; color: red; padding: 40px;">Error loading editors.</p>';
    }
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

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    // Force scroll to top immediately to show skeleton loaders
    window.scrollTo(0, 0);
    
    // Disable browser scroll restoration
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    
    displayReleaseDate();
    await loadCategories();
    await loadEditors();
    await loadFreeAds();
    await loadSponsors();
    initMobileMenu();
    
    console.log('Editors page loaded successfully!');
});
