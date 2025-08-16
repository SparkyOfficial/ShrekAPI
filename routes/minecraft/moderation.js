const express = require('express');
const crypto = require('crypto');

const router = express.Router();

// In-memory storage for moderation data (use database in production)
let moderationSystems = new Map();
let chatLogs = [];
let violations = [];
let filters = new Map();

// Create moderation system
router.post('/system/create', (req, res) => {
  const {
    serverIp,
    settings = {},
    filters = ['profanity', 'spam', 'caps', 'advertising'],
    actions = ['warn', 'mute', 'kick', 'ban'],
    autoModeration = true
  } = req.body;

  if (!serverIp) {
    return res.status(400).json({ error: 'Server IP is required' });
  }

  const systemId = crypto.randomUUID();
  const system = createModerationSystem(systemId, serverIp, settings, filters, actions, autoModeration);

  moderationSystems.set(systemId, system);

  res.json({
    systemId,
    system,
    configuration: system.configuration,
    filters: system.filters,
    timestamp: new Date().toISOString()
  });
});

// Chat analysis and filtering
router.post('/chat/analyze', (req, res) => {
  const {
    systemId,
    message,
    playerId,
    playerName,
    timestamp = new Date().toISOString(),
    context = {}
  } = req.body;

  if (!systemId || !message || !playerId) {
    return res.status(400).json({ error: 'System ID, message, and player ID are required' });
  }

  const system = moderationSystems.get(systemId);
  if (!system) {
    return res.status(404).json({ error: 'Moderation system not found' });
  }

  const analysis = analyzeChatMessage(system, message, playerId, playerName, timestamp, context);

  // Log the message
  const chatLog = {
    id: crypto.randomUUID(),
    systemId,
    playerId,
    playerName,
    message,
    timestamp,
    analysis,
    context
  };
  chatLogs.push(chatLog);

  // Take action if violations detected
  if (analysis.violations.length > 0) {
    const actions = takeAutoActions(system, playerId, analysis);
    analysis.actions = actions;
  }

  res.json({
    systemId,
    analysis,
    message: {
      original: message,
      filtered: analysis.filteredMessage,
      allowed: analysis.allowed
    },
    violations: analysis.violations,
    actions: analysis.actions || [],
    timestamp: new Date().toISOString()
  });
});

// Batch chat analysis
router.post('/chat/batch-analyze', (req, res) => {
  const {
    systemId,
    messages = [],
    options = {}
  } = req.body;

  if (!systemId || !messages.length) {
    return res.status(400).json({ error: 'System ID and messages are required' });
  }

  const system = moderationSystems.get(systemId);
  if (!system) {
    return res.status(404).json({ error: 'Moderation system not found' });
  }

  const results = messages.map(msg => {
    const analysis = analyzeChatMessage(system, msg.message, msg.playerId, msg.playerName, msg.timestamp, msg.context);
    return {
      messageId: msg.id || crypto.randomUUID(),
      analysis,
      actions: analysis.violations.length > 0 ? takeAutoActions(system, msg.playerId, analysis) : []
    };
  });

  const summary = generateBatchAnalysisSummary(results);

  res.json({
    systemId,
    results,
    summary,
    recommendations: generateModerationRecommendations(summary),
    timestamp: new Date().toISOString()
  });
});

// Player behavior analysis
router.get('/players/:playerId/behavior', (req, res) => {
  const { playerId } = req.params;
  const { systemId, period = '7d', includeContext = true } = req.query;

  if (!systemId) {
    return res.status(400).json({ error: 'System ID is required' });
  }

  const system = moderationSystems.get(systemId);
  if (!system) {
    return res.status(404).json({ error: 'Moderation system not found' });
  }

  const behavior = analyzePlayerBehavior(systemId, playerId, period, includeContext);

  res.json({
    systemId,
    playerId,
    behavior,
    riskScore: calculatePlayerRiskScore(behavior),
    recommendations: generatePlayerRecommendations(behavior),
    timestamp: new Date().toISOString()
  });
});

