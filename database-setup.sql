-- OpenRockets Magazine - Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create authors table
CREATE TABLE IF NOT EXISTS authors (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    bio TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT,
    image_url TEXT,
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    author_id BIGINT REFERENCES authors(id) ON DELETE SET NULL,
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create editors table
CREATE TABLE IF NOT EXISTS editors (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    bio TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: If you already have the editors table, run this to add the photo_url column:
-- ALTER TABLE editors ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create sponsors table
CREATE TABLE IF NOT EXISTS sponsors (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE editors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
-- Categories
CREATE POLICY "Allow public read access on categories" 
ON categories FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on categories" 
ON categories FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on categories" 
ON categories FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on categories" 
ON categories FOR DELETE 
USING (true);

-- Authors
CREATE POLICY "Allow public read access on authors" 
ON authors FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on authors" 
ON authors FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on authors" 
ON authors FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on authors" 
ON authors FOR DELETE 
USING (true);

-- Articles
CREATE POLICY "Allow public read access on published articles" 
ON articles FOR SELECT 
USING (published = true OR true);  -- Allow all reads including unpublished for admin

CREATE POLICY "Allow public insert on articles" 
ON articles FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on articles" 
ON articles FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on articles" 
ON articles FOR DELETE 
USING (true);

-- Editors
CREATE POLICY "Allow public read access on editors" 
ON editors FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on editors" 
ON editors FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on editors" 
ON editors FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on editors" 
ON editors FOR DELETE 
USING (true);

-- Sponsors
CREATE POLICY "Allow public read access on sponsors" 
ON sponsors FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on sponsors" 
ON sponsors FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on sponsors" 
ON sponsors FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on sponsors" 
ON sponsors FOR DELETE 
USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Insert sample categories (optional)
INSERT INTO categories (name, slug) VALUES
    ('Space Exploration', 'space-exploration'),
    ('Technology', 'technology'),
    ('Business', 'business'),
    ('Science', 'science'),
    ('Opinion', 'opinion'),
    ('Markets', 'markets'),
    ('World', 'world')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample authors (optional)
INSERT INTO authors (name, bio, verified) VALUES
    ('Sarah Mitchell', 'Senior science writer with a focus on aerospace and space exploration.', true),
    ('John Davis', 'Technology correspondent covering AI and satellite systems.', true),
    ('Emily Chen', 'Business reporter specializing in aerospace industry.', true)
ON CONFLICT DO NOTHING;

-- Insert sample editors (optional)
INSERT INTO editors (name, role, bio) VALUES
    ('Jane Doe', 'Editor-in-Chief', 'Jane is a seasoned journalist with over 15 years of experience covering aerospace and technology. She leads our editorial team with a commitment to rigorous, fact-based reporting.'),
    ('John Smith', 'Managing Editor', 'John oversees daily operations and ensures our content meets the highest standards of quality and accuracy. He has a background in science communication.'),
    ('Emily Chen', 'Senior Editor', 'Emily specializes in space policy and international cooperation. She brings a unique perspective from her work with various space agencies.'),
    ('Michael Patterson', 'Technology Editor', 'Michael covers the latest developments in rocket technology and propulsion systems. He holds a degree in aerospace engineering.'),
    ('Sarah Rodriguez', 'Science Editor', 'Sarah focuses on the scientific aspects of space exploration, from planetary science to astrobiology. She completed her Ph.D. in astrophysics.')
ON CONFLICT DO NOTHING;

-- =================================================================
-- MIGRATION: Run this if you already have existing tables
-- =================================================================
-- Add photo_url column to editors table if it doesn't exist
-- ALTER TABLE editors ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- =================================================================
-- Spotlight Table - Single featured banner/image with link
-- =================================================================
CREATE TABLE IF NOT EXISTS spotlight (
    id BIGSERIAL PRIMARY KEY,
    image_url TEXT NOT NULL,
    link_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on spotlight
ALTER TABLE spotlight ENABLE ROW LEVEL SECURITY;

-- Spotlight policies
CREATE POLICY "Allow public read access on spotlight" 
ON spotlight FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on spotlight" 
ON spotlight FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on spotlight" 
ON spotlight FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on spotlight" 
ON spotlight FOR DELETE 
USING (true);

-- =================================================================
-- Free Ads Table - Nonprofit ads displayed randomly across site
-- =================================================================
CREATE TABLE IF NOT EXISTS free_ads (
    id BIGSERIAL PRIMARY KEY,
    nonprofit_name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT NOT NULL,
    alt_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on free_ads
ALTER TABLE free_ads ENABLE ROW LEVEL SECURITY;

-- Free Ads policies
CREATE POLICY "Allow public read access on free_ads" 
ON free_ads FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on free_ads" 
ON free_ads FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on free_ads" 
ON free_ads FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on free_ads" 
ON free_ads FOR DELETE 
USING (true);

-- Success message
SELECT 'Database schema created successfully! You can now use the admin panel to manage content.' AS message;
