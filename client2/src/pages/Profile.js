import React, { useState, useEffect } from 'react';
import { orderService, authService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Profile.css';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phoneNumber: user?.phoneNumber || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zipCode: user?.address?.zipCode || '',
      country: user?.address?.country || 'USA'
    }
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderService.getMyOrders();
      setOrders(response.data.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const response = await authService.updateProfile(formData);
      
      // Update user in AuthContext
      const updatedUser = response.data.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setMessage({ type: 'success', text: 'Profile successfully updated!' });
      setEditMode(false);
      
      // Force page reload to update user data everywhere
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error updating profile' 
      });
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setFormData({
      name: user?.name || '',
      phoneNumber: user?.phoneNumber || '',
      address: {
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        zipCode: user?.address?.zipCode || '',
        country: user?.address?.country || 'USA'
      }
    });
    setMessage({ type: '', text: '' });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'orange',
      'Processing': 'blue',
      'Shipped': 'purple',
      'Delivered': 'green',
      'Cancelled': 'red'
    };
    return colors[status] || 'gray';
  };

  return (
    <div className="profile-page">
      <h1>My Profile</h1>

      <div className="profile-container">
        {/* User Info */}
        <section className="user-info-section">
          <div className="section-header">
            <h2>Account information</h2>
            {!editMode && (
              <button className="edit-btn" onClick={() => setEditMode(true)}>
                ✏️ Edit
              </button>
            )}
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          {editMode ? (
            /* Edit Form */
            <form onSubmit={handleUpdateProfile} className="edit-form">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Your name"
                />
              </div>

              <div className="form-group">
                <label>Email (does not change)</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="disabled-input"
                />
                <small>Email cannot be changed</small>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+1-555-0100"
                />
              </div>

              <h3 className="form-section-title">Address</h3>

              <div className="form-group">
                <label>Street</label>
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, street: e.target.value }
                  })}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      address: { ...formData.address, city: e.target.value }
                    })}
                    placeholder="New York"
                  />
                </div>

                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    value={formData.address.state}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      address: { ...formData.address, state: e.target.value }
                    })}
                    placeholder="NY"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>zipCode</label>
                  <input
                    type="text"
                    value={formData.address.zipCode}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      address: { ...formData.address, zipCode: e.target.value }
                    })}
                    placeholder="10001"
                  />
                </div>

                <div className="form-group">
                  <label>Страна</label>
                  <input
                    type="text"
                    value={formData.address.country}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      address: { ...formData.address, country: e.target.value }
                    })}
                    placeholder="USA"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn">
                  💾 Save Changes
                </button>
                <button type="button" className="cancel-btn" onClick={handleCancel}>
                  ❌ Cancel
                </button>
              </div>
            </form>
          ) : (
            /* View Mode */
            <div className="info-card">
              <div className="info-row">
                <strong>Имя:</strong>
                <span>{user.name}</span>
              </div>
              <div className="info-row">
                <strong>Email:</strong>
                <span>{user.email}</span>
              </div>
              <div className="info-row">
                <strong>Phone Number:</strong>
                <span>{user.phoneNumber || 'Not specified'}</span>
              </div>
              <div className="info-row">
                <strong>Role:</strong>
                <span className={`role-badge ${user.role}`}>{user.role}</span>
              </div>
              
              {(user.address?.street || user.address?.city) && (
                <>
                  <div className="info-divider"></div>
                  <h3>Address:</h3>
                  <div className="address-display">
                    {user.address.street && <p>{user.address.street}</p>}
                    {(user.address.city || user.address.state || user.address.zipCode) && (
                      <p>
                        {user.address.city && user.address.city}
                        {user.address.state && `, ${user.address.state}`}
                        {user.address.zipCode && ` ${user.address.zipCode}`}
                      </p>
                    )}
                    {user.address.country && <p>{user.address.country}</p>}
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        {/* Order History */}
        <section className="orders-section">
          <h2>Order History</h2>
          {loading ? (
            <p>Loading orders...</p>
          ) : orders.length === 0 ? (
            <p>You don't have any orders yet. Start shopping!</p>
          ) : (
            <div className="orders-list">
              {orders.map(order => (
                <div key={order._id} className="order-card">
                  <div className="order-header">
                    <div>
                      <strong>Order #{order._id.slice(-8).toUpperCase()}</strong>
                      <p className="order-date">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(order.orderStatus) }}
                    >
                      {order.orderStatus}
                    </span>
                  </div>

                  <div className="order-items">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="order-item">
                        <img src={item.productImage} alt={item.productName} />
                        <div className="item-info">
                          <p className="item-name">{item.productName}</p>
                          <p className="item-details">
                            {item.brand} • {item.color} • Size {item.size} • Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="item-price">${item.subtotal.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="order-footer">
                    <div className="order-total">
                      <strong>Total:</strong>
                      <strong>${order.totalAmount.toFixed(2)}</strong>
                    </div>
                    {order.trackingNumber && (
                      <p>Tracking: {order.trackingNumber}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Profile;
