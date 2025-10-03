const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Middleware to verify admin
const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all businesses for verification
router.get('/businesses', verifyAdmin, async (req, res) => {
  try {
    console.log('🏢 Admin fetching businesses...');
    
    const businesses = await User.find({ role: 'owner' })
      .select('name email phone businessName verificationStatus createdAt')
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${businesses.length} businesses for admin`);
    console.log('Businesses:', businesses.map(b => ({
      name: b.name,
      business: b.businessName,
      status: b.verificationStatus
    })));
    
    res.json(businesses);
  } catch (error) {
    console.log('❌ Failed to fetch businesses:', error);
    res.status(500).json({ message: 'Failed to fetch businesses', error: error.message });
  }
});

// Get dashboard stats
router.get('/dashboard-stats', verifyAdmin, async (req, res) => {
  try {
    console.log('📊 Admin fetching dashboard stats...');
    
    const totalBusinesses = await User.countDocuments({ role: 'owner' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalRiders = await User.countDocuments({ role: 'rider' });
    const pendingVerifications = await User.countDocuments({ 
      role: 'owner', 
      verificationStatus: 'pending' 
    });
    const approvedBusinesses = await User.countDocuments({ 
      role: 'owner', 
      verificationStatus: 'approved' 
    });

    console.log('📈 Stats:', {
      totalBusinesses,
      totalCustomers,
      totalRiders,
      pendingVerifications,
      approvedBusinesses
    });

    res.json({
      totalBusinesses,
      totalCustomers,
      totalRiders,
      pendingVerifications,
      approvedBusinesses
    });
  } catch (error) {
    console.log('❌ Failed to fetch stats:', error);
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
});

// Verify business
router.put('/verify-business/:id', verifyAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const { id } = req.params;

    console.log(`🔄 Admin verifying business ${id} with status: ${status}`);

    const business = await User.findById(id);
    if (!business || business.role !== 'owner') {
      console.log('❌ Business not found:', id);
      return res.status(404).json({ message: 'Business not found' });
    }

    console.log('📝 Business before update:', {
      name: business.name,
      currentStatus: business.verificationStatus
    });

    business.verificationStatus = status;
    business.businessVerified = status === 'approved';
    business.verificationNotes = notes || '';

    await business.save();

    console.log('✅ Business updated successfully:', {
      name: business.name,
      newStatus: business.verificationStatus
    });

    res.json({ 
      message: `Business ${status} successfully`,
      business: {
        id: business._id,
        name: business.name,
        businessName: business.businessName,
        verificationStatus: business.verificationStatus,
        businessVerified: business.businessVerified
      }
    });
  } catch (error) {
    console.log('❌ Failed to verify business:', error);
    res.status(500).json({ message: 'Failed to verify business', error: error.message });
  }
});

// Get all users (for admin dashboard)
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    console.log('👥 Admin fetching all users...');
    
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${users.length} total users`);
    
    res.json(users);
  } catch (error) {
    console.log('❌ Failed to fetch users:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

module.exports = router;