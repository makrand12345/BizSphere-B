const express = require('express');
const Product = require('../models/Product');
const User = require('../models/User');
const router = express.Router();

// Middleware to verify business owner
const verifyBusinessOwner = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || user.role !== 'owner' || !user.businessVerified) {
      return res.status(403).json({ message: 'Access denied. Business not verified.' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all products for a business (owner only)
router.get('/my-products', verifyBusinessOwner, async (req, res) => {
  try {
    const products = await Product.find({ businessId: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
});

// Get all active products (for customers)
router.get('/', async (req, res) => {
  try {
    const { category, business } = req.query;
    let filter = { isActive: true };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (business) {
      filter.businessId = business;
    }
    
    const products = await Product.find(filter)
      .populate('businessId', 'businessName')
      .sort({ createdAt: -1 });
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('businessId', 'businessName businessVerified');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch product', error: error.message });
  }
});

// Create product (owner only)
router.post('/', verifyBusinessOwner, async (req, res) => {
  try {
    const { name, description, price, category, stock, images } = req.body;
    
    const product = new Product({
      name,
      description,
      price,
      category,
      stock: stock || 0,
      images: images || [],
      businessId: req.user._id,
      businessName: req.user.businessName
    });
    
    await product.save();
    
    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
});

// Update product (owner only)
router.put('/:id', verifyBusinessOwner, async (req, res) => {
  try {
    const product = await Product.findOne({ 
      _id: req.params.id, 
      businessId: req.user._id 
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const { name, description, price, category, stock, images, isActive } = req.body;
    
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    product.stock = stock !== undefined ? stock : product.stock;
    product.images = images || product.images;
    product.isActive = isActive !== undefined ? isActive : product.isActive;
    
    await product.save();
    
    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
});

// Delete product (owner only)
router.delete('/:id', verifyBusinessOwner, async (req, res) => {
  try {
    const product = await Product.findOne({ 
      _id: req.params.id, 
      businessId: req.user._id 
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    await Product.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
});

// Get business stats
router.get('/stats/business', verifyBusinessOwner, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ businessId: req.user._id });
    const activeProducts = await Product.countDocuments({ 
      businessId: req.user._id, 
      isActive: true 
    });
    const lowStockProducts = await Product.countDocuments({ 
      businessId: req.user._id, 
      stock: { $lte: 10 },
      isActive: true
    });
    
    res.json({
      totalProducts,
      activeProducts,
      lowStockProducts
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
});

module.exports = router;