const express = require('express');
const crypto = require('crypto');

const router = express.Router();

// In-memory storage for permissions data (use database in production)
let permissionSystems = new Map();
let groups = new Map();
let users = new Map();
let whitelists = new Map();

// Create permission system
router.post('/system/create', (req, res) => {
  const {
    name,
    type = 'hierarchical', // 'hierarchical', 'flat', 'hybrid'
    defaultGroup = 'default',
    inheritance = true,
    settings = {}
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Permission system name is required' });
  }

  const systemId = crypto.randomUUID();
  const system = createPermissionSystem(systemId, name, type, defaultGroup, inheritance, settings);

  permissionSystems.set(systemId, system);

  res.json({
    systemId,
    system,
    defaultGroups: system.defaultGroups,
    configuration: system.configuration,
    timestamp: new Date().toISOString()
  });
});

// Group management
router.post('/groups/manage', (req, res) => {
  const {
    systemId,
    action, // 'create', 'update', 'delete', 'clone'
    groupId,
    groupData = {}
  } = req.body;

  if (!systemId || !action) {
    return res.status(400).json({ error: 'System ID and action are required' });
  }

  const system = permissionSystems.get(systemId);
  if (!system) {
    return res.status(404).json({ error: 'Permission system not found' });
  }

  const result = manageGroup(system, action, groupId, groupData);

  res.json({
    systemId,
    action,
    result,
    group: result.group,
    hierarchy: generateGroupHierarchy(system),
    timestamp: new Date().toISOString()
  });
});

// User permission management
router.post('/users/manage', (req, res) => {
  const {
    systemId,
    userId,
    action, // 'add', 'remove', 'update', 'promote', 'demote'
    groupId,
    permissions = [],
    temporary = false,
    duration = null
  } = req.body;

  if (!systemId || !userId || !action) {
    return res.status(400).json({ error: 'System ID, user ID, and action are required' });
  }

  const system = permissionSystems.get(systemId);
  if (!system) {
    return res.status(404).json({ error: 'Permission system not found' });
  }

  const result = manageUserPermissions(system, userId, action, groupId, permissions, temporary, duration);

  res.json({
    systemId,
    userId,
    action,
    result,
    userPermissions: result.userPermissions,
    effectivePermissions: calculateEffectivePermissions(system, userId),
    timestamp: new Date().toISOString()
  });
});

// Whitelist management
router.post('/whitelist/manage', (req, res) => {
  const {
    serverIp,
    action, // 'create', 'add', 'remove', 'check', 'sync'
    playerId,
    playerName,
    reason = '',
    settings = {}
  } = req.body;

  if (!serverIp || !action) {
    return res.status(400).json({ error: 'Server IP and action are required' });
  }

  const result = manageWhitelist(serverIp, action, playerId, playerName, reason, settings);

  res.json({
    serverIp,
    action,
    result,
    whitelist: result.whitelist,
    statistics: result.statistics,
    timestamp: new Date().toISOString()
  });
});

// Permission checking
router.post('/check', (req, res) => {
  const {
    systemId,
    userId,
    permission,
    context = {}
  } = req.body;

  if (!systemId || !userId || !permission) {
    return res.status(400).json({ error: 'System ID, user ID, and permission are required' });
  }

  const system = permissionSystems.get(systemId);
  if (!system) {
    return res.status(404).json({ error: 'Permission system not found' });
  }

  const result = checkPermission(system, userId, permission, context);

  res.json({
    systemId,
    userId,
    permission,
    result,
    reasoning: result.reasoning,
    inheritance: result.inheritance,
    timestamp: new Date().toISOString()
  });
});

// Bulk permission operations
router.post('/bulk', (req, res) => {
  const {
    systemId,
    operation, // 'grant', 'revoke', 'migrate', 'cleanup'
    targets = [], // users or groups
    permissions = [],
    settings = {}
  } = req.body;

  if (!systemId || !operation || !targets.length) {
    return res.status(400).json({ error: 'System ID, operation, and targets are required' });
  }

  const system = permissionSystems.get(systemId);
  if (!system) {
    return res.status(404).json({ error: 'Permission system not found' });
  }

  const result = performBulkOperation(system, operation, targets, permissions, settings);

  res.json({
    systemId,
    operation,
    result,
    affected: result.affected,
    summary: result.summary,
    timestamp: new Date().toISOString()
  });
});

