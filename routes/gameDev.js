const express = require('express');
const crypto = require('crypto');

const router = express.Router();

// Plugin template generator
router.post('/plugin/template', (req, res) => {
  const { 
    pluginName, 
    author = 'Unknown', 
    version = '1.0.0', 
    minecraftVersion = '1.20',
    features = []
  } = req.body;
  
  if (!pluginName) {
    return res.status(400).json({ error: 'PluginName parameter is required' });
  }

  const template = generatePluginTemplate(pluginName, author, version, minecraftVersion, features);
  const structure = generatePluginStructure(pluginName, features);

  res.json({
    pluginName,
    author,
    version,
    minecraftVersion,
    features,
    template,
    structure,
    buildInstructions: generateBuildInstructions(),
    timestamp: new Date().toISOString()
  });
});

// Command generator
router.post('/command/generator', (req, res) => {
  const { 
    commandName, 
    permission, 
    description = 'No description provided',
    usage,
    aliases = []
  } = req.body;
  
  if (!commandName) {
    return res.status(400).json({ error: 'CommandName parameter is required' });
  }

  const commandCode = generateCommandCode(commandName, permission, description, usage, aliases);
  const pluginYml = generatePluginYmlEntry(commandName, permission, description, usage, aliases);

  res.json({
    commandName,
    permission,
    description,
    usage: usage || `/${commandName}`,
    aliases,
    javaCode: commandCode,
    pluginYml,
    examples: generateCommandExamples(commandName),
    timestamp: new Date().toISOString()
  });
});

// Config YAML generator
router.post('/config/yaml', (req, res) => {
  const { 
    configType = 'plugin', 
    settings = {},
    comments = true
  } = req.body;

  const yamlConfig = generateYamlConfig(configType, settings, comments);
  const validation = validateYamlConfig(yamlConfig);

  res.json({
    configType,
    settings,
    comments,
    yaml: yamlConfig,
    validation,
    bestPractices: getYamlBestPractices(),
    timestamp: new Date().toISOString()
  });
});

// Permission manager
router.post('/permission/manager', (req, res) => {
  const { 
    permissions = [],
    groups = [],
    inheritance = true
  } = req.body;

  const permissionTree = buildPermissionTree(permissions);
  const groupConfig = generateGroupConfig(groups, permissions, inheritance);

  res.json({
    permissions,
    groups,
    inheritance,
    permissionTree,
    groupConfig,
    recommendations: generatePermissionRecommendations(permissions, groups),
    pluginYml: generatePermissionPluginYml(permissions),
    timestamp: new Date().toISOString()
  });
});

// Economy calculator
router.get('/economy/calculator', (req, res) => {
  const { 
    playerCount = 100,
    dailyActivity = 0.7,
    inflationRate = 0.02,
    startingBalance = 1000
  } = req.query;

  const economyMetrics = calculateEconomyMetrics(
    parseInt(playerCount),
    parseFloat(dailyActivity),
    parseFloat(inflationRate),
    parseInt(startingBalance)
  );

  res.json({
    input: {
      playerCount: parseInt(playerCount),
      dailyActivity: parseFloat(dailyActivity),
      inflationRate: parseFloat(inflationRate),
      startingBalance: parseInt(startingBalance)
    },
    metrics: economyMetrics,
    recommendations: generateEconomyRecommendations(economyMetrics),
    balancing: getEconomyBalancingTips(),
    timestamp: new Date().toISOString()
  });
});

// World generator
router.post('/world/generator', (req, res) => {
  const { 
    worldType = 'custom',
    biomes = [],
    structures = [],
    ores = {},
    seed
  } = req.body;

  const worldConfig = generateWorldConfig(worldType, biomes, structures, ores, seed);
  const generatorCode = generateWorldGeneratorCode(worldConfig);

  res.json({
    worldType,
    biomes,
    structures,
    ores,
    seed: seed || generateRandomSeed(),
    config: worldConfig,
    generatorCode,
    performance: analyzeWorldGenPerformance(worldConfig),
    timestamp: new Date().toISOString()
  });
});

