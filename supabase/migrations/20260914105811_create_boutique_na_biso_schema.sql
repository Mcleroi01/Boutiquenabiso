/*
# BOUTIQUE NA BISO - Database Schema

## Overview
Creates the complete database schema for BOUTIQUE NA BISO, a product catalog
and order management system for a business that buys products from China
(Pinduoduo, Xianyu, 1688, Alibaba) for clients in Kinshasa, DRC.

## New Tables

### categories
- `id` (uuid, primary key)
- `name` (text, not null) - category display name
- `slug` (text, unique, not null) - URL-friendly identifier
- `icon` (text) - optional lucide icon name
- `created_at` (timestamptz)

### products
- `id` (uuid, primary key)
- `name` (text, not null) - product name
- `description` (text) - product description
- `price` (numeric, not null) - price in USD
- `category_id` (uuid, FK to categories) - product category
- `stock_status` (text, not null, default 'order') - 'in_stock' or 'order'
- `quantity` (integer, default 0) - available quantity for in-stock items
- `variants` (jsonb, default []) - array of variant groups {name, options[]}
- `images` (jsonb, default []) - array of image URLs
- `featured` (boolean, default false) - show on homepage
- `created_at`, `updated_at` (timestamptz)

### orders
- `id` (uuid, primary key)
- `customer_name` (text, not null) - customer full name
- `customer_phone` (text, not null) - customer WhatsApp number
- `product_id` (uuid, FK to products) - ordered product
- `product_name` (text, not null) - snapshot of product name at order time
- `quantity` (integer, not null, default 1)
- `price` (numeric, not null) - unit price
- `status` (text, not null, default 'new') - order workflow status
- `notes` (text) - admin notes
- `created_at`, `updated_at` (timestamptz)

### settings
- `id` (uuid, primary key)
- `key` (text, unique, not null) - setting key
- `value` (text, not null) - setting value
- `created_at` (timestamptz)

## Security (RLS)

### categories
- SELECT: public (anon + authenticated) - catalog is public
- INSERT/UPDATE/DELETE: authenticated only - admin management

### products
- SELECT: public (anon + authenticated) - catalog is public
- INSERT/UPDATE/DELETE: authenticated only - admin management

### orders
- All CRUD: authenticated only - admin manages all orders

### settings
- SELECT: public (anon + authenticated) - WhatsApp number etc. needed publicly
- INSERT/UPDATE/DELETE: authenticated only - admin management

## Demo Data
- 5 categories (iPhones, Accessoires, Électronique, Mode, Sur Commande)
- 10 demo products with realistic data
- Default settings (WhatsApp number, store name)
*/

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_categories" ON categories;
CREATE POLICY "public_select_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_categories" ON categories;
CREATE POLICY "auth_insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_categories" ON categories;
CREATE POLICY "auth_update_categories" ON categories FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_categories" ON categories;
CREATE POLICY "auth_delete_categories" ON categories FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  stock_status text NOT NULL DEFAULT 'order' CHECK (stock_status IN ('in_stock', 'order')),
  quantity integer NOT NULL DEFAULT 0,
  variants jsonb DEFAULT '[]'::jsonb,
  images jsonb DEFAULT '[]'::jsonb,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_products" ON products;
