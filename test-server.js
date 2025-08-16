const http = require('http');
const url = require('url');

const PORT = 3000;

// Simple test data
const testData = {
  serverPing: {
    server: "hypixel.net",
    online: true,
    players: { online: 45231, max: 200000 },
    version: "1.8-1.20",
    motd: "Hypixel Network",
    ping: 23
  },
  datapackGeneration: {
    name: "TestDatapack",
    format: 15,
    files: [
      { path: "data/test/functions/hello.mcfunction", content: "say Hello World!" },
      { path: "data/test/recipes/diamond_sword.json", content: '{"type":"minecraft:crafting_shaped"}' }
    ]
  },
  commandGeneration: {
    language: "java",
    code: `@EventHandler
public void onPlayerJoin(PlayerJoinEvent event) {
    Player player = event.getPlayer();
    player.sendMessage("Welcome to the server!");
}`,
    description: "Player join welcome message"
  }
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight requests
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Root endpoint
  if (path === '/') {
    res.writeHead(200);
    res.end(JSON.stringify({
      name: 'ShrekAPI - Minecraft Utilities',
      version: '1.0.0',
      description: 'Comprehensive Minecraft server management and development API',
      status: 'running',
      endpoints: {
        'Minecraft Tools': [
          'GET /api/mc/servers/ping - Server ping and analysis',
          'POST /api/mc/datapacks/generate - Generate datapacks',
          'POST /api/mc/commands/generate - Generate Minecraft commands',
          'POST /api/mc/performance/analyze - Performance analysis',
          'POST /api/mc/economy/create - Economy management',
          'POST /api/mc/permissions/system/create - Permission systems',
          'POST /api/mc/moderation/chat/analyze - Chat moderation'
        ],
        'Test Endpoints': [
          'GET /test/server-ping - Test server ping',
          'GET /test/datapack - Test datapack generation',
          'GET /test/commands - Test command generation'
        ]
      },
      documentation: '/docs',
      timestamp: new Date().toISOString()
    }, null, 2));
    return;
  }

  // Documentation
  if (path === '/docs') {
    res.writeHead(200);
    res.end(JSON.stringify({
      title: 'ShrekAPI Documentation',
      description: 'Complete Minecraft server management API',
      features: {
        'Server Management': 'Monitor, configure, and optimize Minecraft servers',
        'Player Tools': 'Player profiles, permissions, economy management',
        'Content Creation': 'Generate commands, datapacks, plugins, resource packs',
        'Performance': 'Server optimization, lag analysis, resource monitoring',
        'Moderation': 'Chat analysis, auto-moderation, player behavior tracking',
        'Automation': 'Scheduled tasks, auto-scaling, maintenance automation'
      },
      usage: 'Send POST requests with JSON data to respective endpoints',
      examples: {
        serverPing: 'POST /api/mc/servers/ping {"ip": "hypixel.net"}',
        datapackGen: 'POST /api/mc/datapacks/generate {"name": "MyPack", "mcVersion": "1.20"}',
        commandGen: 'POST /api/mc/commands/generate {"description": "teleport system", "language": "java"}'
      }
    }, null, 2));
    return;
  }

  // Test endpoints
  if (path === '/test/server-ping') {
    res.writeHead(200);
    res.end(JSON.stringify({
      endpoint: '/api/mc/servers/ping',
      example: testData.serverPing,
      description: 'Ping Minecraft servers and get detailed information',
      features: ['Online status', 'Player count', 'Version info', 'MOTD', 'Latency']
    }, null, 2));
    return;
  }

  if (path === '/test/datapack') {
    res.writeHead(200);
    res.end(JSON.stringify({
      endpoint: '/api/mc/datapacks/generate',
      example: testData.datapackGeneration,
      description: 'Generate complete Minecraft datapacks with functions, recipes, and more',
      features: ['Functions', 'Recipes', 'Loot tables', 'Advancements', 'World generation']
    }, null, 2));
    return;
  }

  if (path === '/test/commands') {
    res.writeHead(200);
    res.end(JSON.stringify({
      endpoint: '/api/mc/commands/generate',
      example: testData.commandGeneration,
      description: 'Generate Minecraft plugin code with AI assistance',
      features: ['Java/Kotlin/JavaScript', 'Event handlers', 'Commands', 'Optimization']
    }, null, 2));
    return;
  }

  // Simulate API endpoints
  if (path.startsWith('/api/mc/')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const requestData = body ? JSON.parse(body) : {};
        
        // Simulate different endpoints
        if (path.includes('/servers/ping')) {
          res.writeHead(200);
          res.end(JSON.stringify({
            ...testData.serverPing,
            ...requestData,
            timestamp: new Date().toISOString(),
            status: 'success'
          }, null, 2));
        } else if (path.includes('/datapacks/generate')) {
          res.writeHead(200);
          res.end(JSON.stringify({
            ...testData.datapackGeneration,
            ...requestData,
            timestamp: new Date().toISOString(),
            status: 'generated'
          }, null, 2));
        } else if (path.includes('/commands/generate')) {
          res.writeHead(200);
          res.end(JSON.stringify({
            ...testData.commandGeneration,
            ...requestData,
            timestamp: new Date().toISOString(),
            status: 'generated'
          }, null, 2));
        } else {
          res.writeHead(200);
          res.end(JSON.stringify({
            endpoint: path,
            method: method,
            data: requestData,
            message: 'API endpoint simulation - full implementation available',
            timestamp: new Date().toISOString()
          }, null, 2));
        }
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({
          error: 'Invalid JSON',
          message: error.message
        }));
      }
    });
    return;
  }

  // 404 for unknown paths
  res.writeHead(404);
  res.end(JSON.stringify({
    error: 'Not Found',
    message: 'Endpoint not found',
    availableEndpoints: ['/', '/docs', '/test/*', '/api/mc/*']
  }));
});

server.listen(PORT, () => {
  console.log(`🚀 ShrekAPI Test Server running on http://localhost:${PORT}`);
  console.log(`📚 Documentation: http://localhost:${PORT}/docs`);
  console.log(`🧪 Test endpoints: http://localhost:${PORT}/test/server-ping`);
  console.log(`⚡ Ready to demonstrate Minecraft API functionality!`);
});

module.exports = server;
