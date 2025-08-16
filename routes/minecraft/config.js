const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

const router = express.Router();

// In-memory storage for server configurations (in production, use database)
let serverConfigs = new Map();
let monitoringData = new Map();

// Add/Update server configuration
router.post('/server/add', async (req, res) => {
  const { 
    name, 
    ip, 
    port = 25565, 
    description = '',
    tags = [],
    monitoring = {
      enabled: true,
      interval: 60, // seconds
      alerts: {
        offline: true,
        lowTPS: true,
        highPing: true,
        playerCount: false
      },
      thresholds: {
        maxPing: 200,
        minTPS: 18,
        maxPlayers: 100
      }
    },
    rcon = {
      enabled: false,
      password: '',
      port: 25575
    },
    backup = {
      enabled: false,
      schedule: '0 2 * * *', // Daily at 2 AM
      retention: 7 // days
    }
  } = req.body;

  if (!name || !ip) {
    return res.status(400).json({ error: 'Server name and IP are required' });
  }

  const serverId = crypto.randomUUID();
  const serverConfig = {
    id: serverId,
    name,
    ip,
    port: parseInt(port),
    description,
    tags,
    monitoring,
    rcon,
    backup,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'unknown',
    lastCheck: null
  };

  serverConfigs.set(serverId, serverConfig);
  
  // Initialize monitoring data
  monitoringData.set(serverId, {
    history: [],
    alerts: [],
    statistics: {
      uptime: 0,
      averagePing: 0,
      averagePlayers: 0,
      totalChecks: 0
    }
  });

  // Start monitoring if enabled
  if (monitoring.enabled) {
    startServerMonitoring(serverId);
  }

  res.json({
    success: true,
    serverId,
    server: serverConfig,
    message: 'Server configuration added successfully'
  });
});

// Get all configured servers
router.get('/servers', (req, res) => {
  const { tag, status, search } = req.query;
  
  let servers = Array.from(serverConfigs.values());
  
  // Filter by tag
  if (tag) {
    servers = servers.filter(server => server.tags.includes(tag));
  }
  
  // Filter by status
  if (status) {
    servers = servers.filter(server => server.status === status);
  }
  
  // Search by name or IP
  if (search) {
    const searchLower = search.toLowerCase();
    servers = servers.filter(server => 
      server.name.toLowerCase().includes(searchLower) ||
      server.ip.toLowerCase().includes(searchLower)
    );
  }

  const summary = {
    total: servers.length,
    online: servers.filter(s => s.status === 'online').length,
    offline: servers.filter(s => s.status === 'offline').length,
    unknown: servers.filter(s => s.status === 'unknown').length
  };

  res.json({
    servers,
    summary,
    timestamp: new Date().toISOString()
  });
});

// Get specific server details with monitoring data
router.get('/server/:serverId', (req, res) => {
  const { serverId } = req.params;
  const { timeRange = '24h' } = req.query;
  
  const server = serverConfigs.get(serverId);
  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }

  const monitoring = monitoringData.get(serverId) || { history: [], alerts: [], statistics: {} };
  
  // Filter history by time range
  const now = new Date();
  const timeRangeMs = parseTimeRange(timeRange);
  const filteredHistory = monitoring.history.filter(entry => 
    new Date(entry.timestamp) > new Date(now - timeRangeMs)
  );

  res.json({
    server,
    monitoring: {
      ...monitoring,
      history: filteredHistory
    },
    analytics: generateServerAnalytics(filteredHistory),
    recommendations: generateServerRecommendations(server, monitoring),
    timestamp: new Date().toISOString()
  });
});

// Update server configuration
router.put('/server/:serverId', (req, res) => {
  const { serverId } = req.params;
  const updates = req.body;
  
  const server = serverConfigs.get(serverId);
  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }

  const updatedServer = {
    ...server,
    ...updates,
    id: serverId, // Prevent ID changes
    updatedAt: new Date().toISOString()
  };

  serverConfigs.set(serverId, updatedServer);

  // Restart monitoring if settings changed
  if (updates.monitoring) {
    stopServerMonitoring(serverId);
    if (updatedServer.monitoring.enabled) {
      startServerMonitoring(serverId);
    }
  }

  res.json({
    success: true,
    server: updatedServer,
    message: 'Server configuration updated successfully'
  });
});

