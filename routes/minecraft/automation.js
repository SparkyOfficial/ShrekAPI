const express = require('express');
const crypto = require('crypto');
const cron = require('node-cron');

const router = express.Router();

// Automation rules storage
let automationRules = new Map();
let scheduledTasks = new Map();

// Create automation rule
router.post('/rules', (req, res) => {
  const {
    name,
    description = '',
    trigger,
    conditions = [],
    actions = [],
    enabled = true,
    schedule = null
  } = req.body;

  if (!name || !trigger || !actions.length) {
    return res.status(400).json({ error: 'Name, trigger, and actions are required' });
  }

  const ruleId = crypto.randomUUID();
  const rule = {
    id: ruleId,
    name,
    description,
    trigger,
    conditions,
    actions,
    enabled,
    schedule,
    createdAt: new Date().toISOString(),
    lastExecuted: null,
    executionCount: 0,
    successCount: 0,
    failureCount: 0
  };

  automationRules.set(ruleId, rule);

  // Schedule rule if it has a cron schedule
  if (schedule && enabled) {
    scheduleRule(ruleId, rule);
  }

  res.json({
    success: true,
    ruleId,
    rule,
    message: 'Automation rule created successfully'
  });
});

// Get all automation rules
router.get('/rules', (req, res) => {
  const { enabled, trigger } = req.query;
  
  let rules = Array.from(automationRules.values());
  
  if (enabled !== undefined) {
    rules = rules.filter(rule => rule.enabled === (enabled === 'true'));
  }
  
  if (trigger) {
    rules = rules.filter(rule => rule.trigger.type === trigger);
  }

  const summary = {
    total: rules.length,
    enabled: rules.filter(r => r.enabled).length,
    disabled: rules.filter(r => !r.enabled).length,
    scheduled: rules.filter(r => r.schedule).length
  };

  res.json({
    rules,
    summary,
    timestamp: new Date().toISOString()
  });
});

// Get specific automation rule
router.get('/rules/:ruleId', (req, res) => {
  const { ruleId } = req.params;
  
  const rule = automationRules.get(ruleId);
  if (!rule) {
    return res.status(404).json({ error: 'Automation rule not found' });
  }

  const executionHistory = getExecutionHistory(ruleId);
  
  res.json({
    rule,
    executionHistory,
    statistics: {
      successRate: rule.executionCount > 0 ? 
        ((rule.successCount / rule.executionCount) * 100).toFixed(2) + '%' : '0%',
      averageExecutionTime: Math.floor(Math.random() * 1000) + 100 + 'ms',
      nextExecution: rule.schedule ? getNextExecution(rule.schedule) : null
    }
  });
});

// Update automation rule
router.put('/rules/:ruleId', (req, res) => {
  const { ruleId } = req.params;
  const updates = req.body;
  
  const rule = automationRules.get(ruleId);
  if (!rule) {
    return res.status(404).json({ error: 'Automation rule not found' });
  }

  const updatedRule = {
    ...rule,
    ...updates,
    id: ruleId, // Prevent ID changes
    updatedAt: new Date().toISOString()
  };

  automationRules.set(ruleId, updatedRule);

  // Reschedule if schedule changed
  if (updates.schedule !== undefined || updates.enabled !== undefined) {
    unscheduleRule(ruleId);
    if (updatedRule.schedule && updatedRule.enabled) {
      scheduleRule(ruleId, updatedRule);
    }
  }

  res.json({
    success: true,
    rule: updatedRule,
    message: 'Automation rule updated successfully'
  });
});

// Delete automation rule
router.delete('/rules/:ruleId', (req, res) => {
  const { ruleId } = req.params;
  
  if (!automationRules.has(ruleId)) {
    return res.status(404).json({ error: 'Automation rule not found' });
  }

  unscheduleRule(ruleId);
  automationRules.delete(ruleId);

  res.json({
    success: true,
    message: 'Automation rule deleted successfully'
  });
});