CREATE POLICY "public_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_products" ON products;
CREATE POLICY "auth_insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_products" ON products;
CREATE POLICY "auth_update_products" ON products FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_products" ON products;
CREATE POLICY "auth_delete_products" ON products FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'purchased', 'transit', 'arrived', 'delivered', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_orders" ON orders;
CREATE POLICY "auth_select_orders" ON orders FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_orders" ON orders;
CREATE POLICY "auth_insert_orders" ON orders FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_orders" ON orders;
CREATE POLICY "auth_update_orders" ON orders FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_orders" ON orders;
CREATE POLICY "auth_delete_orders" ON orders FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_settings" ON settings;
CREATE POLICY "public_select_settings" ON settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_settings" ON settings;
CREATE POLICY "auth_insert_settings" ON settings FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_settings" ON settings;
CREATE POLICY "auth_update_settings" ON settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_settings" ON settings;
CREATE POLICY "auth_delete_settings" ON settings FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products(stock_status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ============================================================
-- DEMO DATA - CATEGORIES
-- ============================================================
INSERT INTO categories (name, slug, icon) VALUES
  ('iPhones', 'iphones', 'Smartphone'),
  ('Accessoires', 'accessoires', 'Headphones'),
  ('Électronique', 'electronique', 'Laptop'),
  ('Mode', 'mode', 'Shirt'),
  ('Sur Commande', 'sur-commande', 'Package')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- DEMO DATA - SETTINGS
-- ============================================================
INSERT INTO settings (key, value) VALUES
  ('whatsapp_number', '243812345678'),
  ('store_name', 'BOUTIQUE NA BISO'),
  ('store_description', 'Votre intermédiaire de confiance pour acheter en Chine. Livraison à Kinshasa.')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- DEMO DATA - PRODUCTS
-- Images will be updated after fetching from Pexels
-- ============================================================
INSERT INTO products (name, description, price, category_id, stock_status, quantity, variants, images, featured) VALUES
  (
    'iPhone 15 Pro Max 256GB',
    'iPhone 15 Pro Max avec puce A17 Pro, écran Super Retina XDR de 6.7 pouces, titane, Action Button. Version internationale (SIM). Garantie de 3 mois.',
    1250.00,
    (SELECT id FROM categories WHERE slug = 'iphones'),
    'in_stock',
    5,
    '[{"name":"Capacité","options":["256GB","512GB","1TB"]},{"name":"Couleur","options":["Titane Naturel","Titane Bleu","Titane Noir","Titane Blanc"]}]'::jsonb,
    '["https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg"]'::jsonb,
    true
  ),
  (
    'iPhone 15 128GB',
    'iPhone 15 avec écran Super Retina XDR, Dynamic Island, caméra 48MP. Version internationale (SIM). Garantie de 3 mois.',
    850.00,
    (SELECT id FROM categories WHERE slug = 'iphones'),
    'in_stock',
    8,
    '[{"name":"Capacité","options":["128GB","256GB"]},{"name":"Couleur","options":["Noir","Bleu","Vert","Jaune","Rose"]}]'::jsonb,
    '["https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg"]'::jsonb,
    true
  ),
  (
    'iPhone 14 Pro 256GB',
    'iPhone 14 Pro avec écran Always-On, Dynamic Island, caméra 48MP. Version internationale (SIM). Garantie de 3 mois.',
    980.00,
    (SELECT id FROM categories WHERE slug = 'iphones'),
    'order',
    0,
    '[{"name":"Capacité","options":["128GB","256GB","512GB"]},{"name":"Couleur","options":["Noir Sidéral","Argent","Or","Violet"]}]'::jsonb,
    '["https://images.pexels.com/photos/1294886/pexels-photo-1294886.jpeg"]'::jsonb,
    false
  ),
  (
    'iPhone WiFi (Sans SIM) 64GB',
    'iPhone utilisable en WiFi uniquement (pas de carte SIM). Idéal pour jeux, apps, et navigation. Parfait pour enfants ou comme iPod touch.',
    320.00,
    (SELECT id FROM categories WHERE slug = 'iphones'),
    'in_stock',
    12,
    '[{"name":"Capacité","options":["64GB","128GB","256GB"]},{"name":"Couleur","options":["Noir","Blanc","Rouge"]}]'::jsonb,
    '["https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg"]'::jsonb,
    false
  ),
  (
    'AirPods Pro 2ème génération',
    'AirPods Pro avec réduction de bruit active, audio spatial, boîtier de charge MagSafe. Compatibles iPhone, iPad, Mac.',
    220.00,
    (SELECT id FROM categories WHERE slug = 'accessoires'),
    'in_stock',
    15,
    '[]'::jsonb,
    '["https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg"]'::jsonb,
    true
  ),
  (
    'Apple Watch Series 9',
    'Apple Watch Series 9 GPS, écran Always-On, suivi de santé, puce S9. Bracelet sport inclus.',
    380.00,
    (SELECT id FROM categories WHERE slug = 'accessoires'),
    'order',
    0,
    '[{"name":"Taille","options":["41mm","45mm"]},{"name":"Bracelet","options":["Sport","Milanais","Cuir"]}]'::jsonb,
    '["https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg"]'::jsonb,
    false
  ),
  (
    'Coque iPhone 15 Pro Max',
    'Coque de protection transparente anti-choc pour iPhone 15 Pro Max. Compatible charge MagSafe.',
    25.00,
    (SELECT id FROM categories WHERE slug = 'accessoires'),
    'in_stock',
    30,
    '[{"name":"Couleur","options":["Transparent","Noir","Bleu"]}]'::jsonb,
    '["https://images.pexels.com/photos/4754103/pexels-photo-4754103.jpeg"]'::jsonb,
    false
  ),
  (
    'Batterie Externe 20000mAh',
    'Batterie externe haute capacité 20000mAh avec charge rapide USB-C. Compatible iPhone, Android, iPad.',
    35.00,
    (SELECT id FROM categories WHERE slug = 'accessoires'),
    'in_stock',
    20,
    '[]'::jsonb,
    '["https://images.pexels.com/photos/4087915/pexels-photo-4087915.jpeg"]'::jsonb,
    false
  ),
  (
    'MacBook Air M2 13"',
    'MacBook Air avec puce M2, 8GB RAM, 256GB SSD, écran Liquid Retina. Parfait pour le travail et les études.',
    1100.00,
    (SELECT id FROM categories WHERE slug = 'electronique'),
    'order',
    0,
    '[{"name":"Capacité","options":["256GB","512GB"]},{"name":"Couleur","options":["Gris Sidéral","Minuit","Stellaire","Argent"]}]'::jsonb,
    '["https://images.pexels.com/photos/18105/pexels-photo.jpg"]'::jsonb,
    false
  ),
  (
    'Sneakers Nike Air Force 1',
    'Baskets Nike Air Force 1 originales. Disponible sur commande depuis la Chine. Tailles 39 à 45.',
    85.00,
    (SELECT id FROM categories WHERE slug = 'mode'),
    'order',
    0,
    '[{"name":"Taille","options":["39","40","41","42","43","44","45"]},{"name":"Couleur","options":["Blanc","Noir","Blanc/Rouge"]}]'::jsonb,
    '["https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg"]'::jsonb,
    false
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- DEMO DATA - ORDERS
-- ============================================================
INSERT INTO orders (customer_name, customer_phone, product_id, product_name, quantity, price, status, notes) VALUES
  (
    'Patrick Mwamba',
    '+243812345678',
    (SELECT id FROM products WHERE name = 'iPhone 15 Pro Max 256GB'),
    'iPhone 15 Pro Max 256GB',
    1,
    1250.00,
    'confirmed',
    'Client veut la version 512GB Titane Bleu'
  ),
  (
    'Sarah Kabongo',
    '+243823456789',
    (SELECT id FROM products WHERE name = 'AirPods Pro 2ème génération'),
    'AirPods Pro 2ème génération',
    2,
    220.00,
    'purchased',
    'Acheté sur Pinduoduo, en attente d''envoi'
  ),
  (
    'Jean-Paul Ilunga',
    '+243834567890',
    (SELECT id FROM products WHERE name = 'iPhone WiFi (Sans SIM) 64GB'),
    'iPhone WiFi (Sans SIM) 64GB',
    1,
    320.00,
    'arrived',
    'Arrivé à Kinshasa, en attente de livraison'
  )
ON CONFLICT DO NOTHING;