// Filter management
router.post('/filters/manage', (req, res) => {
  const {
    systemId,
    action, // 'add', 'update', 'remove', 'test'
    filterType,
    filterData = {}
  } = req.body;

  if (!systemId || !action) {
    return res.status(400).json({ error: 'System ID and action are required' });
  }

  const system = moderationSystems.get(systemId);
  if (!system) {
    return res.status(404).json({ error: 'Moderation system not found' });
  }

  const result = manageFilter(system, action, filterType, filterData);

  res.json({
    systemId,
    action,
    result,
    filters: system.filters,
    timestamp: new Date().toISOString()
  });
});

// Violation management
router.post('/violations/manage', (req, res) => {
  const {
    systemId,
    playerId,
    action, // 'warn', 'mute', 'kick', 'ban', 'pardon'
    reason = '',
    duration = null,
    severity = 'medium'
  } = req.body;

  if (!systemId || !playerId || !action) {
    return res.status(400).json({ error: 'System ID, player ID, and action are required' });
  }

  const system = moderationSystems.get(systemId);
  if (!system) {
    return res.status(404).json({ error: 'Moderation system not found' });
  }

  const result = manageViolation(system, playerId, action, reason, duration, severity);

  res.json({
    systemId,
    playerId,
    action,
    result,
    violation: result.violation,
    playerHistory: getPlayerViolationHistory(systemId, playerId),
    timestamp: new Date().toISOString()
  });
});

// Auto-moderation configuration
router.post('/auto-mod/configure', (req, res) => {
  const {
    systemId,
    rules = [],
    thresholds = {},
    escalation = {},
    whitelist = []
  } = req.body;

  if (!systemId) {
    return res.status(400).json({ error: 'System ID is required' });
  }

  const system = moderationSystems.get(systemId);
  if (!system) {
    return res.status(404).json({ error: 'Moderation system not found' });
  }

  const config = configureAutoModeration(system, rules, thresholds, escalation, whitelist);

  res.json({
    systemId,
    configuration: config,
    rules: config.rules,
    testing: generateAutoModTestCases(config),
    timestamp: new Date().toISOString()
  });
});

// Moderation reports
router.get('/reports/:systemId', (req, res) => {
  const { systemId } = req.params;
  const { 
    reportType = 'summary', 
    period = '24h', 
    playerId, 
    filterType 
  } = req.query;

  const system = moderationSystems.get(systemId);
  if (!system) {
    return res.status(404).json({ error: 'Moderation system not found' });
  }

  const report = generateModerationReport(systemId, reportType, period, { playerId, filterType });

  res.json({
    systemId,
    report,
    insights: generateModerationInsights(report),
    trends: analyzeModerationTrends(systemId, period),
    timestamp: new Date().toISOString()
  });
});

// Helper functions
function createModerationSystem(id, serverIp, settings, filterTypes, actions, autoModeration) {
  return {
    id,
    serverIp,
    settings: {
      strictMode: settings.strictMode || false,
      logAllMessages: settings.logAllMessages || true,
      autoActions: settings.autoActions || autoModeration,
      appealSystem: settings.appealSystem || true,
      notifyModerators: settings.notifyModerators || true,
      ...settings
    },
    filters: createDefaultFilters(filterTypes),
    actions: actions.map(action => ({
      type: action,
      enabled: true,
      settings: getDefaultActionSettings(action)
    })),
    autoModeration: {
      enabled: autoModeration,
      rules: createDefaultAutoModRules(),
      thresholds: createDefaultThresholds(),
      escalation: createDefaultEscalation()
    },
    statistics: {
      totalMessages: 0,
      violationsDetected: 0,
      actionsPerformed: 0,
      falsePositives: 0
    },
    configuration: {},
    created: new Date().toISOString()
  };
}

