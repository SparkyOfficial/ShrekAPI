const express = require('express');
const crypto = require('crypto');
const { v1: uuidv1, v4: uuidv4, v5: uuidv5, v6: uuidv6 } = require('uuid');
const QRCode = require('qrcode');
const validator = require('validator');
const moment = require('moment');

const router = express.Router();

// Random UUID generation
router.get('/random/uuid', (req, res) => {
  const { version = '4', namespace, name } = req.query;
  
  try {
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
          return res.status(400).json({
            error: 'UUID v5 requires namespace and name parameters'
          });
        }
        uuid = uuidv5(name, namespace);
        break;
      case '6':
        uuid = uuidv6();
        break;
      default:
        uuid = uuidv4();
    }
    
    res.json({
      uuid,
      version,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate UUID',
      message: error.message
    });
  }
});

// Password generation
router.get('/random/password', (req, res) => {
  const {
    length = 12,
    includeUppercase = 'true',
    includeLowercase = 'true',
    includeNumbers = 'true',
    includeSymbols = 'false',
    excludeSimilar = 'false'
  } = req.query;

  const len = parseInt(length);
  if (len < 4 || len > 128) {
    return res.status(400).json({
      error: 'Password length must be between 4 and 128 characters'
    });
  }

  let charset = '';
  if (includeLowercase === 'true') charset += 'abcdefghijklmnopqrstuvwxyz';
  if (includeUppercase === 'true') charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (includeNumbers === 'true') charset += '0123456789';
  if (includeSymbols === 'true') charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  if (excludeSimilar === 'true') {
    charset = charset.replace(/[il1Lo0O]/g, '');
  }

  if (!charset) {
    return res.status(400).json({
      error: 'At least one character type must be included'
    });
  }

  let password = '';
  for (let i = 0; i < len; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  res.json({
    password,
    length: len,
    strength: calculatePasswordStrength(password),
    timestamp: new Date().toISOString()
  });
});

// Random name generation
router.get('/random/name', (req, res) => {
  const { type = 'player', count = 1 } = req.query;
  
  const playerNames = [
    'ShadowHunter', 'DragonSlayer', 'MysticWarrior', 'StormBringer', 'FireMage',
    'IceQueen', 'ThunderBolt', 'NightCrawler', 'StarGazer', 'MoonWalker',
    'BloodRaven', 'GoldenEagle', 'SilverWolf', 'CrimsonBlade', 'FrostBite'
  ];
  
  const variableNames = [
    'userData', 'configManager', 'apiClient', 'dataProcessor', 'eventHandler',
    'serviceProvider', 'resourceLoader', 'cacheManager', 'sessionStore', 'logger'
  ];

  const names = type === 'variable' ? variableNames : playerNames;
  const result = [];
  
  for (let i = 0; i < Math.min(count, 50); i++) {
    result.push(names[Math.floor(Math.random() * names.length)]);
  }

  res.json({
    names: result,
    type,
    count: result.length,
    timestamp: new Date().toISOString()
  });
});

// Hash endpoints
router.post('/hash/md5', (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text parameter is required' });
  }

  const hash = crypto.createHash('md5').update(text).digest('hex');
  res.json({
    original: text,
    hash,
    algorithm: 'MD5',
    timestamp: new Date().toISOString()
  });
});

router.post('/hash/sha256', (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text parameter is required' });
  }

  const hash = crypto.createHash('sha256').update(text).digest('hex');
  res.json({
    original: text,
    hash,
    algorithm: 'SHA256',
    timestamp: new Date().toISOString()
  });
});

// Base64 encoding/decoding
router.post('/encode/base64', (req, res) => {
  const { text, operation = 'encode' } = req.body;
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
      return res.status(400).json({ error: 'Operation must be "encode" or "decode"' });
    }

    res.json({
      original: text,
      result,
      operation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      error: 'Invalid base64 string for decoding',
      message: error.message
    });
  }
});

