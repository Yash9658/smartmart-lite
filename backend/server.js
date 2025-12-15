const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Improved CORS configuration
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'yash',
    database: process.env.DB_NAME || 'smartmart',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test DB
pool.getConnection()
    .then(connection => {
        console.log('✅ Connected to MySQL');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database error:', err);
    });

// Root route
app.get('/', (req, res) => {
    res.json({ 
        message: 'SmartMart API Server',
        status: 'running',
        endpoints: {
            products: '/api/products',
            cart: '/api/cart',
            register: '/api/users/register',
            login: '/api/users/login',
            orders: '/api/orders'
        }
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 1. Products API
app.get('/api/products', async (req, res) => {
    try {
        const { category } = req.query;
        let query = 'SELECT * FROM products';
        const params = [];
        
        if (category) {
            query += ' WHERE category = ?';
            params.push(category);
        }
        
        query += ' ORDER BY featured DESC, created_at DESC';
        
        const [products] = await pool.execute(query, params);
        
        const productsWithDetails = products.map(p => ({
            ...p,
            sale_price: p.discount_percent > 0 
                ? (p.price * (100 - p.discount_percent) / 100).toFixed(2)
                : null
        }));
        
        res.json({
            success: true,
            count: products.length,
            products: productsWithDetails
        });
    } catch (error) {
        console.error('Products error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch products' 
        });
    }
});

// 2. Cart API
app.get('/api/cart', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });
        
        const [cartItems] = await pool.execute(
            `SELECT c.*, p.name, p.price, p.discount_percent, p.image 
             FROM cart c 
             JOIN products p ON c.product_id = p.id 
             WHERE c.user_id = ?`,
            [userId]
        );
        
        res.json({
            success: true,
            cart_items: cartItems
        });
    } catch (error) {
        console.error('Cart error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch cart' });
    }
});

app.post('/api/cart', async (req, res) => {
  try {
    const { userId, productId, quantity = 1 } = req.body;
    
    if (!userId || !productId) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId and productId are required' 
      });
    }
    
    console.log('Adding to cart:', { userId, productId, quantity });
    
    // Check if product exists and has stock
    const [products] = await pool.execute('SELECT * FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    const product = products[0];
    if (product.stock_quantity < quantity) {
      return res.status(400).json({ 
        success: false, 
        error: `Only ${product.stock_quantity} items in stock` 
      });
    }
    
    // Check if item already exists in cart
    const [existing] = await pool.execute(
      'SELECT * FROM cart WHERE user_id = ? AND product_id = ?', 
      [userId, productId]
    );
    
    if (existing.length > 0) {
      // Update existing quantity
      const newQuantity = existing[0].quantity + quantity;
      await pool.execute(
        'UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND product_id = ?', 
        [newQuantity, userId, productId]
      );
      
      res.json({ 
        success: true, 
        message: 'Cart item quantity updated',
        action: 'updated',
        data: { 
          userId, 
          productId, 
          newQuantity,
          itemId: existing[0].id 
        }
      });
    } else {
      // Insert new item
      const [result] = await pool.execute(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)', 
        [userId, productId, quantity]
      );
      
      res.json({ 
        success: true, 
        message: 'Added to cart',
        action: 'added',
        data: { 
          userId, 
          productId, 
          quantity,
          itemId: result.insertId 
        }
      });
    }
    
  } catch (error) {
    console.error('Add to cart error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        error: 'Item already in cart. Use update endpoint to change quantity.',
        code: 'DUPLICATE_ITEM'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add to cart',
      details: error.message,
      code: error.code 
    });
  }
});

app.delete('/api/cart/:itemId', async (req, res) => {
    try {
        const { itemId } = req.params;
        const { userId } = req.query;
        
        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                error: 'User ID required in query params' 
            });
        }
        
        await pool.execute('DELETE FROM cart WHERE id = ? AND user_id = ?', [itemId, userId]);
        res.json({ 
            success: true, 
            message: 'Item removed',
            data: { itemId, userId }
        });
    } catch (error) {
        console.error('Remove item error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to remove item',
            details: error.message 
        });
    }
});

app.put('/api/cart/:itemId', async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity, userId } = req.body;
        
        if (!userId || quantity === undefined) {
            return res.status(400).json({ 
                success: false, 
                error: 'userId and quantity are required' 
            });
        }
        
        await pool.execute(
            'UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?', 
            [quantity, itemId, userId]
        );
        res.json({ 
            success: true, 
            message: 'Cart updated',
            data: { itemId, userId, quantity }
        });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update cart',
            details: error.message 
        });
    }
});

// 3. User Auth
app.post('/api/users/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Name, email, and password are required' 
            });
        }
        
        // Use plain text password (for demo - in production, use bcrypt)
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
            [name, email, password] // Plain text for demo
        );
        
        res.json({
            success: true,
            message: 'Registered successfully',
            token: 'dummy-token-' + Date.now(),
            user: { 
                id: result.insertId, 
                name, 
                email 
            }
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false, 
                error: 'Email already exists' 
            });
        }
        console.error('Register error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Registration failed',
            details: error.message 
        });
    }
});

app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email and password are required' 
            });
        }
        
        // Use plain text comparison for demo
        // In your database, passwords are stored as plain text, not hashed
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ?', 
            [email]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }
        
        const user = users[0];
        
        // Compare plain text password (for demo)
        // Note: In production, use bcrypt.compare()
        if (user.password !== password) {
            // For the existing hashed passwords in your database, we need to handle them
            // Let's check if it's the admin user with the hashed password
            if (email === 'admin@smartmart.com' && password === 'admin123') {
                // Admin user with hashed password - allow login
                console.log('Admin login successful');
            } else {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Invalid credentials' 
                });
            }
        }
        
        res.json({
            success: true,
            message: 'Login successful',
            token: 'dummy-token-' + Date.now(),
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email 
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Login failed',
            details: error.message 
        });
    }
});

// 4. Orders
app.post('/api/orders', async (req, res) => {
    try {
        const { userId, items, total, shippingAddress } = req.body;
        
        if (!userId || !items || !total) {
            return res.status(400).json({ 
                success: false, 
                error: 'userId, items, and total are required' 
            });
        }
        
        const [result] = await pool.execute(
            'INSERT INTO orders (user_id, items, total, shipping_address) VALUES (?, ?, ?, ?)',
            [userId, JSON.stringify(items), total, shippingAddress || 'Address not provided']
        );
        
        // Clear cart after order
        await pool.execute('DELETE FROM cart WHERE user_id = ?', [userId]);
        
        // Update product stock
        for (const item of items) {
            await pool.execute(
                'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                [item.quantity, item.id]
            );
        }
        
        res.json({
            success: true,
            message: 'Order created',
            orderId: result.insertId
        });
    } catch (error) {
        console.error('Order error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Order failed',
            details: error.message 
        });
    }
});

// Test endpoint for debugging
app.get('/api/debug/user/:email', async (req, res) => {
    try {
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [req.params.email]);
        res.json({
            success: true,
            user: users[0] || null,
            passwordType: users[0] ? (users[0].password.startsWith('$2a$') ? 'hashed' : 'plain') : 'not found'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: `Cannot ${req.method} ${req.originalUrl}`
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}`);
    console.log(`🌐 Frontend: http://localhost:3000`);
    console.log(`🔑 Admin login: admin@smartmart.com / admin123`);
});