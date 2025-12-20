// Initialize Supabase client
if (typeof supabase === 'undefined' || typeof supabase.from !== 'function') {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        var supabase = null;
    }
}

// Admin credentials (will be fetched from database)
let ADMIN_CREDENTIALS = null;

// Invitation data from URL
let invitationData = null;

// Current user session
let currentUser = {
    type: null,         // 'admin' or 'author'
    id: null,           // author ID if type is 'author'
    name: null,         // author name if type is 'author'
    verified: false,    // author verified status
    email: null
};

// ===== INVITATION SYSTEM =====

// Check for invitation link on page load
async function checkInvitationLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteData = urlParams.get('invite');
    
    if (!inviteData) return false;
    
    try {
        // Decode the invitation data
        const decoded = JSON.parse(atob(inviteData));
        
        if (!decoded.email || !decoded.password) {
            console.error('Invalid invitation data');
            return false;
        }
        
        // Fetch author details from database
        const { data: author, error } = await supabase
            .from('authors')
            .select('*')
            .eq('email', decoded.email)
            .single();
        
        if (error || !author) {
            console.error('Author not found for invitation');
            return false;
        }
        
        // Verify the password matches
        const storedPassword = atob(author.password || '');
        if (storedPassword !== decoded.password) {
            console.error('Invitation credentials mismatch');
            return false;
        }
        
        // Store invitation data
        invitationData = {
            email: decoded.email,
            password: decoded.password,
            authorName: author.name,
            verified: author.verified,
            bio: author.bio
        };
        
        // Pre-fill login form
        document.getElementById('loginEmail').value = decoded.email;
        document.getElementById('loginPassword').value = decoded.password;
        
        // Show invitation overlay
        showInvitationOverlay(invitationData);
        
        // Clear the URL parameters without refreshing
        window.history.replaceState({}, document.title, window.location.pathname);
        
        return true;
    } catch (error) {
        console.error('Error processing invitation:', error);
        return false;
    }
}

// Show the invitation welcome overlay
function showInvitationOverlay(data) {
    const overlay = document.getElementById('invitationOverlay');
    const authorNameEl = document.getElementById('invAuthorName');
    const verifiedBadge = document.getElementById('invVerifiedBadge');
    const verifiedMessage = document.getElementById('invVerifiedMessage');
    
    // Set author name
    authorNameEl.textContent = data.authorName;
    
    // Show verified badge if applicable
    if (data.verified) {
        verifiedBadge.style.display = 'inline-flex';
        verifiedMessage.style.display = 'block';
    } else {
        verifiedBadge.style.display = 'none';
        verifiedMessage.style.display = 'none';
    }
    
    // Show overlay
    overlay.style.display = 'flex';
    
    // Trigger login when button clicked
    document.getElementById('invitationLoginBtn').onclick = () => {
        overlay.style.display = 'none';
        // Submit the pre-filled login form
        document.getElementById('loginForm').dispatchEvent(new Event('submit'));
    };
}

// Generate invitation link for an author
function generateInvitationLink(email, password) {
    const inviteData = btoa(JSON.stringify({ email, password }));
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?invite=${inviteData}`;
}

// Copy invitation link to clipboard
async function copyInvitationLink() {
    const email = document.getElementById('authorEmail').value.trim();
    const password = document.getElementById('authorPassword').value;
    const authorId = document.getElementById('authorId').value;
    
    if (!email) {
        alert('Please enter an email for the author first.');
        return;
    }
    
    let passwordToUse = password;
    
    // If editing an existing author without entering new password, get from database
    if (authorId && !password) {
        try {
            const { data, error } = await supabase
                .from('authors')
                .select('password')
                .eq('id', authorId)
                .single();
            
            if (error || !data || !data.password) {
                alert('Please set a password for this author first.');
                return;
            }
            
            passwordToUse = atob(data.password);
        } catch (error) {
            alert('Error fetching author password.');
            return;
        }
    }
    
    if (!passwordToUse) {
        alert('Please enter a password for the author.');
        return;
    }
    
    const link = generateInvitationLink(email, passwordToUse);
    
    try {
        await navigator.clipboard.writeText(link);
        const btn = document.getElementById('copyInvitationBtn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check-lg"></i> Copied!';
        btn.classList.add('copied');
        
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.classList.remove('copied');
        }, 2000);
    } catch (error) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = link;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Invitation link copied to clipboard!');
    }
}

// Initialize copy button
document.getElementById('copyInvitationBtn')?.addEventListener('click', copyInvitationLink);

// Show/hide copy invitation button based on email field
function updateInvitationButtonVisibility() {
    const emailField = document.getElementById('authorEmail');
    const copyBtn = document.getElementById('copyInvitationBtn');
    const authorId = document.getElementById('authorId').value;
    
    if (copyBtn) {
        // Show button when editing existing author with email OR when email is entered
        if ((authorId && emailField.value.trim()) || emailField.value.trim()) {
            copyBtn.style.display = 'inline-flex';
        } else {
            copyBtn.style.display = 'none';
        }
    }
}

// Listen for changes to email field
document.getElementById('authorEmail')?.addEventListener('input', updateInvitationButtonVisibility);

// Bluesky credentials
const BLUESKY_CONFIG = {
    identifier: 'openrocketsmag.bsky.social',
    appPassword: 'htsx-gpgu-uzft-gal3'
};

// Post to Bluesky
async function postToBluesky(title, excerpt, articleUrl) {
    try {
        // Create session (login)
        const loginResponse = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identifier: BLUESKY_CONFIG.identifier,
                password: BLUESKY_CONFIG.appPassword
            })
        });
        
        if (!loginResponse.ok) {
            console.error('Bluesky login failed');
            return false;
        }
        
        const session = await loginResponse.json();
        
        // Create post text
        const postText = `📰 ${title}\n\n${excerpt ? excerpt.substring(0, 200) + '...' : ''}\n\n🔗 ${articleUrl}`;
        
        // Detect link facets for rich text
        const linkStart = postText.indexOf(articleUrl);
        const linkEnd = linkStart + articleUrl.length;
        
        // Convert to byte positions (UTF-8)
        const encoder = new TextEncoder();
        const textBytes = encoder.encode(postText);
        const beforeLink = encoder.encode(postText.substring(0, linkStart));
        const linkBytes = encoder.encode(articleUrl);
        
        // Create post
        const postResponse = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.accessJwt}`
            },
            body: JSON.stringify({
                repo: session.did,
                collection: 'app.bsky.feed.post',
                record: {
                    text: postText,
                    facets: [{
                        index: {
                            byteStart: beforeLink.length,
                            byteEnd: beforeLink.length + linkBytes.length
                        },
                        features: [{
                            $type: 'app.bsky.richtext.facet#link',
                            uri: articleUrl
                        }]
                    }],
                    createdAt: new Date().toISOString()
                }
            })
        });
        
        if (postResponse.ok) {
            console.log('Posted to Bluesky successfully!');
            return true;
        } else {
            const error = await postResponse.json();
            console.error('Bluesky post failed:', error);
            return false;
        }
    } catch (error) {
        console.error('Error posting to Bluesky:', error);
        return false;
    }
}

