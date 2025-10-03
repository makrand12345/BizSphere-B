const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register Route
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, businessName, address } = req.body;

    console.log('📝 Registration attempt for:', email);

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Auto-assign admin role for specific emails
    const ADMIN_EMAILS = [
  'admin@bizsphere.com', 
  'admin@gmail.com',
  'superadmin@bizsphere.com',  // Add this
  'superadmin@gmail.com'       // Add this
];
    let userRole = role;
    let businessVerified = false;
    let verificationStatus = 'pending';

    if (ADMIN_EMAILS.includes(email.toLowerCase())) {
      userRole = 'admin';
      businessVerified = true;
      verificationStatus = 'approved';
      console.log('👑 Auto-assigned admin role for:', email);
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role: userRole,
      phone,
      businessName: userRole === 'owner' ? businessName : '',
      address: userRole === 'customer' ? address : '',
      businessVerified,
      verificationStatus
    });

    await user.save();
    console.log('✅ User registered successfully:', email);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessName: user.businessName,
        businessVerified: user.businessVerified,
        verificationStatus: user.verificationStatus
      }
    });

  } catch (error) {
    console.log('💥 Registration error:', error.message);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt for:', email);
    console.log('📧 Request body received');

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    console.log('🔍 Searching for user in database...');
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    console.log('✅ User found:', user.email);
    console.log('🔑 Checking password...');

    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      console.log('❌ Password incorrect for user:', user.email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    console.log('✅ Password correct for user:', user.email);

    // Generate token
    const token = generateToken(user._id);

    console.log('🎉 Login successful for:', user.email);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessName: user.businessName,
        businessVerified: user.businessVerified,
        verificationStatus: user.verificationStatus
      }
    });

  } catch (error) {
    console.log('💥 Login error:', error.message);
    console.log('💥 Full error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    // This will be protected by auth middleware later
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;