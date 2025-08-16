const express = require('express');
const { v1: uuidv1, v4: uuidv4, v5: uuidv5, v6: uuidv6 } = require('uuid');
const crypto = require('crypto');
const QRCode = require('qrcode');
const validator = require('validator');

const router = express.Router();

// UUID Generation endpoints
router.get('/uuid/:version?', (req, res) => {
  const { version = '4' } = req.params;
  const { count = 1, namespace, name } = req.query;
  
  const results = [];
  const maxCount = Math.min(parseInt(count), 100);
  
  try {
    for (let i = 0; i < maxCount; i++) {
      let uuid;
      switch (version) {
        case '1':
          uuid = uuidv1();
          break;
        case '4':
          uuid = uuidv4();
          break;
        case '5':
          if (!namespace || !name) {
            return res.status(400).json({ error: 'UUID v5 requires namespace and name parameters' });
          }
          uuid = uuidv5(name, namespace);
          break;
        case '6':
          uuid = uuidv6();
          break;
        default:
          return res.status(400).json({ error: 'Invalid UUID version. Supported: 1, 4, 5, 6' });
      }
      results.push(uuid);
    }
    
    res.json({
      version: parseInt(version),
      count: maxCount,
      uuids: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate UUID', message: error.message });
  }
});

// Password generation
router.get('/password', (req, res) => {
  const { 
    length = 12, 
    includeUppercase = true, 
    includeLowercase = true, 
    includeNumbers = true, 
    includeSymbols = false,
    excludeSimilar = false,
    count = 1
  } = req.query;
  
  const len = Math.min(Math.max(parseInt(length), 4), 128);
  const num = Math.min(parseInt(count), 50);
  
  const passwords = [];
  
  for (let i = 0; i < num; i++) {
    const password = generatePassword(len, {
      uppercase: includeUppercase === 'true',
      lowercase: includeLowercase === 'true',
      numbers: includeNumbers === 'true',
      symbols: includeSymbols === 'true',
      excludeSimilar: excludeSimilar === 'true'
    });
    passwords.push(password);
  }
  
  res.json({
    passwords,
    criteria: {
      length: len,
      includeUppercase: includeUppercase === 'true',
      includeLowercase: includeLowercase === 'true',
      includeNumbers: includeNumbers === 'true',
      includeSymbols: includeSymbols === 'true',
      excludeSimilar: excludeSimilar === 'true'
    },
    count: num
  });
});

// Hash generation
router.post('/hash/:algorithm', (req, res) => {
  const { algorithm } = req.params;
  const { text, encoding = 'hex' } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text parameter is required' });
  }
  
  const supportedAlgorithms = ['md5', 'sha1', 'sha256', 'sha512'];
  if (!supportedAlgorithms.includes(algorithm.toLowerCase())) {
    return res.status(400).json({ 
      error: 'Unsupported algorithm', 
      supported: supportedAlgorithms 
    });
  }
  
  try {
    const hash = crypto.createHash(algorithm).update(text).digest(encoding);
    res.json({
      algorithm,
      text,
      hash,
      encoding,
      length: hash.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate hash', message: error.message });
  }
});

// Base64 encoding/decoding
router.post('/base64/:operation', (req, res) => {
  const { operation } = req.params;
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text parameter is required' });
  }
  
  try {
    let result;
    if (operation === 'encode') {
      result = Buffer.from(text, 'utf8').toString('base64');
    } else if (operation === 'decode') {
      result = Buffer.from(text, 'base64').toString('utf8');
    } else {
      return res.status(400).json({ error: 'Invalid operation. Use encode or decode' });
    }
    
    res.json({
      operation,
      input: text,
      output: result,
      inputLength: text.length,
      outputLength: result.length
    });
  } catch (error) {
    res.status(500).json({ error: `Failed to ${operation} text`, message: error.message });
  }
});

// JSON formatting
router.post('/json/:operation', (req, res) => {
  const { operation } = req.params;
  const { json, indent = 2 } = req.body;
  
  if (!json) {
    return res.status(400).json({ error: 'JSON parameter is required' });
  }
  
  try {
    let result;
    if (operation === 'format' || operation === 'prettify') {
      const parsed = typeof json === 'string' ? JSON.parse(json) : json;
      result = JSON.stringify(parsed, null, parseInt(indent));
    } else if (operation === 'minify') {
      const parsed = typeof json === 'string' ? JSON.parse(json) : json;
      result = JSON.stringify(parsed);
    } else if (operation === 'validate') {
      JSON.parse(typeof json === 'string' ? json : JSON.stringify(json));
      return res.json({ valid: true, message: 'JSON is valid' });
    } else {
      return res.status(400).json({ error: 'Invalid operation. Use format, minify, or validate' });
    }
    
    res.json({
      operation,
      input: json,
      output: result,
      originalSize: JSON.stringify(json).length,
      newSize: result.length,
      compression: operation === 'minify' ? 
        `${(((JSON.stringify(json).length - result.length) / JSON.stringify(json).length) * 100).toFixed(1)}%` : null
    });
  } catch (error) {
    if (operation === 'validate') {
      res.json({ valid: false, error: error.message });
    } else {
      res.status(400).json({ error: 'Invalid JSON', message: error.message });
    }
  }
});

// Email validation
router.post('/validate/email', (req, res) => {
  const { email, checkMx = false } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email parameter is required' });
  }
  
  const isValid = validator.isEmail(email);
  const parts = email.split('@');
  
  const result = {
    email,
    valid: isValid,
    parts: isValid ? {
      local: parts[0],
      domain: parts[1]
    } : null,
    checks: {
      format: isValid,
      length: email.length <= 254,
      localLength: parts[0] && parts[0].length <= 64,
      domainLength: parts[1] && parts[1].length <= 253
    }
  };
  
  if (isValid) {
    result.suggestions = {
      normalized: validator.normalizeEmail(email),
      disposable: isDisposableEmail(parts[1])
    };
  }
  
  res.json(result);
});

// Phone validation
router.post('/validate/phone', (req, res) => {
  const { phone, locale = 'US' } = req.body;
  
  if (!phone) {
    return res.status(400).json({ error: 'Phone parameter is required' });
  }
  
  const isMobile = validator.isMobilePhone(phone, locale);
  const cleaned = phone.replace(/\D/g, '');
  
  res.json({
    phone,
    locale,
    valid: isMobile,
    cleaned,
    formatted: formatPhoneNumber(cleaned, locale),
    type: guessPhoneType(cleaned),
    length: cleaned.length
  });
});

// Color conversion
router.get('/color/hex-to-rgb/:hex', (req, res) => {
  const { hex } = req.params;
  
  const cleanHex = hex.replace('#', '');
  if (!/^[0-9A-F]{6}$/i.test(cleanHex)) {
    return res.status(400).json({ error: 'Invalid hex color format' });
  }
  
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  res.json({
    hex: `#${cleanHex.toUpperCase()}`,
    rgb: { r, g, b },
    rgbString: `rgb(${r}, ${g}, ${b})`,
    hsl: rgbToHsl(r, g, b),
    hsv: rgbToHsv(r, g, b),
    cmyk: rgbToCmyk(r, g, b)
  });
});

// Timestamp conversion
router.get('/timestamp/:timestamp?', (req, res) => {
  const { timestamp } = req.params;
  const { format = 'iso', timezone = 'UTC' } = req.query;
  
  let date;
  if (timestamp) {
    const ts = parseInt(timestamp);
    date = new Date(ts * (ts.toString().length === 10 ? 1000 : 1));
  } else {
    date = new Date();
  }
  
  const result = {
    timestamp: Math.floor(date.getTime() / 1000),
    milliseconds: date.getTime(),
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toLocaleString(),
    formats: {
      'YYYY-MM-DD': date.toISOString().split('T')[0],
      'MM/DD/YYYY': date.toLocaleDateString('en-US'),
      'DD/MM/YYYY': date.toLocaleDateString('en-GB'),
      'human': getRelativeTime(date)
    }
  };
  
  res.json(result);
});

// QR Code generation
router.post('/qr', async (req, res) => {
  const { text, size = 200, format = 'png', errorLevel = 'M' } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text parameter is required' });
  }
  
  try {
    const options = {
      width: parseInt(size),
      errorCorrectionLevel: errorLevel,
      type: format === 'svg' ? 'svg' : 'png'
    };
    
    if (format === 'svg') {
      const svg = await QRCode.toString(text, { ...options, type: 'svg' });
      res.json({
        text,
        format: 'svg',
        size: parseInt(size),
        svg,
        dataUri: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
      });
    } else {
      const dataUri = await QRCode.toDataURL(text, options);
      res.json({
        text,
        format: 'png',
        size: parseInt(size),
        dataUri,
        base64: dataUri.split(',')[1]
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR code', message: error.message });
  }
});

// Helper functions
function generatePassword(length, options) {
  let charset = '';
  
  if (options.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (options.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (options.numbers) charset += '0123456789';
  if (options.symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  if (options.excludeSimilar) {
    charset = charset.replace(/[il1Lo0O]/g, '');
  }
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
}

function isDisposableEmail(domain) {
  const disposableDomains = [
    '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 
    'tempmail.org', 'yopmail.com'
  ];
  return disposableDomains.includes(domain.toLowerCase());
}

function formatPhoneNumber(phone, locale) {
  if (locale === 'US' && phone.length === 10) {
    return `(${phone.substring(0, 3)}) ${phone.substring(3, 6)}-${phone.substring(6)}`;
  }
  return phone;
}

function guessPhoneType(phone) {
  if (phone.length === 10 || phone.length === 11) return 'mobile';
  if (phone.length === 7) return 'landline';
  return 'unknown';
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;

  const d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100)
  };
}

function rgbToCmyk(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  
  const k = 1 - Math.max(r, Math.max(g, b));
  const c = (1 - r - k) / (1 - k) || 0;
  const m = (1 - g - k) / (1 - k) || 0;
  const y = (1 - b - k) / (1 - k) || 0;
  
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100)
  };
}

function getRelativeTime(date) {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  
  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

module.exports = router;
