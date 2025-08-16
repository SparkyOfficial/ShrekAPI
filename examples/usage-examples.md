# ShrekAPI Usage Examples

## 🚀 Using ShrekAPI in Your Code

### JavaScript/Node.js Examples

#### 1. Server Ping
```javascript
const axios = require('axios');

async function pingMinecraftServer(serverIp) {
    try {
        const response = await axios.post('http://localhost:3000/api/mc/servers/ping', {
            ip: serverIp,
            detailed: true
        });
        
        console.log('Server Status:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error pinging server:', error.message);
    }
}

// Usage
pingMinecraftServer('hypixel.net');
```

#### 2. Generate Datapack
```javascript
async function createDatapack(name, version, features) {
    const response = await axios.post('http://localhost:3000/api/mc/datapacks/generate', {
        name: name,
        mcVersion: version,
        features: features,
        customFunctions: [
            {
                name: 'welcome',
                commands: ['say Welcome to the server!', 'playsound minecraft:entity.player.levelup master @a']
            }
        ],
        recipes: [
            {
                type: 'crafting_shaped',
                result: { item: 'minecraft:diamond_sword' },
                pattern: [' D ', ' D ', ' S '],
                ingredients: { D: { item: 'minecraft:diamond' }, S: { item: 'minecraft:stick' } }
            }
        ]
    });
    
    return response.data;
}

// Usage
createDatapack('MyServerPack', '1.20', ['functions', 'recipes']);
```

#### 3. Performance Analysis
```javascript
async function analyzeServerPerformance(serverIp) {
    const response = await axios.post('http://localhost:3000/api/mc/performance/analyze', {
        serverIp: serverIp,
        metrics: ['tps', 'memory', 'cpu', 'entities'],
        duration: 300,
        detailed: true
    });
    
    const { analysis, recommendations } = response.data;
    
    console.log('Server Health:', analysis.health);
    console.log('Recommendations:', recommendations);
    
    return response.data;
}
```

#### 4. Economy Management
```javascript
async function managePlayerBalance(economyId, playerId, action, amount) {
    const response = await axios.post('http://localhost:3000/api/mc/economy/balance/manage', {
        economyId: economyId,
        playerId: playerId,
        action: action, // 'add', 'subtract', 'set', 'get'
        amount: amount,
        reason: `Balance ${action} via API`
    });
    
    return response.data.balance;
}

// Usage
managePlayerBalance('server1', 'player123', 'add', 100);
```

### Python Examples

#### 1. Server Monitoring
```python
import requests
import json

def monitor_server(server_ip):
    url = "http://localhost:3000/api/mc/servers/ping"
    data = {
        "ip": server_ip,
        "detailed": True
    }
    
    response = requests.post(url, json=data)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code}")
        return None

# Usage
server_data = monitor_server("hypixel.net")
print(f"Players online: {server_data['players']['online']}")
```

#### 2. Chat Moderation
```python
def analyze_chat_message(system_id, player_id, message):
    url = "http://localhost:3000/api/mc/moderation/chat/analyze"
    data = {
        "systemId": system_id,
        "playerId": player_id,
        "playerName": "TestPlayer",
        "message": message
    }
    
    response = requests.post(url, json=data)
    result = response.json()
    
    if not result['analysis']['allowed']:
        print(f"Message blocked: {result['analysis']['violations']}")
    
    return result

# Usage
analyze_chat_message("mod_system_1", "player123", "Join my discord server!")
```

### Java Examples

#### 1. Bukkit Plugin Integration
```java
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;
import com.google.gson.Gson;

public class ShrekAPIClient {
    private static final String API_BASE = "http://localhost:3000/api/mc";
    private final HttpClient client = HttpClient.newHttpClient();
    private final Gson gson = new Gson();
    
    public ServerPingResponse pingServer(String serverIp) throws Exception {
        String json = gson.toJson(new PingRequest(serverIp, true));
        
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(API_BASE + "/servers/ping"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();
            
        HttpResponse<String> response = client.send(request, 
            HttpResponse.BodyHandlers.ofString());
            
        return gson.fromJson(response.body(), ServerPingResponse.class);
    }
    
    public void generateCommands(String description, String language) throws Exception {
        CommandRequest request = new CommandRequest(description, language, "advanced");
        String json = gson.toJson(request);
        
        HttpRequest httpRequest = HttpRequest.newBuilder()
            .uri(URI.create(API_BASE + "/commands/generate"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();
            
        HttpResponse<String> response = client.send(httpRequest, 
            HttpResponse.BodyHandlers.ofString());
            
        CommandResponse result = gson.fromJson(response.body(), CommandResponse.class);
        System.out.println("Generated code: " + result.getCode());
    }
}
```

