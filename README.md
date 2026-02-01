# 👟 Online Shoe Store - Advanced NoSQL Project

A full-stack e-commerce application built with Node.js, Express, MongoDB, and React, showcasing advanced NoSQL database features.

## 🎯 Project Overview

This project demonstrates advanced MongoDB features including:
- **Embedded Documents** (colors, sizes, reviews in products)
- **Document References** (users, orders, products)
- **Compound Indexes** (brand + price, category + rating)
- **Text Search Indexes** (full-text search on products)
- **Aggregation Pipelines** (revenue analytics, top-rated products)
- **Advanced Update Operators** ($inc for stock, $push for reviews)
- **Complex Validation** (nested schema validation)
- **Virtual Properties** (calculated fields)
- **Pre/Post Hooks** (auto-calculations, password hashing)

## 📋 Team Division

### Aliya: Data & Security Specialist
**Responsibilities:**
- ✅ Database Setup & Schema Design
- ✅ Authentication System (JWT)
- ✅ Advanced Aggregation Pipelines
- ✅ Advanced Update Operations
- ✅ Database Optimization (Indexes)
- ✅ Order & Analytics Endpoints

**Files Owned:**
- `/server/models/` - All Mongoose models
- `/server/config/db.js` - Database configuration
- `/server/middleware/auth.js` - Authentication middleware
- `/server/middleware/errorHandler.js` - Error Handler middleware
- `/server/controllers/authController.js`
- `/server/controllers/orderController.js`
- `/server/controllers/analyticsController.js`
- `/server/seed.js` - Database seeder
- `/server/server.js`- Server connection

### Alina: Full-Stack & UX Specialist
**Responsibilities:**
- ✅ Frontend Development (React)
- ✅ API Integration (Axios)
- ✅ Product Management (CRUD)
- ✅ Shopping Cart Logic
- ✅ Product Gallery & Filters
- ✅ UI/UX Design

**Files Owned:**
- `/client/src/` - All frontend code
- `/server/controllers/productController.js`
- `/server/routes/productRoutes.js`
- All React components and pages

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)

### Backend Setup

1. Navigate to server directory (1st terminal):
```bash
cd server
npm install
```

2. Create `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/shoe_store
JWT_SECRET=your_super_secret_key_change_in_production
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

3. Seed the database:
```bash
node seed.js
```

4. Start the server:
```bash
npm run dev
```

Server runs on http://localhost:5000

### Frontend Setup

1. Navigate to client directory (2nd terminal):
```bash
cd client
npm install
```

2. Create `.env` file:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

3. Start React app:
```bash
npm start
```

App runs on http://localhost:3000

## 📚 API Endpoints (15+ Routes)

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)
- `PUT /api/auth/profile` - Update profile (Protected)

### Products
- `GET /api/products` - Get all products (with filtering)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PATCH /api/products/:id` - Update product (Admin)
- `PATCH /api/products/:id/stock` - Update stock using $inc (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)
- `POST /api/products/:id/reviews` - Add review using $push (Protected)

### Orders
- `POST /api/orders` - Create order (Protected)
- `GET /api/orders/me` - Get user's orders (Protected)
- `GET /api/orders/:id` - Get order details (Protected)
- `GET /api/orders` - Get all orders (Admin)
- `PATCH /api/orders/:id/status` - Update order status (Admin)
- `DELETE /api/orders/:id` - Cancel order (Protected)

### Analytics (Advanced Aggregations)
- `GET /api/stats/revenue` - Revenue by category (Admin)
- `GET /api/stats/top-rated` - Top-rated products
- `GET /api/stats/best-sellers` - Best-selling products
- `GET /api/stats/sales-trends` - Sales over time (Admin)
- `GET /api/stats/inventory` - Low stock report (Admin)
- `GET /api/stats/customers` - Top customers (Admin)

## 🎨 Frontend Pages (6 Required)

1. **Home Page** (`/`) - Hero section, featured products, categories
2. **Shop/Catalog** (`/shop`) - Product listing with filters (brand, category, price, gender)
3. **Product Detail** (`/product/:id`) - Full product info, color/size selection, reviews
4. **Cart** (`/cart`) - Shopping cart with quantity controls
5. **User Profile/Orders** (`/profile`) - Order history, profile management
6. **Admin Dashboard** (`/admin`) - Product CRUD, analytics, order management
7. **Login** (`/login`) - Login to the system
8. **Register** (`/register`) - Register to the platform
9. **Checkout** (`/checkout`) - Check out the order details

## 🔧 Advanced MongoDB Features Implemented

### 1. Embedded Documents
```javascript
// Product has embedded colors with nested sizes
colors: [{
  name: String,
  hexCode: String,
  sizes: [{
    size: String,
    stock: Number
  }]
}]

// Product has embedded reviews
reviews: [{
  user: ObjectId,
  rating: Number,
  comment: String
}]
```

### 2. Document References
```javascript
// Order references User
user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
}

// With denormalization for performance
userName: String,  // Snapshot at order time
userEmail: String
```

### 3. Compound Indexes
```javascript
// Optimize brand + price filtering
productSchema.index({ brand: 1, price: 1 });

// Optimize category browsing
productSchema.index({ category: 1, averageRating: -1 });
```

### 4. Text Search Index
```javascript
// Full-text search on multiple fields
productSchema.index({ 
  name: 'text', 
  description: 'text', 
  brand: 'text' 
}, {
  weights: { name: 10, brand: 5, description: 1 }
});
```

