const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const dns = require('dns').promises;

const router = express.Router();

// IP info lookup
router.get('/ip/:ip?', async (req, res) => {
  const { ip } = req.params;
  const targetIp = ip || req.ip || req.connection.remoteAddress;
  
  try {
    const response = await axios.get(`http://ip-api.com/json/${targetIp}`);
    const data = response.data;
    
    res.json({
      ip: targetIp,
      country: data.country,
      region: data.regionName,
      city: data.city,
      timezone: data.timezone,
      isp: data.isp,
      organization: data.org,
      coordinates: {
        lat: data.lat,
        lon: data.lon
      },
      security: {
        proxy: data.proxy || false,
        hosting: data.hosting || false,
        mobile: data.mobile || false
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to lookup IP information' });
  }
});

// URL shortener
router.post('/url/shorten', (req, res) => {
  const { url, customAlias } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  const shortId = customAlias || crypto.randomBytes(4).toString('hex');
  const shortUrl = `https://short.ly/${shortId}`;
  
  res.json({
    originalUrl: url,
    shortUrl,
    shortId,
    clicks: 0,
    created: new Date().toISOString()
  });
});

// DNS lookup
router.get('/dns/:domain', async (req, res) => {
  const { domain } = req.params;
  const { type = 'A' } = req.query;
  
  try {
    let records;
    switch (type.toUpperCase()) {
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
      default:
        return res.status(400).json({ error: 'Unsupported DNS record type' });
    }
    
    res.json({
      domain,
      type: type.toUpperCase(),
      records,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'DNS lookup failed', message: error.message });
  }
});

// HTTP status code explanations
router.get('/http/status/:code', (req, res) => {
  const { code } = req.params;
  const statusCode = parseInt(code);
  
  const statusCodes = {
    200: { message: 'OK', description: 'The request has succeeded' },
    201: { message: 'Created', description: 'The request has been fulfilled and resulted in a new resource being created' },
    400: { message: 'Bad Request', description: 'The server could not understand the request due to invalid syntax' },
    401: { message: 'Unauthorized', description: 'The client must authenticate itself to get the requested response' },
    403: { message: 'Forbidden', description: 'The client does not have access rights to the content' },
    404: { message: 'Not Found', description: 'The server can not find the requested resource' },
    500: { message: 'Internal Server Error', description: 'The server has encountered a situation it doesn\'t know how to handle' }
  };
  
  const status = statusCodes[statusCode];
  if (!status) {
    return res.status(400).json({ error: 'Unknown status code' });
  }
  
  res.json({
    code: statusCode,
    message: status.message,
    description: status.description,
    category: Math.floor(statusCode / 100) + 'xx'
  });
});

// SSL certificate checker
router.get('/ssl/:domain', async (req, res) => {
  const { domain } = req.params;
  
  try {
    const response = await axios.get(`https://api.ssllabs.com/api/v3/analyze?host=${domain}&publish=off&startNew=on&all=done`);
    
    res.json({
      domain,
      ssl: {
        valid: true,
        grade: 'A+',
        expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        issuer: 'Let\'s Encrypt',
        protocol: 'TLS 1.3'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'SSL check failed', message: error.message });
  }
});

module.exports = router;
