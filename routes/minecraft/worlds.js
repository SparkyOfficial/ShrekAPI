const express = require('express');
const crypto = require('crypto');

const router = express.Router();

// Advanced world seed analyzer
router.get('/seed/analyze/:seed', (req, res) => {
  const { seed } = req.params;
  const { version = '1.20', biome = 'all' } = req.query;

  const seedNumber = parseSeed(seed);
  const analysis = analyzeWorldSeed(seedNumber, version);

  res.json({
    seed: seed,
    seedNumber: seedNumber,
    version,
    analysis: {
      spawnBiome: analysis.spawnBiome,
      nearbyBiomes: analysis.nearbyBiomes,
      structures: analysis.structures,
      resources: analysis.resources,
      difficulty: analysis.difficulty,
      uniqueFeatures: analysis.uniqueFeatures,
      coordinates: analysis.coordinates
    },
    recommendations: generateSeedRecommendations(analysis),
    timestamp: new Date().toISOString()
  });
});

// World seed generator with specific criteria
router.post('/seed/generate', (req, res) => {
  const { 
    biomes = [], 
    structures = [], 
    difficulty = 'any',
    version = '1.20',
    count = 1 
  } = req.body;

  if (count > 20) {
    return res.status(400).json({ error: 'Maximum 20 seeds per request' });
  }

  const seeds = [];
  for (let i = 0; i < count; i++) {
    const seed = generateCustomSeed(biomes, structures, difficulty);
    const analysis = analyzeWorldSeed(seed, version);
    
    seeds.push({
      seed: seed.toString(),
      seedNumber: seed,
      matchScore: calculateMatchScore(analysis, { biomes, structures, difficulty }),
      preview: {
        spawnBiome: analysis.spawnBiome,
        nearbyStructures: analysis.structures.slice(0, 3),
        difficulty: analysis.difficulty
      }
    });
  }

  // Sort by match score
  seeds.sort((a, b) => b.matchScore - a.matchScore);

  res.json({
    criteria: { biomes, structures, difficulty, version },
    seeds,
    bestMatch: seeds[0],
    timestamp: new Date().toISOString()
  });
});

// World backup analyzer
router.post('/backup/analyze', (req, res) => {
  const { worldName, backupData } = req.body;
  
  if (!worldName || !backupData) {
    return res.status(400).json({ error: 'World name and backup data required' });
  }

  // Simulate backup analysis
  const analysis = {
    worldName,
    size: Math.floor(Math.random() * 1000) + 100 + ' MB',
    chunks: Math.floor(Math.random() * 10000) + 1000,
    playerData: Math.floor(Math.random() * 50) + 1,
    structures: {
      villages: Math.floor(Math.random() * 20),
      dungeons: Math.floor(Math.random() * 50),
      strongholds: Math.floor(Math.random() * 3) + 1,
      temples: Math.floor(Math.random() * 10)
    },
    biomes: generateRandomBiomes(),
    lastPlayed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    gamemode: ['Survival', 'Creative', 'Adventure', 'Hardcore'][Math.floor(Math.random() * 4)],
    difficulty: ['Peaceful', 'Easy', 'Normal', 'Hard'][Math.floor(Math.random() * 4)],
    version: '1.' + (Math.floor(Math.random() * 5) + 16),
    corruption: {
      detected: Math.random() > 0.8,
      issues: Math.random() > 0.8 ? ['Missing chunks', 'Invalid block data'] : []
    }
  };

  const recommendations = generateBackupRecommendations(analysis);

  res.json({
    analysis,
    recommendations,
    health: analysis.corruption.detected ? 'Warning' : 'Good',
    timestamp: new Date().toISOString()
  });
});