function createDefaultFilters(filterTypes) {
  const filters = {};
  
  filterTypes.forEach(type => {
    switch (type) {
      case 'profanity':
        filters.profanity = {
          enabled: true,
          severity: 'medium',
          words: ['badword1', 'badword2'], // Simplified list
          action: 'filter',
          replacement: '***'
        };
        break;
      case 'spam':
        filters.spam = {
          enabled: true,
          maxRepeats: 3,
          timeWindow: 10, // seconds
          similarity: 0.8,
          action: 'warn'
        };
        break;
      case 'caps':
        filters.caps = {
          enabled: true,
          maxPercentage: 70,
          minLength: 10,
          action: 'warn'
        };
        break;
      case 'advertising':
        filters.advertising = {
          enabled: true,
          patterns: ['discord.gg/', 'join my server', 'free items'],
          action: 'block'
        };
        break;
    }
  });
  
  return filters;
}

function getDefaultActionSettings(action) {
  const settings = {
    warn: { maxWarnings: 3, escalate: true },
    mute: { defaultDuration: 300, maxDuration: 3600 },
    kick: { reason: 'Violation of server rules' },
    ban: { defaultDuration: 86400, permanent: false }
  };
  
  return settings[action] || {};
}

function createDefaultAutoModRules() {
  return [
    {
      id: 'spam-detection',
      name: 'Spam Detection',
      conditions: ['repeated_messages', 'rapid_posting'],
      action: 'mute',
      duration: 300
    },
    {
      id: 'profanity-filter',
      name: 'Profanity Filter',
      conditions: ['contains_profanity'],
      action: 'warn',
      escalate: true
    },
    {
      id: 'advertising-block',
      name: 'Advertising Block',
      conditions: ['contains_links', 'advertising_patterns'],
      action: 'block',
      notify: true
    }
  ];
}

function createDefaultThresholds() {
  return {
    spamMessages: 5,
    spamTimeWindow: 30,
    capsPercentage: 70,
    profanityTolerance: 0,
    advertisingTolerance: 0
  };
}

function createDefaultEscalation() {
  return {
    enabled: true,
    levels: [
      { violations: 1, action: 'warn' },
      { violations: 3, action: 'mute', duration: 300 },
      { violations: 5, action: 'kick' },
      { violations: 10, action: 'ban', duration: 86400 }
    ]
  };
}

function analyzeChatMessage(system, message, playerId, playerName, timestamp, context) {
  const analysis = {
    violations: [],
    severity: 'none',
    confidence: 0,
    filteredMessage: message,
    allowed: true,
    metadata: {
      length: message.length,
      wordCount: message.split(' ').length,
      hasLinks: /https?:\/\//.test(message),
      hasMentions: /@\w+/.test(message)
    }
  };

  // Check each filter
  Object.entries(system.filters).forEach(([filterType, filter]) => {
    if (!filter.enabled) return;

    const violation = checkFilter(filterType, filter, message, analysis.metadata);
    if (violation) {
      analysis.violations.push(violation);
      analysis.severity = getHighestSeverity(analysis.severity, violation.severity);
      analysis.confidence = Math.max(analysis.confidence, violation.confidence);

      // Apply filter action
      if (filter.action === 'filter' && filter.replacement) {
        analysis.filteredMessage = applyFilter(analysis.filteredMessage, violation, filter.replacement);
      } else if (filter.action === 'block') {
        analysis.allowed = false;
      }
    }
  });

  return analysis;
}