// Schematic converter
router.post('/schematic/converter', (req, res) => {
  const { 
    schematicData,
    fromFormat = 'schematic',
    toFormat = 'structure',
    optimize = true
  } = req.body;

  if (!schematicData) {
    return res.status(400).json({ error: 'SchematicData parameter is required' });
  }

  const conversion = convertSchematic(schematicData, fromFormat, toFormat, optimize);

  res.json({
    fromFormat,
    toFormat,
    optimize,
    originalSize: schematicData.length,
    convertedSize: conversion.data.length,
    conversion,
    supportedFormats: getSupportedSchematicFormats(),
    timestamp: new Date().toISOString()
  });
});

// Particle effects
router.post('/particle/effects', (req, res) => {
  const { 
    effectType = 'explosion',
    intensity = 1.0,
    duration = 5,
    particles = []
  } = req.body;

  const particleCode = generateParticleCode(effectType, intensity, duration, particles);
  const optimization = optimizeParticleEffect(effectType, intensity, particles);

  res.json({
    effectType,
    intensity,
    duration,
    particles,
    javaCode: particleCode,
    optimization,
    performance: analyzeParticlePerformance(effectType, intensity, particles),
    presets: getParticlePresets(),
    timestamp: new Date().toISOString()
  });
});

// Sound library
router.get('/sound/library', (req, res) => {
  const { category = 'all', version = '1.20' } = req.query;

  const sounds = getSoundLibrary(category, version);
  const usage = generateSoundUsageExamples();

  res.json({
    category,
    version,
    sounds,
    usage,
    categories: getSoundCategories(),
    volumeGuidelines: getVolumeGuidelines(),
    timestamp: new Date().toISOString()
  });
});

// Hologram creator
router.post('/hologram/creator', (req, res) => {
  const { 
    text = [],
    location,
    touchable = false,
    followPlayer = false
  } = req.body;

  if (!text || text.length === 0) {
    return res.status(400).json({ error: 'Text array parameter is required' });
  }

  const hologramCode = generateHologramCode(text, location, touchable, followPlayer);
  const animation = generateHologramAnimation(text);

  res.json({
    text,
    location: location || { x: 0, y: 100, z: 0 },
    touchable,
    followPlayer,
    javaCode: hologramCode,
    animation,
    libraries: getHologramLibraries(),
    bestPractices: getHologramBestPractices(),
    timestamp: new Date().toISOString()
  });
});

// Helper functions
function generatePluginTemplate(pluginName, author, version, minecraftVersion, features) {
  const mainClass = `package com.${author.toLowerCase()}.${pluginName.toLowerCase()};

import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.event.Listener;

public class ${pluginName} extends JavaPlugin implements Listener {
    
    @Override
    public void onEnable() {
        getLogger().info("${pluginName} v${version} has been enabled!");
        
        // Register events
        getServer().getPluginManager().registerEvents(this, this);
        
        // Load configuration
        saveDefaultConfig();
        
        ${features.includes('commands') ? '// Register commands\n        getCommand("' + pluginName.toLowerCase() + '").setExecutor(new CommandHandler());' : ''}
        ${features.includes('database') ? '// Initialize database\n        initializeDatabase();' : ''}
    }
    
    @Override
    public void onDisable() {
        getLogger().info("${pluginName} has been disabled!");
    }
    
    ${features.includes('database') ? `
    private void initializeDatabase() {
        // Database initialization code
    }` : ''}
}`;

  const pluginYml = `name: ${pluginName}
version: ${version}
author: ${author}
main: com.${author.toLowerCase()}.${pluginName.toLowerCase()}.${pluginName}
api-version: ${minecraftVersion}
description: A Minecraft plugin generated by ShrekAPI

${features.includes('commands') ? `commands:
  ${pluginName.toLowerCase()}:
    description: Main command for ${pluginName}
    usage: /${pluginName.toLowerCase()}` : ''}

${features.includes('permissions') ? `permissions:
  ${pluginName.toLowerCase()}.*:
    description: All permissions for ${pluginName}
    default: op` : ''}`;

  return {
    mainClass,
    pluginYml,
    buildGradle: generateBuildGradle(pluginName, version, minecraftVersion)
  };
}