// Fetch admin credentials from database
async function fetchAdminCredentials() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('name')
            .eq('slug', '__admin_config__')
            .single();
        
        if (error || !data) {
            console.error('Admin config not found. Please run setup.html first.');
            return null;
        }
        
        // Decode the credentials
        const decoded = JSON.parse(atob(data.name));
        return decoded;
    } catch (error) {
        console.error('Error fetching admin credentials:', error);
        return null;
    }
}

// Check if logged in
async function checkAuth() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    const userType = localStorage.getItem('userType');
    const authorId = localStorage.getItem('authorId');
    const authorName = localStorage.getItem('authorName');
    const authorVerified = localStorage.getItem('authorVerified') === 'true';
    
    if (isLoggedIn === 'true') {
        currentUser.type = userType || 'admin';
        if (userType === 'author') {
            currentUser.id = authorId;
            currentUser.name = authorName;
            currentUser.verified = authorVerified;
        }
        showDashboard();
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'flex';
    
    // Apply role-based UI restrictions
    applyRoleRestrictions();
    
    loadAllData();
}

// Apply role-based UI restrictions
function applyRoleRestrictions() {
    const isAdmin = currentUser.type === 'admin';
    const isVerifiedAuthor = currentUser.type === 'author' && currentUser.verified;
    
    // Update sidebar header for authors
    const sidebarHeader = document.querySelector('.sidebar-header h2');
    if (currentUser.type === 'author') {
        const verifiedBadge = currentUser.verified 
            ? '<svg style="width: 14px; height: 14px; fill: #1DA1F2; vertical-align: middle; margin-left: 4px;" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>'
            : '';
        sidebarHeader.innerHTML = `Author Panel<br><span style="font-size: 13px; font-family: 'Ubuntu', sans-serif; opacity: 0.85; font-weight: 400;">${currentUser.name}${verifiedBadge}</span>`;
    } else {
        sidebarHeader.textContent = 'Admin Panel';
    }
    
    // Hide/show nav buttons based on role
    document.querySelectorAll('.nav-btn[data-role="admin-only"]').forEach(btn => {
        btn.style.display = isAdmin ? 'block' : 'none';
    });
    
    document.querySelectorAll('.nav-btn[data-role="verified-author"]').forEach(btn => {
        btn.style.display = (isAdmin || isVerifiedAuthor) ? 'block' : 'none';
    });
    
    // Show author welcome message
    const authorWelcome = document.getElementById('authorWelcome');
    const verifiedNote = document.getElementById('verifiedNote');
    if (currentUser.type === 'author' && authorWelcome) {
        authorWelcome.style.display = 'block';
        if (verifiedNote) {
            verifiedNote.textContent = currentUser.verified 
                ? 'As a verified author, you can also create Spotlights and Free Ads!'
                : 'Contact the admin to get verified for additional features.';
        }
    } else if (authorWelcome) {
        authorWelcome.style.display = 'none';
    }
}

// Check if current user can edit/delete articles
function canEditArticles() {
    return currentUser.type === 'admin';
}

// Check if current user can create spotlights/free ads
function canCreateSpotlightAndAds() {
    return currentUser.type === 'admin' || (currentUser.type === 'author' && currentUser.verified);
}

// Login handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    
    // First, try admin credentials
    const adminCreds = await fetchAdminCredentials();
    
    if (adminCreds && email === adminCreds.email && password === adminCreds.password) {
        // Admin login successful
        currentUser = { type: 'admin', id: null, name: 'Administrator', verified: true, email: email };
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('userType', 'admin');
        localStorage.removeItem('authorId');
        localStorage.removeItem('authorName');
        localStorage.removeItem('authorVerified');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
        showDashboard();
        return;
    }
    
    // Try author credentials
    const author = await checkAuthorCredentials(email, password);
    
    if (author) {
        // Author login successful
        currentUser = { 
            type: 'author', 
            id: author.id, 
            name: author.name, 
            verified: author.verified,
            email: email 
        };
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('userType', 'author');
        localStorage.setItem('authorId', author.id);
        localStorage.setItem('authorName', author.name);
        localStorage.setItem('authorVerified', author.verified.toString());
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
        showDashboard();
        return;
    }
    
    // Neither admin nor author
    alert('Invalid credentials!');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Login';
});

// Check author credentials
async function checkAuthorCredentials(email, password) {
    try {
        const { data, error } = await supabase
            .from('authors')
            .select('id, name, verified, email, password')
            .eq('email', email)
            .single();
        
        if (error || !data) return null;
        
        // Password is stored as base64
        const storedPassword = atob(data.password || '');
        
        if (storedPassword === password) {
            return { id: data.id, name: data.name, verified: data.verified };
        }
        
        return null;
    } catch (error) {
        console.error('Error checking author credentials:', error);
        return null;
    }
}

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('userType');
    localStorage.removeItem('authorId');
    localStorage.removeItem('authorName');
    localStorage.removeItem('authorVerified');
    currentUser = { type: null, id: null, name: null, verified: false, email: null };
    showLogin();
});

// Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const section = btn.dataset.section;
        
        // Update active nav button
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update active section
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        document.getElementById(section).classList.add('active');
        
        // Load data for the section
        loadSectionData(section);
    });
});