function checkFilter(filterType, filter, message, metadata) {
  switch (filterType) {
    case 'profanity':
      for (const word of filter.words) {
        if (message.toLowerCase().includes(word.toLowerCase())) {
          return {
            type: 'profanity',
            severity: filter.severity,
            confidence: 0.9,
            details: `Contains profanity: ${word}`,
            position: message.toLowerCase().indexOf(word.toLowerCase())
          };
        }
      }
      break;

    case 'spam':
      // Check recent messages from same player
      const recentMessages = chatLogs
        .filter(log => log.playerId === playerId && 
                      new Date() - new Date(log.timestamp) < filter.timeWindow * 1000)
        .slice(-filter.maxRepeats);
      
      if (recentMessages.length >= filter.maxRepeats) {
        const similarity = calculateMessageSimilarity(message, recentMessages.map(m => m.message));
        if (similarity >= filter.similarity) {
          return {
            type: 'spam',
            severity: 'medium',
            confidence: similarity,
            details: `Repeated similar messages detected`,
            count: recentMessages.length
          };
        }
      }
      break;

    case 'caps':
      if (message.length >= filter.minLength) {
        const capsCount = (message.match(/[A-Z]/g) || []).length;
        const capsPercentage = (capsCount / message.length) * 100;
        
        if (capsPercentage > filter.maxPercentage) {
          return {
            type: 'caps',
            severity: 'low',
            confidence: 0.8,
            details: `Excessive caps usage: ${capsPercentage.toFixed(1)}%`,
            percentage: capsPercentage
          };
        }
      }
      break;

    case 'advertising':
      for (const pattern of filter.patterns) {
        if (message.toLowerCase().includes(pattern.toLowerCase())) {
          return {
            type: 'advertising',
            severity: 'high',
            confidence: 0.85,
            details: `Advertising pattern detected: ${pattern}`,
            pattern
          };
        }
      }
      break;
  }

  return null;
}

function takeAutoActions(system, playerId, analysis) {
  if (!system.autoModeration.enabled) return [];

  const actions = [];
  const playerHistory = getPlayerViolationHistory(system.id, playerId);
  const totalViolations = playerHistory.length;

  // Check escalation rules
  for (const level of system.autoModeration.escalation.levels) {
    if (totalViolations >= level.violations) {
      const action = {
        id: crypto.randomUUID(),
        type: level.action,
        playerId,
        reason: `Auto-moderation: ${analysis.violations.map(v => v.type).join(', ')}`,
        duration: level.duration,
        timestamp: new Date().toISOString(),
        automated: true
      };

      actions.push(action);
      
      // Record violation
      violations.push({
        id: crypto.randomUUID(),
        systemId: system.id,
        playerId,
        violations: analysis.violations,
        action,
        timestamp: new Date().toISOString()
      });

      break; // Only apply highest applicable escalation
    }
  }

  return actions;
}

function manageFilter(system, action, filterType, filterData) {
  let success = false;
  let message = '';

  switch (action) {
    case 'add':
      if (!system.filters[filterType]) {
        system.filters[filterType] = {
          enabled: true,
          ...filterData
        };
        success = true;
        message = `Filter ${filterType} added`;
      } else {
        message = 'Filter already exists';
      }
      break;

    case 'update':
      if (system.filters[filterType]) {
        Object.assign(system.filters[filterType], filterData);
        success = true;
        message = `Filter ${filterType} updated`;
      } else {
        message = 'Filter not found';
      }
      break;

    case 'remove':
      if (system.filters[filterType]) {
        delete system.filters[filterType];
        success = true;
        message = `Filter ${filterType} removed`;
      } else {
        message = 'Filter not found';
      }
      break;

    case 'test':
      if (system.filters[filterType] && filterData.testMessage) {
        const result = checkFilter(filterType, system.filters[filterType], filterData.testMessage, {});
        success = true;
        message = result ? 'Filter triggered' : 'Filter passed';
        return { success, message, testResult: result };
      }
      break;
  }

  return { success, message };
}

function manageViolation(system, playerId, action, reason, duration, severity) {
  const violation = {
    id: crypto.randomUUID(),
    systemId: system.id,
    playerId,
    action,
    reason,
    duration,
    severity,
    timestamp: new Date().toISOString(),
    automated: false
  };

  violations.push(violation);

  return {
    success: true,
    message: `${action} applied to player ${playerId}`,
    violation
  };
}

