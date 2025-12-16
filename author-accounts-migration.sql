-- =================================================================
-- OpenRockets Magazine - Author Accounts Migration
-- Run this in your Supabase SQL Editor to enable author logins
-- =================================================================

-- =================================================================
-- STEP 1: Add credential columns to authors table
-- =================================================================
ALTER TABLE authors ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS password TEXT;

-- Note: We'll store a base64 encoded password (same approach as admin credentials)
-- Only authors with email AND password can login as authors

-- =================================================================
-- STEP 2: Create index for faster email lookups
-- =================================================================
CREATE INDEX IF NOT EXISTS idx_authors_email ON authors(email);

-- =================================================================
-- STEP 3: Add views column to articles table (for view tracking)
-- =================================================================
ALTER TABLE articles ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- =================================================================
-- STEP 4: Add author_id constraint to articles (for author-specific articles)
-- This already exists but let's make sure
-- =================================================================
-- articles.author_id already references authors(id)

-- =================================================================
-- EXAMPLE: Create an author account
-- =================================================================
-- To create an author account that can login, update an existing author:
-- UPDATE authors 
-- SET email = 'author@example.com', 
--     password = 'base64encodedpassword'
-- WHERE id = 1;
--
-- Or insert a new author with credentials:
-- INSERT INTO authors (name, bio, verified, email, password) 
-- VALUES ('Author Name', 'Author bio...', false, 'author@email.com', 'encodedpassword');

-- =================================================================
-- PERMISSIONS SUMMARY
-- =================================================================
-- Regular Author (verified = false):
--   ✓ Create articles
--   ✗ Edit/Delete articles  
--   ✗ Spotlights
--   ✗ Free Ads
--   ✗ Categories
--   ✗ Authors
--   ✗ Editors
--   ✗ Sponsors
--
-- Verified Author (verified = true):
--   ✓ Create articles
--   ✗ Edit/Delete articles
--   ✓ Create Spotlights
--   ✓ Create Free Ads
--   ✗ Categories
--   ✗ Authors
--   ✗ Editors
--   ✗ Sponsors
--
-- Admin/Moderator (main password):
--   ✓ Full access to everything
--   ✓ Can verify/unverify authors
--   ✓ Can delete anything

SELECT 'Author accounts migration completed successfully!' AS message;
