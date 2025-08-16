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
const dataRoutes = require('./routes/data');
const minecraftRoutes = require('./routes/minecraft');
const javaRoutes = require('./routes/java');
const androidRoutes = require('./routes/android');
const networkRoutes = require('./routes/network');
const codeQualityRoutes = require('./routes/codeQuality');
const devUtilsRoutes = require('./routes/devUtils');
const gameDevRoutes = require('./routes/gameDev');
const analyticsRoutes = require('./routes/analytics');

// Use routes
app.use('/api', dataRoutes);
app.use('/api/mc', minecraftRoutes);
app.use('/api', javaRoutes);
app.use('/api/android', androidRoutes);
app.use('/api', networkRoutes);
app.use('/api/code', codeQualityRoutes);
app.use('/api', devUtilsRoutes);
app.use('/api/mc', gameDevRoutes);
app.use('/api', analyticsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'ShrekAPI',
    version: '1.0.0',
    description: 'Comprehensive API for developers with utilities, Minecraft tools, and more',
    documentation: '/api/docs',
    endpoints: {
      'Data & Utils': [
        '/api/random/uuid',
        '/api/random/password',
        '/api/random/name',
        '/api/hash/md5',
        '/api/hash/sha256',
        '/api/encode/base64',
        '/api/format/json',
        '/api/validate/email',
        '/api/validate/phone',
        '/api/color/hex2rgb',
        '/api/timestamp/convert',
        '/api/qr/generate'
      ],
      'Minecraft Utilities': [
        '/api/mc/server/ping',
        '/api/mc/skin/download',
        '/api/mc/username/history',
        '/api/mc/uuid/lookup',
        '/api/mc/server/motd',
        '/api/mc/color/codes',
        '/api/mc/item/recipe',
        '/api/mc/enchant/calculator',
        '/api/mc/world/seed/info',
        '/api/mc/version/check'
      ],
      'Java/Kotlin Tools': [
        '/api/java/class/decompile',
        '/api/kotlin/java/convert',
        '/api/regex/test',
        '/api/sql/format',
        '/api/lombok/generate',
        '/api/gradle/version/latest',
        '/api/spring/property/generator',
        '/api/exception/analyzer',
        '/api/jar/info',
        '/api/jvm/memory/calculator'
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