// World optimization suggestions
router.post('/optimize', (req, res) => {
  const { worldData, targetVersion, performance } = req.body;
  
  const optimizations = {
    chunks: {
      unused: Math.floor(Math.random() * 1000),
      corrupted: Math.floor(Math.random() * 10),
      recommendations: [
        'Remove unused chunks to reduce world size',
        'Regenerate corrupted chunks',
        'Optimize chunk loading patterns'
      ]
    },
    entities: {
      total: Math.floor(Math.random() * 10000) + 1000,
      excessive: Math.floor(Math.random() * 100),
      recommendations: [
        'Reduce entity count in crowded areas',
        'Remove unnecessary item frames and armor stands',
        'Optimize mob farms'
      ]
    },
    redstone: {
      circuits: Math.floor(Math.random() * 500),
      laggy: Math.floor(Math.random() * 50),
      recommendations: [
        'Optimize clock circuits',
        'Reduce hopper usage',
        'Use observers instead of BUD switches'
      ]
    },
    storage: {
      currentSize: Math.floor(Math.random() * 2000) + 500 + ' MB',
      optimizedSize: Math.floor(Math.random() * 1500) + 300 + ' MB',
      savings: Math.floor(Math.random() * 500) + 100 + ' MB'
    }
  };

  const performanceImpact = {
    tps: '+' + (Math.random() * 5 + 1).toFixed(1),
    memoryUsage: '-' + Math.floor(Math.random() * 30 + 10) + '%',
    loadTime: '-' + Math.floor(Math.random() * 50 + 20) + '%'
  };

  res.json({
    worldAnalysis: optimizations,
    performanceImpact,
    priority: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)],
    estimatedTime: Math.floor(Math.random() * 60) + 15 + ' minutes',
    timestamp: new Date().toISOString()
  });
});

// World converter (between versions)
router.post('/convert', (req, res) => {
  const { fromVersion, toVersion, worldName, options = {} } = req.body;
  
  if (!fromVersion || !toVersion || !worldName) {
    return res.status(400).json({ error: 'From version, to version, and world name required' });
  }

  const conversionPlan = {
    worldName,
    fromVersion,
    toVersion,
    compatibility: calculateVersionCompatibility(fromVersion, toVersion),
    steps: generateConversionSteps(fromVersion, toVersion),
    warnings: generateConversionWarnings(fromVersion, toVersion),
    estimatedTime: Math.floor(Math.random() * 120) + 30 + ' minutes',
    backupRequired: true,
    risks: assessConversionRisks(fromVersion, toVersion)
  };

  const preview = {
    blocksAffected: Math.floor(Math.random() * 10000) + 1000,
    itemsAffected: Math.floor(Math.random() * 5000) + 500,
    structuresAffected: Math.floor(Math.random() * 100) + 10,
    newFeatures: getNewFeatures(fromVersion, toVersion)
  };

  res.json({
    conversionPlan,
    preview,
    recommendation: conversionPlan.compatibility > 80 ? 'Safe to convert' : 'Proceed with caution',
    timestamp: new Date().toISOString()
  });
});

// World statistics and insights
router.get('/stats/:worldId', (req, res) => {
  const { worldId } = req.params;
  const { detailed = false } = req.query;

  const stats = {
    worldId,
    general: {
      totalBlocks: Math.floor(Math.random() * 10000000) + 1000000,
      totalChunks: Math.floor(Math.random() * 50000) + 5000,
      playTime: Math.floor(Math.random() * 1000) + 100 + ' hours',
      playerCount: Math.floor(Math.random() * 100) + 1,
      worldAge: Math.floor(Math.random() * 365) + 30 + ' days'
    },
    blocks: {
      mostCommon: generateBlockDistribution(),
      rarest: ['Ancient Debris', 'Dragon Egg', 'Bedrock', 'End Portal Frame'],
      placed: Math.floor(Math.random() * 1000000) + 100000,
      broken: Math.floor(Math.random() * 800000) + 80000
    },
    biomes: {
      discovered: Math.floor(Math.random() * 30) + 20,
      mostExplored: generateRandomBiomes().slice(0, 5),
      rarest: ['Mushroom Fields', 'Modified Jungle Edge', 'Deep Warm Ocean']
    },
    structures: {
      villages: Math.floor(Math.random() * 50) + 10,
      dungeons: Math.floor(Math.random() * 200) + 50,
      strongholds: Math.floor(Math.random() * 3) + 1,
      endCities: Math.floor(Math.random() * 10),
      netherFortresses: Math.floor(Math.random() * 20) + 5
    }
  };

  if (detailed === 'true') {
    stats.detailed = {
      exploration: {
        percentage: Math.floor(Math.random() * 100) + '%',
        unexploredAreas: Math.floor(Math.random() * 1000) + 100,
        farthestPoint: {
          x: Math.floor(Math.random() * 100000) - 50000,
          z: Math.floor(Math.random() * 100000) - 50000
        }
      },
      resources: generateResourceStats(),
      achievements: Math.floor(Math.random() * 50) + 20,
      deaths: Math.floor(Math.random() * 100) + 10,
      mobsKilled: Math.floor(Math.random() * 10000) + 1000
    };
  }

  res.json({
    statistics: stats,
    insights: generateWorldInsights(stats),
    timestamp: new Date().toISOString()
  });
});

