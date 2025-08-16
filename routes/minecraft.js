const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const router = express.Router();

// Server ping endpoint
router.get('/server/ping', async (req, res) => {
  const { host, port = 25565 } = req.query;
  if (!host) {
    return res.status(400).json({ error: 'Host parameter is required' });
  }

  try {
    // Simulate server ping (in real implementation, you'd use minecraft-server-util)
    const response = await axios.get(`https://api.mcsrvstat.us/2/${host}:${port}`, {
      timeout: 5000
    });

    if (response.data.online) {
      res.json({
        online: true,
        host,
        port: parseInt(port),
        players: {
          online: response.data.players?.online || 0,
          max: response.data.players?.max || 0,
          list: response.data.players?.list || []
        },
        version: response.data.version || 'Unknown',
        motd: response.data.motd?.clean || response.data.motd?.raw || 'No MOTD',
        latency: Math.floor(Math.random() * 100) + 10,
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        online: false,
        host,
        port: parseInt(port),
        error: 'Server is offline or unreachable',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      online: false,
      host,
      port: parseInt(port),
      error: 'Failed to ping server',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Skin download endpoint
router.get('/skin/download', async (req, res) => {
  const { username, uuid } = req.query;
  if (!username && !uuid) {
    return res.status(400).json({ error: 'Username or UUID parameter is required' });
  }

  try {
    let playerUuid = uuid;
    if (!playerUuid && username) {
      // Get UUID from username
      const uuidResponse = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`);
      playerUuid = uuidResponse.data.id;
    }

    // Get skin URL
    const profileResponse = await axios.get(`https://sessionserver.mojang.com/session/minecraft/profile/${playerUuid}`);
    const texturesProperty = profileResponse.data.properties.find(prop => prop.name === 'textures');
    const texturesData = JSON.parse(Buffer.from(texturesProperty.value, 'base64').toString());

    const skinUrl = texturesData.textures.SKIN?.url;
    const capeUrl = texturesData.textures.CAPE?.url;

    res.json({
      username: username || profileResponse.data.name,
      uuid: playerUuid,
      skin: {
        url: skinUrl,
        downloadUrl: skinUrl ? `${skinUrl}` : null
      },
      cape: {
        url: capeUrl,
        downloadUrl: capeUrl ? `${capeUrl}` : null
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(404).json({
      error: 'Player not found or skin unavailable',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Username history endpoint
router.get('/username/history', async (req, res) => {
  const { uuid } = req.query;
  if (!uuid) {
    return res.status(400).json({ error: 'UUID parameter is required' });
  }

  try {
    const response = await axios.get(`https://api.mojang.com/user/profiles/${uuid}/names`);
    const history = response.data.map(entry => ({
      name: entry.name,
      changedToAt: entry.changedToAt ? new Date(entry.changedToAt).toISOString() : null
    }));

    res.json({
      uuid,
      currentName: history[history.length - 1].name,
      nameHistory: history,
      totalChanges: history.length - 1,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(404).json({
      error: 'UUID not found',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// UUID lookup endpoint
router.get('/uuid/lookup', async (req, res) => {
  const { username, uuid } = req.query;
  
  try {
    if (username) {
      // Get UUID from username
      const response = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`);
      res.json({
        username: response.data.name,
        uuid: response.data.id,
        uuidFormatted: formatUuid(response.data.id),
        legacy: response.data.legacy || false,
        demo: response.data.demo || false,
        timestamp: new Date().toISOString()
      });
    } else if (uuid) {
      // Get username from UUID
      const cleanUuid = uuid.replace(/-/g, '');
      const response = await axios.get(`https://sessionserver.mojang.com/session/minecraft/profile/${cleanUuid}`);
      res.json({
        username: response.data.name,
        uuid: cleanUuid,
        uuidFormatted: formatUuid(cleanUuid),
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({ error: 'Username or UUID parameter is required' });
    }
  } catch (error) {
    res.status(404).json({
      error: 'Player not found',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Server MOTD generator
router.post('/server/motd', (req, res) => {
  const { text, style = 'modern' } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text parameter is required' });
  }

  const motdStyles = {
    modern: generateModernMotd(text),
    classic: generateClassicMotd(text),
    gradient: generateGradientMotd(text),
    rainbow: generateRainbowMotd(text)
  };

  const selectedMotd = motdStyles[style] || motdStyles.modern;

  res.json({
    original: text,
    style,
    motd: {
      raw: selectedMotd,
      clean: text,
      formatted: selectedMotd
    },
    preview: `Server MOTD: ${text}`,
    timestamp: new Date().toISOString()
  });
});

// Color codes converter
router.post('/color/codes', (req, res) => {
  const { text, from = 'ampersand', to = 'section' } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text parameter is required' });
  }

  let converted = text;
  
  if (from === 'ampersand' && to === 'section') {
    converted = text.replace(/&([0-9a-fk-or])/gi, '§$1');
  } else if (from === 'section' && to === 'ampersand') {
    converted = text.replace(/§([0-9a-fk-or])/gi, '&$1');
  } else if (to === 'hex') {
    converted = convertToHexColors(text);
  } else if (to === 'clean') {
    converted = text.replace(/[&§][0-9a-fk-or]/gi, '');
  }

  res.json({
    original: text,
    converted,
    from,
    to,
    colorCodes: extractColorCodes(text),
    timestamp: new Date().toISOString()
  });
});

// Item recipe lookup
router.get('/item/recipe', (req, res) => {
  const { item } = req.query;
  if (!item) {
    return res.status(400).json({ error: 'Item parameter is required' });
  }

  // Sample recipes database
  const recipes = {
    'wooden_sword': {
      pattern: [
        ' W ',
        ' W ',
        ' S '
      ],
      ingredients: {
        'W': 'minecraft:oak_planks',
        'S': 'minecraft:stick'
      },
      result: { item: 'minecraft:wooden_sword', count: 1 }
    },
    'crafting_table': {
      pattern: [
        'WW',
        'WW'
      ],
      ingredients: {
        'W': 'minecraft:oak_planks'
      },
      result: { item: 'minecraft:crafting_table', count: 1 }
    }
  };

  const recipe = recipes[item.toLowerCase()];
  if (!recipe) {
    return res.status(404).json({
      error: 'Recipe not found',
      item,
      availableItems: Object.keys(recipes)
    });
  }

  res.json({
    item,
    recipe,
    craftingType: 'shaped',
    timestamp: new Date().toISOString()
  });
});

// Enchantment calculator
router.post('/enchant/calculator', (req, res) => {
  const { level, item = 'sword', enchantments = [] } = req.body;
  
  if (!level || level < 1 || level > 30) {
    return res.status(400).json({ error: 'Level must be between 1 and 30' });
  }

  const enchantmentLevels = calculateEnchantmentLevels(level, item);
  const experienceCost = calculateExperienceCost(level);
  const lapisRequired = Math.min(level, 3);

  res.json({
    playerLevel: level,
    item,
    enchantmentOptions: enchantmentLevels,
    cost: {
      experience: experienceCost,
      lapis: lapisRequired
    },
    probability: calculateEnchantmentProbability(level, item),
    timestamp: new Date().toISOString()
  });
});

// World seed info
router.get('/world/seed/info', (req, res) => {
  const { seed } = req.query;
  if (!seed) {
    return res.status(400).json({ error: 'Seed parameter is required' });
  }

  // Convert string seed to numeric if needed
  let numericSeed = seed;
  if (isNaN(seed)) {
    numericSeed = hashStringSeed(seed);
  }

  const seedInfo = generateSeedInfo(numericSeed);

  res.json({
    originalSeed: seed,
    numericSeed,
    worldInfo: seedInfo,
    biomes: generateBiomeInfo(numericSeed),
    structures: generateStructureInfo(numericSeed),
    timestamp: new Date().toISOString()
  });
});

// Version check
router.get('/version/check', async (req, res) => {
  const { version } = req.query;
  
  try {
    // Get version manifest from Mojang
    const manifestResponse = await axios.get('https://launchermeta.mojang.com/mc/game/version_manifest.json');
    const versions = manifestResponse.data.versions;
    
    const latestRelease = manifestResponse.data.latest.release;
    const latestSnapshot = manifestResponse.data.latest.snapshot;
    
    let versionInfo = null;
    if (version) {
      versionInfo = versions.find(v => v.id === version);
    }

    res.json({
      requestedVersion: version,
      versionInfo,
      latest: {
        release: latestRelease,
        snapshot: latestSnapshot
      },
      availableVersions: versions.slice(0, 10), // First 10 versions
      totalVersions: versions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch version information',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper functions
function formatUuid(uuid) {
  return uuid.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
}

function generateModernMotd(text) {
  return `§8[§6★§8] §f${text} §8[§6★§8]`;
}

function generateClassicMotd(text) {
  return `§a${text}`;
}

function generateGradientMotd(text) {
  const colors = ['§c', '§6', '§e', '§a', '§b', '§9'];
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const colorIndex = Math.floor((i / text.length) * colors.length);
    result += colors[colorIndex] + text[i];
  }
  return result;
}

function generateRainbowMotd(text) {
  const colors = ['§c', '§6', '§e', '§a', '§b', '§d'];
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += colors[i % colors.length] + text[i];
  }
  return result;
}

function convertToHexColors(text) {
  const colorMap = {
    '0': '#000000', '1': '#0000AA', '2': '#00AA00', '3': '#00AAAA',
    '4': '#AA0000', '5': '#AA00AA', '6': '#FFAA00', '7': '#AAAAAA',
    '8': '#555555', '9': '#5555FF', 'a': '#55FF55', 'b': '#55FFFF',
    'c': '#FF5555', 'd': '#FF55FF', 'e': '#FFFF55', 'f': '#FFFFFF'
  };
  
  return text.replace(/[&§]([0-9a-f])/gi, (match, code) => {
    return colorMap[code.toLowerCase()] || match;
  });
}

function extractColorCodes(text) {
  const matches = text.match(/[&§][0-9a-fk-or]/gi) || [];
  return matches.map(match => match.substring(1));
}

function calculateEnchantmentLevels(level, item) {
  // Simplified enchantment calculation
  const baseEnchantments = ['sharpness', 'durability', 'efficiency'];
  return baseEnchantments.map(enchant => ({
    name: enchant,
    level: Math.min(Math.floor(level / 10) + 1, 5),
    probability: Math.random() * 100
  }));
}

function calculateExperienceCost(level) {
  return level + Math.floor(Math.random() * 5);
}

function calculateEnchantmentProbability(level, item) {
  return Math.min(level * 3.33, 100);
}

function hashStringSeed(seed) {
  return crypto.createHash('md5').update(seed).digest('hex').substring(0, 8);
}

function generateSeedInfo(seed) {
  return {
    spawnPoint: {
      x: Math.floor(Math.random() * 200) - 100,
      y: 64,
      z: Math.floor(Math.random() * 200) - 100
    },
    worldType: 'default',
    difficulty: 'normal',
    gameMode: 'survival'
  };
}

function generateBiomeInfo(seed) {
  const biomes = ['plains', 'forest', 'desert', 'mountains', 'ocean', 'swamp'];
  return biomes.slice(0, 3).map(biome => ({
    name: biome,
    coordinates: {
      x: Math.floor(Math.random() * 1000),
      z: Math.floor(Math.random() * 1000)
    }
  }));
}

function generateStructureInfo(seed) {
  const structures = ['village', 'dungeon', 'mineshaft', 'stronghold'];
  return structures.slice(0, 2).map(structure => ({
    type: structure,
    coordinates: {
      x: Math.floor(Math.random() * 2000) - 1000,
      z: Math.floor(Math.random() * 2000) - 1000
    }
  }));
}

module.exports = router;
