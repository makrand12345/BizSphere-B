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

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

console.log('🔗 Attempting MongoDB connection...');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully to:', mongoose.connection.name);
})
.catch((error) => {
  console.error('❌ MongoDB Connection Failed:', error.message);
});

// MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('📊 MongoDB event - Connected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB event - Error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB event - Disconnected');
});

// Test route
app.get('/api/test', (req, res) => {
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
app.get('/api/health', (req, res) => {
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
app.get('/', (req, res) => {
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
app.post('/api/auth/register', (req, res) => {
  res.json({ 
    message: '✅ Registration endpoint working!',
    user: req.body,
    status: 'success',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.post('/api/auth/login', (req, res) => {
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
  console.log(`📊 MongoDB Status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;