function analyzePlayerBehavior(systemId, playerId, period, includeContext) {
  const playerLogs = chatLogs.filter(log => 
    log.systemId === systemId && 
    log.playerId === playerId &&
    isWithinPeriod(log.timestamp, period)
  );

  const playerViolations = violations.filter(v => 
    v.systemId === systemId && 
    v.playerId === playerId &&
    isWithinPeriod(v.timestamp, period)
  );

  return {
    messageCount: playerLogs.length,
    violationCount: playerViolations.length,
    violationTypes: [...new Set(playerViolations.flatMap(v => v.violations?.map(viol => viol.type) || []))],
    averageMessageLength: playerLogs.reduce((sum, log) => sum + log.message.length, 0) / playerLogs.length || 0,
    activityPattern: analyzeActivityPattern(playerLogs),
    riskFactors: identifyRiskFactors(playerLogs, playerViolations),
    improvement: calculateImprovementTrend(playerViolations)
  };
}

function generateModerationReport(systemId, reportType, period, filters) {
  const systemLogs = chatLogs.filter(log => 
    log.systemId === systemId && 
    isWithinPeriod(log.timestamp, period)
  );

  const systemViolations = violations.filter(v => 
    v.systemId === systemId && 
    isWithinPeriod(v.timestamp, period)
  );

  return {
    summary: {
      totalMessages: systemLogs.length,
      totalViolations: systemViolations.length,
      violationRate: (systemViolations.length / systemLogs.length * 100).toFixed(2) + '%',
      uniquePlayers: new Set(systemLogs.map(log => log.playerId)).size
    },
    violations: {
      byType: groupViolationsByType(systemViolations),
      bySeverity: groupViolationsBySeverity(systemViolations),
      byPlayer: groupViolationsByPlayer(systemViolations)
    },
    trends: {
      hourly: generateHourlyTrends(systemLogs, systemViolations),
      daily: generateDailyTrends(systemLogs, systemViolations)
    },
    topOffenders: getTopOffenders(systemId, period, 10)
  };
}

// Additional helper functions
function calculateMessageSimilarity(message, recentMessages) {
  if (recentMessages.length === 0) return 0;
  
  return recentMessages.reduce((maxSim, recent) => {
    const similarity = message === recent ? 1 : 0.5; // Simplified similarity
    return Math.max(maxSim, similarity);
  }, 0);
}

function getHighestSeverity(current, newSeverity) {
  const severityLevels = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };
  return severityLevels[newSeverity] > severityLevels[current] ? newSeverity : current;
}

function applyFilter(message, violation, replacement) {
  // Simplified filter application
  return message.replace(new RegExp(violation.details.split(': ')[1], 'gi'), replacement);
}

function getPlayerViolationHistory(systemId, playerId) {
  return violations.filter(v => v.systemId === systemId && v.playerId === playerId);
}

function calculatePlayerRiskScore(behavior) {
  let score = 0;
  
  score += behavior.violationCount * 10;
  score += behavior.violationTypes.length * 5;
  score += Math.max(0, behavior.averageMessageLength - 100) * 0.1;
  
  return Math.min(100, Math.max(0, score));
}

function generatePlayerRecommendations(behavior) {
  const recommendations = [];
  
  if (behavior.violationCount > 5) {
    recommendations.push('Consider temporary restrictions');
  }
  
  if (behavior.violationTypes.includes('spam')) {
    recommendations.push('Monitor for spam patterns');
  }
  
  if (behavior.riskFactors.length > 0) {
    recommendations.push('Review recent activity closely');
  }
  
  return recommendations;
}

function isWithinPeriod(timestamp, period) {
  const now = new Date();
  const periodMs = parsePeriod(period);
  return now - new Date(timestamp) <= periodMs;
}

