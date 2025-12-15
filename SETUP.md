# OpenRockets Magazine

A student-run magazine affiliated with the OpenRockets Foundation, a non-profit organization in the United States of America.

## Features

- **Full Admin Panel**: Manage articles, categories, authors, editors, and sponsors
- **Supabase Integration**: Serverless database backend
- **Dynamic Content**: Articles loaded from database
- **SEO-Friendly URLs**: Article pages at `/p/article-slug`
- **Responsive Design**: Works on all devices
- **Share Buttons**: Easy article sharing on social media
- **Professional Typography**: Playfair Display for headlines, Georgia for content, Ubuntu for UI

## Setup

### 1. Supabase Database

The following tables should be created in your Supabase project:

#### `categories`
```sql
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `authors`
```sql
CREATE TABLE authors (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    bio TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `articles`
```sql
CREATE TABLE articles (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT,
    image_url TEXT,
    category_id BIGINT REFERENCES categories(id),
    author_id BIGINT REFERENCES authors(id),
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `editors`
```sql
CREATE TABLE editors (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `sponsors`
```sql
CREATE TABLE sponsors (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Configuration

Update `config.js` with your Supabase credentials (already configured):
- Supabase URL: `https://ahkfuaaryzmcmoarxraq.supabase.co`
- Anon Key: (already in config.js)

### 3. Admin Access

**Default Admin Credentials:**
- Email: `admin@openrockets.com`
- Password: `OpenRockets2025!`

Access the admin panel at: `/admin.html`

## Usage

### Admin Panel

1. **Login**: Visit `/admin.html` and login with the admin credentials
2. **Create Categories**: Add categories that will appear in the navigation
3. **Add Authors**: Create author profiles (can be marked as verified)
4. **Add Editors**: Add editor profiles for the `/editors` page
5. **Manage Sponsors**: Upload sponsor logos (as data URLs) and links
6. **Create Articles**: 
   - Write articles with full HTML content
   - Upload images (converted to data URLs)
   - Assign category and author
   - Publish when ready

### Article Pages

Articles are automatically accessible at `/p/article-slug` where the slug is auto-generated from the article title.

### Editors Page

View all editors at `/editors` or `/editors.html`

## File Structure

```
/
├── index.html              # Homepage
├── admin.html              # Admin panel
├── editors.html            # Editors page
├── config.js               # Supabase configuration
├── script.js               # Homepage JavaScript
├── admin.js                # Admin panel JavaScript
├── editors.js              # Editors page JavaScript
├── article.js              # Article page JavaScript
├── styles.css              # Main styles
├── admin-styles.css        # Admin panel styles
├── editors-styles.css      # Editors page styles
├── article-styles.css      # Article page styles
├── 210044478.png           # Logo
└── p/
    └── index.html          # Article template page
```

## Fonts

- **Headlines**: Playfair Display (from Google Fonts)
- **Body Text**: Georgia (system font)
- **UI Elements**: Ubuntu (from Google Fonts)

## Important Notes

1. **No Backend Required**: Everything runs client-side with Supabase
2. **Static Hosting**: Can be hosted on GitHub Pages, Netlify, or any static host
3. **Image Storage**: Images are stored as data URLs in the database (suitable for small images)
4. **SEO**: Article pages use clean URLs for better search engine indexing
5. **Security**: Admin authentication is simple (single password) - suitable for small teams

## GitHub Pages Configuration

This site is configured to work with GitHub Pages. The CNAME file points to `mag.openrockets.com`.

## Future Enhancements

- Full-text search functionality
- Article pagination
- Category filtering
- Newsletter signup
- Comment system
- Analytics integration
- Image optimization service integration

## License

See LICENSE file for details.

## Contact

- Website: https://mag.openrockets.com
- X (Twitter): https://x.com/openrockets
- Admin Panel: https://mag.openrockets.com/admin.html