// JSON formatting
router.post('/format/json', (req, res) => {
  const { json, operation = 'format', indent = 2 } = req.body;
  if (!json) {
    return res.status(400).json({ error: 'JSON parameter is required' });
  }

  try {
    const parsed = typeof json === 'string' ? JSON.parse(json) : json;
    
    let result;
    if (operation === 'format') {
      result = JSON.stringify(parsed, null, parseInt(indent));
    } else if (operation === 'minify') {
      result = JSON.stringify(parsed);
    } else {
      return res.status(400).json({ error: 'Operation must be "format" or "minify"' });
    }

    res.json({
      original: json,
      result,
      operation,
      size: {
        original: JSON.stringify(json).length,
        result: result.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      error: 'Invalid JSON format',
      message: error.message
    });
  }
});

// Email validation
router.post('/validate/email', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email parameter is required' });
  }

  const isValid = validator.isEmail(email);
  const domain = email.split('@')[1];
  
  res.json({
    email,
    isValid,
    domain,
    suggestions: isValid ? [] : getEmailSuggestions(email),
    timestamp: new Date().toISOString()
  });
});

// Phone validation
router.post('/validate/phone', (req, res) => {
  const { phone, locale = 'any' } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone parameter is required' });
  }

  const isValid = validator.isMobilePhone(phone, locale);
  
  res.json({
    phone,
    isValid,
    locale,
    formatted: phone.replace(/\D/g, ''),
    timestamp: new Date().toISOString()
  });
});

// Color conversion
router.get('/color/hex2rgb', (req, res) => {
  const { hex } = req.query;
  if (!hex) {
    return res.status(400).json({ error: 'Hex color parameter is required' });
  }

  const cleanHex = hex.replace('#', '');
  if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    return res.status(400).json({ error: 'Invalid hex color format' });
  }

  const r = parseInt(cleanHex.substr(0, 2), 16);
  const g = parseInt(cleanHex.substr(2, 2), 16);
  const b = parseInt(cleanHex.substr(4, 2), 16);

  res.json({
    hex: `#${cleanHex.toUpperCase()}`,
    rgb: { r, g, b },
    rgbString: `rgb(${r}, ${g}, ${b})`,
    hsl: rgbToHsl(r, g, b),
    timestamp: new Date().toISOString()
  });
});

// Timestamp conversion
router.get('/timestamp/convert', (req, res) => {
  const { timestamp, format = 'ISO', timezone = 'UTC' } = req.query;
  
  let momentObj;
  if (timestamp) {
    momentObj = moment(isNaN(timestamp) ? timestamp : parseInt(timestamp));
  } else {
    momentObj = moment();
  }

  if (!momentObj.isValid()) {
    return res.status(400).json({ error: 'Invalid timestamp format' });
  }

  res.json({
    original: timestamp || 'current',
    unix: momentObj.unix(),
    unixMs: momentObj.valueOf(),
    iso: momentObj.toISOString(),
    formatted: momentObj.format(format),
    timezone,
    relative: momentObj.fromNow(),
    timestamp: new Date().toISOString()
  });
});

// QR Code generation
router.post('/qr/generate', async (req, res) => {
  const { text, size = 200, format = 'png' } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text parameter is required' });
  }

  try {
    const options = {
      width: parseInt(size),
      height: parseInt(size),
      format: format.toLowerCase()
    };

    const qrCodeDataURL = await QRCode.toDataURL(text, options);
    
    res.json({
      text,
      qrCode: qrCodeDataURL,
      size: parseInt(size),
      format,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate QR code',
      message: error.message
    });
  }
});

// Helper functions
function calculatePasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  return levels[Math.min(score, 5)];
}

function getEmailSuggestions(email) {
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const [localPart] = email.split('@');
  return commonDomains.map(domain => `${localPart}@${domain}`);
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
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

module.exports = router;