function generatePluginStructure(pluginName, features) {
  const structure = [
    'src/',
    '  main/',
    '    java/',
    `      com/${pluginName.toLowerCase()}/`,
    `        ${pluginName}.java`,
    '    resources/',
    '      plugin.yml',
    '      config.yml'
  ];

  if (features.includes('commands')) {
    structure.splice(-2, 0, `        commands/`, `          CommandHandler.java`);
  }

  if (features.includes('listeners')) {
    structure.splice(-2, 0, `        listeners/`, `          EventListener.java`);
  }

  return structure;
}

function generateBuildInstructions() {
  return [
    '1. Create new directory with plugin name',
    '2. Copy generated files to appropriate locations',
    '3. Run: gradle build',
    '4. Find compiled JAR in build/libs/',
    '5. Copy JAR to server plugins folder',
    '6. Restart server'
  ];
}

function generateCommandCode(commandName, permission, description, usage, aliases) {
  return `package com.example.plugin.commands;

import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;

public class ${commandName.charAt(0).toUpperCase() + commandName.slice(1)}Command implements CommandExecutor {
    
    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        ${permission ? `
        if (!sender.hasPermission("${permission}")) {
            sender.sendMessage("§cYou don't have permission to use this command!");
            return true;
        }` : ''}
        
        if (!(sender instanceof Player)) {
            sender.sendMessage("This command can only be used by players!");
            return true;
        }
        
        Player player = (Player) sender;
        
        // Command logic here
        player.sendMessage("§aCommand ${commandName} executed successfully!");
        
        return true;
    }
}`;
}

function generatePluginYmlEntry(commandName, permission, description, usage, aliases) {
  return `commands:
  ${commandName}:
    description: ${description}
    usage: ${usage || `/${commandName}`}${aliases.length > 0 ? `
    aliases: [${aliases.join(', ')}]` : ''}${permission ? `
    permission: ${permission}` : ''}`;
}

function generateCommandExamples(commandName) {
  return [
    `/${commandName} - Basic usage`,
    `/${commandName} help - Show help`,
    `/${commandName} reload - Reload configuration`
  ];
}

function generateYamlConfig(configType, settings, comments) {
  let yaml = comments ? `# Configuration for ${configType}\n# Generated by ShrekAPI\n\n` : '';
  
  const defaultSettings = {
    plugin: {
      enabled: true,
      debug: false,
      'auto-save': 300,
      database: {
        type: 'sqlite',
        host: 'localhost',
        port: 3306,
        name: 'plugin_db'
      }
    },
    server: {
      'server-name': 'My Server',
      'max-players': 100,
      difficulty: 'normal',
      gamemode: 'survival'
    }
  };

  const config = { ...defaultSettings[configType], ...settings };
  
  function objectToYaml(obj, indent = 0) {
    let result = '';
    const spaces = '  '.repeat(indent);
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        result += `${spaces}${key}:\n`;
        result += objectToYaml(value, indent + 1);
      } else {
        result += `${spaces}${key}: ${value}\n`;
      }
    }
    
    return result;
  }
  
  yaml += objectToYaml(config);
  return yaml;
}

function validateYamlConfig(yaml) {
  const issues = [];
  const warnings = [];
  
  if (!yaml.includes('enabled:')) {
    warnings.push('Consider adding an "enabled" option');
  }
  
  if (yaml.includes('password:') && !yaml.includes('#')) {
    issues.push('Passwords should be commented with security notes');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    score: Math.max(0, 100 - (issues.length * 20) - (warnings.length * 10))
  };
}

function getYamlBestPractices() {
  return [
    'Use consistent indentation (2 spaces recommended)',
    'Add comments for complex configurations',
    'Group related settings together',
    'Use meaningful key names',
    'Validate configuration on plugin startup'
  ];
}

function buildPermissionTree(permissions) {
  const tree = {};
  
  permissions.forEach(permission => {
    const parts = permission.split('.');
    let current = tree;
    
    parts.forEach(part => {
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    });
  });
  
  return tree;
}

function generateGroupConfig(groups, permissions, inheritance) {
  return groups.map(group => ({
    name: group.name,
    permissions: group.permissions || [],
    inheritance: inheritance ? group.inherits || [] : [],
    prefix: group.prefix || '',
    suffix: group.suffix || '',
    default: group.default || false
  }));
}

