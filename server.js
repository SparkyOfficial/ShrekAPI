const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { RateLimiterMemory } = require('rate-limiter-flexible');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting middleware
app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Try again later.',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000) || 1,
    });
  }
});

// Import route modules
const dataRoutes = require('./routes/utils/data');
const networkRoutes = require('./routes/utils/network');

// Minecraft-focused routes
const minecraftServersRoutes = require('./routes/minecraft/servers');
const minecraftPlayersRoutes = require('./routes/minecraft/players');
const minecraftWorldsRoutes = require('./routes/minecraft/worlds');
const minecraftPluginsRoutes = require('./routes/minecraft/plugins');
const minecraftModsRoutes = require('./routes/minecraft/mods');
const minecraftResourcePacksRoutes = require('./routes/minecraft/resourcepacks');
const minecraftConfigRoutes = require('./routes/minecraft/config');
const minecraftDashboardRoutes = require('./routes/minecraft/dashboard');
const minecraftAutomationRoutes = require('./routes/minecraft/automation');

// Use routes
app.use('/api/utils', dataRoutes);
app.use('/api/utils', networkRoutes);

// Minecraft-focused routes (main focus)
app.use('/api/mc/servers', minecraftServersRoutes);
app.use('/api/mc/players', minecraftPlayersRoutes);
app.use('/api/mc/worlds', minecraftWorldsRoutes);
app.use('/api/mc/plugins', minecraftPluginsRoutes);
app.use('/api/mc/mods', minecraftModsRoutes);
app.use('/api/mc/resourcepacks', minecraftResourcePacksRoutes);
app.use('/api/mc/config', minecraftConfigRoutes);
app.use('/api/mc/dashboard', minecraftDashboardRoutes);
app.use('/api/mc/automation', minecraftAutomationRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'ShrekAPI',
    version: '1.0.0',
    description: 'Comprehensive API for developers with utilities, Minecraft tools, and more',
    documentation: '/api/docs',
    endpoints: {
      'Minecraft Tools (Primary Focus)': [
        '/api/mc/servers - Advanced server analysis and monitoring',
        '/api/mc/players - Comprehensive player profiles and statistics',
        '/api/mc/worlds - World analysis, optimization, and conversion',
        '/api/mc/plugins - Plugin development and management tools',
        '/api/mc/mods - Mod compatibility and performance analysis',
        '/api/mc/resourcepacks - Resource pack creation and optimization'
      ],
      'Utility Tools': [
        '/api/utils/uuid - UUID generation',
        '/api/utils/password - Password generation',
        '/api/utils/hash - Hashing utilities',
        '/api/utils/base64 - Base64 encoding/decoding',
        '/api/utils/json - JSON formatting and validation',
        '/api/utils/validate - Email and phone validation',
        '/api/utils/color - Color conversion tools',
        '/api/utils/timestamp - Timestamp utilities',
        '/api/utils/qr - QR code generation',
        '/api/utils/ip - IP information lookup',
        '/api/utils/url - URL utilities',
        '/api/utils/dns - DNS lookup tools',
        '/api/utils/http - HTTP status codes',
        '/api/utils/ssl - SSL certificate checking'
      ]
    }
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'ShrekAPI Documentation',
    version: '1.0.0',
    description: 'Complete API documentation for all available endpoints',
    categories: {
      'Data & Utils': 'General utilities for data manipulation and generation',
      'Minecraft Utilities': 'Tools specifically for Minecraft servers and players',
      'Java/Kotlin Tools': 'Development tools for Java and Kotlin',
      'Android Helpers': 'Android development utilities',
      'Network & Web': 'Network and web-related tools',
      'Code Quality': 'Code analysis and quality tools',
      'Development Utils': 'General development utilities',
      'Game Development': 'Game development specific tools',
      'Analytics & Monitoring': 'Performance and monitoring tools'
    },
    usage: 'All endpoints accept GET requests unless specified otherwise. POST requests require JSON body.',
    rateLimit: '100 requests per minute per IP address'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    availableEndpoints: '/'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong on our end',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ShrekAPI is running on port ${PORT}`);
  console.log(`📚 Documentation available at http://localhost:${PORT}/api/docs`);
  console.log(`❤️  Health check at http://localhost:${PORT}/health`);
});

module.exports = app;
