// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin credentials
const ADMIN_PASSWORD = 'OpenRockets2025!';

// Check if logged in
function checkAuth() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (isLoggedIn === 'true') {
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
    loadAllData();
}

// Login handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        localStorage.setItem('adminLoggedIn', 'true');
        showDashboard();
    } else {
        alert('Invalid credentials!');
    }
});

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('adminLoggedIn');
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
function createSlug(text) {
    return text.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
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
        
        tbody.innerHTML = data.map(article => `
            <tr>
                <td><strong>${article.title}</strong></td>
                <td>${article.categories?.name || 'N/A'}</td>
                <td>${article.authors?.name || 'N/A'}</td>
                <td>${new Date(article.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn-edit" onclick="editArticle(${article.id})">Edit</button>
                    <button class="btn-danger" onclick="deleteArticle(${article.id})">Delete</button>
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
    openModal('articleModal');
});

async function loadCategoriesForSelect() {
    const { data, error } = await supabase.from('categories').select('*').order('name');
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
            data.map(author => `<option value="${author.id}">${author.name}${author.verified ? ' ✓' : ''}</option>`).join('');
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
        document.getElementById('articleContent').value = data.content || '';
        
        openModal('articleModal');
    } catch (error) {
        console.error('Error loading article:', error);
        alert('Error loading article');
    }
}

async function deleteArticle(id) {
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

document.getElementById('articleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('articleId').value;
    const title = document.getElementById('articleTitle').value;
    const slug = createSlug(title);
    const categoryId = document.getElementById('articleCategory').value;
    const authorId = document.getElementById('articleAuthor').value;
    const excerpt = document.getElementById('articleExcerpt').value;
    const imageUrl = document.getElementById('articleImage').value;
    const content = document.getElementById('articleContent').value;
    
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
    
    try {
        if (id) {
            // Update existing article
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
        }
        
        closeModal('articleModal');
        await loadArticles();
        alert('Article saved successfully!');
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
                    <button class="btn-edit" onclick="editCategory(${category.id})">Edit</button>
                    <button class="btn-danger" onclick="deleteCategory(${category.id})">Delete</button>
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
    tbody.innerHTML = '<tr><td colspan="4" class="loading">Loading authors</td></tr>';
    
    try {
        const { data, error } = await supabase
            .from('authors')
            .select('*')
            .order('name');
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #999;">No authors yet. Create your first author!</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(author => `
            <tr>
                <td><strong>${author.name}</strong></td>
                <td>${author.verified ? '<span class="verified-badge">Verified</span>' : '-'}</td>
                <td>${author.bio ? author.bio.substring(0, 100) + '...' : '-'}</td>
                <td>
                    <button class="btn-edit" onclick="editAuthor(${author.id})">Edit</button>
                    <button class="btn-danger" onclick="deleteAuthor(${author.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading authors:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Error loading authors</td></tr>';
    }
}

document.getElementById('newAuthorBtn').addEventListener('click', () => {
    document.getElementById('authorModalTitle').textContent = 'New Author';
    document.getElementById('authorForm').reset();
    document.getElementById('authorId').value = '';
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
    
    const authorData = { name, bio, verified };
    
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
                    <button class="btn-edit" onclick="editEditor(${editor.id})">Edit</button>
                    <button class="btn-danger" onclick="deleteEditor(${editor.id})">Delete</button>
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
    openModal('editorModal');
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
    const bio = document.getElementById('editorBio').value;
    
    const editorData = { name, role, bio };
    
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
                    <button class="btn-edit" onclick="editSponsor(${sponsor.id})">Edit</button>
                    <button class="btn-danger" onclick="deleteSponsor(${sponsor.id})">Delete</button>
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

// Initialize
checkAuth();
