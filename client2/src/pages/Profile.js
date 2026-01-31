import React, { useState, useEffect } from 'react';
import { orderService } from '../services/api';
import { useAuth } from '../../../client2/src/contexts/AuthContext';
import '../styles/Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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
          <h2>Account Information</h2>
          <div className="info-card">
            <div className="info-row">
              <strong>Name:</strong>
              <span>{user.name}</span>
            </div>
            <div className="info-row">
              <strong>Email:</strong>
              <span>{user.email}</span>
            </div>
            <div className="info-row">
              <strong>Account Type:</strong>
              <span className={`role-badge ${user.role}`}>{user.role}</span>
            </div>
          </div>
        </section>

        {/* Order History */}
        <section className="orders-section">
          <h2>Order History</h2>
          {loading ? (
            <p>Loading orders...</p>
          ) : orders.length === 0 ? (
            <p>No orders yet. Start shopping!</p>
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