// Permission templates
router.post('/templates/manage', (req, res) => {
  const {
    systemId,
    action, // 'create', 'apply', 'update', 'delete'
    templateId,
    templateData = {}
  } = req.body;

  if (!systemId || !action) {
    return res.status(400).json({ error: 'System ID and action are required' });
  }

  const system = permissionSystems.get(systemId);
  if (!system) {
    return res.status(404).json({ error: 'Permission system not found' });
  }

  const result = managePermissionTemplate(system, action, templateId, templateData);

  res.json({
    systemId,
    action,
    result,
    template: result.template,
    availableTemplates: system.templates,
    timestamp: new Date().toISOString()
  });
});

// Permission audit
router.get('/audit/:systemId', (req, res) => {
  const { systemId } = req.params;
  const { userId, groupId, permission, dateFrom, dateTo } = req.query;

  const system = permissionSystems.get(systemId);
  if (!system) {
    return res.status(404).json({ error: 'Permission system not found' });
  }

  const audit = generatePermissionAudit(system, { userId, groupId, permission, dateFrom, dateTo });

  res.json({
    systemId,
    audit,
    summary: audit.summary,
    violations: audit.violations,
    recommendations: audit.recommendations,
    timestamp: new Date().toISOString()
  });
});

// Helper functions
function createPermissionSystem(id, name, type, defaultGroup, inheritance, settings) {
  const system = {
    id,
    name,
    type,
    defaultGroup,
    inheritance,
    settings: {
      caseInsensitive: settings.caseInsensitive || false,
      wildcardSupport: settings.wildcardSupport || true,
      temporaryPermissions: settings.temporaryPermissions || true,
      auditLog: settings.auditLog || true,
      ...settings
    },
    groups: new Map(),
    users: new Map(),
    templates: new Map(),
    auditLog: [],
    created: new Date().toISOString()
  };

  // Create default groups
  system.defaultGroups = createDefaultGroups(system);
  
  return {
    ...system,
    configuration: generateSystemConfiguration(system)
  };
}

function createDefaultGroups(system) {
  const defaultGroups = [
    {
      id: 'admin',
      name: 'Administrator',
      permissions: ['*'],
      priority: 100,
      inheritance: []
    },
    {
      id: 'moderator',
      name: 'Moderator',
      permissions: ['minecraft.command.kick', 'minecraft.command.ban', 'minecraft.command.mute'],
      priority: 50,
      inheritance: ['helper']
    },
    {
      id: 'helper',
      name: 'Helper',
      permissions: ['minecraft.command.tp', 'minecraft.command.heal'],
      priority: 25,
      inheritance: ['vip']
    },
    {
      id: 'vip',
      name: 'VIP',
      permissions: ['minecraft.command.home', 'minecraft.command.sethome'],
      priority: 10,
      inheritance: ['default']
    },
    {
      id: 'default',
      name: 'Default',
      permissions: ['minecraft.command.help', 'minecraft.command.list'],
      priority: 1,
      inheritance: []
    }
  ];

  defaultGroups.forEach(group => {
    system.groups.set(group.id, {
      ...group,
      members: new Set(),
      created: new Date().toISOString()
    });
  });

  return defaultGroups;
}

function manageGroup(system, action, groupId, groupData) {
  let success = false;
  let message = '';
  let group = null;

  switch (action) {
    case 'create':
      if (!system.groups.has(groupData.id)) {
        group = {
          id: groupData.id,
          name: groupData.name || groupData.id,
          permissions: groupData.permissions || [],
          priority: groupData.priority || 1,
          inheritance: groupData.inheritance || [],
          members: new Set(),
          settings: groupData.settings || {},
          created: new Date().toISOString()
        };
        system.groups.set(group.id, group);
        success = true;
        message = 'Group created successfully';
      } else {
        message = 'Group already exists';
      }
      break;

    case 'update':
      if (system.groups.has(groupId)) {
        group = system.groups.get(groupId);
        Object.assign(group, groupData);
        success = true;
        message = 'Group updated successfully';
      } else {
        message = 'Group not found';
      }
      break;

    case 'delete':
      if (system.groups.has(groupId)) {
        group = system.groups.get(groupId);
        system.groups.delete(groupId);
        success = true;
        message = 'Group deleted successfully';
      } else {
        message = 'Group not found';
      }
      break;

    case 'clone':
      if (system.groups.has(groupId)) {
        const sourceGroup = system.groups.get(groupId);
        group = {
          ...sourceGroup,
          id: groupData.id,
          name: groupData.name || sourceGroup.name + ' (Copy)',
          members: new Set(),
          created: new Date().toISOString()
        };
        system.groups.set(group.id, group);
        success = true;
        message = 'Group cloned successfully';
      } else {
        message = 'Source group not found';
      }
      break;
  }

  return { success, message, group };
}