// Delete server configuration
router.delete('/server/:serverId', (req, res) => {
  const { serverId } = req.params;
  
  if (!serverConfigs.has(serverId)) {
    return res.status(404).json({ error: 'Server not found' });
  }

  stopServerMonitoring(serverId);
  serverConfigs.delete(serverId);
  monitoringData.delete(serverId);

  res.json({
    success: true,
    message: 'Server configuration deleted successfully'
  });
});

// Manual server check
router.post('/server/:serverId/check', async (req, res) => {
  const { serverId } = req.params;
  
  const server = serverConfigs.get(serverId);
  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }

  const checkResult = await performServerCheck(server);
  
  // Update server status
  server.status = checkResult.online ? 'online' : 'offline';
  server.lastCheck = new Date().toISOString();
  serverConfigs.set(serverId, server);

  // Add to monitoring history
  const monitoring = monitoringData.get(serverId);
  if (monitoring) {
    monitoring.history.push({
      timestamp: new Date().toISOString(),
      ...checkResult
    });
    
    // Keep only last 1000 entries
    if (monitoring.history.length > 1000) {
      monitoring.history = monitoring.history.slice(-1000);
    }
  }

  res.json({
    serverId,
    checkResult,
    server: {
      name: server.name,
      ip: server.ip,
      port: server.port,
      status: server.status,
      lastCheck: server.lastCheck
    }
  });
});

// Get server alerts
router.get('/server/:serverId/alerts', (req, res) => {
  const { serverId } = req.params;
  const { limit = 50, severity } = req.query;
  
  const monitoring = monitoringData.get(serverId);
  if (!monitoring) {
    return res.status(404).json({ error: 'Server monitoring data not found' });
  }

  let alerts = monitoring.alerts;
  
  if (severity) {
    alerts = alerts.filter(alert => alert.severity === severity);
  }

  alerts = alerts.slice(0, parseInt(limit));

  res.json({
    serverId,
    alerts,
    summary: {
      total: monitoring.alerts.length,
      critical: monitoring.alerts.filter(a => a.severity === 'critical').length,
      warning: monitoring.alerts.filter(a => a.severity === 'warning').length,
      info: monitoring.alerts.filter(a => a.severity === 'info').length
    }
  });
});

// Bulk operations
router.post('/servers/bulk', async (req, res) => {
  const { action, serverIds, config } = req.body;
  
  if (!action || !serverIds || !Array.isArray(serverIds)) {
    return res.status(400).json({ error: 'Action and server IDs array are required' });
  }

  const results = [];
  
  for (const serverId of serverIds) {
    const server = serverConfigs.get(serverId);
    if (!server) {
      results.push({ serverId, success: false, error: 'Server not found' });
      continue;
    }

    try {
      switch (action) {
        case 'check':
          const checkResult = await performServerCheck(server);
          server.status = checkResult.online ? 'online' : 'offline';
          server.lastCheck = new Date().toISOString();
          serverConfigs.set(serverId, server);
          results.push({ serverId, success: true, result: checkResult });
          break;
          
        case 'update':
          const updatedServer = { ...server, ...config, updatedAt: new Date().toISOString() };
          serverConfigs.set(serverId, updatedServer);
          results.push({ serverId, success: true, result: 'Updated' });
          break;
          
        case 'start_monitoring':
          startServerMonitoring(serverId);
          results.push({ serverId, success: true, result: 'Monitoring started' });
          break;
          
        case 'stop_monitoring':
          stopServerMonitoring(serverId);
          results.push({ serverId, success: true, result: 'Monitoring stopped' });
          break;
          
        default:
          results.push({ serverId, success: false, error: 'Unknown action' });
      }
    } catch (error) {
      results.push({ serverId, success: false, error: error.message });
    }
  }

  res.json({
    action,
    results,
    summary: {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }
  });
});