// Execute automation rule manually
router.post('/rules/:ruleId/execute', async (req, res) => {
  const { ruleId } = req.params;
  const { dryRun = false } = req.body;
  
  const rule = automationRules.get(ruleId);
  if (!rule) {
    return res.status(404).json({ error: 'Automation rule not found' });
  }

  try {
    const result = await executeRule(rule, dryRun);
    
    if (!dryRun) {
      rule.executionCount++;
      if (result.success) {
        rule.successCount++;
      } else {
        rule.failureCount++;
      }
      rule.lastExecuted = new Date().toISOString();
      automationRules.set(ruleId, rule);
    }

    res.json({
      ruleId,
      dryRun,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to execute automation rule',
      message: error.message
    });
  }
});

// Server maintenance automation
router.post('/maintenance/schedule', (req, res) => {
  const {
    serverIds = [],
    maintenanceType = 'restart',
    schedule,
    duration = 300, // seconds
    notification = {
      enabled: true,
      beforeMinutes: [30, 10, 5, 1]
    },
    actions = []
  } = req.body;

  if (!schedule || !serverIds.length) {
    return res.status(400).json({ error: 'Schedule and server IDs are required' });
  }

  const maintenanceId = crypto.randomUUID();
  const maintenance = {
    id: maintenanceId,
    serverIds,
    maintenanceType,
    schedule,
    duration,
    notification,
    actions,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    nextExecution: getNextExecution(schedule)
  };

  // Create automation rule for maintenance
  const ruleId = crypto.randomUUID();
  const rule = {
    id: ruleId,
    name: `Maintenance: ${maintenanceType}`,
    description: `Automated ${maintenanceType} for ${serverIds.length} servers`,
    trigger: { type: 'schedule', schedule },
    conditions: [],
    actions: [
      {
        type: 'maintenance',
        config: maintenance
      }
    ],
    enabled: true,
    schedule,
    createdAt: new Date().toISOString(),
    lastExecuted: null,
    executionCount: 0,
    successCount: 0,
    failureCount: 0
  };

  automationRules.set(ruleId, rule);
  scheduleRule(ruleId, rule);

  res.json({
    success: true,
    maintenanceId,
    ruleId,
    maintenance,
    message: 'Maintenance scheduled successfully'
  });
});

// Backup automation
router.post('/backup/schedule', (req, res) => {
  const {
    serverIds = [],
    backupType = 'world',
    schedule = '0 2 * * *', // Daily at 2 AM
    retention = 7, // days
    compression = true,
    storage = {
      type: 'local',
      path: '/backups'
    }
  } = req.body;

  if (!serverIds.length) {
    return res.status(400).json({ error: 'Server IDs are required' });
  }

  const backupId = crypto.randomUUID();
  const backup = {
    id: backupId,
    serverIds,
    backupType,
    schedule,
    retention,
    compression,
    storage,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    nextExecution: getNextExecution(schedule),
    lastBackup: null,
    totalBackups: 0
  };

  // Create automation rule for backup
  const ruleId = crypto.randomUUID();
  const rule = {
    id: ruleId,
    name: `Backup: ${backupType}`,
    description: `Automated ${backupType} backup for ${serverIds.length} servers`,
    trigger: { type: 'schedule', schedule },
    conditions: [],
    actions: [
      {
        type: 'backup',
        config: backup
      }
    ],
    enabled: true,
    schedule,
    createdAt: new Date().toISOString(),
    lastExecuted: null,
    executionCount: 0,
    successCount: 0,
    failureCount: 0
  };

  automationRules.set(ruleId, rule);
  scheduleRule(ruleId, rule);

  res.json({
    success: true,
    backupId,
    ruleId,
    backup,
    message: 'Backup automation scheduled successfully'
  });
});