// Load all data
async function loadAllData() {
    await loadArticles();
    await loadSpotlight();
    await loadFreeAds();
    await loadCategories();
    await loadAuthors();
    await loadEditors();
    await loadSponsors();
}

// Load section data
async function loadSectionData(section) {
    switch(section) {
        case 'articles':
            await loadArticles();
            break;
        case 'spotlight':
            await loadSpotlight();
            break;
        case 'freeads':
            await loadFreeAds();
            break;
        case 'categories':
            await loadCategories();
            break;
        case 'authors':
            await loadAuthors();
            break;
        case 'editors':
            await loadEditors();
            break;
        case 'sponsors':
            await loadSponsors();
            break;
    }
}

// Utility function to create slug
function createSlug(text, addUniqueSuffix = false) {
    let slug = text.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    
    if (addUniqueSuffix) {
        slug += '-' + Date.now().toString(36);
    }
    return slug;
}

// Image to Data URL converter with validation
function imageToDataURL(file) {
    return new Promise((resolve, reject) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            reject(new Error('File must be an image'));
            return;
        }
        
        // Validate file size (max 1MB)
        if (file.size > 1024 * 1024) {
            reject(new Error('Image must be less than 1MB'));
            return;
        }
        
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ===== ARTICLES =====
let allCategories = [];
let allAuthors = [];

async function loadArticles() {
    const tbody = document.querySelector('#articlesTable tbody');
    tbody.innerHTML = '<tr><td colspan="5" class="loading">Loading articles</td></tr>';
    
    try {
        const { data, error } = await supabase
            .from('articles')
            .select(`
                *,
                categories(name),
                authors(name)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">No articles yet. Create your first article!</td></tr>';
            return;
        }
        
        // Check if user can edit/delete
        const canEdit = canEditArticles();
        
        tbody.innerHTML = data.map(article => `
            <tr>
                <td><strong>${article.title}</strong></td>
                <td>${article.categories?.name || 'N/A'}</td>
                <td>${article.authors?.name || 'N/A'}</td>
                <td>${new Date(article.created_at).toLocaleDateString()}</td>
                <td>
                    ${canEdit ? `
                        <button class="btn-edit" data-action="edit" data-type="article" data-id="${article.id}">Edit</button>
                        <button class="btn-danger" data-action="delete" data-type="article" data-id="${article.id}">Delete</button>
                    ` : `
                        <span style="color: #999; font-size: 12px;">View only</span>
                    `}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading articles:', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Error loading articles</td></tr>';
    }
}

// New Article button
document.getElementById('newArticleBtn').addEventListener('click', async () => {
    // Load categories and authors first
    await Promise.all([loadCategoriesForSelect(), loadAuthorsForSelect()]);
    
    document.getElementById('articleModalTitle').textContent = 'New Article';
    document.getElementById('articleForm').reset();
    document.getElementById('articleId').value = '';
    resetEditor(); // Reset the rich text editor
    
    // Reset date selection to today
    document.querySelector('input[name="dateOption"][value="today"]').checked = true;
    document.getElementById('articleCustomDate').disabled = true;
    document.getElementById('articleCustomDate').value = '';
    
    // For author users, auto-select and lock their author
    if (currentUser.type === 'author' && currentUser.id) {
        const authorSelect = document.getElementById('articleAuthor');
        authorSelect.value = currentUser.id;
        authorSelect.disabled = true; // Authors can only post as themselves
    } else {
        document.getElementById('articleAuthor').disabled = false;
    }
    
    openModal('articleModal');
});

async function loadCategoriesForSelect() {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .neq('slug', '__admin_config__') // Exclude admin config
        .order('name');
    if (!error && data) {
        allCategories = data;
        const select = document.getElementById('articleCategory');
        select.innerHTML = '<option value="">Select Category</option>' + 
            data.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
    }
}

async function loadAuthorsForSelect() {
    const { data, error } = await supabase.from('authors').select('*').order('name');
    if (!error && data) {
        allAuthors = data;
        const select = document.getElementById('articleAuthor');
        select.innerHTML = '<option value="">Select Author</option>' + 
            data.map(author => `<option value="${author.id}">${author.name}${author.verified ? ' (Verified)' : ''}</option>`).join('');
    }
}

async function editArticle(id) {
    await Promise.all([loadCategoriesForSelect(), loadAuthorsForSelect()]);
    
    try {
        const { data, error } = await supabase
            .from('articles')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        document.getElementById('articleModalTitle').textContent = 'Edit Article';
        document.getElementById('articleId').value = data.id;
        document.getElementById('articleTitle').value = data.title;
        document.getElementById('articleCategory').value = data.category_id;
        document.getElementById('articleAuthor').value = data.author_id;
        document.getElementById('articleExcerpt').value = data.excerpt || '';
        document.getElementById('articleImage').value = data.image_url || '';
        setEditorContent(data.content || ''); // Use rich text editor
        
        // Set date selection
        if (data.created_at) {
            const articleDate = new Date(data.created_at).toISOString().split('T')[0];
            const todayDate = new Date().toISOString().split('T')[0];
            
            if (articleDate !== todayDate) {
                document.querySelector('input[name="dateOption"][value="custom"]').checked = true;
                const customDateInput = document.getElementById('articleCustomDate');
                customDateInput.disabled = false;
                customDateInput.value = articleDate;
                // Set min/max dates
                const today = new Date();
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                customDateInput.max = today.toISOString().split('T')[0];
                customDateInput.min = sixMonthsAgo.toISOString().split('T')[0];
            } else {
                document.querySelector('input[name="dateOption"][value="today"]').checked = true;
                document.getElementById('articleCustomDate').disabled = true;
            }
        } else {
            document.querySelector('input[name="dateOption"][value="today"]').checked = true;
            document.getElementById('articleCustomDate').disabled = true;
        }
        
        openModal('articleModal');
    } catch (error) {
        console.error('Error loading article:', error);
        alert('Error loading article');
    }
}

async function deleteArticle(id) {
    // Only admin can delete
    if (currentUser.type !== 'admin') {
        alert('You do not have permission to delete articles.');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this article?')) return;
    
    try {
        const { error } = await supabase.from('articles').delete().eq('id', id);
        if (error) throw error;
        await loadArticles();
        alert('Article deleted successfully!');
    } catch (error) {
        console.error('Error deleting article:', error);
        alert('Error deleting article');
    }
}

// Handle image upload
document.getElementById('articleImageFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            const dataURL = await imageToDataURL(file);
            document.getElementById('articleImage').value = dataURL;
        } catch (error) {
            console.error('Error converting image:', error);
            alert('Error processing image');
        }
    }
});

