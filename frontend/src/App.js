// App.js - Minimal SmartMart Frontend
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';

// Setup
axios.defaults.baseURL = 'http://localhost:5000/api';

// Set auth header from localStorage on initial load
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Add request interceptor to handle auth errors
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const safeNumber = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};

// Helper function to safely parse user from localStorage
const getParsedUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr || userStr === "undefined" || userStr === "null") {
    return null;
  }
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error("Error parsing user:", error);
    return null;
  }
};

// Styles
const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '2rem' },
  nav: { 
    background: '#fff', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 1000 
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem' },
  card: { 
    background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s'
  },
  btn: { 
    background: '#4f46e5', color: 'white', border: 'none', padding: '10px 20px', 
    borderRadius: '6px', cursor: 'pointer', width: '100%', marginTop: '10px'
  },
  hero: { 
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: 'white', 
    padding: '3rem 2rem', borderRadius: '8px', textAlign: 'center', marginBottom: '2rem' 
  },
  form: { maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' },
  input: { padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem' },
};

// Components
const Navbar = ({ user, cartCount, onLogout }) => (
  <nav style={styles.nav}>
    <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4f46e5', textDecoration: 'none' }}>
      🛍️ SmartMart
    </Link>
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#666' }}>Home</Link>
      <Link to="/products" style={{ textDecoration: 'none', color: '#666' }}>Products</Link>
      <Link to="/cart" style={{ textDecoration: 'none', color: '#666' }}>
        Cart {cartCount > 0 && <span style={{background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 8px', fontSize: '0.8rem', marginLeft: '5px'}}>{cartCount}</span>}
      </Link>
      {user ? (
        <>
          <span style={{ color: '#4f46e5' }}>Hi, {user.name}</span>
          {user.email === 'admin@smartmart.com' && (
            <Link to="/admin" style={{ ...styles.btn, padding: '8px 16px', background: '#10b981' }}>Admin</Link>
          )}
          <button onClick={onLogout} style={{ ...styles.btn, padding: '8px 16px', background: '#ef4444' }}>Logout</button>
        </>
      ) : (
        <>
          <Link to="/login" style={{ ...styles.btn, padding: '8px 16px' }}>Login</Link>
          <Link to="/register" style={{ ...styles.btn, padding: '8px 16px', background: '#7c3aed' }}>Sign Up</Link>
        </>
      )}
    </div>
  </nav>
);

const ProductCard = ({ product, addToCart }) => {
  const price = safeNumber(product.price);
  const discount = safeNumber(product.discount_percent) || 0;
  const finalPrice = discount > 0 ? price * (100 - discount) / 100 : price;
  const stock = product.stock_quantity || 0;
  const inStock = stock > 0;
  const imageUrl = product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop';

  const [adding, setAdding] = useState(false);

  const handleAddToCart = async () => {
    if (!inStock || adding) return;
    
    setAdding(true);
    try {
      const success = await addToCart(product.id, 1);
      // Note: alert is now handled in addToCart function
    } catch (error) {
      console.error('Add to cart error:', error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={{ height: '150px', overflow: 'hidden', position: 'relative' }}>
        <img src={imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {discount > 0 && (
          <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
            -{discount}%
          </div>
        )}
      </div>
      <div style={{ padding: '1rem' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>{product.name}</h3>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '10px', height: '40px', overflow: 'hidden' }}>
          {product.description?.substring(0, 80) || 'High quality product'}...
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4f46e5' }}>${finalPrice.toFixed(2)}</span>
            {discount > 0 && <span style={{ fontSize: '0.9rem', color: '#999', textDecoration: 'line-through', marginLeft: '8px' }}>${price.toFixed(2)}</span>}
          </div>
          <span style={{ fontSize: '0.8rem', background: '#e0e7ff', color: '#4f46e5', padding: '3px 8px', borderRadius: '10px' }}>
            {product.category}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
          <span style={{ color: inStock ? '#10b981' : '#ef4444' }}>
            {inStock ? `${stock} in stock` : 'Out of stock'}
          </span>
          {discount > 0 && <span style={{ color: '#10b981' }}>Save ${(price - finalPrice).toFixed(2)}</span>}
        </div>
        <button onClick={handleAddToCart} style={{ ...styles.btn, background: inStock ? '#4f46e5' : '#999' }} disabled={!inStock || adding}>
          {adding ? 'Adding...' : inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
};

// Pages
const Home = ({ addToCart }) => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get('/products').then(res => {
      if (res.data.success && Array.isArray(res.data.products)) {
        setProducts(res.data.products.slice(0, 4));
      } else {
        setProducts([]);
      }
    }).catch(() => setProducts([]));
  }, []);
  
  return (
    <div>
      <div style={styles.hero}>
        <h1 style={{ margin: '0 0 1rem 0' }}>Welcome to SmartMart</h1>
        <p style={{ marginBottom: '2rem', opacity: 0.9 }}>Your one-stop shop for electronics and fashion</p>
        <Link to="/products" style={{ ...styles.btn, background: 'white', color: '#4f46e5', display: 'inline-block' }}>
          Shop Now
        </Link>
      </div>
      <h2>Featured Products</h2>
      <div style={styles.grid}>
        {products.map(p => <ProductCard key={p.id} product={p} addToCart={addToCart} />)}
      </div>
    </div>
  );
};

const Products = ({ addToCart }) => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get('/products').then(res => {
      if (res.data.success && Array.isArray(res.data.products)) {
        setProducts(res.data.products);
      } else {
        console.error('Unexpected response:', res.data);
        setProducts([]);
      }
    }).catch(err => {
      console.error('Error fetching products:', err);
      setProducts([]);
    });
  }, []);
  
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>All Products</h1>
        <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...styles.input, width: '300px' }} />
      </div>
      <div style={styles.grid}>
        {filtered.map(p => <ProductCard key={p.id} product={p} addToCart={addToCart} />)}
      </div>
    </div>
  );
};

const Cart = ({ updateCartCount }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = getParsedUser();
    
    if (!token || !user) {
      setLoading(false);
      return;
    }
    
    axios.get(`/cart?userId=${user.id}`).then(res => { 
      if (res.data.success && Array.isArray(res.data.cart_items)) {
        setItems(res.data.cart_items); 
      } else if (Array.isArray(res.data)) {
        setItems(res.data);
      } else {
        setItems([]);
      }
      setLoading(false); 
    }).catch(() => {
      setItems([]);
      setLoading(false);
    });
  }, []);
  
  const removeItem = async (itemId) => {
    const user = getParsedUser();
    if (!user) return;
    
    await axios.delete(`/cart/${itemId}?userId=${user.id}`);
    setItems(items.filter(i => i.id !== itemId));
    updateCartCount();
  };
  
  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return removeItem(itemId);
    
    const user = getParsedUser();
    if (!user) return;
    
    await axios.put(`/cart/${itemId}`, { quantity, userId: user.id });
    setItems(items.map(i => i.id === itemId ? { ...i, quantity } : i));
    updateCartCount();
  };
  
  const total = items.reduce((sum, item) => {
    const price = item.discount_percent > 0 ? item.price * (100 - item.discount_percent) / 100 : item.price;
    return sum + (price * item.quantity);
  }, 0);
  
  const token = localStorage.getItem('token');
  const user = getParsedUser();
  
  if (!token || !user) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h2>Please login to view cart</h2>
        <Link to="/login" style={styles.btn}>Login Now</Link>
      </div>
    );
  }
  
  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading cart...</div>;
  if (items.length === 0) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <h2>Your cart is empty</h2>
      <Link to="/products" style={styles.btn}>Browse Products</Link>
    </div>
  );
  
  return (
    <div>
      <h1>Shopping Cart</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div>
          {items.map(item => {
            const finalPrice = item.discount_percent > 0 ? item.price * (100 - item.discount_percent) / 100 : item.price;
            return (
              <div key={item.id} style={{ display: 'flex', background: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', alignItems: 'center', gap: '1rem' }}>
                <img src={item.image || item.image_url} alt={item.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px' }} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0 }}>{item.name}</h4>
                  <p style={{ margin: '5px 0', color: '#4f46e5', fontWeight: 'bold' }}>${finalPrice.toFixed(2)} each</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ ...styles.btn, padding: '5px 10px', width: 'auto' }}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ ...styles.btn, padding: '5px 10px', width: 'auto' }}>+</button>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>${(finalPrice * item.quantity).toFixed(2)}</p>
                  <button onClick={() => removeItem(item.id)} style={{ ...styles.btn, background: '#ef4444', padding: '5px 10px' }}>Remove</button>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', height: 'fit-content' }}>
          <h3 style={{ marginTop: 0 }}>Order Summary</h3>
          <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal:</span><span>${total.toFixed(2)}</span></p>
          <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Shipping:</span><span>$0.00</span></p>
          <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax (10%):</span><span>${(total * 0.1).toFixed(2)}</span></p>
          <p style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', paddingTop: '10px', fontWeight: 'bold' }}>
            <span>Total:</span><span>${(total * 1.1).toFixed(2)}</span>
          </p>
          <button onClick={() => {
            const user = getParsedUser();
            if (!user) return;
            
            axios.post('/orders', { 
              userId: user.id, 
              items, 
              total: total * 1.1,
              shippingAddress: '123 Main St' 
            }).then(() => { 
              alert('Order placed!'); 
              setItems([]); 
              updateCartCount(); 
            }).catch(err => alert(err.response?.data?.error || 'Order failed'));
          }} style={{ ...styles.btn, background: '#10b981' }}>
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@smartmart.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Use the correct password from the database - it's not hashed in your setup
      const res = await axios.post('/users/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      onLogin(res.data.user);
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 2rem' }}>
      <div style={{ ...styles.form, background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <h2 style={{ textAlign: 'center', marginTop: 0 }}>Login</h2>
        {error && <p style={{ color: '#ef4444', textAlign: 'center' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} required />
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem' }}>Don't have an account? <Link to="/register" style={{ color: '#4f46e5' }}>Register</Link></p>
        <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '6px', fontSize: '0.9rem', marginTop: '1rem' }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Demo Credentials:</p>
          <p style={{ margin: 0 }}>Email: admin@smartmart.com</p>
          <p style={{ margin: 0 }}>Password: admin123</p>
        </div>
      </div>
    </div>
  );
};

const Register = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await axios.post('/users/register', { name, email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      onLogin(res.data.user);
      window.location.href = '/';
    } catch (err) {
      alert(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 2rem' }}>
      <div style={{ ...styles.form, background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <h2 style={{ textAlign: 'center', marginTop: 0 }}>Register</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} style={styles.input} required />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} required />
          <input type="password" placeholder="Password (min 6)" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} required minLength="6" />
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem' }}>Already have an account? <Link to="/login" style={{ color: '#4f46e5' }}>Login</Link></p>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  return (
    <div>
      <h1 style={{ textAlign: 'center' }}>Admin Dashboard</h1>
      <div style={styles.grid}>
        {[
          { label: 'Total Users', value: '3' },
          { label: 'Total Products', value: '16' },
          { label: 'Total Orders', value: '3' },
          { label: 'Revenue', value: '$3,129.94' }
        ].map((stat, i) => (
          <div key={i} style={{ ...styles.card, padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4f46e5' }}>{stat.value}</div>
            <div style={{ color: '#666' }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main App
function App() {
  const [user, setUser] = useState(() => getParsedUser());
  const [cartCount, setCartCount] = useState(0);
  
  const updateCartCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = getParsedUser();
      
      if (!token || !user) { 
        setCartCount(0); 
        return; 
      }
      
      const res = await axios.get(`/cart?userId=${user.id}`);
      setCartCount(res.data.cart_items?.reduce((sum, item) => sum + item.quantity, 0) || 0);
    } catch { 
      setCartCount(0); 
    }
  };

  useEffect(() => {
    updateCartCount();
  }, [user]);
  
  const addToCart = async (productId, quantity = 1) => {
    try {
      const token = localStorage.getItem('token');
      const user = getParsedUser();
      
      if (!token || !user) { 
        alert('Please login first'); 
        window.location.href = '/login'; 
        return false; 
      }
      
      console.log('Adding to cart:', { userId: user.id, productId, quantity });
      
      const response = await axios.post('/cart', { 
        userId: user.id, 
        productId: Number(productId),
        quantity: Number(quantity) 
      });
      
      console.log('Add to cart response:', response.data);
      
      if (response.data.success) {
        const message = response.data.action === 'updated' 
          ? 'Cart item quantity updated!' 
          : 'Added to cart!';
        alert(message);
        
        await updateCartCount();
        return true;
      } else {
        alert(response.data.error || 'Failed to add to cart');
        return false;
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      
      if (error.response?.data?.code === 'DUPLICATE_ITEM') {
        alert('Item already in cart. Updating quantity...');
        
        try {
          const user = getParsedUser();
          await axios.put(`/cart/${productId}`, { 
            quantity: quantity,
            userId: user.id 
          });
          alert('Quantity updated!');
          await updateCartCount();
          return true;
        } catch (updateError) {
          alert('Failed to update cart quantity');
          return false;
        }
      }
      
      const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Failed to add to cart';
      alert(errorMessage);
      return false;
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    updateCartCount();
  };
  
  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setCartCount(0);
    delete axios.defaults.headers.common['Authorization'];
    window.location.href = '/';
  };
  
  return (
    <Router>
      <div>
        <Navbar user={user} cartCount={cartCount} onLogout={handleLogout} />
        <div style={styles.container}>
          <Routes>
            <Route path="/" element={<Home addToCart={addToCart} />} />
            <Route path="/products" element={<Products addToCart={addToCart} />} />
            <Route path="/cart" element={<Cart updateCartCount={updateCartCount} />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register onLogin={handleLogin} />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;