### cURL Examples

#### 1. Quick Server Check
```bash
curl -X POST http://localhost:3000/api/mc/servers/ping \
  -H "Content-Type: application/json" \
  -d '{"ip": "hypixel.net", "detailed": true}'
```

#### 2. Create Economy System
```bash
curl -X POST http://localhost:3000/api/mc/economy/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MyServerEconomy",
    "currency": "coins",
    "startingBalance": 100,
    "features": ["banking", "shops", "auctions"]
  }'
```

#### 3. Generate Plugin Template
```bash
curl -X POST http://localhost:3000/api/mc/plugins/template \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MyPlugin",
    "type": "utility",
    "language": "java",
    "features": ["commands", "events", "config"]
  }'
```

## 🔌 Integration Patterns

### 1. Minecraft Plugin Integration
```java
// In your Bukkit plugin
@EventHandler
public void onPlayerJoin(PlayerJoinEvent event) {
    Player player = event.getPlayer();
    
    // Check player via API
    CompletableFuture.supplyAsync(() -> {
        return shrekAPI.getPlayerProfile(player.getUniqueId().toString());
    }).thenAccept(profile -> {
        // Use profile data
        player.sendMessage("Welcome back! Rank: " + profile.getRank());
    });
}
```

### 2. Discord Bot Integration
```javascript
// Discord.js bot
client.on('messageCreate', async message => {
    if (message.content.startsWith('!server')) {
        const serverIp = message.content.split(' ')[1];
        
        try {
            const serverData = await pingMinecraftServer(serverIp);
            const embed = new EmbedBuilder()
                .setTitle(`Server: ${serverIp}`)
                .addFields(
                    { name: 'Status', value: serverData.online ? '🟢 Online' : '🔴 Offline' },
                    { name: 'Players', value: `${serverData.players.online}/${serverData.players.max}` }
                );
            
            message.reply({ embeds: [embed] });
        } catch (error) {
            message.reply('❌ Could not ping server');
        }
    }
});
```

### 3. Web Dashboard Integration
```javascript
// React component
function ServerDashboard({ serverId }) {
    const [serverData, setServerData] = useState(null);
    
    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(`http://localhost:3000/api/mc/dashboard/${serverId}`);
            const data = await response.json();
            setServerData(data);
        };
        
        fetchData();
        const interval = setInterval(fetchData, 30000); // Update every 30s
        
        return () => clearInterval(interval);
    }, [serverId]);
    
    return (
        <div>
            <h2>Server Dashboard</h2>
            {serverData && (
                <div>
                    <p>TPS: {serverData.performance.tps}</p>
                    <p>Memory: {serverData.performance.memory}%</p>
                    <p>Players: {serverData.players.online}</p>
                </div>
            )}
        </div>
    );
}
```

## 📊 Response Formats

All API responses follow this structure:
```json
{
    "success": true,
    "data": { ... },
    "timestamp": "2025-08-16T14:58:43.000Z",
    "endpoint": "/api/mc/servers/ping"
}
```

Error responses:
```json
{
    "error": "Bad Request",
    "message": "Server IP is required",
    "timestamp": "2025-08-16T14:58:43.000Z"
}
```

## 🚀 Deployment Examples

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Heroku
```json
{
    "name": "shrek-api",
    "description": "Minecraft Server Management API",
    "image": "heroku/nodejs",
    "addons": ["heroku-redis:mini"],
    "env": {
        "NODE_ENV": "production",
        "PORT": "3000"
    }
}
```
