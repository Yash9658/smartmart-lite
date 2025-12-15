-- ============================================
-- SMARTMART DATABASE SCHEMA
-- Complete database setup for SmartMart E-commerce
-- ============================================

-- Create database
DROP DATABASE IF EXISTS smartmart;
CREATE DATABASE smartmart;
USE smartmart;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image VARCHAR(500),
    category VARCHAR(100),
    stock_quantity INT DEFAULT 10,
    featured BOOLEAN DEFAULT FALSE,
    discount_percent INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CART TABLE
-- ============================================
CREATE TABLE cart (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_cart_item (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Index for faster cart queries
CREATE INDEX idx_cart_user_id ON cart(user_id);
CREATE INDEX idx_cart_product_id ON cart(product_id);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    items JSON,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    shipping_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- INSERT SAMPLE USERS (WITH PLAIN TEXT PASSWORDS FOR DEMO)
-- ============================================
INSERT INTO users (name, email, password) VALUES 
('Admin User', 'admin@smartmart.com', 'admin123'),
('John Doe', 'john@example.com', 'password123'),
('Jane Smith', 'jane@example.com', 'password123');

-- ============================================
-- INSERT SAMPLE PRODUCTS
-- ============================================
INSERT INTO products (name, description, price, image, category, stock_quantity, featured, discount_percent) VALUES
-- Electronics (Featured)
('iPhone 15 Pro', 'Latest Apple smartphone with A17 Pro chip, 48MP camera, and Dynamic Island', 999.99, 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop', 'Electronics', 50, 1, 15),
('MacBook Air M2', 'Thin and light laptop with Apple Silicon, 13.6" Liquid Retina display', 1199.99, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop', 'Electronics', 30, 1, 0),
('Samsung Galaxy S23', 'Android flagship with Snapdragon 8 Gen 2, 200MP camera, 120Hz display', 799.99, 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=400&fit=crop', 'Electronics', 40, 0, 10),

-- Electronics
('Sony WH-1000XM5', 'Industry-leading noise cancellation with 30-hour battery life', 399.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', 'Electronics', 25, 0, 8),
('Apple Watch Series 9', 'Smartwatch with always-on display, ECG, and blood oxygen monitoring', 429.99, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop', 'Electronics', 45, 0, 0),
('Dell XPS 13', 'Ultra-thin laptop with 13.4" InfinityEdge display, Intel Core i7', 1299.99, 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&h=400&fit=crop', 'Electronics', 20, 0, 12),
('iPad Pro 12.9"', 'M2 chip, Liquid Retina XDR display, Pro camera system', 1099.99, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop', 'Electronics', 35, 0, 5),

-- Fashion (Featured)
('Nike Air Max 270', 'Comfortable running shoes with Max Air cushioning for all-day comfort', 149.99, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', 'Fashion', 100, 1, 20),
('Levi''s 501 Original Jeans', 'Classic straight fit jeans made with high-quality stretch denim', 89.99, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop', 'Fashion', 60, 0, 5),

-- Fashion
('Adidas Ultraboost 22', 'Responsive running shoes with Boost technology and Primeknit upper', 179.99, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop', 'Fashion', 75, 0, 15),
('Ralph Lauren Polo Shirt', 'Classic fit polo shirt made with breathable cotton pique', 79.99, 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=400&fit=crop', 'Fashion', 120, 0, 10),
('Zara Leather Jacket', 'Genuine leather jacket with quilted lining and multiple pockets', 299.99, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop', 'Fashion', 25, 0, 25),
('Ray-Ban Aviator Sunglasses', 'Classic aviator sunglasses with G-15 lenses and metal frame', 159.99, 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop', 'Fashion', 80, 0, 0),

-- Home & Kitchen
('Ninja Air Fryer', '4-quart air fryer that cooks faster and uses 75% less fat', 99.99, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop', 'Home & Kitchen', 65, 0, 30),
('Keurig K-Classic', 'Single serve coffee maker with 6 to 10 oz. brew sizes', 129.99, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop', 'Home & Kitchen', 90, 0, 0),

-- Books
('The Creative Act: A Way of Being', 'New book by Rick Rubin on creativity and the artistic process', 24.99, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop', 'Books', 200, 0, 20),
('Atomic Habits', 'An Easy & Proven Way to Build Good Habits & Break Bad Ones', 18.99, 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&h=400&fit=crop', 'Books', 150, 0, 10);

-- ============================================
-- INSERT SAMPLE ORDERS
-- ============================================
INSERT INTO orders (user_id, items, total, status, shipping_address) VALUES
(2, '[{"id": 1, "name": "iPhone 15 Pro", "price": 999.99, "quantity": 1}, {"id": 9, "name": "Nike Air Max 270", "price": 149.99, "quantity": 2}]', 1299.97, 'delivered', '123 Main St, New York, NY 10001'),
(3, '[{"id": 5, "name": "Apple Watch Series 9", "price": 429.99, "quantity": 1}]', 429.99, 'processing', '456 Oak Ave, Los Angeles, CA 90001'),
(2, '[{"id": 7, "name": "Dell XPS 13", "price": 1299.99, "quantity": 1}, {"id": 15, "name": "Ninja Air Fryer", "price": 99.99, "quantity": 1}]', 1399.98, 'pending', '123 Main St, New York, NY 10001');

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- View: Product inventory summary
CREATE VIEW product_inventory_summary AS
SELECT 
    category,
    COUNT(*) as total_products,
    SUM(stock_quantity) as total_stock,
    AVG(price) as avg_price,
    SUM(CASE WHEN featured = 1 THEN 1 ELSE 0 END) as featured_count
FROM products
GROUP BY category;

-- View: Recent orders with user info
CREATE VIEW recent_orders_view AS
SELECT 
    o.id as order_id,
    o.total,
    o.status,
    o.created_at,
    u.name as customer_name,
    u.email as customer_email
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
ORDER BY o.created_at DESC;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_products_stock ON products(stock_quantity);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

-- ============================================
-- STORED PROCEDURES (Optional - for advanced features)
-- ============================================

-- Procedure: Update product stock
DELIMITER $$
CREATE PROCEDURE update_product_stock(
    IN p_product_id INT,
    IN p_quantity_change INT
)
BEGIN
    UPDATE products 
    SET stock_quantity = stock_quantity + p_quantity_change
    WHERE id = p_product_id;
    
    IF (SELECT stock_quantity FROM products WHERE id = p_product_id) < 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Insufficient stock';
    END IF;
END$$
DELIMITER ;

-- ============================================
-- INITIAL DATA CHECKS
-- ============================================

-- Verify all tables
SELECT 'Users count:' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Products count:', COUNT(*) FROM products
UNION ALL
SELECT 'Orders count:', COUNT(*) FROM orders
UNION ALL
SELECT 'Cart items count:', COUNT(*) FROM cart;

-- Show user credentials for testing
SELECT 'TEST LOGINS:' as info;
SELECT email, password FROM users;

-- Show product categories
SELECT category, COUNT(*) as product_count, SUM(stock_quantity) as total_stock
FROM products
GROUP BY category
ORDER BY product_count DESC;

-- Show featured products
SELECT name, price, discount_percent, stock_quantity
FROM products
WHERE featured = 1
ORDER BY created_at DESC;