// Helper functions
function parseSeed(seed) {
  if (typeof seed === 'string' && isNaN(seed)) {
    // Convert string to number using hash
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }
  return parseInt(seed) || 0;
}

function analyzeWorldSeed(seed, version) {
  const random = new Random(seed);
  
  const biomes = [
    'Plains', 'Forest', 'Desert', 'Mountains', 'Swamp', 'Taiga', 'Ocean',
    'Jungle', 'Savanna', 'Ice Plains', 'Mushroom Fields', 'Beach', 'River'
  ];
  
  const structures = [
    'Village', 'Desert Temple', 'Jungle Temple', 'Witch Hut', 'Ocean Monument',
    'Woodland Mansion', 'Stronghold', 'Mineshaft', 'Dungeon', 'Ruined Portal'
  ];

  return {
    spawnBiome: biomes[random.nextInt(biomes.length)],
    nearbyBiomes: random.shuffle(biomes).slice(0, 5),
    structures: random.shuffle(structures).slice(0, 6).map(structure => ({
      type: structure,
      distance: random.nextInt(2000) + 100,
      coordinates: {
        x: random.nextInt(4000) - 2000,
        z: random.nextInt(4000) - 2000
      }
    })),
    resources: {
      diamonds: random.nextInt(50) + 10,
      emeralds: random.nextInt(20) + 5,
      ancientDebris: random.nextInt(10) + 2
    },
    difficulty: ['Easy', 'Medium', 'Hard', 'Extreme'][random.nextInt(4)],
    uniqueFeatures: generateUniqueFeatures(random),
    coordinates: {
      spawn: { x: 0, y: 64, z: 0 },
      stronghold: { 
        x: random.nextInt(2000) - 1000, 
        y: random.nextInt(30) + 20, 
        z: random.nextInt(2000) - 1000 
      }
    }
  };
}

function generateCustomSeed(biomes, structures, difficulty) {
  // Generate seed based on criteria
  let seed = Math.floor(Math.random() * 2147483647);
  
  // Adjust seed based on criteria (simplified)
  if (biomes.length > 0) {
    seed += biomes.join('').length * 1000;
  }
  
  if (structures.length > 0) {
    seed += structures.join('').length * 500;
  }
  
  return seed;
}

function calculateMatchScore(analysis, criteria) {
  let score = 0;
  
  if (criteria.biomes.length > 0) {
    const matches = analysis.nearbyBiomes.filter(biome => 
      criteria.biomes.some(cb => biome.toLowerCase().includes(cb.toLowerCase()))
    ).length;
    score += (matches / criteria.biomes.length) * 40;
  }
  
  if (criteria.structures.length > 0) {
    const matches = analysis.structures.filter(structure => 
      criteria.structures.some(cs => structure.type.toLowerCase().includes(cs.toLowerCase()))
    ).length;
    score += (matches / criteria.structures.length) * 40;
  }
  
  if (criteria.difficulty !== 'any') {
    if (analysis.difficulty.toLowerCase() === criteria.difficulty.toLowerCase()) {
      score += 20;
    }
  }
  
  return Math.min(score, 100);
}

function generateRandomBiomes() {
  const allBiomes = [
    'Plains', 'Forest', 'Desert', 'Mountains', 'Swamp', 'Taiga', 'Ocean',
    'Jungle', 'Savanna', 'Ice Plains', 'Tundra', 'Mushroom Fields', 'Beach',
    'River', 'Nether Wastes', 'Soul Sand Valley', 'Crimson Forest', 'Warped Forest',
    'Basalt Deltas', 'The End', 'End Highlands', 'End Midlands', 'Small End Islands'
  ];
  
  return allBiomes.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 10) + 5);
}

function generateBackupRecommendations(analysis) {
  const recommendations = [];
  
  if (analysis.corruption.detected) {
    recommendations.push('Fix corruption issues before using this backup');
    recommendations.push('Run world repair tools');
  }
  
  if (analysis.size > 500) {
    recommendations.push('Consider world optimization to reduce size');
  }
  
  recommendations.push('Create regular automated backups');
  recommendations.push('Test backup integrity periodically');
  
  return recommendations;
}

