import React, { useState, useEffect } from 'react';
import { productService, orderService, analyticsService } from '../services/api';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '', brand: 'Nike', category: 'Running', price: 0,
    description: '', mainImage: '', gender: 'Unisex'
  });

  useEffect(() => {
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'analytics') fetchAnalytics();
  }, [activeTab]);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll();
      setProducts(response.data.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await orderService.getAll();
      setOrders(response.data.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const [revenue, topRated, inventory] = await Promise.all([
        analyticsService.getRevenue(),
        analyticsService.getTopRated(),
        analyticsService.getInventory()
      ]);
      setAnalytics({
        revenue: revenue.data.data,
        topRated: topRated.data.data,
        inventory: inventory.data.data
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...formData,
        colors: [{
          name: 'Default',
          hexCode: '#000000',
          sizes: [
            { size: '8', stock: 10 },
            { size: '9', stock: 10 },
            { size: '10', stock: 10 }
          ]
        }]
      };

      if (editingProduct) {
        await productService.update(editingProduct._id, productData);
      } else {
        await productService.create(productData);
      }
      
      setShowProductForm(false);
      setEditingProduct(null);
      setFormData({
        name: '', brand: 'Nike', category: 'Running', price: 0,
        description: '', mainImage: '', gender: 'Unisex'
      });
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productService.delete(id);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price,
      description: product.description,
      mainImage: product.mainImage,
      gender: product.gender
    });
    setShowProductForm(true);
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      <div className="tabs">
        <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>
          Products
        </button>
        <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>
          Orders
        </button>
        <button className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>
          Analytics
        </button>
      </div>

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="products-tab">
          <div className="tab-header">
            <h2>Products Management</h2>
            <button onClick={() => setShowProductForm(!showProductForm)}>
              {showProductForm ? 'Cancel' : 'Add New Product'}
            </button>
          </div>

          {showProductForm && (
            <form className="product-form" onSubmit={handleSubmitProduct}>
              <input
                type="text"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
              <select
                value={formData.brand}
                onChange={(e) => setFormData({...formData, brand: e.target.value})}
              >
                <option value="Nike">Nike</option>
                <option value="Adidas">Adidas</option>
                <option value="Puma">Puma</option>
                <option value="Reebok">Reebok</option>
                <option value="New Balance">New Balance</option>
                <option value="Converse">Converse</option>
                <option value="Vans">Vans</option>
              </select>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="Running">Running</option>
                <option value="Basketball">Basketball</option>
                <option value="Casual">Casual</option>
                <option value="Training">Training</option>
              </select>
              <input
                type="number"
                placeholder="Price"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                required
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              />
              <input
                type="url"
                placeholder="Image URL"
                value={formData.mainImage}
                onChange={(e) => setFormData({...formData, mainImage: e.target.value})}
                required
              />
              <select
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
              >
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Unisex">Unisex</option>
                <option value="Kids">Kids</option>
              </select>
              <button type="submit">{editingProduct ? 'Update' : 'Create'} Product</button>
            </form>
          )}

          <table className="products-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product._id}>
                  <td><img src={product.mainImage} alt={product.name} width="50" /></td>
                  <td>{product.name}</td>
                  <td>{product.brand}</td>
                  <td>${product.price}</td>
                  <td>{product.totalStock}</td>
                  <td>
                    <button onClick={() => handleEditProduct(product)}>Edit</button>
                    <button onClick={() => handleDeleteProduct(product._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="orders-tab">
          <h2>Orders Management</h2>
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td>#{order._id.slice(-8).toUpperCase()}</td>
                  <td>{order.userName}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>${order.totalAmount.toFixed(2)}</td>
                  <td><span className={`status ${order.orderStatus.toLowerCase()}`}>{order.orderStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && analytics && (
        <div className="analytics-tab">
          <h2>Analytics Dashboard</h2>
          
          <div className="analytics-grid">
            <div className="analytics-card">
              <h3>Revenue by Category</h3>
              {analytics.revenue.byCategory.map(cat => (
                <div key={cat.category} className="stat-row">
                  <span>{cat.category}</span>
                  <strong>${cat.totalRevenue.toFixed(2)}</strong>
                </div>
              ))}
            </div>

            <div className="analytics-card">
              <h3>Top Rated Products</h3>
              {analytics.topRated.map(product => (
                <div key={product._id} className="stat-row">
                  <span>{product.name}</span>
                  <span>⭐ {product.averageRating}</span>
                </div>
              ))}
            </div>

            <div className="analytics-card">
              <h3>Low Stock Alert</h3>
              {analytics.inventory.lowStockProducts.map(product => (
                <div key={product._id} className="stat-row warning">
                  <span>{product.name}</span>
                  <strong>{product.totalStock} units</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