function parsePeriod(period) {
  const match = period.match(/^(\d+)([hdw])$/);
  if (!match) return 24 * 60 * 60 * 1000; // Default 24h
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'w': return value * 7 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

function analyzeActivityPattern(logs) {
  const hours = logs.map(log => new Date(log.timestamp).getHours());
  const hourCounts = {};
  
  hours.forEach(hour => {
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  return {
    peakHour: Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b),
    distribution: hourCounts
  };
}

function identifyRiskFactors(logs, violations) {
  const factors = [];
  
  if (violations.length > logs.length * 0.1) {
    factors.push('High violation rate');
  }
  
  if (logs.some(log => log.message.length > 500)) {
    factors.push('Unusually long messages');
  }
  
  return factors;
}

function calculateImprovementTrend(violations) {
  if (violations.length < 2) return 'insufficient_data';
  
  const recent = violations.slice(-5);
  const older = violations.slice(-10, -5);
  
  return recent.length < older.length ? 'improving' : 'declining';
}

function groupViolationsByType(violations) {
  const groups = {};
  violations.forEach(v => {
    if (v.violations) {
      v.violations.forEach(viol => {
        groups[viol.type] = (groups[viol.type] || 0) + 1;
      });
    }
  });
  return groups;
}

function groupViolationsBySeverity(violations) {
  const groups = {};
  violations.forEach(v => {
    groups[v.severity] = (groups[v.severity] || 0) + 1;
  });
  return groups;
}

function groupViolationsByPlayer(violations) {
  const groups = {};
  violations.forEach(v => {
    groups[v.playerId] = (groups[v.playerId] || 0) + 1;
  });
  return groups;
}

function generateHourlyTrends(logs, violations) {
  return { messages: 'steady', violations: 'decreasing' };
}

function generateDailyTrends(logs, violations) {
  return { messages: 'increasing', violations: 'stable' };
}

function getTopOffenders(systemId, period, limit) {
  const systemViolations = violations.filter(v => 
    v.systemId === systemId && 
    isWithinPeriod(v.timestamp, period)
  );
  
  const playerCounts = {};
  systemViolations.forEach(v => {
    playerCounts[v.playerId] = (playerCounts[v.playerId] || 0) + 1;
  });
  
  return Object.entries(playerCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([playerId, count]) => ({ playerId, violationCount: count }));
}

function generateBatchAnalysisSummary(results) {
  return {
    total: results.length,
    violations: results.filter(r => r.analysis.violations.length > 0).length,
    blocked: results.filter(r => !r.analysis.allowed).length,
    actions: results.reduce((sum, r) => sum + r.actions.length, 0)
  };
}

function generateModerationRecommendations(summary) {
  return [
    'Review filter sensitivity settings',
    'Consider adjusting auto-moderation thresholds',
    'Monitor for false positives'
  ];
}

function configureAutoModeration(system, rules, thresholds, escalation, whitelist) {
  system.autoModeration.rules = rules.length > 0 ? rules : system.autoModeration.rules;
  system.autoModeration.thresholds = { ...system.autoModeration.thresholds, ...thresholds };
  system.autoModeration.escalation = { ...system.autoModeration.escalation, ...escalation };
  system.autoModeration.whitelist = whitelist;
  
  return system.autoModeration;
}

function generateAutoModTestCases(config) {
  return [
    { message: 'This is spam spam spam', expected: 'spam_detection' },
    { message: 'STOP YELLING AT ME!!!', expected: 'caps_filter' },
    { message: 'Join my discord server!', expected: 'advertising_block' }
  ];
}

function generateModerationInsights(report) {
  return [
    'Spam detection is working effectively',
    'Consider reviewing profanity filter sensitivity',
    'Player behavior trends are improving'
  ];
}

function analyzeModerationTrends(systemId, period) {
  return {
    violations: 'decreasing',
    falsePositives: 'stable',
    playerCompliance: 'improving'
  };
}

module.exports = router;
