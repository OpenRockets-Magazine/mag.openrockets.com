// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Display last release date (last time articles table was updated)
async function displayReleaseDate() {
    const dateElement = document.getElementById('currentDate');
    if (!dateElement) return;
    
    try {
        // Try updated_at first, fallback to created_at
        let { data, error } = await supabase
            .from('articles')
            .select('updated_at, created_at')
            .order('updated_at', { ascending: false })
            .limit(1);
        
        if (error) {
            // If updated_at doesn't exist, try just created_at
            const result = await supabase
                .from('articles')
                .select('created_at')
                .order('created_at', { ascending: false })
                .limit(1);
            data = result.data;
            error = result.error;
        }
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            const dateStr = data[0].updated_at || data[0].created_at;
            const lastUpdate = new Date(dateStr);
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            dateElement.textContent = `Release: ${lastUpdate.toLocaleDateString('en-US', options)}`;
        } else {
            dateElement.textContent = 'Release: —';
        }
    } catch (error) {
        console.error('Error loading release date:', error);
        dateElement.textContent = 'Release: —';
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
            // Show placeholder editors
            grid.innerHTML = `
                <div class="editor-card">
                    <div class="editor-photo"><span class="editor-initials">JD</span></div>
                    <h2 class="editor-name">Jane Doe</h2>
                    <p class="editor-role">Editor-in-Chief</p>
                    <p class="editor-bio">Jane is a seasoned journalist with over 15 years of experience covering aerospace and technology. She leads our editorial team with a commitment to rigorous, fact-based reporting.</p>
                </div>
                <div class="editor-card">
                    <div class="editor-photo"><span class="editor-initials">JS</span></div>
                    <h2 class="editor-name">John Smith</h2>
                    <p class="editor-role">Managing Editor</p>
                    <p class="editor-bio">John oversees daily operations and ensures our content meets the highest standards of quality and accuracy. He has a background in science communication.</p>
                </div>
                <div class="editor-card">
                    <div class="editor-photo"><span class="editor-initials">EC</span></div>
                    <h2 class="editor-name">Emily Chen</h2>
                    <p class="editor-role">Senior Editor</p>
                    <p class="editor-bio">Emily specializes in space policy and international cooperation. She brings a unique perspective from her work with various space agencies.</p>
                </div>
                <div class="editor-card">
                    <div class="editor-photo"><span class="editor-initials">MP</span></div>
                    <h2 class="editor-name">Michael Patterson</h2>
                    <p class="editor-role">Technology Editor</p>
                    <p class="editor-bio">Michael covers the latest developments in rocket technology and propulsion systems. He holds a degree in aerospace engineering.</p>
                </div>
                <div class="editor-card">
                    <div class="editor-photo"><span class="editor-initials">SR</span></div>
                    <h2 class="editor-name">Sarah Rodriguez</h2>
                    <p class="editor-role">Science Editor</p>
                    <p class="editor-bio">Sarah focuses on the scientific aspects of space exploration, from planetary science to astrobiology. She completed her Ph.D. in astrophysics.</p>
                </div>
            `;
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
    await loadSponsors();
    initMobileMenu();
    
    console.log('Editors page loaded successfully!');
});
