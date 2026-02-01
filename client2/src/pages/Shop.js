import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productService } from '../services/api';
import '../styles/Shop.css';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    brand: searchParams.get('brand') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    gender: searchParams.get('gender') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    order: searchParams.get('order') || 'desc'
  });

  useEffect(() => {
    fetchProducts();
  }, [searchParams]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(searchParams);
      const response = await productService.getAll(params);
      setProducts(response.data.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    
    // Update URL params
    const params = {};
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key]) {
        params[key] = newFilters[key];
      }
    });
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      brand: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      gender: '',
      sortBy: 'createdAt',
      order: 'desc'
    });
    setSearchParams({});
  };

  return (
    <div className="shop-page">
      <h1>Shop All Shoes</h1>
      
      <div className="shop-container">
        {/* Filters Sidebar */}
        <aside className="filters-sidebar">
          <div className="filter-header">
            <h2>Filters</h2>
            <button onClick={clearFilters} className="clear-btn">Clear All</button>
          </div>

          {/* Search */}
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          {/* Brand Filter */}
          <div className="filter-group">
            <label>Brand</label>
            <select
              value={filters.brand}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
            >
              <option value="">All Brands</option>
              <option value="Nike">Nike</option>
              <option value="Adidas">Adidas</option>
              <option value="Puma">Puma</option>
              <option value="Reebok">Reebok</option>
              <option value="New Balance">New Balance</option>
              <option value="Converse">Converse</option>
              <option value="Vans">Vans</option>
              <option value="Under Armour">Under Armour</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="filter-group">
            <label>Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Running">Running</option>
              <option value="Basketball">Basketball</option>
              <option value="Casual">Casual</option>
              <option value="Training">Training</option>
              <option value="Soccer">Soccer</option>
              <option value="Tennis">Tennis</option>
              <option value="Walking">Walking</option>
            </select>
          </div>

          {/* Gender Filter */}
          <div className="filter-group">
            <label>Gender</label>
            <select
              value={filters.gender}
              onChange={(e) => handleFilterChange('gender', e.target.value)}
            >
              <option value="">All</option>
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Unisex">Unisex</option>
              <option value="Kids">Kids</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="filter-group">
            <label>Price Range</label>
            <div className="price-inputs">
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </div>
          </div>

          {/* Sort */}
          <div className="filter-group">
            <label>Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="createdAt">Newest</option>
              <option value="price">Price</option>
              <option value="averageRating">Rating</option>
              <option value="soldCount">Popularity</option>
              <option value="name">Name</option>
            </select>
            <select
              value={filters.order}
              onChange={(e) => handleFilterChange('order', e.target.value)}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </aside>

        {/* Products Grid */}
        <main className="products-main">
          {loading ? (
            <div className="loading">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="no-products">
              <p>No products found matching your filters.</p>
              <button onClick={clearFilters}>Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="products-count">
                Showing {products.length} products
              </div>
              
              <div className="products-grid">
                {products.map(product => (
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
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Shop;
