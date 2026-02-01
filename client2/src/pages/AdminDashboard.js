import { useState, useEffect } from 'react';
import { productService, orderService, analyticsService } from '../services/api';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const makeEmptyProduct = () => ({
    name: '',
    brand: 'Nike',
    category: 'Running',
    price: 0,
    discountPercentage: 0,
    description: '',
    mainImage: '',
    gender: 'Unisex',
    colors: [
      {
        name: 'Default',
        hexCode: '#000000',
        imageUrl: '',
        sizes: [{ size: '8', stock: 10 }]
      }
    ]
  });

  const [formData, setFormData] = useState({ ...makeEmptyProduct() });

  useEffect(() => {
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'analytics') fetchAnalytics();
  }, [activeTab]);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll();
      const payload = response.data;
      const data = payload?.data ?? payload;
      const list = Array.isArray(data) ? data : (data?.products ?? data?.items ?? []);
      setProducts(list);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await orderService.getAll();
      const payload = response.data;
      const data = payload?.data ?? payload;
      const list = Array.isArray(data) ? data : (data?.orders ?? data?.items ?? []);
      setOrders(list);
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

      const pick = (resp) => {
        const payload = resp?.data;
        const data = payload?.data ?? payload;
        return data;
      };

      setAnalytics({
        revenue: pick(revenue),
        topRated: pick(topRated),
        inventory: pick(inventory)
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const normalizeHex = (hex) => {
    if (!hex) return '#000000';
    let h = String(hex).trim();
    if (!h.startsWith('#')) h = `#${h}`;
    if (/^#([0-9a-fA-F]{3})$/.test(h)) {
      const a = h[1], b = h[2], c = h[3];
      return `#${a}${a}${b}${b}${c}${c}`;
    }
    return h;
  };

  const clampDiscount = (v) => {
    const n = Number(v);
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(90, n));
  };

  const updateColorField = (colorIndex, field, value) => {
    setFormData((prev) => {
      const colors = (prev.colors || []).map((c, idx) => (idx === colorIndex ? { ...c, [field]: value } : c));
      return { ...prev, colors };
    });
  };

  const addColor = () => {
    setFormData((prev) => ({
      ...prev,
      colors: [
        ...(prev.colors || []),
        { name: 'New Color', hexCode: '#111111', imageUrl: '', sizes: [{ size: '8', stock: 0 }] }
      ]
    }));
  };

  const removeColor = (colorIndex) => {
    setFormData((prev) => {
      const next = (prev.colors || []).filter((_, idx) => idx !== colorIndex);
      return { ...prev, colors: next.length ? next : makeEmptyProduct().colors };
    });
  };

  const updateSizeField = (colorIndex, sizeIndex, field, value) => {
    setFormData((prev) => {
      const colors = (prev.colors || []).map((c, ci) => {
        if (ci !== colorIndex) return c;
        const sizes = (c.sizes || []).map((s, si) => (si === sizeIndex ? { ...s, [field]: value } : s));
        return { ...c, sizes };
      });
      return { ...prev, colors };
    });
  };

  const addSize = (colorIndex) => {
    setFormData((prev) => {
      const colors = (prev.colors || []).map((c, ci) => {
        if (ci !== colorIndex) return c;
        const sizes = [...(c.sizes || []), { size: '9', stock: 0 }];
        return { ...c, sizes };
      });
      return { ...prev, colors };
    });
  };

  const removeSize = (colorIndex, sizeIndex) => {
    setFormData((prev) => {
      const colors = (prev.colors || []).map((c, ci) => {
        if (ci !== colorIndex) return c;
        const sizes = (c.sizes || []).filter((_, si) => si !== sizeIndex);
        return { ...c, sizes: sizes.length ? sizes : [{ size: '8', stock: 0 }] };
      });
      return { ...prev, colors };
    });
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    try {
      if (!formData.description || formData.description.trim().length < 10) {
        alert('Description must be at least 10 characters');
        return;
      }
      if (!formData.colors || formData.colors.length === 0) {
        alert('Add at least one color');
        return;
      }

      const cleanedColors = (formData.colors || [])
        .filter((c) => c && String(c.name || '').trim())
        .map((c) => ({
          name: String(c.name).trim(),
          hexCode: normalizeHex(c.hexCode),
          imageUrl: String(c.imageUrl || '').trim(),
          sizes: (c.sizes || [])
            .filter((s) => s && String(s.size || '').trim())
            .map((s) => ({
              size: String(s.size),
              stock: Math.max(0, Number(s.stock) || 0)
            }))
        }))
        .filter((c) => c.sizes && c.sizes.length > 0);

      if (cleanedColors.length === 0) {
        alert('Each color must have at least one size');
        return;
      }

      const productData = {
        ...formData,
        price: Number(formData.price) || 0,
        discountPercentage: clampDiscount(formData.discountPercentage),
        colors: cleanedColors
      };

      if (editingProduct) {
        await productService.update(editingProduct._id, productData);
      } else {
        await productService.create(productData);
      }

      setShowProductForm(false);
      setEditingProduct(null);
      setFormData(makeEmptyProduct());
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to save product';
      alert(msg);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productService.delete(id);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      const msg = error?.response?.data?.message || error?.message || 'Failed to delete product';
      alert(msg);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product?.name || '',
      brand: product?.brand || 'Nike',
      category: product?.category || 'Running',
      price: Number(product?.price) || 0,
      discountPercentage: clampDiscount(product?.discountPercentage ?? 0),
      description: product?.description || '',
      mainImage: product?.mainImage || '',
      gender: product?.gender || 'Unisex',
      colors: (product?.colors && product.colors.length > 0)
        ? product.colors.map((c) => ({
            name: c.name,
            hexCode: c.hexCode,
            imageUrl: c.imageUrl || '',
            sizes: (c.sizes || []).map((s) => ({ size: String(s.size), stock: Number(s.stock) || 0 }))
          }))
        : makeEmptyProduct().colors
    });
    setShowProductForm(true);
  };

  const handleToggleForm = () => {
    if (showProductForm) {
      setShowProductForm(false);
      setEditingProduct(null);
      setFormData(makeEmptyProduct());
      return;
    }
    setEditingProduct(null);
    setFormData(makeEmptyProduct());
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

      {activeTab === 'products' && (
        <div className="products-tab">
          <div className="tab-header">
            <h2>Products Management</h2>
            <button onClick={handleToggleForm}>
              {showProductForm ? 'Cancel' : 'Add New Product'}
            </button>
          </div>

          {showProductForm && (
            <form className="product-form" onSubmit={handleSubmitProduct}>
              <input
                type="text"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <select
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />

              <input
                type="number"
                placeholder="Discount % (0-90)"
                min="0"
                max="90"
                value={formData.discountPercentage}
                onChange={(e) =>
                  setFormData({ ...formData, discountPercentage: clampDiscount(e.target.value) })
                }
              />

              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />

              <input
                type="url"
                placeholder="Image URL"
                value={formData.mainImage}
                onChange={(e) => setFormData({ ...formData, mainImage: e.target.value })}
                required
              />

              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Unisex">Unisex</option>
                <option value="Kids">Kids</option>
              </select>

              <div className="variants">
                <div className="variants-head">
                  <div className="variants-title">
                    <h3>Variants</h3>
                    <p>Manage colors, sizes and stock.</p>
                  </div>
                  <button type="button" className="add-variant" onClick={addColor}>+ Add Color</button>
                </div>

                {(formData.colors || []).map((color, colorIndex) => (
                  <div className="variant-card" key={`${colorIndex}-${color?.name || 'color'}`}>
                    <div className="variant-top">
                      <div className="variant-title">
                        <span className="swatch" style={{ background: normalizeHex(color.hexCode) }} />
                        <strong>Color #{colorIndex + 1}</strong>
                      </div>
                      <button type="button" className="remove-variant" onClick={() => removeColor(colorIndex)}>
                        Remove
                      </button>
                    </div>

                    <div className="variant-fields">
                      <input
                        type="text"
                        placeholder="Color name (e.g., Red)"
                        value={color.name}
                        onChange={(e) => updateColorField(colorIndex, 'name', e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        placeholder="#RRGGBB (e.g., #ff0000)"
                        value={color.hexCode}
                        onChange={(e) => updateColorField(colorIndex, 'hexCode', e.target.value)}
                        required
                      />
                      <input
                        type="url"
                        placeholder="Color image URL (optional)"
                        value={color.imageUrl || ''}
                        onChange={(e) => updateColorField(colorIndex, 'imageUrl', e.target.value)}
                      />
                    </div>

                    <div className="sizes-head">
                      <h4>Sizes & Stock</h4>
                      <button type="button" className="add-size" onClick={() => addSize(colorIndex)}>+ Add Size</button>
                    </div>

                    <div className="sizes-grid">
                      {(color.sizes || []).map((s, sizeIndex) => (
                        <div className="size-row" key={`${colorIndex}-${sizeIndex}`}>
                          <select
                            value={String(s.size)}
                            onChange={(e) => updateSizeField(colorIndex, sizeIndex, 'size', e.target.value)}
                          >
                            {['5', '6', '7', '8', '9', '10', '11', '12', '13', '14'].map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min="0"
                            placeholder="Stock"
                            value={s.stock}
                            onChange={(e) => updateSizeField(colorIndex, sizeIndex, 'stock', e.target.value)}
                          />
                          <button
                            type="button"
                            className="remove-size"
                            onClick={() => removeSize(colorIndex, sizeIndex)}
                            title="Remove size"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

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
              {products.map((product) => (
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
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>#{order._id.slice(-8).toUpperCase()}</td>
                  <td>{order.userName}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>${Number(order.totalAmount || 0).toFixed(2)}</td>
                  <td>
                    <span className={`status ${String(order.orderStatus || '').toLowerCase()}`}>
                      {order.orderStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'analytics' && analytics && (
        <div className="analytics-tab">
          <h2>Analytics Dashboard</h2>

          <div className="analytics-grid">
            <div className="analytics-card">
              <h3>Revenue by Category</h3>
              {(analytics?.revenue?.byCategory || []).map((cat) => (
                <div key={cat.category} className="stat-row">
                  <span>{cat.category}</span>
                  <strong>${Number(cat.totalRevenue || 0).toFixed(2)}</strong>
                </div>
              ))}
            </div>

            <div className="analytics-card">
              <h3>Top Rated Products</h3>
              {(analytics?.topRated || []).map((product) => (
                <div key={product._id} className="stat-row">
                  <span>{product.name}</span>
                  <span>⭐ {product.averageRating}</span>
                </div>
              ))}
            </div>

            <div className="analytics-card">
              <h3>Low Stock Alert</h3>
              {(analytics?.inventory?.lowStockProducts || []).map((product) => (
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
