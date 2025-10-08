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

// MongoDB connection with better configuration
const MONGODB_URI = process.env.MONGODB_URI;

console.log('🔗 Attempting MongoDB connection...');

// MongoDB connection options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
};

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('✅ Using existing MongoDB connection');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    isConnected = mongoose.connection.readyState === 1;
    
    if (isConnected) {
      console.log('✅ MongoDB Connected Successfully to:', mongoose.connection.name);
    }
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    isConnected = false;
  }
};

// Connect to DB when server starts
connectDB();

// Test route
app.get('/api/test', async (req, res) => {
  await connectDB(); // Ensure connection for each request in serverless
  const dbStatus = mongoose.connection.readyState;
  const statusText = dbStatus === 1 ? 'connected' : 'disconnected';
  
  res.json({ 
    message: '✅ Backend is working perfectly!', 
    timestamp: new Date().toISOString(),
    database: statusText,
    databaseCode: dbStatus
  });
});

// Health check route
app.get('/api/health', async (req, res) => {
  await connectDB(); // Ensure connection for each request
  const dbStatus = mongoose.connection.readyState;
  const statusText = dbStatus === 1 ? 'connected' : 'disconnected';
  
  res.json({ 
    status: 'OK', 
    backend: 'running',
    database: statusText,
    databaseCode: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', async (req, res) => {
  await connectDB(); // Ensure connection for each request
  const dbStatus = mongoose.connection.readyState;
  const statusText = dbStatus === 1 ? 'connected' : 'disconnected';
  
  res.json({ 
    message: '🚀 BizSphere Backend Server is Running!',
    database: statusText,
    endpoints: {
      test: '/api/test',
      health: '/api/health',
      register: '/api/auth/register (POST)',
      login: '/api/auth/login (POST)'
    }
  });
});

// Auth routes (placeholder)
app.post('/api/auth/register', async (req, res) => {
  await connectDB(); // Ensure connection for each request
  res.json({ 
    message: '✅ Registration endpoint working!',
    user: req.body,
    status: 'success',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.post('/api/auth/login', async (req, res) => {
  await connectDB(); // Ensure connection for each request
  res.json({ 
    message: '✅ Login endpoint working!',
    user: { email: req.body.email },
    status: 'success',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
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

module.exports = app;