function generatePermissionRecommendations(permissions, groups) {
  const recommendations = [];
  
  if (permissions.length > 20) {
    recommendations.push('Consider grouping permissions with wildcards');
  }
  
  if (groups.length === 0) {
    recommendations.push('Create permission groups for easier management');
  }
  
  recommendations.push('Use descriptive permission names');
  recommendations.push('Follow plugin.category.action naming convention');
  
  return recommendations;
}

function generatePermissionPluginYml(permissions) {
  let yml = 'permissions:\n';
  
  permissions.forEach(permission => {
    yml += `  ${permission}:\n`;
    yml += `    description: Permission for ${permission}\n`;
    yml += `    default: false\n`;
  });
  
  return yml;
}

function calculateEconomyMetrics(playerCount, dailyActivity, inflationRate, startingBalance) {
  const activePlayersDaily = Math.round(playerCount * dailyActivity);
  const totalMoney = playerCount * startingBalance;
  const dailyTransactions = activePlayersDaily * 5; // Estimated transactions per active player
  const monthlyInflation = Math.pow(1 + inflationRate, 30) - 1;
  
  return {
    activePlayersDaily,
    totalMoneySupply: totalMoney,
    dailyTransactions,
    monthlyInflation: `${(monthlyInflation * 100).toFixed(2)}%`,
    recommendedTaxRate: `${(inflationRate * 50).toFixed(2)}%`,
    balanceDistribution: {
      top10Percent: Math.round(totalMoney * 0.4),
      middle40Percent: Math.round(totalMoney * 0.35),
      bottom50Percent: Math.round(totalMoney * 0.25)
    }
  };
}

function generateEconomyRecommendations(metrics) {
  const recommendations = [];
  
  if (metrics.dailyTransactions < 100) {
    recommendations.push('Consider adding more money sinks to encourage transactions');
  }
  
  recommendations.push('Monitor money supply growth regularly');
  recommendations.push('Implement progressive taxation for wealth redistribution');
  recommendations.push('Create seasonal events to stimulate economy');
  
  return recommendations;
}

function getEconomyBalancingTips() {
  return [
    'Money sources should equal money sinks',
    'Reward active gameplay over idle time',
    'Price items based on effort required to obtain',
    'Create scarcity for valuable items',
    'Monitor and adjust prices based on market data'
  ];
}

function generateWorldConfig(worldType, biomes, structures, ores, seed) {
  return {
    generator: worldType,
    seed: seed || generateRandomSeed(),
    biomes: biomes.length > 0 ? biomes : ['plains', 'forest', 'mountains'],
    structures: {
      villages: structures.includes('villages'),
      dungeons: structures.includes('dungeons'),
      strongholds: structures.includes('strongholds'),
      mineshafts: structures.includes('mineshafts')
    },
    ores: {
      coal: ores.coal || 20,
      iron: ores.iron || 15,
      gold: ores.gold || 5,
      diamond: ores.diamond || 2,
      emerald: ores.emerald || 1
    }
  };
}

function generateWorldGeneratorCode(config) {
  return `package com.example.worldgen;

import org.bukkit.World;
import org.bukkit.generator.ChunkGenerator;
import org.bukkit.generator.WorldInfo;
import java.util.Random;

public class CustomWorldGenerator extends ChunkGenerator {
    
    @Override
    public void generateNoise(WorldInfo worldInfo, Random random, int chunkX, int chunkZ, ChunkData chunkData) {
        // World generation logic here
        // Seed: ${config.seed}
        // Biomes: ${config.biomes.join(', ')}
        
        for (int x = 0; x < 16; x++) {
            for (int z = 0; z < 16; z++) {
                int height = 64 + (int)(Math.sin((chunkX * 16 + x) * 0.1) * Math.cos((chunkZ * 16 + z) * 0.1) * 10);
                
                for (int y = 0; y < height; y++) {
                    if (y == 0) {
                        chunkData.setBlock(x, y, z, Material.BEDROCK);
                    } else if (y < height - 3) {
                        chunkData.setBlock(x, y, z, Material.STONE);
                    } else if (y < height - 1) {
                        chunkData.setBlock(x, y, z, Material.DIRT);
                    } else {
                        chunkData.setBlock(x, y, z, Material.GRASS_BLOCK);
                    }
                }
            }
        }
    }
}`;
}

