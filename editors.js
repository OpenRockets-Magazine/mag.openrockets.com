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
    grid.innerHTML = '<p style="text-align: center; padding: 40px;">Loading editors...</p>';
    
    try {
        const { data, error } = await supabase
            .from('editors')
            .select('*')
            .order('name');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            grid.innerHTML = data.map(editor => {
                const initials = editor.name.split(' ').map(n => n[0]).join('').toUpperCase();
                
                return `
                    <div class="editor-card">
                        <div class="editor-photo">${initials}</div>
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
                    <div class="editor-photo">JD</div>
                    <h2 class="editor-name">Jane Doe</h2>
                    <p class="editor-role">Editor-in-Chief</p>
                    <p class="editor-bio">Jane is a seasoned journalist with over 15 years of experience covering aerospace and technology. She leads our editorial team with a commitment to rigorous, fact-based reporting.</p>
                </div>
                <div class="editor-card">
                    <div class="editor-photo">JS</div>
                    <h2 class="editor-name">John Smith</h2>
                    <p class="editor-role">Managing Editor</p>
                    <p class="editor-bio">John oversees daily operations and ensures our content meets the highest standards of quality and accuracy. He has a background in science communication.</p>
                </div>
                <div class="editor-card">
                    <div class="editor-photo">EC</div>
                    <h2 class="editor-name">Emily Chen</h2>
                    <p class="editor-role">Senior Editor</p>
                    <p class="editor-bio">Emily specializes in space policy and international cooperation. She brings a unique perspective from her work with various space agencies.</p>
                </div>
                <div class="editor-card">
                    <div class="editor-photo">MP</div>
                    <h2 class="editor-name">Michael Patterson</h2>
                    <p class="editor-role">Technology Editor</p>
                    <p class="editor-bio">Michael covers the latest developments in rocket technology and propulsion systems. He holds a degree in aerospace engineering.</p>
                </div>
                <div class="editor-card">
                    <div class="editor-photo">SR</div>
                    <h2 class="editor-name">Sarah Rodriguez</h2>
                    <p class="editor-role">Science Editor</p>
                    <p class="editor-bio">Sarah focuses on the scientific aspects of space exploration, from planetary science to astrobiology. She completed her Ph.D. in astrophysics.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading editors:', error);
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
    displayCurrentDate();
    await loadCategories();
    await loadEditors();
    await loadSponsors();
    initMobileMenu();
    
    console.log('Editors page loaded successfully!');
});
