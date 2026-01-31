import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const { getCartItemsCount } = useCart();

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          👟 ShoeStore
        </Link>

        <ul className="nav-menu">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/shop">Shop</Link></li>
          
          {isAuthenticated ? (
            <>
              <li><Link to="/cart">🛒 Cart ({getCartItemsCount()})</Link></li>
              <li><Link to="/profile">Profile</Link></li>
              {isAdmin() && <li><Link to="/admin">Admin</Link></li>}
              <li><button onClick={logout} className="logout-btn">Logout</button></li>
              <li className="user-greeting">Hi, {user?.name}</li>
            </>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
