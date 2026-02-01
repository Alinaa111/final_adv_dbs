import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/api';
import '../styles/Home.css';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await productService.getFeatured();
      setFeaturedProducts(response.data.data);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Step Into Style</h1>
          <p>Discover the latest collection of premium shoes</p>
          <Link to="/shop" className="cta-button">Shop Now</Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section">
        <h2>Featured Products</h2>
        
        {loading ? (
          <div className="loading">Loading products...</div>
        ) : (
          <div className="products-grid">
            {featuredProducts.map(product => (
              <div key={product._id} className="product-card">
                <Link to={`/product/${product._id}`}>
                  <img src={product.mainImage} alt={product.name} />
                  <div className="product-info">
                    <span className="brand">{product.brand}</span>
                    <h3>{product.name}</h3>
                    <div className="price-section">
                      {product.discountPercentage > 0 ? (
                        <>
                          <span className="original-price">${product.price}</span>
                          <span className="sale-price">${product.finalPrice}</span>
                          <span className="discount">{product.discountPercentage}% OFF</span>
                        </>
                      ) : (
                        <span className="price">${product.price}</span>
                      )}
                    </div>
                    {product.averageRating > 0 && (
                      <div className="rating">
                        {'⭐'.repeat(Math.round(product.averageRating))}
                        <span>({product.totalReviews})</span>
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <h2>Shop by Category</h2>
        <div className="categories-grid">
          {['Running', 'Basketball', 'Casual', 'Training'].map(category => (
            <Link 
              key={category} 
              to={`/shop?category=${category}`} 
              className="category-card"
            >
              <h3>{category}</h3>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
