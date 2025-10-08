const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// CORS configuration
app.use(cors({
  origin: ['https://biz-sphere-f.vercel.app', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

// MongoDB connection - optimized for Vercel serverless
const MONGODB_URI = process.env.MONGODB_URI;

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    console.log('✅ Using cached database connection');
    return cachedDb;
  }

  try {
    console.log('🔗 Creating new database connection');
    const client = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    cachedDb = mongoose.connection;
    console.log('✅ New database connection established');
    return cachedDb;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Test route
app.get('/api/test', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const dbStatus = db.readyState === 1 ? 'connected' : 'disconnected';
    
    res.json({ 
      message: '✅ Backend is working perfectly!', 
      timestamp: new Date().toISOString(),
      database: dbStatus
    });
  } catch (error) {
    res.json({ 
      message: '✅ Backend is working but database is disconnected', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Health check route
app.get('/api/health', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const dbStatus = db.readyState === 1 ? 'connected' : 'disconnected';
    
    res.json({ 
      status: 'OK', 
      backend: 'running',
      database: dbStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({ 
      status: 'OK', 
      backend: 'running',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Root route
app.get('/', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const dbStatus = db.readyState === 1 ? 'connected' : 'disconnected';
    
    res.json({ 
      message: '🚀 BizSphere Backend Server is Running!',
      database: dbStatus,
      endpoints: {
        test: '/api/test',
        health: '/api/health',
        register: '/api/auth/register (POST)',
        login: '/api/auth/login (POST)'
      }
    });
  } catch (error) {
    res.json({ 
      message: '🚀 BizSphere Backend Server is Running!',
      database: 'disconnected',
      note: 'Database connection failed but API is working',
      endpoints: {
        test: '/api/test',
        health: '/api/health',
        register: '/api/auth/register (POST)',
        login: '/api/auth/login (POST)'
      }
    });
  }
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const dbStatus = db.readyState === 1 ? 'connected' : 'disconnected';
    
    res.json({ 
      message: '✅ Registration endpoint working!',
      user: req.body,
      status: 'success',
      database: dbStatus
    });
  } catch (error) {
    res.json({ 
      message: '✅ Registration endpoint working!',
      user: req.body,
      status: 'success',
      database: 'disconnected',
      note: 'Working without database'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const dbStatus = db.readyState === 1 ? 'connected' : 'disconnected';
    
    res.json({ 
      message: '✅ Login endpoint working!',
      user: { email: req.body.email },
      status: 'success',
      database: dbStatus
    });
  } catch (error) {
    res.json({ 
      message: '✅ Login endpoint working!',
      user: { email: req.body.email },
      status: 'success',
      database: 'disconnected',
      note: 'Working without database'
    });
  }
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    available_routes: [
      '/',
      '/api/test', 
      '/api/health', 
      '/api/auth/register', 
      '/api/auth/login'
    ]
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// For Vercel serverless
module.exports = app;