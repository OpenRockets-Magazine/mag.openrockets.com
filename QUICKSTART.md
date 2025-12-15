# Quick Start Guide - OpenRockets Magazine

## 🚀 Get Started in 3 Steps

### Step 1: Setup Database (5 minutes)

1. Open your Supabase project at https://app.supabase.com
2. Navigate to **SQL Editor**
3. Open `database-setup.sql` from this repository
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl/Cmd + Enter)
7. ✅ You should see "Database schema created successfully!"

**What this does:**
- Creates 5 tables: articles, categories, authors, editors, sponsors
- Sets up Row Level Security policies
- Creates database indexes
- Inserts sample data (categories, authors, editors)

### Step 2: Login to Admin Panel (2 minutes)

1. Visit: **https://mag.openrockets.com/admin.html**
2. Enter credentials:
   - Email: `admin@openrockets.com`
   - Password: `OpenRockets2025!`
3. Click **Login**
4. ✅ You're now in the admin panel!

### Step 3: Create Your First Article (5 minutes)

1. In the admin panel, click **"New Article"**
2. Fill in the form:
   - **Title**: "Welcome to OpenRockets Magazine"
   - **Category**: Select "Space Exploration"
   - **Author**: Select any author
   - **Excerpt**: "An introduction to our student-run magazine"
   - **Content**: Write your article content (HTML supported!)
3. Click **"Save Article"**
4. Visit: **https://mag.openrockets.com/**
5. ✅ Your article is now live!

## 📝 What You Can Do

### In the Admin Panel

**Articles Tab**
- Create, edit, delete articles
- Upload images (converted to data URLs)
- Rich HTML content editor
- Auto-generated SEO-friendly URLs

**Categories Tab**
- Create categories (appear in navigation)
- URL-friendly slugs
- Auto-updated in header menu

**Authors Tab**
- Manage author profiles
- Add verification checkmarks
- Include author bios

**Editors Tab**
- Editorial team members
- Roles and bios
- Displayed on `/editors` page

**Sponsors Tab**
- Upload sponsor logos
- Add website links
- Shown on all pages

## 🎯 Common Tasks

### Adding a New Category

1. Admin Panel → Categories
2. Click "New Category"
3. Enter name (e.g., "Rocket Technology")
4. Slug auto-generates (e.g., "rocket-technology")
5. Save
6. ✅ Category appears in navigation immediately

### Publishing an Article

1. Admin Panel → Articles → New Article
2. Fill in all required fields (Title, Category, Author, Content)
3. Optional: Add featured image, excerpt
4. Click "Save Article"
5. ✅ Article is live at `/p/article-slug`

### Editing Published Content

1. Admin Panel → Articles
2. Find article in list
3. Click "Edit"
4. Make changes
5. Click "Save Article"
6. ✅ Changes are immediately visible

### Managing Sponsors

1. Admin Panel → Sponsors
2. Click "New Sponsor"
3. Enter sponsor name
4. Upload logo OR paste image URL
5. Add website URL (optional)
6. Save
7. ✅ Sponsor appears in footer section

## 🔗 Important URLs

| Page | URL | Purpose |
|------|-----|---------|
| Homepage | `/` | Main landing page with articles |
| Admin Panel | `/admin.html` | Content management system |
| Editors Page | `/editors` or `/editors.html` | Editorial team |
| Article Pages | `/p/article-slug` | Individual articles |

## 💡 Pro Tips

### Writing Great Articles

1. **Use Clear Titles**: They become the URL slug
2. **Add Excerpts**: Shows in article listings
3. **Use Images**: Upload or paste URLs
4. **Format Content**: HTML tags work!
   ```html
   <h2>Section Title</h2>
   <p>Paragraph text here.</p>
   <blockquote>Important quote</blockquote>
   ```

### Image Best Practices

- Keep under 1MB (data URL storage)
- Use 800x500px for featured images
- JPEG for photos, PNG for graphics
- Compress before uploading

### SEO Tips

- Clear, descriptive titles
- Meaningful excerpts
- Use header tags (h2, h3) in content
- Add relevant categories
- Verified authors boost credibility

## ❓ Troubleshooting

### "Articles not showing on homepage?"

✅ **Solution**: Check that:
1. Articles are marked as "published"
2. Category and author are assigned
3. Supabase credentials are correct in `config.js`

### "Can't login to admin?"

✅ **Solution**:
1. Verify email: `admin@openrockets.com`
2. Verify password: `OpenRockets2025!`
3. Clear browser cache/localStorage
4. Try incognito/private browsing mode

### "Categories not in navigation?"

✅ **Solution**:
1. Create categories in admin panel first
2. Refresh homepage (Ctrl+F5 / Cmd+Shift+R)
3. Check browser console for errors

### "Image upload not working?"

✅ **Solution**:
1. Ensure image is under 1MB
2. Use supported formats (JPEG, PNG, GIF)
3. Try pasting image URL instead
4. Check browser console for errors

## 📚 Learn More

- **SETUP.md** - Complete setup documentation
- **IMPLEMENTATION.md** - Technical details
- **database-setup.sql** - Database schema

## 🆘 Need Help?

- Check browser console (F12) for errors
- Review documentation files
- Contact: [@openrockets on X](https://x.com/openrockets)

## 🎉 You're Ready!

You now have a fully functional magazine website with:
- ✅ Admin panel for content management
- ✅ Dynamic article loading from database
- ✅ SEO-friendly URLs
- ✅ Professional design
- ✅ Mobile responsive
- ✅ Share buttons
- ✅ Sponsor section

**Start creating amazing content!** 🚀

---

*OpenRockets Magazine - A student-run publication of the OpenRockets Foundation*