// Date selection - enable/disable custom date picker
document.querySelectorAll('input[name="dateOption"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const customDateInput = document.getElementById('articleCustomDate');
        if (e.target.value === 'custom') {
            customDateInput.disabled = false;
            // Set min/max dates (past 6 months to today)
            const today = new Date();
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            customDateInput.max = today.toISOString().split('T')[0];
            customDateInput.min = sixMonthsAgo.toISOString().split('T')[0];
            // Default to today if empty
            if (!customDateInput.value) {
                customDateInput.value = today.toISOString().split('T')[0];
            }
        } else {
            customDateInput.disabled = true;
        }
    });
});

document.getElementById('articleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('articleId').value;
    const title = document.getElementById('articleTitle').value;
    const slug = createSlug(title, !id); // Add unique suffix only for new articles
    const categoryId = document.getElementById('articleCategory').value;
    
    // For author users, force their own author ID
    let authorId = document.getElementById('articleAuthor').value;
    if (currentUser.type === 'author' && currentUser.id) {
        authorId = currentUser.id;
    }
    
    const excerpt = document.getElementById('articleExcerpt').value;
    const imageUrl = document.getElementById('articleImage').value;
    const content = getEditorContent(); // Get content from rich text editor
    
    // Validate content
    if (!content || content === '<br>' || content.trim() === '') {
        alert('Please enter article content');
        return;
    }
    
    const articleData = {
        title,
        slug,
        category_id: categoryId,
        author_id: authorId,
        excerpt,
        image_url: imageUrl,
        content,
        published: true
    };
    
    // Handle custom date
    const dateOption = document.querySelector('input[name="dateOption"]:checked').value;
    if (dateOption === 'custom') {
        const customDate = document.getElementById('articleCustomDate').value;
        if (customDate) {
            articleData.created_at = new Date(customDate).toISOString();
        }
    }
    
    try {
        if (id) {
            // Update existing article - only admin can do this
            if (currentUser.type !== 'admin') {
                alert('You do not have permission to edit articles.');
                return;
            }
            const { error } = await supabase
                .from('articles')
                .update(articleData)
                .eq('id', id);
            if (error) throw error;
        } else {
            // Create new article
            const { error } = await supabase
                .from('articles')
                .insert([articleData]);
            if (error) throw error;
            
            // Post to Bluesky for new articles (if checkbox is checked)
            const postToBlueskyCheckbox = document.getElementById('postToBluesky');
            if (postToBlueskyCheckbox && postToBlueskyCheckbox.checked) {
                const articleUrl = `https://mag.openrockets.com/p/?article=${slug}`;
                const blueskyPosted = await postToBluesky(title, excerpt, articleUrl);
                if (blueskyPosted) {
                    alert('Article saved and shared on Bluesky!');
                } else {
                    alert('Article saved! (Bluesky post failed - check console)');
                }
            } else {
                alert('Article saved successfully!');
            }
        }
        
        closeModal('articleModal');
        await loadArticles();
        if (id) alert('Article updated successfully!');
    } catch (error) {
        console.error('Error saving article:', error);
        alert('Error saving article: ' + error.message);
    }
});

// ===== CATEGORIES =====
async function loadCategories() {
    const tbody = document.querySelector('#categoriesTable tbody');
    tbody.innerHTML = '<tr><td colspan="3" class="loading">Loading categories</td></tr>';
    
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .neq('slug', '__admin_config__') // Exclude admin config
            .order('name');
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 40px; color: #999;">No categories yet. Create your first category!</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(category => `
            <tr>
                <td><strong>${category.name}</strong></td>
                <td>${category.slug}</td>
                <td>
                    <button class="btn-edit" data-action="edit" data-type="category" data-id="${category.id}">Edit</button>
                    <button class="btn-danger" data-action="delete" data-type="category" data-id="${category.id}">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: red;">Error loading categories</td></tr>';
    }
}

document.getElementById('newCategoryBtn').addEventListener('click', () => {
    document.getElementById('categoryModalTitle').textContent = 'New Category';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    openModal('categoryModal');
});

// Auto-generate slug from name
document.getElementById('categoryName').addEventListener('input', (e) => {
    if (!document.getElementById('categoryId').value) {
        document.getElementById('categorySlug').value = createSlug(e.target.value);
    }
});

async function editCategory(id) {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        document.getElementById('categoryModalTitle').textContent = 'Edit Category';
        document.getElementById('categoryId').value = data.id;
        document.getElementById('categoryName').value = data.name;
        document.getElementById('categorySlug').value = data.slug;
        
        openModal('categoryModal');
    } catch (error) {
        console.error('Error loading category:', error);
        alert('Error loading category');
    }
}

async function deleteCategory(id) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        await loadCategories();
        alert('Category deleted successfully!');
    } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category');
    }
}

document.getElementById('categoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('categoryId').value;
    const name = document.getElementById('categoryName').value;
    const slug = document.getElementById('categorySlug').value;
    
    const categoryData = { name, slug };
    
    try {
        if (id) {
            const { error } = await supabase
                .from('categories')
                .update(categoryData)
                .eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('categories')
                .insert([categoryData]);
            if (error) throw error;
        }
        
        closeModal('categoryModal');
        await loadCategories();
        alert('Category saved successfully!');
    } catch (error) {
        console.error('Error saving category:', error);
        alert('Error saving category: ' + error.message);
    }
});

