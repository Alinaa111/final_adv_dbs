require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@shoestore.com',
    password: 'admin123',
    role: 'admin',
    phoneNumber: '+1-555-0100',
    address: {
      street: '123 Admin Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    }
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'user',
    phoneNumber: '+1-555-0101',
    address: {
      street: '456 User Avenue',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
      country: 'USA'
    }
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    role: 'user',
    phoneNumber: '+1-555-0102'
  }
];

const products = [
  {
    name: 'Air Max 270',
    description: 'The Nike Air Max 270 delivers visible cushioning under every step. Featuring a large Max Air unit in the heel for unrivaled comfort.',
    brand: 'Nike',
    category: 'Running',
    price: 150,
    discountPercentage: 10,
    mainImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
    gender: 'Men',
    isFeatured: true,
    tags: ['comfortable', 'cushioned', 'running'],
    colors: [
      {
        name: 'Black',
        hexCode: '#000000',
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
        sizes: [
          { size: '8', stock: 15 },
          { size: '9', stock: 20 },
          { size: '10', stock: 18 },
          { size: '11', stock: 12 }
        ]
      },
      {
        name: 'White',
        hexCode: '#FFFFFF',
        imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772',
        sizes: [
          { size: '8', stock: 10 },
          { size: '9', stock: 15 },
          { size: '10', stock: 20 },
          { size: '11', stock: 8 }
        ]
      }
    ],
    reviews: []
  },
  {
    name: 'Ultraboost 22',
    description: 'Experience energy return like never before. The adidas Ultraboost 22 features responsive Boost cushioning.',
    brand: 'Adidas',
    category: 'Running',
    price: 180,
    discountPercentage: 15,
    mainImage: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5',
    gender: 'Unisex',
    isFeatured: true,
    tags: ['performance', 'boost', 'energy'],
    colors: [
      {
        name: 'Blue',
        hexCode: '#0000FF',
        imageUrl: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5',
        sizes: [
          { size: '7', stock: 12 },
          { size: '8', stock: 15 },
          { size: '9', stock: 18 },
          { size: '10', stock: 20 }
        ]
      }
    ],
    reviews: []
  },
  {
    name: 'Chuck Taylor All Star',
    description: 'The iconic Converse Chuck Taylor All Star. A timeless classic that never goes out of style.',
    brand: 'Converse',
    category: 'Casual',
    price: 65,
    mainImage: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3',
    gender: 'Unisex',
    isFeatured: true,
    tags: ['classic', 'casual', 'versatile'],
    colors: [
      {
        name: 'Red',
        hexCode: '#FF0000',
        imageUrl: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3',
        sizes: [
          { size: '6', stock: 25 },
          { size: '7', stock: 30 },
          { size: '8', stock: 28 },
          { size: '9', stock: 22 },
          { size: '10', stock: 18 }
        ]
      },
      {
        name: 'Black',
        hexCode: '#000000',
        sizes: [
          { size: '7', stock: 20 },
          { size: '8', stock: 25 },
          { size: '9', stock: 30 }
        ]
      }
    ],
    reviews: []
  },
  {
    name: 'LeBron 19',
    description: 'Designed for explosive play. The Nike LeBron 19 features Max Air and Zoom Air for ultimate court performance.',
    brand: 'Nike',
    category: 'Basketball',
    price: 200,
    discountPercentage: 20,
    mainImage: 'https://images.unsplash.com/photo-1579338559194-a162d19bf842',
    gender: 'Men',
    isFeatured: false,
    tags: ['basketball', 'performance', 'high-top'],
    colors: [
      {
        name: 'Purple',
        hexCode: '#800080',
        sizes: [
          { size: '9', stock: 10 },
          { size: '10', stock: 12 },
          { size: '11', stock: 15 },
          { size: '12', stock: 8 }
        ]
      }
    ],
    reviews: []
  },
  {
    name: 'Old Skool',
    description: 'The Vans Old Skool features the iconic side stripe and durable suede and canvas uppers.',
    brand: 'Vans',
    category: 'Casual',
    price: 70,
    mainImage: 'https://images.unsplash.com/photo-1543508282-6319a3e2621f',
    gender: 'Unisex',
    isFeatured: false,
    tags: ['skate', 'casual', 'durable'],
    colors: [
      {
        name: 'Black/White',
        hexCode: '#000000',
        sizes: [
          { size: '7', stock: 15 },
          { size: '8', stock: 20 },
          { size: '9', stock: 18 },
          { size: '10', stock: 12 }
        ]
      }
    ],
    reviews: []
  },
  {
    name: 'Puma Suede Classic',
    description: 'A streetwear icon since 1968. The Puma Suede Classic features a premium suede upper.',
    brand: 'Puma',
    category: 'Casual',
    price: 75,
    mainImage: 'https://images.unsplash.com/photo-1584735175315-9d5df23860e6',
    gender: 'Unisex',
    isFeatured: true,
    tags: ['retro', 'suede', 'classic'],
    colors: [
      {
        name: 'Navy',
        hexCode: '#000080',
        sizes: [
          { size: '8', stock: 14 },
          { size: '9', stock: 16 },
          { size: '10', stock: 12 }
        ]
      }
    ],
    reviews: []
  },
  {
    name: '990v5',
    description: 'The New Balance 990v5 combines premium pigskin and mesh uppers with superior ENCAP cushioning.',
    brand: 'New Balance',
    category: 'Running',
    price: 185,
    mainImage: 'https://images.unsplash.com/photo-1539185441755-769473a23570',
    gender: 'Unisex',
    isFeatured: false,
    tags: ['premium', 'cushioned', 'made-in-usa'],
    colors: [
      {
        name: 'Grey',
        hexCode: '#808080',
        sizes: [
          { size: '8', stock: 10 },
          { size: '9', stock: 12 },
          { size: '10', stock: 15 },
          { size: '11', stock: 8 }
        ]
      }
    ],
    reviews: []
  },
  {
    name: 'Club C 85',
    description: 'Reebok Club C 85 brings retro tennis style to the streets with a soft leather upper.',
    brand: 'Reebok',
    category: 'Casual',
    price: 80,
    discountPercentage: 5,
    mainImage: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a',
    gender: 'Unisex',
    isFeatured: false,
    tags: ['retro', 'tennis', 'leather'],
    colors: [
      {
        name: 'White/Green',
        hexCode: '#FFFFFF',
        sizes: [
          { size: '7', stock: 18 },
          { size: '8', stock: 22 },
          { size: '9', stock: 20 },
          { size: '10', stock: 15 }
        ]
      }
    ],
    reviews: []
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});

    // Create users
    console.log('👥 Creating users...');
    const createdUsers = await User.create(users);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Create products
    console.log('👟 Creating products...');
    const createdProducts = await Product.create(products);
    console.log(`✅ Created ${createdProducts.length} products`);

    // Add sample reviews to products
    console.log('⭐ Adding sample reviews...');
    const johnUser = createdUsers.find(u => u.email === 'john@example.com');
    const janeUser = createdUsers.find(u => u.email === 'jane@example.com');

    // Add reviews to first 3 products
    for (let i = 0; i < 3 && i < createdProducts.length; i++) {
      await createdProducts[i].addReview(
        johnUser._id,
        johnUser.name,
        5,
        'Excellent quality! Very comfortable and stylish.'
      );
      
      await createdProducts[i].addReview(
        janeUser._id,
        janeUser.name,
        4,
        'Great shoes, fits perfectly. Highly recommend!'
      );
    }

    // Create sample order
    console.log('📦 Creating sample order...');

    const orderItems = [
      {
        product: createdProducts[0]._id,
        productName: createdProducts[0].name,
        productImage: createdProducts[0].mainImage,
        brand: createdProducts[0].brand,
        color: createdProducts[0].colors[0].name,
        size: '9',
        priceAtPurchase: createdProducts[0].finalPrice,
        quantity: 1,
        subtotal: createdProducts[0].finalPrice
      }
    ];

    const orderSubtotal = orderItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    const totalAmount = orderSubtotal; 


    const sampleOrder = await Order.create({
      user: johnUser._id,
      userEmail: johnUser.email,
      userName: johnUser.name,
      items: orderItems,
      subtotal: orderSubtotal,
      totalAmount: totalAmount,
      shippingAddress: {
        street: '456 User Avenue',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90001',
        country: 'USA',
        phoneNumber: '+1-555-0101'
      },
      paymentMethod: 'Credit Card',
      customerNotes: 'Please deliver in the morning'
    });


    console.log(' Created sample order');

    console.log('\n');
    console.log('║    Database seeded successfully!                    ║');
    
    console.log('║   🔐 Test Credentials:                                ║');
    console.log('║   Admin:  admin@shoestore.com / admin123             ║');
    console.log('║   User:   john@example.com / password123             ║');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();