// Server groups management
router.post('/groups', (req, res) => {
  const { name, description, serverIds = [], settings = {} } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Group name is required' });
  }

  const groupId = crypto.randomUUID();
  const group = {
    id: groupId,
    name,
    description,
    serverIds,
    settings,
    createdAt: new Date().toISOString()
  };

  // Store group (in production, use database)
  // For now, just return the created group
  res.json({
    success: true,
    group,
    message: 'Server group created successfully'
  });
});

// Export server configurations
router.get('/export', (req, res) => {
  const { format = 'json' } = req.query;
  
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    servers: Array.from(serverConfigs.values())
  };

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="shrekapi-servers.json"');
    res.json(exportData);
  } else {
    res.status(400).json({ error: 'Unsupported export format' });
  }
});

// Import server configurations
router.post('/import', async (req, res) => {
  const { servers, overwrite = false } = req.body;
  
  if (!servers || !Array.isArray(servers)) {
    return res.status(400).json({ error: 'Servers array is required' });
  }

  const results = [];
  
  for (const serverData of servers) {
    try {
      const serverId = serverData.id || crypto.randomUUID();
      
      if (serverConfigs.has(serverId) && !overwrite) {
        results.push({ 
          server: serverData.name, 
          success: false, 
          error: 'Server already exists (use overwrite=true to replace)' 
        });
        continue;
      }

      const server = {
        ...serverData,
        id: serverId,
        updatedAt: new Date().toISOString()
      };

      serverConfigs.set(serverId, server);
      
      // Initialize monitoring
      if (!monitoringData.has(serverId)) {
        monitoringData.set(serverId, {
          history: [],
          alerts: [],
          statistics: { uptime: 0, averagePing: 0, averagePlayers: 0, totalChecks: 0 }
        });
      }

      results.push({ server: server.name, success: true, id: serverId });
    } catch (error) {
      results.push({ 
        server: serverData.name || 'Unknown', 
        success: false, 
        error: error.message 
      });
    }
  }

  res.json({
    imported: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  });
});

// Helper functions
async function performServerCheck(server) {
  try {
    const startTime = Date.now();
    const response = await axios.get(`https://api.mcsrvstat.us/2/${server.ip}:${server.port}`, {
      timeout: 10000
    });
    const pingTime = Date.now() - startTime;

    const data = response.data;
    
    return {
      online: data.online || false,
      players: {
        online: data.players?.online || 0,
        max: data.players?.max || 0,
        list: data.players?.list || []
      },
      version: data.version || 'Unknown',
      motd: data.motd?.clean?.[0] || '',
      ping: pingTime,
      software: data.software || 'Unknown',
      map: data.map || null,
      gamemode: data.gamemode || null
    };
  } catch (error) {
    return {
      online: false,
      error: error.message,
      ping: null,
      players: { online: 0, max: 0, list: [] }
    };
  }
}

function startServerMonitoring(serverId) {
  const server = serverConfigs.get(serverId);
  if (!server || !server.monitoring.enabled) return;

  const interval = setInterval(async () => {
    const checkResult = await performServerCheck(server);
    
    // Update server status
    server.status = checkResult.online ? 'online' : 'offline';
    server.lastCheck = new Date().toISOString();
    serverConfigs.set(serverId, server);

    // Add to monitoring history
    const monitoring = monitoringData.get(serverId);
    if (monitoring) {
      monitoring.history.push({
        timestamp: new Date().toISOString(),
        ...checkResult
      });
      
      // Update statistics
      monitoring.statistics.totalChecks++;
      if (checkResult.online) {
        monitoring.statistics.uptime = 
          (monitoring.statistics.uptime * (monitoring.statistics.totalChecks - 1) + 1) / 
          monitoring.statistics.totalChecks;
      }

      // Check for alerts
      checkForAlerts(serverId, server, checkResult, monitoring);
      
      // Keep only last 1000 entries
      if (monitoring.history.length > 1000) {
        monitoring.history = monitoring.history.slice(-1000);
      }
    }
  }, server.monitoring.interval * 1000);

  // Store interval ID for cleanup
  server._monitoringInterval = interval;
}