// ===== AUTHORS =====
async function loadAuthors() {
    const tbody = document.querySelector('#authorsTable tbody');
    tbody.innerHTML = '<tr><td colspan="5" class="loading">Loading authors</td></tr>';
    
    try {
        const { data, error } = await supabase
            .from('authors')
            .select('*')
            .order('name');
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">No authors yet. Create your first author!</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(author => {
            const hasLogin = author.email && author.password;
            return `
                <tr>
                    <td><strong>${author.name}</strong></td>
                    <td>${author.verified ? '<span class="verified-badge"><i class="bi bi-patch-check-fill"></i></span>' : '-'}</td>
                    <td>${hasLogin ? `<span style="color: #28a745;"><i class="bi bi-key-fill"></i> ${author.email}</span>` : '<span style="color: #999;">No login</span>'}</td>
                    <td>${author.bio ? author.bio.substring(0, 80) + '...' : '-'}</td>
                    <td>
                        ${hasLogin ? `<button class="btn-invite" data-action="invite" data-email="${author.email}" data-password="${author.password}" title="Copy invitation link"><i class="bi bi-link-45deg"></i></button>` : ''}
                        <button class="btn-edit" data-action="edit" data-type="author" data-id="${author.id}">Edit</button>
                        <button class="btn-danger" data-action="delete" data-type="author" data-id="${author.id}">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading authors:', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Error loading authors</td></tr>';
    }
}

document.getElementById('newAuthorBtn').addEventListener('click', () => {
    document.getElementById('authorModalTitle').textContent = 'New Author';
    document.getElementById('authorForm').reset();
    document.getElementById('authorId').value = '';
    document.getElementById('authorEmail').value = '';
    document.getElementById('authorPassword').value = '';
    // Hide copy button for new authors
    const copyBtn = document.getElementById('copyInvitationBtn');
    if (copyBtn) copyBtn.style.display = 'none';
    openModal('authorModal');
});

async function editAuthor(id) {
    try {
        const { data, error } = await supabase
            .from('authors')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        document.getElementById('authorModalTitle').textContent = 'Edit Author';
        document.getElementById('authorId').value = data.id;
        document.getElementById('authorName').value = data.name;
        document.getElementById('authorBio').value = data.bio || '';
        document.getElementById('authorVerified').checked = data.verified || false;
        document.getElementById('authorEmail').value = data.email || '';
        document.getElementById('authorPassword').value = ''; // Don't show password, leave blank to keep current
        
        // Show copy invitation button if author has login credentials
        const copyBtn = document.getElementById('copyInvitationBtn');
        if (copyBtn) {
            copyBtn.style.display = (data.email && data.password) ? 'inline-flex' : 'none';
        }
        
        openModal('authorModal');
    } catch (error) {
        console.error('Error loading author:', error);
        alert('Error loading author');
    }
}

async function deleteAuthor(id) {
    if (!confirm('Are you sure you want to delete this author?')) return;
    
    try {
        const { error } = await supabase.from('authors').delete().eq('id', id);
        if (error) throw error;
        await loadAuthors();
        alert('Author deleted successfully!');
    } catch (error) {
        console.error('Error deleting author:', error);
        alert('Error deleting author');
    }
}

document.getElementById('authorForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('authorId').value;
    const name = document.getElementById('authorName').value;
    const bio = document.getElementById('authorBio').value;
    const verified = document.getElementById('authorVerified').checked;
    const email = document.getElementById('authorEmail').value.trim();
    const password = document.getElementById('authorPassword').value;
    
    const authorData = { name, bio, verified };
    
    // Add email if provided
    if (email) {
        authorData.email = email;
    }
    
    // Add password if provided (store as base64)
    if (password) {
        authorData.password = btoa(password);
    }
    
    try {
        if (id) {
            const { error } = await supabase
                .from('authors')
                .update(authorData)
                .eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('authors')
                .insert([authorData]);
            if (error) throw error;
        }
        
        closeModal('authorModal');
        await loadAuthors();
        alert('Author saved successfully!');
    } catch (error) {
        console.error('Error saving author:', error);
        alert('Error saving author: ' + error.message);
    }
});

// ===== EDITORS =====
async function loadEditors() {
    const tbody = document.querySelector('#editorsTable tbody');
    tbody.innerHTML = '<tr><td colspan="4" class="loading">Loading editors</td></tr>';
    
    try {
        const { data, error } = await supabase
            .from('editors')
            .select('*')
            .order('name');
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #999;">No editors yet. Create your first editor!</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(editor => `
            <tr>
                <td><strong>${editor.name}</strong></td>
                <td>${editor.role}</td>
                <td>${editor.bio ? editor.bio.substring(0, 100) + '...' : '-'}</td>
                <td>
                    <button class="btn-edit" data-action="edit" data-type="editor" data-id="${editor.id}">Edit</button>
                    <button class="btn-danger" data-action="delete" data-type="editor" data-id="${editor.id}">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading editors:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Error loading editors</td></tr>';
    }
}

document.getElementById('newEditorBtn').addEventListener('click', () => {
    document.getElementById('editorModalTitle').textContent = 'New Editor';
    document.getElementById('editorForm').reset();
    document.getElementById('editorId').value = '';
    document.getElementById('editorPhoto').value = '';
    openModal('editorModal');
});

// Handle editor photo upload
document.getElementById('editorPhotoFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            const dataURL = await imageToDataURL(file);
            document.getElementById('editorPhoto').value = dataURL;
        } catch (error) {
            console.error('Error converting image:', error);
            alert('Error processing image: ' + error.message);
        }
    }
});

async function editEditor(id) {
    try {
        const { data, error } = await supabase
            .from('editors')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        document.getElementById('editorModalTitle').textContent = 'Edit Editor';
        document.getElementById('editorId').value = data.id;
        document.getElementById('editorName').value = data.name;
        document.getElementById('editorRole').value = data.role;
        document.getElementById('editorPhoto').value = data.photo_url || '';
        document.getElementById('editorBio').value = data.bio || '';
        
        openModal('editorModal');
    } catch (error) {
        console.error('Error loading editor:', error);
        alert('Error loading editor');
    }
}

async function deleteEditor(id) {
    if (!confirm('Are you sure you want to delete this editor?')) return;
    
    try {
        const { error } = await supabase.from('editors').delete().eq('id', id);
        if (error) throw error;
        await loadEditors();
        alert('Editor deleted successfully!');
    } catch (error) {
        console.error('Error deleting editor:', error);
        alert('Error deleting editor');
    }
}

