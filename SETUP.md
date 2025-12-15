# OpenRockets Magazine

A student-run magazine affiliated with the OpenRockets Foundation, a non-profit organization in the United States of America.

## Overview

This is a modern, SEO-friendly magazine website powered by Supabase as a backend-free solution. The site features a full admin panel for content management, dynamic article pages, and a responsive design that works on all devices.

## Quick Start

1. **Database Setup**: Run the SQL in `database-setup.sql` in your Supabase SQL Editor
2. **Admin Access**: Visit `/admin.html` and login with:
   - Email: `admin@openrockets.com`
   - Password: `OpenRockets2025!`
3. **Create Content**: Use the admin panel to create categories, authors, and articles
4. **View Site**: Your articles will automatically appear on the homepage and at `/p/article-slug`

## Features

- ✅ **Full Admin Panel**: Manage articles, categories, authors, editors, and sponsors
- ✅ **Supabase Integration**: Serverless database backend (no Node.js required)
- ✅ **Dynamic Content**: Articles loaded from database
- ✅ **SEO-Friendly URLs**: Article pages at `/p/article-slug` for better Google indexing
- ✅ **Responsive Design**: Works on all devices
- ✅ **Share Buttons**: Easy article sharing on social media (X, Facebook, LinkedIn)
- ✅ **Professional Typography**: 
  - Playfair Display for headlines
  - Georgia for article content
  - Ubuntu for UI elements
- ✅ **Image Support**: Images stored as data URLs (no external storage needed)
- ✅ **Verified Authors**: Checkmark badges for verified authors
- ✅ **Sponsor Section**: Displayed on all pages
- ✅ **Editors Page**: Dedicated page at `/editors` for editorial team

## Setup Instructions

### 1. Supabase Database Setup

Run the SQL script in `database-setup.sql` in your Supabase SQL Editor. This will:
- Create all necessary tables (categories, authors, articles, editors, sponsors)
- Set up Row Level Security (RLS) policies for public access
- Create indexes for better performance
- Insert sample data (optional)

The tables are:
- **categories**: Article categories that appear in navigation
- **authors**: Author profiles with verification status
- **articles**: Full article content with slug-based URLs
- **editors**: Editorial team members
- **sponsors**: Sponsor information and logos

### 2. Configuration

The Supabase configuration is already set up in `config.js`:
- Supabase URL: `https://ahkfuaaryzmcmoarxraq.supabase.co`
- Anon Key: Already configured

No additional configuration needed!

### 3. Admin Access

**Default Admin Credentials:**
- Email: `admin@openrockets.com`
- Password: `OpenRockets2025!`

Access the admin panel at: `https://mag.openrockets.com/admin.html`

## Usage Guide

### Admin Panel Overview

The admin panel has 5 main sections:

#### 1. Articles
- Create, edit, and delete articles
- Upload images (converted to data URLs automatically)
- Write full HTML content
- Assign categories and authors
- Publish/unpublish articles
- Auto-generated slugs for SEO-friendly URLs

#### 2. Categories
- Create categories that appear in the site navigation
- Each category has a name and URL-friendly slug
- Categories are automatically displayed in the header menu

#### 3. Authors
- Add author profiles
- Mark authors as "verified" (shows checkmark badge)
- Add author bios

#### 4. Editors
- Manage editorial team members
- Add roles (e.g., "Editor-in-Chief", "Managing Editor")
- Add detailed bios
- These appear on the `/editors` page

#### 5. Sponsors
- Upload sponsor logos (as images or data URLs)
- Add sponsor website links
- Sponsors appear in a section at the bottom of every page

### Creating Your First Article

1. Login to admin panel at `/admin.html`
2. Click "Articles" in the sidebar
3. Click "New Article" button
4. Fill in:
   - Title (required)
   - Category (select from dropdown)
   - Author (select from dropdown)
   - Excerpt (optional, appears in article listings)
   - Featured Image (URL or upload file)
   - Content (required, supports HTML)
5. Click "Save Article"
6. Your article is now live at `/p/your-article-title`

### Article Content Tips