function manageUserPermissions(system, userId, action, groupId, permissions, temporary, duration) {
  let user = system.users.get(userId) || {
    id: userId,
    groups: new Set([system.defaultGroup]),
    permissions: new Set(),
    temporaryPermissions: new Map(),
    joined: new Date().toISOString()
  };

  let success = false;
  let message = '';

  switch (action) {
    case 'add':
      if (groupId && system.groups.has(groupId)) {
        user.groups.add(groupId);
        system.groups.get(groupId).members.add(userId);
        success = true;
        message = `Added to group ${groupId}`;
      }
      permissions.forEach(perm => {
        if (temporary && duration) {
          user.temporaryPermissions.set(perm, new Date(Date.now() + duration * 1000).toISOString());
        } else {
          user.permissions.add(perm);
        }
      });
      break;

    case 'remove':
      if (groupId) {
        user.groups.delete(groupId);
        if (system.groups.has(groupId)) {
          system.groups.get(groupId).members.delete(userId);
        }
        success = true;
        message = `Removed from group ${groupId}`;
      }
      permissions.forEach(perm => {
        user.permissions.delete(perm);
        user.temporaryPermissions.delete(perm);
      });
      break;

    case 'promote':
      const currentGroups = Array.from(user.groups);
      const promotionPath = findPromotionPath(system, currentGroups);
      if (promotionPath) {
        user.groups.delete(promotionPath.from);
        user.groups.add(promotionPath.to);
        success = true;
        message = `Promoted from ${promotionPath.from} to ${promotionPath.to}`;
      } else {
        message = 'No promotion path available';
      }
      break;

    case 'demote':
      const demotionPath = findDemotionPath(system, Array.from(user.groups));
      if (demotionPath) {
        user.groups.delete(demotionPath.from);
        user.groups.add(demotionPath.to);
        success = true;
        message = `Demoted from ${demotionPath.from} to ${demotionPath.to}`;
      } else {
        message = 'No demotion path available';
      }
      break;
  }

  // Clean up expired temporary permissions
  cleanupTemporaryPermissions(user);

  system.users.set(userId, user);

  return {
    success,
    message,
    userPermissions: {
      groups: Array.from(user.groups),
      permissions: Array.from(user.permissions),
      temporaryPermissions: Object.fromEntries(user.temporaryPermissions)
    }
  };
}

function manageWhitelist(serverIp, action, playerId, playerName, reason, settings) {
  let whitelist = whitelists.get(serverIp) || {
    serverIp,
    enabled: true,
    players: new Map(),
    settings: {
      kickMessage: 'You are not whitelisted on this server',
      autoSync: false,
      backupEnabled: true,
      ...settings
    },
    statistics: {
      totalPlayers: 0,
      lastSync: null,
      rejectedAttempts: 0
    },
    created: new Date().toISOString()
  };

  let success = false;
  let message = '';

  switch (action) {
    case 'create':
      whitelists.set(serverIp, whitelist);
      success = true;
      message = 'Whitelist created';
      break;

    case 'add':
      if (playerId || playerName) {
        const id = playerId || crypto.randomUUID();
        whitelist.players.set(id, {
          id,
          name: playerName || 'Unknown',
          addedBy: 'system',
          addedAt: new Date().toISOString(),
          reason: reason || 'Added to whitelist'
        });
        whitelist.statistics.totalPlayers = whitelist.players.size;
        success = true;
        message = `Added ${playerName || playerId} to whitelist`;
      } else {
        message = 'Player ID or name required';
      }
      break;

    case 'remove':
      if (playerId && whitelist.players.has(playerId)) {
        whitelist.players.delete(playerId);
        whitelist.statistics.totalPlayers = whitelist.players.size;
        success = true;
        message = 'Player removed from whitelist';
      } else {
        message = 'Player not found in whitelist';
      }
      break;

    case 'check':
      const isWhitelisted = playerId ? whitelist.players.has(playerId) : 
                           playerName ? Array.from(whitelist.players.values()).some(p => p.name === playerName) : false;
      success = true;
      message = isWhitelisted ? 'Player is whitelisted' : 'Player is not whitelisted';
      break;

    case 'sync':
      // Simulate sync operation
      whitelist.statistics.lastSync = new Date().toISOString();
      success = true;
      message = 'Whitelist synchronized';
      break;
  }

  whitelists.set(serverIp, whitelist);

  return {
    success,
    message,
    whitelist: {
      enabled: whitelist.enabled,
      playerCount: whitelist.players.size,
      settings: whitelist.settings
    },
    statistics: whitelist.statistics
  };
}