// Performance monitoring automation
router.post('/monitoring/auto-scale', (req, res) => {
  const {
    serverIds = [],
    metrics = ['cpu', 'memory', 'players'],
    thresholds = {
      cpu: { high: 80, low: 30 },
      memory: { high: 85, low: 40 },
      players: { high: 90, low: 20 } // percentage of max players
    },
    actions = {
      scaleUp: ['increase_memory', 'add_instance'],
      scaleDown: ['decrease_memory', 'remove_instance']
    },
    cooldown = 300 // seconds between scaling actions
  } = req.body;

  if (!serverIds.length) {
    return res.status(400).json({ error: 'Server IDs are required' });
  }

  const autoScaleId = crypto.randomUUID();
  const autoScale = {
    id: autoScaleId,
    serverIds,
    metrics,
    thresholds,
    actions,
    cooldown,
    enabled: true,
    createdAt: new Date().toISOString(),
    lastAction: null,
    totalActions: 0
  };

  // Create monitoring rule
  const ruleId = crypto.randomUUID();
  const rule = {
    id: ruleId,
    name: 'Auto-Scale Monitoring',
    description: `Automatic scaling for ${serverIds.length} servers`,
    trigger: { type: 'metric', interval: 60 }, // Check every minute
    conditions: [
      {
        type: 'metric_threshold',
        config: { metrics, thresholds }
      }
    ],
    actions: [
      {
        type: 'auto_scale',
        config: autoScale
      }
    ],
    enabled: true,
    schedule: null,
    createdAt: new Date().toISOString(),
    lastExecuted: null,
    executionCount: 0,
    successCount: 0,
    failureCount: 0
  };

  automationRules.set(ruleId, rule);

  res.json({
    success: true,
    autoScaleId,
    ruleId,
    autoScale,
    message: 'Auto-scaling configured successfully'
  });
});

// Alert automation
router.post('/alerts/auto-response', (req, res) => {
  const {
    alertTypes = ['server_offline', 'high_ping', 'low_tps'],
    responses = {
      server_offline: ['restart_server', 'notify_admin'],
      high_ping: ['check_network', 'notify_admin'],
      low_tps: ['restart_server', 'analyze_performance']
    },
    severity = ['critical', 'warning'],
    delay = 60 // seconds before auto-response
  } = req.body;

  const autoResponseId = crypto.randomUUID();
  const autoResponse = {
    id: autoResponseId,
    alertTypes,
    responses,
    severity,
    delay,
    enabled: true,
    createdAt: new Date().toISOString(),
    totalResponses: 0
  };

  // Create alert response rule
  const ruleId = crypto.randomUUID();
  const rule = {
    id: ruleId,
    name: 'Alert Auto-Response',
    description: 'Automatic responses to server alerts',
    trigger: { type: 'alert', alertTypes, severity },
    conditions: [
      {
        type: 'alert_severity',
        config: { severity }
      }
    ],
    actions: [
      {
        type: 'auto_response',
        config: autoResponse
      }
    ],
    enabled: true,
    schedule: null,
    createdAt: new Date().toISOString(),
    lastExecuted: null,
    executionCount: 0,
    successCount: 0,
    failureCount: 0
  };

  automationRules.set(ruleId, rule);

  res.json({
    success: true,
    autoResponseId,
    ruleId,
    autoResponse,
    message: 'Alert auto-response configured successfully'
  });
});

// Get automation statistics
router.get('/statistics', (req, res) => {
  const rules = Array.from(automationRules.values());
  
  const stats = {
    totalRules: rules.length,
    enabledRules: rules.filter(r => r.enabled).length,
    totalExecutions: rules.reduce((sum, r) => sum + r.executionCount, 0),
    successfulExecutions: rules.reduce((sum, r) => sum + r.successCount, 0),
    failedExecutions: rules.reduce((sum, r) => sum + r.failureCount, 0),
    averageSuccessRate: rules.length > 0 ? 
      (rules.reduce((sum, r) => sum + (r.executionCount > 0 ? r.successCount / r.executionCount : 0), 0) / rules.length * 100).toFixed(2) + '%' : '0%',
    rulesByType: {
      scheduled: rules.filter(r => r.schedule).length,
      eventBased: rules.filter(r => r.trigger.type !== 'schedule').length,
      maintenance: rules.filter(r => r.actions.some(a => a.type === 'maintenance')).length,
      backup: rules.filter(r => r.actions.some(a => a.type === 'backup')).length,
      monitoring: rules.filter(r => r.actions.some(a => a.type === 'auto_scale')).length
    },
    upcomingExecutions: getUpcomingExecutions()
  };

  res.json({
    statistics: stats,
    timestamp: new Date().toISOString()
  });
});