function generateRandomSeed() {
  return Math.floor(Math.random() * 2147483647).toString();
}

function analyzeWorldGenPerformance(config) {
  const complexity = config.biomes.length + Object.keys(config.structures).filter(s => config.structures[s]).length;
  
  return {
    complexity: complexity > 5 ? 'High' : complexity > 2 ? 'Medium' : 'Low',
    estimatedGenTime: `${complexity * 50}ms per chunk`,
    memoryUsage: `${complexity * 10}MB estimated`,
    recommendations: complexity > 5 ? ['Consider simplifying generation', 'Use async generation'] : ['Performance should be good']
  };
}

function convertSchematic(data, fromFormat, toFormat, optimize) {
  // Simplified conversion simulation
  let convertedData = data;
  let compressionRatio = 1.0;
  
  if (optimize) {
    compressionRatio = 0.75;
    convertedData = data.substring(0, Math.floor(data.length * compressionRatio));
  }
  
  return {
    data: convertedData,
    compressionRatio,
    blocksOptimized: optimize ? Math.floor(data.length * 0.1) : 0,
    conversionTime: '150ms',
    success: true
  };
}

function getSupportedSchematicFormats() {
  return [
    { format: 'schematic', extension: '.schematic', description: 'WorldEdit schematic format' },
    { format: 'structure', extension: '.nbt', description: 'Minecraft structure format' },
    { format: 'blueprint', extension: '.bp', description: 'Blueprint format' }
  ];
}

function generateParticleCode(effectType, intensity, duration, particles) {
  return `package com.example.particles;

import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.entity.Player;
import org.bukkit.scheduler.BukkitRunnable;

public class ParticleEffect {
    
    public static void play${effectType.charAt(0).toUpperCase() + effectType.slice(1)}(Player player, Location location) {
        new BukkitRunnable() {
            int ticks = 0;
            
            @Override
            public void run() {
                if (ticks >= ${duration * 20}) {
                    cancel();
                    return;
                }
                
                // ${effectType} effect
                location.getWorld().spawnParticle(
                    Particle.${getParticleType(effectType)},
                    location,
                    ${Math.round(intensity * 10)},
                    0.5, 0.5, 0.5,
                    0.1
                );
                
                ticks++;
            }
        }.runTaskTimer(plugin, 0L, 1L);
    }
}`;
}

function getParticleType(effectType) {
  const types = {
    explosion: 'EXPLOSION_LARGE',
    fire: 'FLAME',
    magic: 'ENCHANTMENT_TABLE',
    smoke: 'SMOKE_NORMAL',
    heart: 'HEART'
  };
  
  return types[effectType] || 'FLAME';
}

function optimizeParticleEffect(effectType, intensity, particles) {
  return {
    particleCount: Math.min(Math.round(intensity * 10), 50),
    updateRate: intensity > 2 ? '2 ticks' : '1 tick',
    cullingDistance: '32 blocks',
    performanceImpact: intensity > 3 ? 'High' : intensity > 1 ? 'Medium' : 'Low'
  };
}

function analyzeParticlePerformance(effectType, intensity, particles) {
  const particlesPerSecond = Math.round(intensity * 10 * 20);
  
  return {
    particlesPerSecond,
    networkBandwidth: `${particlesPerSecond * 0.1}KB/s per player`,
    clientFPS: intensity > 3 ? 'May impact FPS' : 'Minimal impact',
    serverTPS: intensity > 5 ? 'May impact TPS' : 'Minimal impact'
  };
}

function getParticlePresets() {
  return [
    { name: 'Gentle Rain', type: 'water', intensity: 0.5, duration: 10 },
    { name: 'Magical Aura', type: 'magic', intensity: 1.5, duration: 5 },
    { name: 'Explosion', type: 'explosion', intensity: 3.0, duration: 2 },
    { name: 'Healing Circle', type: 'heart', intensity: 1.0, duration: 3 }
  ];
}