function checkPermission(system, userId, permission, context) {
  const user = system.users.get(userId);
  if (!user) {
    return {
      allowed: false,
      reasoning: 'User not found',
      inheritance: []
    };
  }

  // Check direct permissions
  if (user.permissions.has(permission) || user.permissions.has('*')) {
    return {
      allowed: true,
      reasoning: 'Direct permission granted',
      inheritance: ['user']
    };
  }

  // Check temporary permissions
  if (user.temporaryPermissions.has(permission)) {
    const expiry = new Date(user.temporaryPermissions.get(permission));
    if (expiry > new Date()) {
      return {
        allowed: true,
        reasoning: 'Temporary permission granted',
        inheritance: ['user', 'temporary']
      };
    }
  }

  // Check group permissions
  const inheritance = [];
  for (const groupId of user.groups) {
    const result = checkGroupPermission(system, groupId, permission, inheritance);
    if (result.allowed) {
      return result;
    }
  }

  return {
    allowed: false,
    reasoning: 'Permission denied',
    inheritance
  };
}

function checkGroupPermission(system, groupId, permission, inheritance) {
  const group = system.groups.get(groupId);
  if (!group) {
    return { allowed: false, reasoning: 'Group not found', inheritance };
  }

  inheritance.push(groupId);

  // Check direct group permissions
  if (group.permissions.includes(permission) || group.permissions.includes('*')) {
    return {
      allowed: true,
      reasoning: `Permission granted by group ${groupId}`,
      inheritance
    };
  }

  // Check wildcard permissions
  if (system.settings.wildcardSupport) {
    for (const perm of group.permissions) {
      if (perm.endsWith('*') && permission.startsWith(perm.slice(0, -1))) {
        return {
          allowed: true,
          reasoning: `Wildcard permission granted by group ${groupId}`,
          inheritance
        };
      }
    }
  }

  // Check inherited permissions
  if (system.inheritance && group.inheritance) {
    for (const parentGroupId of group.inheritance) {
      const result = checkGroupPermission(system, parentGroupId, permission, [...inheritance]);
      if (result.allowed) {
        return result;
      }
    }
  }

  return { allowed: false, reasoning: 'Permission not found in group', inheritance };
}

function calculateEffectivePermissions(system, userId) {
  const user = system.users.get(userId);
  if (!user) return [];

  const permissions = new Set(user.permissions);

  // Add temporary permissions
  for (const [perm, expiry] of user.temporaryPermissions) {
    if (new Date(expiry) > new Date()) {
      permissions.add(perm);
    }
  }

  // Add group permissions
  for (const groupId of user.groups) {
    const groupPerms = getGroupPermissions(system, groupId);
    groupPerms.forEach(perm => permissions.add(perm));
  }

  return Array.from(permissions);
}

function getGroupPermissions(system, groupId, visited = new Set()) {
  if (visited.has(groupId)) return [];
  visited.add(groupId);

  const group = system.groups.get(groupId);
  if (!group) return [];

  const permissions = new Set(group.permissions);

  // Add inherited permissions
  if (system.inheritance && group.inheritance) {
    for (const parentGroupId of group.inheritance) {
      const parentPerms = getGroupPermissions(system, parentGroupId, visited);
      parentPerms.forEach(perm => permissions.add(perm));
    }
  }

  return Array.from(permissions);
}

function performBulkOperation(system, operation, targets, permissions, settings) {
  const results = [];
  let affected = 0;

  targets.forEach(target => {
    let success = false;
    let message = '';

    switch (operation) {
      case 'grant':
        if (target.type === 'user') {
          const result = manageUserPermissions(system, target.id, 'add', null, permissions, false, null);
          success = result.success;
          message = result.message;
        } else if (target.type === 'group') {
          const group = system.groups.get(target.id);
          if (group) {
            permissions.forEach(perm => {
              if (!group.permissions.includes(perm)) {
                group.permissions.push(perm);
              }
            });
            success = true;
            message = 'Permissions granted to group';
          }
        }
        break;

      case 'revoke':
        if (target.type === 'user') {
          const result = manageUserPermissions(system, target.id, 'remove', null, permissions, false, null);
          success = result.success;
          message = result.message;
        } else if (target.type === 'group') {
          const group = system.groups.get(target.id);
          if (group) {
            group.permissions = group.permissions.filter(perm => !permissions.includes(perm));
            success = true;
            message = 'Permissions revoked from group';
          }
        }
        break;
    }

    results.push({ target, success, message });
    if (success) affected++;
  });

  return {
    results,
    affected,
    summary: {
      total: targets.length,
      successful: affected,
      failed: targets.length - affected
    }
  };
}