// Helper functions
function scheduleRule(ruleId, rule) {
  if (!rule.schedule) return;
  
  try {
    const task = cron.schedule(rule.schedule, async () => {
      try {
        await executeRule(rule, false);
        rule.executionCount++;
        rule.successCount++;
        rule.lastExecuted = new Date().toISOString();
        automationRules.set(ruleId, rule);
      } catch (error) {
        rule.executionCount++;
        rule.failureCount++;
        rule.lastExecuted = new Date().toISOString();
        automationRules.set(ruleId, rule);
        console.error(`Failed to execute rule ${ruleId}:`, error);
      }
    }, {
      scheduled: rule.enabled
    });
    
    scheduledTasks.set(ruleId, task);
  } catch (error) {
    console.error(`Failed to schedule rule ${ruleId}:`, error);
  }
}

function unscheduleRule(ruleId) {
  const task = scheduledTasks.get(ruleId);
  if (task) {
    task.destroy();
    scheduledTasks.delete(ruleId);
  }
}

async function executeRule(rule, dryRun = false) {
  const result = {
    success: true,
    actions: [],
    errors: [],
    dryRun
  };

  // Check conditions
  for (const condition of rule.conditions) {
    const conditionMet = await evaluateCondition(condition);
    if (!conditionMet) {
      result.success = false;
      result.errors.push(`Condition not met: ${condition.type}`);
      return result;
    }
  }

  // Execute actions
  for (const action of rule.actions) {
    try {
      const actionResult = await executeAction(action, dryRun);
      result.actions.push({
        type: action.type,
        success: actionResult.success,
        message: actionResult.message,
        dryRun
      });
      
      if (!actionResult.success) {
        result.success = false;
        result.errors.push(actionResult.error || 'Action failed');
      }
    } catch (error) {
      result.success = false;
      result.errors.push(error.message);
      result.actions.push({
        type: action.type,
        success: false,
        error: error.message,
        dryRun
      });
    }
  }

  return result;
}

async function evaluateCondition(condition) {
  // Simulate condition evaluation
  switch (condition.type) {
    case 'metric_threshold':
      return Math.random() > 0.3; // 70% chance condition is met
    case 'alert_severity':
      return Math.random() > 0.5; // 50% chance condition is met
    case 'time_range':
      return true; // Always met for demo
    default:
      return true;
  }
}

async function executeAction(action, dryRun) {
  // Simulate action execution
  const actionTypes = {
    restart_server: () => ({ success: true, message: 'Server restart initiated' }),
    backup: () => ({ success: true, message: 'Backup created successfully' }),
    maintenance: () => ({ success: true, message: 'Maintenance completed' }),
    auto_scale: () => ({ success: true, message: 'Auto-scaling action performed' }),
    auto_response: () => ({ success: true, message: 'Auto-response executed' }),
    notify_admin: () => ({ success: true, message: 'Admin notification sent' }),
    check_network: () => ({ success: true, message: 'Network check completed' }),
    analyze_performance: () => ({ success: true, message: 'Performance analysis completed' })
  };

  if (dryRun) {
    return { success: true, message: `Would execute: ${action.type}` };
  }

  const executor = actionTypes[action.type];
  if (!executor) {
    throw new Error(`Unknown action type: ${action.type}`);
  }

  // Simulate execution time
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 100));
  
  return executor();
}

function getExecutionHistory(ruleId) {
  // Simulate execution history
  return Array.from({ length: 10 }, (_, i) => ({
    id: crypto.randomUUID(),
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    success: Math.random() > 0.2,
    duration: Math.floor(Math.random() * 5000) + 100,
    actions: Math.floor(Math.random() * 3) + 1
  }));
}

function getNextExecution(schedule) {
  try {
    // Simple next execution calculation (in production, use proper cron parser)
    return new Date(Date.now() + 3600000).toISOString(); // Next hour
  } catch (error) {
    return null;
  }
}

function getUpcomingExecutions() {
  const upcoming = [];
  
  automationRules.forEach((rule, ruleId) => {
    if (rule.schedule && rule.enabled) {
      upcoming.push({
        ruleId,
        ruleName: rule.name,
        nextExecution: getNextExecution(rule.schedule),
        type: rule.actions[0]?.type || 'unknown'
      });
    }
  });

  return upcoming.sort((a, b) => new Date(a.nextExecution) - new Date(b.nextExecution)).slice(0, 10);
}

module.exports = router;