### 5. Advanced Update Operators

**$inc - Decrease Stock:**
```javascript
// In productController.js
Product.findByIdAndUpdate(
  id,
  { $inc: { [`colors.${colorIndex}.sizes.${sizeIndex}.stock`]: -quantity } }
);
```

**$push - Add Review:**
```javascript
// In productController.js
Product.findByIdAndUpdate(
  id,
  { $push: { reviews: reviewData } }
);
```

### 6. Aggregation Pipelines

**Revenue by Category:**
```javascript
Order.aggregate([
  { $match: { orderStatus: { $ne: 'Cancelled' } } },
  { $unwind: '$items' },
  { $lookup: { from: 'products', ... } },
  { $group: { _id: '$productDetails.category', totalRevenue: { $sum: '$items.subtotal' } } },
  { $sort: { totalRevenue: -1 } }
]);
```

**Top-Rated Products:**
```javascript
Product.aggregate([
  { $match: { isActive: true, totalReviews: { $gte: 5 } } },
  { $sort: { averageRating: -1, totalReviews: -1 } },
  { $limit: 10 }
]);
```

## 🔐 Test Credentials

After running `node seed.js`:

**Admin Account:**
- Email: `admin@shoestore.com`
- Password: `admin123`

**User Account:**
- Email: `john@example.com`
- Password: `password123`

## 📊 Database Schema Highlights

### User Model
- Embedded address document
- Password hashing with bcrypt
- Role-based access (user/admin)
- Compound index on email + role

### Product Model
- Array of embedded color options
- Nested size variants with stock tracking
- Array of embedded reviews
- Text index for search
- Multiple compound indexes
- Virtual properties (finalPrice, inStock)
- Pre-save hooks for calculations

### Order Model
- Reference to User collection
- Embedded order items (denormalized)
- Embedded shipping address
- Status history tracking
- Compound indexes for queries

## 🧪 Testing the Application

### Test Aggregation Queries

1. **Revenue Stats** (Admin only):
```bash
GET http://localhost:5000/api/stats/revenue
Authorization: Bearer YOUR_ADMIN_TOKEN
```

2. **Top-Rated Products** (Public):
```bash
GET http://localhost:5000/api/stats/top-rated?limit=5
```

3. **Sales Trends** (Admin only):
```bash
GET http://localhost:5000/api/stats/sales-trends?period=daily&days=30
Authorization: Bearer YOUR_ADMIN_TOKEN
```

### Test Advanced Updates

1. **Update Stock** (Admin only):
```bash
PATCH http://localhost:5000/api/products/:id/stock
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_TOKEN

{
  "colorName": "Black",
  "size": "9",
  "quantity": -1  // Decrease by 1
}
```

2. **Add Review** (Authenticated user):
```bash
POST http://localhost:5000/api/products/:id/reviews
Content-Type: application/json
Authorization: Bearer YOUR_USER_TOKEN

{
  "rating": 5,
  "comment": "Excellent product!"
}
```

## 📁 Project Structure
```
SHOE-STORE-PROJECT/
├── server/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js        # Auth logic
│   │   ├── productController.js     # Product CRUD + search
│   │   ├── orderController.js       # Order management
│   │   └── analyticsController.js   # Aggregation queries
│   ├── models/
│   │   ├── User.js                  # User schema
│   │   ├── Product.js               # Product schema (advanced)
│   │   └── Order.js                 # Order schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── orderRoutes.js
│   │   └── analyticsRoutes.js
│   ├── middleware/
│   │   ├── auth.js                  # JWT verification
│   │   └── errorHandler.js          # Error handling
│   ├── .env
│   ├── server.js                    # Entry point
│   ├── seed.js                      # Database seeder
│   └── package.json
│
└── client2/
    ├── src/
    │   ├── components/              # Reusable components
    │   ├── pages/                   # Main pages
    │   │   ├── Home.js
    │   │   ├── Shop.js
    │   │   ├── ProductDetail.js
    │   │   ├── Cart.js
    │   │   ├── Profile.js
    │   │   |── AdminDashboard.js
    │   │   ├── Checkout.js
    │   │   ├── Login.js
    │   │   └── Register.js
    │   ├── contexts/
    │   │   ├── AuthContext.js       # Auth state management
    │   │   └── CartContext.js       # Cart state management
    │   ├── services/
    │   │   └── api.js               # Axios API calls
    │   ├── styles/                  # CSS files
    │   │   ├── Home.css
    │   │   ├── Shop.css
    │   │   ├── ProductDetail.css
    │   │   ├── Cart.css
    │   │   ├── Profile.css
    │   │   |── AdminDashboard.css
    │   │   ├── Checkout.css
    │   │   ├── Login.css
    │   │   |── Register.css
    │   │   ├── base.css
    │   │   ├── ui.css
    │   │   └── layout.css
    │   └── App.js
    └── package.json
```

## 🎓 Learning Outcomes

This project demonstrates:
✅ Advanced NoSQL database design
✅ Embedded vs. referenced data strategies
✅ Complex schema validation
✅ Index optimization for queries
✅ Aggregation framework mastery
✅ Advanced update operators
✅ Full-stack JavaScript development
✅ RESTful API design
✅ JWT authentication
✅ React state management
✅ Responsive UI design