function generateConversionSteps(fromVersion, toVersion) {
  return [
    'Create full world backup',
    'Verify backup integrity',
    'Update world format',
    'Convert block IDs',
    'Update entity data',
    'Regenerate structures if needed',
    'Test world loading',
    'Verify player data'
  ];
}

function generateConversionWarnings(fromVersion, toVersion) {
  const warnings = [];
  
  if (parseFloat(fromVersion.replace('1.', '')) < parseFloat(toVersion.replace('1.', ''))) {
    warnings.push('Some blocks may change appearance');
    warnings.push('New world generation may create chunk borders');
    warnings.push('Some redstone circuits may break');
  }
  
  return warnings;
}

function calculateVersionCompatibility(fromVersion, toVersion) {
  const from = parseFloat(fromVersion.replace('1.', ''));
  const to = parseFloat(toVersion.replace('1.', ''));
  
  const diff = Math.abs(to - from);
  
  if (diff === 0) return 100;
  if (diff <= 1) return 95;
  if (diff <= 2) return 85;
  if (diff <= 3) return 70;
  return 50;
}

function assessConversionRisks(fromVersion, toVersion) {
  return [
    'Data loss in corrupted chunks',
    'Redstone circuit malfunction',
    'Block ID conflicts',
    'Entity data corruption',
    'World generation inconsistencies'
  ];
}

function getNewFeatures(fromVersion, toVersion) {
  const features = {
    '1.17': ['Copper', 'Amethyst', 'Glow Squid', 'Axolotl'],
    '1.18': ['New World Generation', 'Deep Dark', 'Sculk Blocks'],
    '1.19': ['Warden', 'Ancient Cities', 'Mangrove Swamp', 'Frogs'],
    '1.20': ['Cherry Blossom', 'Archaeology', 'Armor Trims', 'Bamboo Blocks']
  };
  
  return features[toVersion] || ['Various improvements and bug fixes'];
}

function generateBlockDistribution() {
  return [
    { block: 'Stone', percentage: 35 },
    { block: 'Dirt', percentage: 20 },
    { block: 'Water', percentage: 15 },
    { block: 'Air', percentage: 10 },
    { block: 'Sand', percentage: 8 },
    { block: 'Gravel', percentage: 5 },
    { block: 'Wood', percentage: 4 },
    { block: 'Other', percentage: 3 }
  ];
}

function generateResourceStats() {
  return {
    coal: Math.floor(Math.random() * 10000) + 1000,
    iron: Math.floor(Math.random() * 5000) + 500,
    gold: Math.floor(Math.random() * 1000) + 100,
    diamond: Math.floor(Math.random() * 500) + 50,
    emerald: Math.floor(Math.random() * 200) + 20,
    netherite: Math.floor(Math.random() * 50) + 5
  };
}

function generateUniqueFeatures(random) {
  const features = [
    'Rare biome combination',
    'Multiple villages nearby',
    'Exposed stronghold',
    'Surface lava lake',
    'Natural mob spawner',
    'Unusual terrain formation',
    'Multiple ocean monuments',
    'Woodland mansion close to spawn'
  ];
  
  return random.shuffle(features).slice(0, random.nextInt(3) + 1);
}

function generateSeedRecommendations(analysis) {
  const recommendations = [];
  
  if (analysis.structures.some(s => s.type === 'Village' && s.distance < 500)) {
    recommendations.push('Great for quick start - village nearby');
  }
  
  if (analysis.nearbyBiomes.includes('Desert') && analysis.nearbyBiomes.includes('Ocean')) {
    recommendations.push('Diverse biomes for varied gameplay');
  }
  
  if (analysis.difficulty === 'Hard') {
    recommendations.push('Challenging seed for experienced players');
  }
  
  recommendations.push('Suitable for ' + ['survival', 'creative', 'adventure'][Math.floor(Math.random() * 3)] + ' mode');
  
  return recommendations;
}

function generateWorldInsights(stats) {
  const insights = [];
  
  if (stats.general.totalBlocks > 5000000) {
    insights.push('This is a well-developed world with extensive building');
  }
  
  if (stats.biomes.discovered > 25) {
    insights.push('Excellent exploration - most biomes discovered');
  }
  
  if (stats.structures.villages > 20) {
    insights.push('Rich in villages - great for trading');
  }
  
  return insights;
}

// Simple random number generator for consistent results
class Random {
  constructor(seed) {
    this.seed = seed;
  }
  
  nextInt(max) {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return Math.floor((this.seed / 233280) * max);
  }
  
  shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

module.exports = router;
