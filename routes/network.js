const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const dns = require('dns').promises;

const router = express.Router();

// IP information lookup
router.get('/ip/info', async (req, res) => {
  const { ip } = req.query;
  
  if (!ip) {
    // Get client IP if no IP provided
    const clientIP = req.ip || req.connection.remoteAddress || '8.8.8.8';
    return res.redirect(`/api/ip/info?ip=${clientIP}`);
  }

  try {
    // Use a free IP geolocation service
    const response = await axios.get(`http://ip-api.com/json/${ip}`, {
      timeout: 5000
    });

    if (response.data.status === 'success') {
      res.json({
        ip,
        country: response.data.country,
        countryCode: response.data.countryCode,
        region: response.data.regionName,
        city: response.data.city,
        zip: response.data.zip,
        lat: response.data.lat,
        lon: response.data.lon,
        timezone: response.data.timezone,
        isp: response.data.isp,
        org: response.data.org,
        as: response.data.as,
        mobile: response.data.mobile || false,
        proxy: response.data.proxy || false,
        hosting: response.data.hosting || false,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        error: 'Invalid IP address or lookup failed',
        ip,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to lookup IP information',
      message: error.message,
      ip,
      timestamp: new Date().toISOString()
    });
  }
});

// URL shortener
router.post('/url/shortener', (req, res) => {
  const { url, customAlias, expiresIn } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  const shortId = customAlias || generateShortId();
  const shortUrl = `https://shrek.ly/${shortId}`;
  const expiryDate = expiresIn ? new Date(Date.now() + parseInt(expiresIn) * 24 * 60 * 60 * 1000) : null;

  res.json({
    originalUrl: url,
    shortUrl,
    shortId,
    customAlias: customAlias || null,
    clicks: 0,
    createdAt: new Date().toISOString(),
    expiresAt: expiryDate?.toISOString() || null,
    qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shortUrl)}`,
    analytics: {
      enabled: true,
      trackingId: generateTrackingId()
    },
    timestamp: new Date().toISOString()
  });
});

// DNS lookup
router.get('/dns/lookup', async (req, res) => {
  const { domain, type = 'A' } = req.query;
  if (!domain) {
    return res.status(400).json({ error: 'Domain parameter is required' });
  }

  try {
    let records;
    const lookupType = type.toUpperCase();

    switch (lookupType) {
      case 'A':
        records = await dns.resolve4(domain);
        break;
      case 'AAAA':
        records = await dns.resolve6(domain);
        break;
      case 'MX':
        records = await dns.resolveMx(domain);
        break;
      case 'TXT':
        records = await dns.resolveTxt(domain);
        break;
      case 'CNAME':
        records = await dns.resolveCname(domain);
        break;
      case 'NS':
        records = await dns.resolveNs(domain);
        break;
      default:
        return res.status(400).json({ 
          error: 'Unsupported DNS record type',
          supportedTypes: ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS']
        });
    }

    res.json({
      domain,
      type: lookupType,
      records,
      recordCount: Array.isArray(records) ? records.length : 1,
      ttl: 300, // Simplified TTL
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(404).json({
      error: 'DNS lookup failed',
      message: error.message,
      domain,
      type: lookupType,
      timestamp: new Date().toISOString()
    });
  }
});

// HTTP status code lookup
router.get('/http/status', (req, res) => {
  const { code } = req.query;
  
  const statusCodes = {
    // 1xx Informational
    100: { name: 'Continue', description: 'The server has received the request headers and the client should proceed to send the request body.' },
    101: { name: 'Switching Protocols', description: 'The requester has asked the server to switch protocols and the server has agreed to do so.' },
    
    // 2xx Success
    200: { name: 'OK', description: 'The request has succeeded.' },
    201: { name: 'Created', description: 'The request has been fulfilled and resulted in a new resource being created.' },
    204: { name: 'No Content', description: 'The server successfully processed the request and is not returning any content.' },
    
    // 3xx Redirection
    301: { name: 'Moved Permanently', description: 'The URL of the requested resource has been changed permanently.' },
    302: { name: 'Found', description: 'The URI of requested resource has been changed temporarily.' },
    304: { name: 'Not Modified', description: 'Indicates that the resource has not been modified since the version specified by the request headers.' },
    
    // 4xx Client Error
    400: { name: 'Bad Request', description: 'The server could not understand the request due to invalid syntax.' },
    401: { name: 'Unauthorized', description: 'The client must authenticate itself to get the requested response.' },
    403: { name: 'Forbidden', description: 'The client does not have access rights to the content.' },
    404: { name: 'Not Found', description: 'The server can not find the requested resource.' },
    429: { name: 'Too Many Requests', description: 'The user has sent too many requests in a given amount of time.' },
    
    // 5xx Server Error
    500: { name: 'Internal Server Error', description: 'The server has encountered a situation it doesn\'t know how to handle.' },
    502: { name: 'Bad Gateway', description: 'The server was acting as a gateway or proxy and received an invalid response from the upstream server.' },
    503: { name: 'Service Unavailable', description: 'The server is not ready to handle the request.' }
  };

  if (code) {
    const statusInfo = statusCodes[parseInt(code)];
    if (!statusInfo) {
      return res.status(404).json({
        error: 'HTTP status code not found',
        code: parseInt(code),
        availableCodes: Object.keys(statusCodes).map(Number)
      });
    }

    res.json({
      code: parseInt(code),
      ...statusInfo,
      category: getStatusCategory(parseInt(code)),
      isError: parseInt(code) >= 400,
      timestamp: new Date().toISOString()
    });
  } else {
    res.json({
      statusCodes,
      categories: {
        '1xx': 'Informational responses',
        '2xx': 'Successful responses',
        '3xx': 'Redirection messages',
        '4xx': 'Client error responses',
        '5xx': 'Server error responses'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// WebSocket tester
router.post('/websocket/tester', (req, res) => {
  const { url, message, protocols = [] } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  // Simulate WebSocket connection test
  const testResult = simulateWebSocketTest(url, message, protocols);

  res.json({
    url,
    message,
    protocols,
    testResult,
    connectionInfo: {
      supported: true,
      latency: Math.floor(Math.random() * 100) + 10,
      maxMessageSize: '64KB',
      compression: 'deflate'
    },
    recommendations: generateWebSocketRecommendations(url),
    timestamp: new Date().toISOString()
  });
});

// SSL certificate checker
router.get('/ssl/checker', async (req, res) => {
  const { domain, port = 443 } = req.query;
  if (!domain) {
    return res.status(400).json({ error: 'Domain parameter is required' });
  }

  try {
    // Simulate SSL certificate check
    const sslInfo = await checkSSLCertificate(domain, port);

    res.json({
      domain,
      port: parseInt(port),
      ssl: sslInfo,
      security: analyzeCertificateSecurity(sslInfo),
      recommendations: generateSSLRecommendations(sslInfo),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'SSL certificate check failed',
      message: error.message,
      domain,
      port: parseInt(port),
      timestamp: new Date().toISOString()
    });
  }
});

// HTTP headers analyzer
router.post('/headers/analyzer', (req, res) => {
  const { headers, url } = req.body;
  if (!headers) {
    return res.status(400).json({ error: 'Headers parameter is required' });
  }

  const analysis = analyzeHTTPHeaders(headers);
  const security = analyzeSecurityHeaders(headers);

  res.json({
    url: url || 'Not specified',
    headers,
    analysis,
    security,
    recommendations: generateHeaderRecommendations(analysis, security),
    timestamp: new Date().toISOString()
  });
});

// CORS validator
router.post('/cors/validator', (req, res) => {
  const { origin, method = 'GET', headers = {}, credentials = false } = req.body;
  if (!origin) {
    return res.status(400).json({ error: 'Origin parameter is required' });
  }

  const corsValidation = validateCORS(origin, method, headers, credentials);

  res.json({
    origin,
    method,
    headers,
    credentials,
    validation: corsValidation,
    recommendations: generateCORSRecommendations(corsValidation),
    exampleConfiguration: generateCORSConfig(origin, method, headers),
    timestamp: new Date().toISOString()
  });
});

// API mocker
router.post('/api/mocker', (req, res) => {
  const { endpoint, method = 'GET', responseType = 'json', dataType = 'user' } = req.body;
  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint parameter is required' });
  }

  const mockData = generateMockData(dataType, responseType);
  const mockConfig = generateMockConfiguration(endpoint, method, mockData);

  res.json({
    endpoint,
    method,
    responseType,
    dataType,
    mockData,
    configuration: mockConfig,
    usage: generateMockUsageExamples(endpoint, method),
    timestamp: new Date().toISOString()
  });
});

// Bandwidth calculator
router.get('/bandwidth/calculator', (req, res) => {
  const { fileSize, time, unit = 'MB', timeUnit = 'seconds' } = req.query;
  
  if (!fileSize || !time) {
    return res.status(400).json({ error: 'FileSize and time parameters are required' });
  }

  const calculation = calculateBandwidth(parseFloat(fileSize), parseFloat(time), unit, timeUnit);

  res.json({
    input: {
      fileSize: parseFloat(fileSize),
      time: parseFloat(time),
      unit,
      timeUnit
    },
    calculation,
    conversions: generateBandwidthConversions(calculation.bitsPerSecond),
    recommendations: generateBandwidthRecommendations(calculation),
    timestamp: new Date().toISOString()
  });
});

// Helper functions
function generateShortId() {
  return crypto.randomBytes(4).toString('hex');
}

function generateTrackingId() {
  return crypto.randomBytes(8).toString('hex');
}

function getStatusCategory(code) {
  if (code >= 100 && code < 200) return 'Informational';
  if (code >= 200 && code < 300) return 'Success';
  if (code >= 300 && code < 400) return 'Redirection';
  if (code >= 400 && code < 500) return 'Client Error';
  if (code >= 500 && code < 600) return 'Server Error';
  return 'Unknown';
}

function simulateWebSocketTest(url, message, protocols) {
  return {
    connectionStatus: 'success',
    responseTime: Math.floor(Math.random() * 100) + 50,
    protocolUsed: protocols[0] || 'ws',
    messageEcho: message || 'No message sent',
    supportedExtensions: ['permessage-deflate'],
    maxFrameSize: '65536 bytes'
  };
}

function generateWebSocketRecommendations(url) {
  return [
    'Use WSS (WebSocket Secure) for production',
    'Implement proper error handling',
    'Add connection retry logic',
    'Consider using heartbeat/ping-pong for connection health'
  ];
}

async function checkSSLCertificate(domain, port) {
  // Simulate SSL certificate information
  const now = new Date();
  const expiryDate = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 days from now

  return {
    valid: true,
    issuer: 'Let\'s Encrypt Authority X3',
    subject: `CN=${domain}`,
    validFrom: now.toISOString(),
    validTo: expiryDate.toISOString(),
    daysUntilExpiry: 90,
    algorithm: 'RSA 2048 bits',
    serialNumber: crypto.randomBytes(8).toString('hex'),
    fingerprint: crypto.randomBytes(20).toString('hex'),
    version: 3,
    extensions: ['Subject Alternative Name', 'Key Usage', 'Extended Key Usage']
  };
}

function analyzeCertificateSecurity(sslInfo) {
  return {
    grade: 'A',
    keyStrength: sslInfo.algorithm.includes('2048') ? 'Strong' : 'Weak',
    expiryStatus: sslInfo.daysUntilExpiry > 30 ? 'Good' : 'Warning',
    chainTrust: 'Trusted',
    vulnerabilities: []
  };
}

function generateSSLRecommendations(sslInfo) {
  const recommendations = [];
  
  if (sslInfo.daysUntilExpiry < 30) {
    recommendations.push('Certificate expires soon - consider renewal');
  }
  
  recommendations.push('Enable HSTS for enhanced security');
  recommendations.push('Use certificate transparency monitoring');
  
  return recommendations;
}

function analyzeHTTPHeaders(headers) {
  const analysis = {
    totalHeaders: Object.keys(headers).length,
    cacheHeaders: [],
    securityHeaders: [],
    contentHeaders: [],
    customHeaders: []
  };

  Object.keys(headers).forEach(header => {
    const lowerHeader = header.toLowerCase();
    
    if (['cache-control', 'expires', 'etag', 'last-modified'].includes(lowerHeader)) {
      analysis.cacheHeaders.push(header);
    } else if (['content-security-policy', 'x-frame-options', 'x-xss-protection'].includes(lowerHeader)) {
      analysis.securityHeaders.push(header);
    } else if (['content-type', 'content-length', 'content-encoding'].includes(lowerHeader)) {
      analysis.contentHeaders.push(header);
    } else if (lowerHeader.startsWith('x-')) {
      analysis.customHeaders.push(header);
    }
  });

  return analysis;
}

function analyzeSecurityHeaders(headers) {
  const securityHeaders = {
    'content-security-policy': headers['content-security-policy'] || headers['Content-Security-Policy'],
    'x-frame-options': headers['x-frame-options'] || headers['X-Frame-Options'],
    'x-xss-protection': headers['x-xss-protection'] || headers['X-XSS-Protection'],
    'strict-transport-security': headers['strict-transport-security'] || headers['Strict-Transport-Security'],
    'x-content-type-options': headers['x-content-type-options'] || headers['X-Content-Type-Options']
  };

  const score = Object.values(securityHeaders).filter(Boolean).length * 20;

  return {
    headers: securityHeaders,
    score,
    grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'F',
    missing: Object.keys(securityHeaders).filter(key => !securityHeaders[key])
  };
}

function generateHeaderRecommendations(analysis, security) {
  const recommendations = [];
  
  if (security.missing.includes('content-security-policy')) {
    recommendations.push('Add Content-Security-Policy header to prevent XSS attacks');
  }
  
  if (security.missing.includes('x-frame-options')) {
    recommendations.push('Add X-Frame-Options header to prevent clickjacking');
  }
  
  if (analysis.cacheHeaders.length === 0) {
    recommendations.push('Consider adding cache headers for better performance');
  }
  
  return recommendations;
}

function validateCORS(origin, method, headers, credentials) {
  return {
    allowed: true, // Simplified validation
    preflight: method !== 'GET' && method !== 'POST',
    credentialsAllowed: credentials,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: Object.keys(headers),
    maxAge: 86400
  };
}

function generateCORSRecommendations(validation) {
  return [
    'Be specific with allowed origins in production',
    'Only allow necessary HTTP methods',
    'Set appropriate max-age for preflight caching',
    'Be cautious with credentials: true'
  ];
}

function generateCORSConfig(origin, method, headers) {
  return {
    express: `app.use(cors({
  origin: '${origin}',
  methods: ['${method}'],
  allowedHeaders: [${Object.keys(headers).map(h => `'${h}'`).join(', ')}],
  credentials: true
}));`,
    nginx: `add_header Access-Control-Allow-Origin "${origin}";
add_header Access-Control-Allow-Methods "${method}";
add_header Access-Control-Allow-Headers "${Object.keys(headers).join(', ')}";`
  };
}

function generateMockData(dataType, responseType) {
  const mockData = {
    user: {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      avatar: 'https://via.placeholder.com/150',
      createdAt: new Date().toISOString()
    },
    product: {
      id: 1,
      name: 'Sample Product',
      price: 99.99,
      description: 'This is a sample product',
      inStock: true,
      category: 'Electronics'
    },
    post: {
      id: 1,
      title: 'Sample Blog Post',
      content: 'This is sample content for a blog post...',
      author: 'Jane Smith',
      publishedAt: new Date().toISOString(),
      tags: ['sample', 'blog', 'post']
    }
  };

  return mockData[dataType] || mockData.user;
}

function generateMockConfiguration(endpoint, method, mockData) {
  return {
    endpoint,
    method,
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: mockData
    },
    delay: 0,
    middleware: []
  };
}

function generateMockUsageExamples(endpoint, method) {
  return {
    curl: `curl -X ${method} "${endpoint}"`,
    javascript: `fetch('${endpoint}', { method: '${method}' })
  .then(response => response.json())
  .then(data => console.log(data));`,
    python: `import requests
response = requests.${method.toLowerCase()}('${endpoint}')
print(response.json())`
  };
}

function calculateBandwidth(fileSize, time, unit, timeUnit) {
  // Convert to bytes
  const sizeInBytes = convertToBytes(fileSize, unit);
  
  // Convert to seconds
  const timeInSeconds = convertToSeconds(time, timeUnit);
  
  const bytesPerSecond = sizeInBytes / timeInSeconds;
  const bitsPerSecond = bytesPerSecond * 8;
  
  return {
    bytesPerSecond,
    bitsPerSecond,
    kilobitsPerSecond: bitsPerSecond / 1000,
    megabitsPerSecond: bitsPerSecond / 1000000,
    gigabitsPerSecond: bitsPerSecond / 1000000000
  };
}

function convertToBytes(size, unit) {
  const units = {
    'B': 1,
    'KB': 1000,
    'MB': 1000000,
    'GB': 1000000000,
    'KiB': 1024,
    'MiB': 1048576,
    'GiB': 1073741824
  };
  
  return size * (units[unit] || 1);
}

function convertToSeconds(time, unit) {
  const units = {
    'seconds': 1,
    'minutes': 60,
    'hours': 3600,
    'days': 86400
  };
  
  return time * (units[unit] || 1);
}

function generateBandwidthConversions(bitsPerSecond) {
  return {
    'bps': Math.round(bitsPerSecond),
    'Kbps': Math.round(bitsPerSecond / 1000 * 100) / 100,
    'Mbps': Math.round(bitsPerSecond / 1000000 * 100) / 100,
    'Gbps': Math.round(bitsPerSecond / 1000000000 * 100) / 100
  };
}

function generateBandwidthRecommendations(calculation) {
  const mbps = calculation.megabitsPerSecond;
  
  if (mbps < 1) {
    return ['Consider optimizing file sizes', 'Use compression where possible'];
  } else if (mbps < 10) {
    return ['Good for basic web browsing', 'May struggle with HD video'];
  } else if (mbps < 100) {
    return ['Suitable for most applications', 'Good for HD streaming'];
  } else {
    return ['Excellent bandwidth', 'Suitable for 4K streaming and large file transfers'];
  }
}

module.exports = router;