document.getElementById('editorForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('editorId').value;
    const name = document.getElementById('editorName').value;
    const role = document.getElementById('editorRole').value;
    const photoUrl = document.getElementById('editorPhoto').value;
    const bio = document.getElementById('editorBio').value;
    
    // Build editor data - only include photo_url if column exists in DB
    const editorData = { name, role, bio };
    if (photoUrl) {
        editorData.photo_url = photoUrl;
    }
    
    try {
        if (id) {
            const { error } = await supabase
                .from('editors')
                .update(editorData)
                .eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('editors')
                .insert([editorData]);
            if (error) throw error;
        }
        
        closeModal('editorModal');
        await loadEditors();
        alert('Editor saved successfully!');
    } catch (error) {
        console.error('Error saving editor:', error);
        alert('Error saving editor: ' + error.message);
    }
});

// ===== SPONSORS =====
async function loadSponsors() {
    const tbody = document.querySelector('#sponsorsTable tbody');
    tbody.innerHTML = '<tr><td colspan="4" class="loading">Loading sponsors</td></tr>';
    
    try {
        const { data, error } = await supabase
            .from('sponsors')
            .select('*')
            .order('name');
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #999;">No sponsors yet. Create your first sponsor!</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(sponsor => `
            <tr>
                <td><strong>${sponsor.name}</strong></td>
                <td>${sponsor.logo_url ? '<img src="' + sponsor.logo_url + '" style="height: 30px; width: auto;">' : '-'}</td>
                <td>${sponsor.url || '-'}</td>
                <td>
                    <button class="btn-edit" data-action="edit" data-type="sponsor" data-id="${sponsor.id}">Edit</button>
                    <button class="btn-danger" data-action="delete" data-type="sponsor" data-id="${sponsor.id}">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading sponsors:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Error loading sponsors</td></tr>';
    }
}

document.getElementById('newSponsorBtn').addEventListener('click', () => {
    document.getElementById('sponsorModalTitle').textContent = 'New Sponsor';
    document.getElementById('sponsorForm').reset();
    document.getElementById('sponsorId').value = '';
    openModal('sponsorModal');
});

// Handle sponsor logo upload
document.getElementById('sponsorLogoFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            const dataURL = await imageToDataURL(file);
            document.getElementById('sponsorLogo').value = dataURL;
        } catch (error) {
            console.error('Error converting image:', error);
            alert('Error processing image');
        }
    }
});

async function editSponsor(id) {
    try {
        const { data, error } = await supabase
            .from('sponsors')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        document.getElementById('sponsorModalTitle').textContent = 'Edit Sponsor';
        document.getElementById('sponsorId').value = data.id;
        document.getElementById('sponsorName').value = data.name;
        document.getElementById('sponsorLogo').value = data.logo_url || '';
        document.getElementById('sponsorUrl').value = data.url || '';
        
        openModal('sponsorModal');
    } catch (error) {
        console.error('Error loading sponsor:', error);
        alert('Error loading sponsor');
    }
}

async function deleteSponsor(id) {
    if (!confirm('Are you sure you want to delete this sponsor?')) return;
    
    try {
        const { error } = await supabase.from('sponsors').delete().eq('id', id);
        if (error) throw error;
        await loadSponsors();
        alert('Sponsor deleted successfully!');
    } catch (error) {
        console.error('Error deleting sponsor:', error);
        alert('Error deleting sponsor');
    }
}

document.getElementById('sponsorForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('sponsorId').value;
    const name = document.getElementById('sponsorName').value;
    const logoUrl = document.getElementById('sponsorLogo').value;
    const url = document.getElementById('sponsorUrl').value;
    
    const sponsorData = { name, logo_url: logoUrl, url };
    
    try {
        if (id) {
            const { error } = await supabase
                .from('sponsors')
                .update(sponsorData)
                .eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('sponsors')
                .insert([sponsorData]);
            if (error) throw error;
        }
        
        closeModal('sponsorModal');
        await loadSponsors();
        alert('Sponsor saved successfully!');
    } catch (error) {
        console.error('Error saving sponsor:', error);
        alert('Error saving sponsor: ' + error.message);
    }
});

// ===== MODAL HELPERS =====
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Close modal buttons
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) {
            modal.classList.remove('active');
        }
    });
});

// Close modal on backdrop click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// Global click handler for edit/delete buttons using event delegation
document.addEventListener('click', async function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    
    const action = btn.dataset.action;
    const type = btn.dataset.type;
    const id = btn.dataset.id;
    
    // Handle invite button separately
    if (action === 'invite') {
        const email = btn.dataset.email;
        const password = atob(btn.dataset.password);
        const link = generateInvitationLink(email, password);
        
        try {
            await navigator.clipboard.writeText(link);
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="bi bi-check-lg"></i>';
            btn.style.background = '#10b981';
            btn.style.color = 'white';
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.background = '';
                btn.style.color = '';
            }, 2000);
        } catch (error) {
            const textarea = document.createElement('textarea');
            textarea.value = link;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert('Invitation link copied!');
        }
        return;
    }
    
    if (!action || !type || !id) return;
    
    if (action === 'edit') {
        switch(type) {
            case 'article': await editArticle(id); break;
            case 'category': await editCategory(id); break;
            case 'author': await editAuthor(id); break;
            case 'editor': await editEditor(id); break;
            case 'sponsor': await editSponsor(id); break;
        }
    } else if (action === 'delete') {
        switch(type) {
            case 'article': await deleteArticle(id); break;
            case 'category': await deleteCategory(id); break;
            case 'author': await deleteAuthor(id); break;
            case 'editor': await deleteEditor(id); break;
            case 'sponsor': await deleteSponsor(id); break;
        }
    }
});

// ===== RICH TEXT EDITOR =====
const contentEditor = document.getElementById('articleContentEditor');
const contentTextarea = document.getElementById('articleContent');
let isHtmlView = false;

