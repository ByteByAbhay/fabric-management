const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import routes
const partyRoutes = require('./routes/partyRoutes');
const stockRoutes = require('./routes/stockRoutes');
const cuttingRoutes = require('./routes/cuttingRoutes');
const processRoutes = require('./routes/processRoutes');
const productionRoutes = require('./routes/productionRoutes');
const inlineStockRoutes = require('./routes/inlineStockRoutes');
const dataIntegrityRoutes = require('./routes/dataIntegrityRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
// Security headers
app.use(helmet());

// CORS (restrict in production)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('CORS not allowed'), false);
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

// Basic rate limiting (tune as needed)
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });
app.use(limiter);

// HTTP request logging (less verbose in production)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fabric-management';
mongoose
  .connect(mongoUri, {
    // Buffering disabled so the app fails fast if DB is unavailable in prod
    bufferCommands: false
  })
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
  });

// Minimal request log (avoid sensitive data)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log('Incoming request:', {
      method: req.method,
      path: req.path,
      query: req.query
    });
    next();
  });
}

// Register routes with logging
const registerRoute = (path, router) => {
  console.log(`Registering route: ${path}`);
  app.use(path, router);
};

// Routes
registerRoute('/api/parties', partyRoutes);
registerRoute('/api/stock', stockRoutes);
registerRoute('/api/cutting', cuttingRoutes);
registerRoute('/api/process', processRoutes);
registerRoute('/api/production', productionRoutes);
registerRoute('/api/inline-stock', inlineStockRoutes);
registerRoute('/api/data-integrity', dataIntegrityRoutes);
registerRoute('/api/delivery', deliveryRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  res.status(500).json({
    success: false,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Handle 404 routes
app.use((req, res) => {
  console.log('404 Not Found:', {
    method: req.method,
    path: req.path,
    body: req.body,
    query: req.query
  });
  res.status(404).json({
    success: false,
    error: 'Route not found',
    method: req.method,
    path: req.path
  });
});

// Root route
app.get('/', (req, res) => {
  res.send('Fabric Management System API');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Available routes:');
  console.log('- /api/parties');
  console.log('- /api/stock');
  console.log('- /api/cutting');
  console.log('- /api/process');
  console.log('- /api/production');
  console.log('- /api/inline-stock');
  console.log('- /api/data-integrity');
  console.log('- /api/delivery');
}); 