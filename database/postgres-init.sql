-- PostgreSQL Database Initialization Script for POS Application
-- This script is compatible with PostgreSQL 12+

-- Create database (note: this is typically done via POSTGRES_DB env var)
-- CREATE DATABASE fascinito_pos;

-- Connect to the database
-- \c fascinito_pos;

-- Create schema if needed
CREATE SCHEMA IF NOT EXISTS public;

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    reset_code VARCHAR(6),
    reset_code_expiry TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(active);
CREATE INDEX idx_users_deleted ON users(deleted);
CREATE INDEX idx_users_created_at ON users(created_at);

-- User roles mapping table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for refresh_tokens table
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expiry ON refresh_tokens(expiry_date);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    description TEXT,
    logo_url VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for vendors table
CREATE INDEX idx_vendors_slug ON vendors(slug);
CREATE INDEX idx_vendors_active ON vendors(active);

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100),
    phone VARCHAR(20),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for locations table
CREATE INDEX idx_locations_active ON locations(active);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    description TEXT,
    image_url VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for categories table
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_active ON categories(active);
CREATE INDEX idx_categories_display_order ON categories(display_order);

-- Sub-categories table
CREATE TABLE IF NOT EXISTS sub_categories (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    description TEXT,
    image_url VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for sub_categories table
CREATE INDEX idx_sub_categories_category_id ON sub_categories(category_id);
CREATE INDEX idx_sub_categories_slug ON sub_categories(slug);
CREATE INDEX idx_sub_categories_active ON sub_categories(active);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(400) UNIQUE NOT NULL,
    description TEXT,
    detailed_description TEXT,
    sku VARCHAR(100) UNIQUE,
    upc VARCHAR(100),
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    sub_category_id BIGINT REFERENCES sub_categories(id) ON DELETE SET NULL,
    vendor_id BIGINT REFERENCES vendors(id) ON DELETE SET NULL,
    location_id BIGINT REFERENCES locations(id) ON DELETE SET NULL,
    regular_price NUMERIC(10, 2) NOT NULL,
    sale_price NUMERIC(10, 2),
    cost_per_item NUMERIC(10, 2),
    tax_rate NUMERIC(5, 2) DEFAULT 0,
    tax_exempt BOOLEAN NOT NULL DEFAULT FALSE,
    visible_to_customers BOOLEAN NOT NULL DEFAULT TRUE,
    track_inventory BOOLEAN NOT NULL DEFAULT FALSE,
    stock_quantity INT NOT NULL DEFAULT 0,
    low_stock_threshold INT NOT NULL DEFAULT 5,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for products table
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_vendor_id ON products(vendor_id);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_products_created_at ON products(created_at);

-- Product images table
CREATE TABLE IF NOT EXISTS product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for product_images table
CREATE INDEX idx_product_images_product_id ON product_images(product_id);

-- Product variations table (for product types like size, color, etc.)
CREATE TABLE IF NOT EXISTS product_variations (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for product_variations table
CREATE INDEX idx_product_variations_product_id ON product_variations(product_id);

-- Variation options table (actual values for variations)
CREATE TABLE IF NOT EXISTS variation_options (
    id BIGSERIAL PRIMARY KEY,
    variation_id BIGINT NOT NULL REFERENCES product_variations(id) ON DELETE CASCADE,
    value VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for variation_options table
CREATE INDEX idx_variation_options_variation_id ON variation_options(variation_id);

-- Product variant combinations table
CREATE TABLE IF NOT EXISTS product_variant_combinations (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for product_variant_combinations table
CREATE INDEX idx_product_variant_combinations_product_id ON product_variant_combinations(product_id);

-- Product variant combination options (mapping)
CREATE TABLE IF NOT EXISTS product_variant_combination_options (
    id BIGSERIAL PRIMARY KEY,
    combination_id BIGINT NOT NULL REFERENCES product_variant_combinations(id) ON DELETE CASCADE,
    variation_option_id BIGINT NOT NULL REFERENCES variation_options(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for product_variant_combination_options table
CREATE INDEX idx_product_variant_combination_options_combination_id ON product_variant_combination_options(combination_id);
CREATE INDEX idx_product_variant_combination_options_variation_option_id ON product_variant_combination_options(variation_option_id);

-- Product specifications table
CREATE TABLE IF NOT EXISTS product_specifications (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for product_specifications table
CREATE INDEX idx_product_specifications_product_id ON product_specifications(product_id);

-- Product reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for product_reviews table
CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_user_id ON product_reviews(user_id);

-- Wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Create indexes for wishlists table
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_wishlists_product_id ON wishlists(product_id);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    variant_combination_id BIGINT REFERENCES product_variant_combinations(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for cart_items table
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(100) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    subtotal NUMERIC(10, 2) NOT NULL,
    tax_amount NUMERIC(10, 2) NOT NULL,
    shipping_cost NUMERIC(10, 2) DEFAULT 0,
    discount NUMERIC(10, 2) DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL,
    shipping_address TEXT,
    billing_address TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for orders table
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variation_combination_id BIGINT REFERENCES product_variant_combinations(id) ON DELETE SET NULL,
    quantity INT NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for order_items table
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Order status history table
CREATE TABLE IF NOT EXISTS order_status_history (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for order_status_history table
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255),
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    response_data TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for payments table
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);

-- OTP Verification table
CREATE TABLE IF NOT EXISTS otp_verification (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for otp_verification table
CREATE INDEX idx_otp_verification_email ON otp_verification(email);
CREATE INDEX idx_otp_verification_expires_at ON otp_verification(expires_at);

-- Banners table
CREATE TABLE IF NOT EXISTS banners (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    link_url VARCHAR(500),
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for banners table
CREATE INDEX idx_banners_active ON banners(active);
CREATE INDEX idx_banners_display_order ON banners(display_order);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
    ('ROLE_ADMIN', 'Administrator role with full access'),
    ('ROLE_VENDOR', 'Vendor role for managing their products'),
    ('ROLE_CUSTOMER', 'Customer role for browsing and purchasing')
ON CONFLICT DO NOTHING;

-- Grant permissions if needed
ALTER TABLE IF EXISTS users OWNER TO current_user;
ALTER TABLE IF EXISTS roles OWNER TO current_user;
ALTER TABLE IF EXISTS products OWNER TO current_user;
ALTER TABLE IF EXISTS orders OWNER TO current_user;