// Initialize editor
function initRichTextEditor() {
    // Toolbar button commands
    document.querySelectorAll('.toolbar-btn[data-command]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const command = btn.dataset.command;
            document.execCommand(command, false, null);
            contentEditor.focus();
        });
    });
    
    // Format block (headings)
    document.getElementById('formatBlock').addEventListener('change', (e) => {
        const value = e.target.value;
        if (value) {
            document.execCommand('formatBlock', false, value);
        } else {
            document.execCommand('formatBlock', false, 'p');
        }
        contentEditor.focus();
        e.target.value = '';
    });
    
    // Font size
    document.getElementById('fontSize').addEventListener('change', (e) => {
        const value = e.target.value;
        if (value) {
            document.execCommand('fontSize', false, value);
        }
        contentEditor.focus();
        e.target.value = '';
    });
    
    // Text color
    document.getElementById('foreColor').addEventListener('input', (e) => {
        document.execCommand('foreColor', false, e.target.value);
        contentEditor.focus();
    });
    
    // Background/highlight color
    document.getElementById('backColor').addEventListener('input', (e) => {
        document.execCommand('hiliteColor', false, e.target.value);
        contentEditor.focus();
    });
    
    // Insert link
    document.getElementById('insertLinkBtn').addEventListener('click', (e) => {
        e.preventDefault();
        const url = prompt('Enter URL:', 'https://');
        if (url) {
            document.execCommand('createLink', false, url);
        }
        contentEditor.focus();
    });
    
    // Insert image
    document.getElementById('insertImageBtn').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('contentImageFile').click();
    });
    
    // Handle image file selection
    document.getElementById('contentImageFile').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    alert('Please select an image file');
                    return;
                }
                
                // Validate file size (max 2MB for content images)
                if (file.size > 2 * 1024 * 1024) {
                    alert('Image must be less than 2MB');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    const dataURL = event.target.result;
                    // Insert image at cursor position
                    document.execCommand('insertImage', false, dataURL);
                    contentEditor.focus();
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Error inserting image:', error);
                alert('Error inserting image');
            }
        }
        // Reset file input
        e.target.value = '';
    });
    
    // Toggle HTML view
    document.getElementById('toggleHtmlBtn').addEventListener('click', (e) => {
        e.preventDefault();
        toggleHtmlView();
    });
    
    // Sync content editor to textarea on input
    contentEditor.addEventListener('input', () => {
        if (!isHtmlView) {
            contentTextarea.value = contentEditor.innerHTML;
        }
    });
    
    // Handle paste to clean up formatting
    contentEditor.addEventListener('paste', (e) => {
        // Allow paste but let browser handle it
        // The content will be synced via the input event
    });
}

// Toggle between visual editor and HTML view
function toggleHtmlView() {
    const toggleBtn = document.getElementById('toggleHtmlBtn');
    
    if (isHtmlView) {
        // Switch to visual editor
        contentEditor.innerHTML = contentTextarea.value;
        contentEditor.style.display = 'block';
        contentTextarea.style.display = 'none';
        toggleBtn.classList.remove('active');
        isHtmlView = false;
    } else {
        // Switch to HTML view
        contentTextarea.value = contentEditor.innerHTML;
        contentEditor.style.display = 'none';
        contentTextarea.style.display = 'block';
        toggleBtn.classList.add('active');
        isHtmlView = true;
    }
}

// Set editor content (used when editing article)
function setEditorContent(html) {
    contentEditor.innerHTML = html || '';
    contentTextarea.value = html || '';
    // Make sure we're in visual mode
    if (isHtmlView) {
        toggleHtmlView();
    }
}

// Get editor content
function getEditorContent() {
    if (isHtmlView) {
        return contentTextarea.value;
    }
    return contentEditor.innerHTML;
}

// Reset editor
function resetEditor() {
    contentEditor.innerHTML = '';
    contentTextarea.value = '';
    if (isHtmlView) {
        toggleHtmlView();
    }
}

// Initialize the rich text editor
initRichTextEditor();

// =================================================================
// SPOTLIGHT MANAGEMENT
// =================================================================