- The content field supports full HTML
- You can include images using `<img>` tags
- For uploaded images, they're automatically converted to data URLs
- Use headings (`<h2>`, `<h3>`) to structure your content
- Add `<blockquote>` for pull quotes
- Content is displayed in Georgia font for readability

## File Structure

```
/
├── index.html              # Homepage (loads articles from Supabase)
├── admin.html              # Admin panel
├── editors.html            # Editors page
├── config.js               # Supabase configuration
├── script.js               # Homepage JavaScript
├── admin.js                # Admin panel JavaScript  
├── editors.js              # Editors page JavaScript
├── article.js              # Article page JavaScript
├── styles.css              # Main stylesheet
├── admin-styles.css        # Admin panel styles
├── editors-styles.css      # Editors page styles
├── article-styles.css      # Article page styles
├── database-setup.sql      # Database schema and setup
├── SETUP.md                # Detailed setup guide
├── 210044478.png           # OpenRockets logo
└── p/
    └── index.html          # Article template page
```

## Fonts

The site uses a professional typographic hierarchy:

- **Headlines**: Playfair Display (Google Fonts) - For article titles and major headings
- **Body Text**: Georgia (system font) - For article content and descriptions
- **UI Elements**: Ubuntu (Google Fonts) - For buttons, navigation, and interface elements

## Technical Details

### No Backend Required
Everything runs client-side with Supabase as the database. No Node.js, no build process, no complicated deployment.

### SEO-Friendly
- Clean URLs: `/p/article-slug` instead of query parameters
- Semantic HTML structure
- Meta tags support (can be extended)
- Fast loading times

### Image Handling
Images are stored as data URLs in the database:
- Simple to implement
- No external storage needed
- Works well for moderately-sized images
- For very large images, consider using Supabase Storage in the future

### Security
- Simple admin authentication (single password)
- Suitable for small editorial teams
- All database operations use Supabase RLS policies
- Credentials stored in localStorage (can be enhanced)

## Hosting

This site is designed for static hosting and works perfectly with:
- ✅ **GitHub Pages** (currently configured)
- ✅ Netlify
- ✅ Vercel
- ✅ Cloudflare Pages
- ✅ Any static file hosting

The CNAME file is configured for `mag.openrockets.com`.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

Potential features for future versions:

- [ ] Full-text search across articles
- [ ] Article pagination on homepage
- [ ] Category filter pages
- [ ] Newsletter signup integration
- [ ] Comment system (via Disqus or similar)
- [ ] Analytics integration (Google Analytics, Plausible)
- [ ] Image optimization service (Cloudinary, Imgix)
- [ ] Multiple admin users with different permissions
- [ ] Draft/scheduled publishing
- [ ] Article version history
- [ ] RSS feed generation
- [ ] Related articles suggestions
- [ ] Reading time estimates
- [ ] Article series/collections

## Troubleshooting

### Articles not appearing?
1. Check that articles are marked as "published" in admin panel
2. Verify Supabase credentials in `config.js`
3. Check browser console for errors
4. Ensure RLS policies are set correctly in Supabase

### Can't login to admin?
- Verify email: `admin@openrockets.com`
- Verify password: `OpenRockets2025!`
- Clear browser cache/localStorage
- Check browser console for errors

### Images not loading?
- Ensure image URLs are accessible
- For uploaded files, they're converted to data URLs automatically
- Very large images may cause issues (keep under 1MB)

### Categories not showing in navigation?
- Create categories in admin panel first
- Refresh the homepage
- Check browser console for errors

## Contributing

This is a student-run publication. For contributions:
1. Contact via X: [@openrockets](https://x.com/openrockets)
2. Editorial guidelines will be provided by editors
3. Technical issues can be reported via GitHub

## License

See LICENSE file for details.

## Contact & Links

- **Website**: https://mag.openrockets.com
- **X (Twitter)**: https://x.com/openrockets
- **Admin Panel**: https://mag.openrockets.com/admin.html
- **Editors Page**: https://mag.openrockets.com/editors

---

**Made with ❤️ by the OpenRockets Foundation team**

*A non-profit organization dedicated to advancing aerospace education and exploration.*