function managePermissionTemplate(system, action, templateId, templateData) {
  let success = false;
  let message = '';
  let template = null;

  switch (action) {
    case 'create':
      template = {
        id: templateData.id || crypto.randomUUID(),
        name: templateData.name,
        description: templateData.description || '',
        permissions: templateData.permissions || [],
        groups: templateData.groups || [],
        settings: templateData.settings || {},
        created: new Date().toISOString()
      };
      system.templates.set(template.id, template);
      success = true;
      message = 'Template created';
      break;

    case 'apply':
      template = system.templates.get(templateId);
      if (template && templateData.targetId) {
        if (templateData.targetType === 'user') {
          manageUserPermissions(system, templateData.targetId, 'add', null, template.permissions, false, null);
          template.groups.forEach(groupId => {
            manageUserPermissions(system, templateData.targetId, 'add', groupId, [], false, null);
          });
        }
        success = true;
        message = 'Template applied';
      }
      break;
  }

  return { success, message, template };
}

function generatePermissionAudit(system, filters) {
  const audit = {
    summary: {
      totalUsers: system.users.size,
      totalGroups: system.groups.size,
      totalPermissions: calculateTotalPermissions(system)
    },
    violations: findPermissionViolations(system),
    recommendations: generateAuditRecommendations(system),
    changes: system.auditLog.slice(-100) // Last 100 changes
  };

  return audit;
}

function generateGroupHierarchy(system) {
  const hierarchy = {};
  
  system.groups.forEach((group, groupId) => {
    hierarchy[groupId] = {
      name: group.name,
      priority: group.priority,
      parents: group.inheritance || [],
      children: findChildGroups(system, groupId),
      memberCount: group.members.size
    };
  });

  return hierarchy;
}

function generateSystemConfiguration(system) {
  return {
    type: system.type,
    features: {
      inheritance: system.inheritance,
      temporaryPermissions: system.settings.temporaryPermissions,
      wildcardSupport: system.settings.wildcardSupport,
      auditLog: system.settings.auditLog
    },
    defaultGroup: system.defaultGroup,
    groupCount: system.groups.size,
    userCount: system.users.size
  };
}

// Additional helper functions
function cleanupTemporaryPermissions(user) {
  const now = new Date();
  for (const [perm, expiry] of user.temporaryPermissions) {
    if (new Date(expiry) <= now) {
      user.temporaryPermissions.delete(perm);
    }
  }
}

function findPromotionPath(system, currentGroups) {
  // Simplified promotion logic
  const groupPriorities = new Map();
  system.groups.forEach((group, id) => {
    groupPriorities.set(id, group.priority);
  });

  const currentPriority = Math.max(...currentGroups.map(g => groupPriorities.get(g) || 0));
  
  for (const [groupId, group] of system.groups) {
    if (group.priority > currentPriority) {
      return { from: currentGroups[0], to: groupId };
    }
  }
  
  return null;
}

function findDemotionPath(system, currentGroups) {
  const groupPriorities = new Map();
  system.groups.forEach((group, id) => {
    groupPriorities.set(id, group.priority);
  });

  const currentPriority = Math.max(...currentGroups.map(g => groupPriorities.get(g) || 0));
  
  for (const [groupId, group] of system.groups) {
    if (group.priority < currentPriority) {
      return { from: currentGroups[0], to: groupId };
    }
  }
  
  return null;
}

function calculateTotalPermissions(system) {
  const allPermissions = new Set();
  
  system.groups.forEach(group => {
    group.permissions.forEach(perm => allPermissions.add(perm));
  });
  
  system.users.forEach(user => {
    user.permissions.forEach(perm => allPermissions.add(perm));
  });
  
  return allPermissions.size;
}

function findPermissionViolations(system) {
  return [
    'No critical violations found',
    'Some users have excessive permissions',
    'Consider implementing permission expiry'
  ];
}

function generateAuditRecommendations(system) {
  return [
    'Regular permission cleanup recommended',
    'Consider implementing role-based access control',
    'Monitor for permission escalation attempts'
  ];
}

function findChildGroups(system, parentGroupId) {
  const children = [];
  system.groups.forEach((group, groupId) => {
    if (group.inheritance && group.inheritance.includes(parentGroupId)) {
      children.push(groupId);
    }
  });
  return children;
}

module.exports = router;
