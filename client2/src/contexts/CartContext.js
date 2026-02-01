import { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, color, size, quantity = 1) => {
    setCart(prevCart => {
      // Check if item already exists in cart
      const existingIndex = prevCart.findIndex(
        item => item.product._id === product._id && 
                item.color === color && 
                item.size === size
      );

      if (existingIndex !== -1) {
        // Update quantity if item exists
        const newCart = [...prevCart];
        newCart[existingIndex].quantity += quantity;
        return newCart;
      } else {
        // Add new item
        return [...prevCart, {
          product,
          color,
          size,
          quantity,
          price: product.finalPrice || product.price
        }];
      }
    });
  };

  const removeFromCart = (productId, color, size) => {
    setCart(prevCart => 
      prevCart.filter(item => 
        !(item.product._id === productId && 
          item.color === color && 
          item.size === size)
      )
    );
  };

  const updateQuantity = (productId, color, size, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, color, size);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.product._id === productId && 
        item.color === color && 
        item.size === size
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