function stopServerMonitoring(serverId) {
  const server = serverConfigs.get(serverId);
  if (server && server._monitoringInterval) {
    clearInterval(server._monitoringInterval);
    delete server._monitoringInterval;
  }
}

function checkForAlerts(serverId, server, checkResult, monitoring) {
  const alerts = server.monitoring.alerts;
  const thresholds = server.monitoring.thresholds;
  
  // Offline alert
  if (alerts.offline && !checkResult.online) {
    addAlert(monitoring, 'critical', 'Server Offline', `Server ${server.name} is offline`);
  }
  
  // High ping alert
  if (alerts.highPing && checkResult.ping && checkResult.ping > thresholds.maxPing) {
    addAlert(monitoring, 'warning', 'High Ping', `Server ping is ${checkResult.ping}ms (threshold: ${thresholds.maxPing}ms)`);
  }
  
  // Player count alert
  if (alerts.playerCount && checkResult.players.online > thresholds.maxPlayers) {
    addAlert(monitoring, 'info', 'High Player Count', `Server has ${checkResult.players.online} players (threshold: ${thresholds.maxPlayers})`);
  }
}

function addAlert(monitoring, severity, title, message) {
  monitoring.alerts.unshift({
    id: crypto.randomUUID(),
    severity,
    title,
    message,
    timestamp: new Date().toISOString(),
    acknowledged: false
  });
  
  // Keep only last 100 alerts
  if (monitoring.alerts.length > 100) {
    monitoring.alerts = monitoring.alerts.slice(0, 100);
  }
}

function parseTimeRange(timeRange) {
  const units = {
    'h': 60 * 60 * 1000,
    'd': 24 * 60 * 60 * 1000,
    'w': 7 * 24 * 60 * 60 * 1000
  };
  
  const match = timeRange.match(/^(\d+)([hdw])$/);
  if (!match) return 24 * 60 * 60 * 1000; // Default 24 hours
  
  const [, amount, unit] = match;
  return parseInt(amount) * units[unit];
}

function generateServerAnalytics(history) {
  if (history.length === 0) return {};
  
  const onlineHistory = history.filter(h => h.online);
  const uptime = (onlineHistory.length / history.length) * 100;
  
  const avgPing = onlineHistory.length > 0 ? 
    onlineHistory.reduce((sum, h) => sum + (h.ping || 0), 0) / onlineHistory.length : 0;
    
  const avgPlayers = onlineHistory.length > 0 ?
    onlineHistory.reduce((sum, h) => sum + h.players.online, 0) / onlineHistory.length : 0;

  return {
    uptime: Math.round(uptime * 100) / 100,
    averagePing: Math.round(avgPing),
    averagePlayers: Math.round(avgPlayers * 100) / 100,
    peakPlayers: Math.max(...history.map(h => h.players?.online || 0)),
    totalChecks: history.length
  };
}

function generateServerRecommendations(server, monitoring) {
  const recommendations = [];
  
  if (monitoring.statistics.uptime < 0.95) {
    recommendations.push({
      type: 'reliability',
      priority: 'high',
      message: 'Server uptime is below 95%. Consider investigating connectivity issues.'
    });
  }
  
  if (monitoring.statistics.averagePing > 150) {
    recommendations.push({
      type: 'performance',
      priority: 'medium',
      message: 'Average ping is high. Consider server location or network optimization.'
    });
  }
  
  if (!server.monitoring.enabled) {
    recommendations.push({
      type: 'monitoring',
      priority: 'low',
      message: 'Enable monitoring to track server performance and receive alerts.'
    });
  }
  
  return recommendations;
}

module.exports = router;