function getSoundLibrary(category, version) {
  const sounds = {
    ambient: ['ambient.cave', 'ambient.underwater.enter', 'ambient.nether_wastes.loop'],
    block: ['block.stone.break', 'block.wood.place', 'block.glass.break'],
    entity: ['entity.player.hurt', 'entity.zombie.ambient', 'entity.cow.ambient'],
    item: ['item.armor.equip_leather', 'item.bottle.fill', 'item.book.page_turn'],
    music: ['music.overworld', 'music.nether', 'music.end'],
    ui: ['ui.button.click', 'ui.toast.challenge_complete', 'ui.loom.select_pattern']
  };
  
  return category === 'all' ? sounds : { [category]: sounds[category] || [] };
}

function generateSoundUsageExamples() {
  return {
    playSound: `player.playSound(player.getLocation(), Sound.BLOCK_STONE_BREAK, 1.0f, 1.0f);`,
    playSoundToAll: `world.playSound(location, Sound.ENTITY_PLAYER_LEVELUP, 1.0f, 1.0f);`,
    stopSound: `player.stopSound(Sound.MUSIC_OVERWORLD);`
  };
}

function getSoundCategories() {
  return ['ambient', 'block', 'entity', 'item', 'music', 'ui', 'weather'];
}

function getVolumeGuidelines() {
  return {
    'UI Sounds': '0.5 - 1.0',
    'Ambient': '0.3 - 0.7',
    'Effects': '0.8 - 1.0',
    'Music': '0.4 - 0.8',
    'Notifications': '0.7 - 1.0'
  };
}

function generateHologramCode(text, location, touchable, followPlayer) {
  const loc = location || { x: 0, y: 100, z: 0 };
  
  return `package com.example.holograms;

import org.bukkit.Location;
import org.bukkit.entity.ArmorStand;
import org.bukkit.entity.EntityType;
import org.bukkit.entity.Player;

public class HologramManager {
    
    public static void createHologram(Player player, Location location) {
        Location loc = new Location(player.getWorld(), ${loc.x}, ${loc.y}, ${loc.z});
        
        ${text.map((line, index) => `
        ArmorStand line${index} = (ArmorStand) loc.getWorld().spawnEntity(
            loc.clone().add(0, ${-index * 0.25}, 0), 
            EntityType.ARMOR_STAND
        );
        line${index}.setCustomName("${line}");
        line${index}.setCustomNameVisible(true);
        line${index}.setVisible(false);
        line${index}.setGravity(false);
        line${index}.setSmall(true);${touchable ? `
        line${index}.setMetadata("touchable", new FixedMetadataValue(plugin, true));` : ''}`).join('')}
        
        ${followPlayer ? `
        // Add task to follow player
        new BukkitRunnable() {
            @Override
            public void run() {
                Location playerLoc = player.getLocation().add(0, 2, 0);
                // Update hologram positions to follow player
            }
        }.runTaskTimer(plugin, 0L, 5L);` : ''}
    }
}`;
}

function generateHologramAnimation(text) {
  return {
    fadeIn: 'Gradually increase visibility over 1 second',
    typewriter: 'Display text character by character',
    rainbow: 'Cycle through colors every 0.5 seconds',
    bounce: 'Move up and down by 0.1 blocks',
    rotate: 'Rotate text around Y axis'
  };
}

function getHologramLibraries() {
  return [
    { name: 'HolographicDisplays', description: 'Most popular hologram plugin' },
    { name: 'DecentHolograms', description: 'Lightweight alternative' },
    { name: 'ArmorStand API', description: 'Custom implementation using armor stands' }
  ];
}

function getHologramBestPractices() {
  return [
    'Limit text length to maintain readability',
    'Use appropriate colors for visibility',
    'Consider performance impact of many holograms',
    'Clean up holograms when no longer needed',
    'Test visibility from different distances'
  ];
}

function generateBuildGradle(pluginName, version, minecraftVersion) {
  return `plugins {
    id 'java'
    id 'com.github.johnrengelman.shadow' version '7.1.2'
}

group = 'com.example'
version = '${version}'
sourceCompatibility = '17'

repositories {
    mavenCentral()
    maven {
        name = 'spigotmc-repo'
        url = 'https://hub.spigotmc.org/nexus/content/repositories/snapshots/'
    }
}

dependencies {
    compileOnly 'org.spigotmc:spigot-api:${minecraftVersion}-R0.1-SNAPSHOT'
}

jar {
    archiveFileName = '${pluginName}-${version}.jar'
}`;
}

module.exports = router;