async function loadSpotlight() {
    const tbody = document.querySelector('#spotlightTable tbody');
    tbody.innerHTML = '<tr><td colspan="5" class="loading">Loading spotlight...</td></tr>';
    
    try {
        const { data, error } = await supabase
            .from('spotlight')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            tbody.innerHTML = data.map(item => `
                <tr>
                    <td><img src="${item.image_url}" alt="Spotlight" style="max-width: 100px; max-height: 50px; object-fit: cover; border-radius: 4px;"></td>
                    <td>${item.caption || '<em>No caption</em>'}</td>
                    <td><a href="${item.link_url}" target="_blank" style="color: #0066cc; word-break: break-all;">${item.link_url.substring(0, 40)}...</a></td>
                    <td>${new Date(item.created_at).toLocaleDateString()}</td>
                    <td>
                        <button class="btn-edit" data-id="${item.id}">Edit</button>
                        <button class="btn-delete" data-id="${item.id}">Delete</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">No spotlight set. Click "Set Spotlight" to create one.</td></tr>';
        }
    } catch (error) {
        console.error('Error loading spotlight:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="error">Error loading spotlight</td></tr>';
    }
}

// New Spotlight button
document.getElementById('newSpotlightBtn').addEventListener('click', () => {
    document.getElementById('spotlightId').value = '';
    document.getElementById('spotlightImage').value = '';
    document.getElementById('spotlightLink').value = '';
    document.getElementById('spotlightCaption').value = '';
    document.getElementById('spotlightModalTitle').textContent = 'Set Spotlight';
    openModal('spotlightModal');
});

// Spotlight form submit
document.getElementById('spotlightForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('spotlightId').value;
    let imageUrl = document.getElementById('spotlightImage').value;
    const linkUrl = document.getElementById('spotlightLink').value;
    const caption = document.getElementById('spotlightCaption').value;
    
    // Handle file upload
    const imageFile = document.getElementById('spotlightImageFile').files[0];
    if (imageFile) {
        try {
            imageUrl = await imageToDataURL(imageFile);
        } catch (error) {
            alert(error.message);
            return;
        }
    }
    
    if (!imageUrl || !linkUrl) {
        alert('Image URL and Link URL are required');
        return;
    }
    
    try {
        // Delete all existing spotlights first (only one can be active)
        if (!id) {
            await supabase.from('spotlight').delete().neq('id', 0);
        }
        
        const spotlightData = {
            image_url: imageUrl,
            link_url: linkUrl,
            caption: caption || null
        };
        
        let error;
        if (id) {
            ({ error } = await supabase.from('spotlight').update(spotlightData).eq('id', id));
        } else {
            ({ error } = await supabase.from('spotlight').insert([spotlightData]));
        }
        
        if (error) throw error;
        
        closeModal('spotlightModal');
        await loadSpotlight();
        document.getElementById('spotlightImageFile').value = '';
    } catch (error) {
        console.error('Error saving spotlight:', error);
        alert('Error saving spotlight');
    }
});

// Spotlight table event delegation
document.getElementById('spotlightTable').addEventListener('click', async (e) => {
    const target = e.target;
    const id = target.dataset.id;
    
    if (!id) return;
    
    if (target.classList.contains('btn-edit')) {
        // Edit spotlight
        try {
            const { data, error } = await supabase
                .from('spotlight')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            
            document.getElementById('spotlightId').value = data.id;
            document.getElementById('spotlightImage').value = data.image_url;
            document.getElementById('spotlightLink').value = data.link_url;
            document.getElementById('spotlightCaption').value = data.caption || '';
            document.getElementById('spotlightModalTitle').textContent = 'Edit Spotlight';
            openModal('spotlightModal');
        } catch (error) {
            console.error('Error loading spotlight:', error);
            alert('Error loading spotlight');
        }
    }
    
    if (target.classList.contains('btn-delete')) {
        if (confirm('Delete this spotlight?')) {
            try {
                const { error } = await supabase.from('spotlight').delete().eq('id', id);
                if (error) throw error;
                await loadSpotlight();
            } catch (error) {
                console.error('Error deleting spotlight:', error);
                alert('Error deleting spotlight');
            }
        }
    }
});

// =================================================================
// FREE ADS MANAGEMENT
// =================================================================

async function loadFreeAds() {
    const tbody = document.querySelector('#freeAdsTable tbody');
    tbody.innerHTML = '<tr><td colspan="4" class="loading">Loading free ads...</td></tr>';
    
    try {
        const { data, error } = await supabase
            .from('free_ads')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            tbody.innerHTML = data.map(ad => `
                <tr>
                    <td>${ad.nonprofit_name}</td>
                    <td><img src="${ad.image_url}" alt="${ad.alt_text || ad.nonprofit_name}" style="max-width: 100px; max-height: 50px; object-fit: cover; border-radius: 4px;"></td>
                    <td><a href="${ad.link_url}" target="_blank" style="color: #0066cc; word-break: break-all;">${ad.link_url.substring(0, 40)}...</a></td>
                    <td>
                        <button class="btn-edit" data-id="${ad.id}">Edit</button>
                        <button class="btn-delete" data-id="${ad.id}">Delete</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="no-data">No free ads yet. Click "New Free Ad" to create one.</td></tr>';
        }
    } catch (error) {
        console.error('Error loading free ads:', error);
        tbody.innerHTML = '<tr><td colspan="4" class="error">Error loading free ads</td></tr>';
    }
}

// New Free Ad button
document.getElementById('newFreeAdBtn').addEventListener('click', () => {
    document.getElementById('freeAdId').value = '';
    document.getElementById('freeAdNonprofitName').value = '';
    document.getElementById('freeAdImage').value = '';
    document.getElementById('freeAdLink').value = '';
    document.getElementById('freeAdAltText').value = '';
    document.getElementById('freeAdModalTitle').textContent = 'New Free Ad';
    openModal('freeAdModal');
});

// Free Ad form submit
document.getElementById('freeAdForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('freeAdId').value;
    const nonprofitName = document.getElementById('freeAdNonprofitName').value;
    let imageUrl = document.getElementById('freeAdImage').value;
    const linkUrl = document.getElementById('freeAdLink').value;
    const altText = document.getElementById('freeAdAltText').value;
    
    // Handle file upload
    const imageFile = document.getElementById('freeAdImageFile').files[0];
    if (imageFile) {
        try {
            imageUrl = await imageToDataURL(imageFile);
        } catch (error) {
            alert(error.message);
            return;
        }
    }
    
    if (!nonprofitName || !imageUrl || !linkUrl) {
        alert('Nonprofit Name, Image URL, and Link URL are required');
        return;
    }
    
    try {
        const adData = {
            nonprofit_name: nonprofitName,
            image_url: imageUrl,
            link_url: linkUrl,
            alt_text: altText || null
        };
        
        let error;
        if (id) {
            ({ error } = await supabase.from('free_ads').update(adData).eq('id', id));
        } else {
            ({ error } = await supabase.from('free_ads').insert([adData]));
        }
        
        if (error) throw error;
        
        closeModal('freeAdModal');
        await loadFreeAds();
        document.getElementById('freeAdImageFile').value = '';
    } catch (error) {
        console.error('Error saving free ad:', error);
        alert('Error saving free ad');
    }
});

// Free Ads table event delegation
document.getElementById('freeAdsTable').addEventListener('click', async (e) => {
    const target = e.target;
    const id = target.dataset.id;
    
    if (!id) return;
    
    if (target.classList.contains('btn-edit')) {
        // Edit free ad
        try {
            const { data, error } = await supabase
                .from('free_ads')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            
            document.getElementById('freeAdId').value = data.id;
            document.getElementById('freeAdNonprofitName').value = data.nonprofit_name;
            document.getElementById('freeAdImage').value = data.image_url;
            document.getElementById('freeAdLink').value = data.link_url;
            document.getElementById('freeAdAltText').value = data.alt_text || '';
            document.getElementById('freeAdModalTitle').textContent = 'Edit Free Ad';
            openModal('freeAdModal');
        } catch (error) {
            console.error('Error loading free ad:', error);
            alert('Error loading free ad');
        }
    }
    
    if (target.classList.contains('btn-delete')) {
        if (confirm('Delete this free ad?')) {
            try {
                const { error } = await supabase.from('free_ads').delete().eq('id', id);
                if (error) throw error;
                await loadFreeAds();
            } catch (error) {
                console.error('Error deleting free ad:', error);
                alert('Error deleting free ad');
            }
        }
    }
});

// Initialize
(async () => {
    // Check for invitation link first
    await checkInvitationLink();
    
    // Then check normal auth
    checkAuth();
})();
