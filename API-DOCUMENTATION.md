# ShrekAPI - Developer Documentation

## 🎯 **Что это такое?**

ShrekAPI - это полноценный **REST API** для разработчиков Minecraft серверов. Это не веб-сайт, а программный интерфейс, который можно использовать в:

- **Bukkit/Spigot плагинах**
- **Discord ботах** 
- **Веб-панелях управления**
- **Мобильных приложениях**
- **Автоматизации серверов**

## 🔧 **Как использовать в коде**

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Пинг сервера
const response = await axios.post('http://your-api.com/api/mc/servers/ping', {
    ip: 'hypixel.net',
    detailed: true
});

console.log('Игроков онлайн:', response.data.players.online);
```

### Java (Bukkit Plugin)
```java
// В вашем плагине
public class MyPlugin extends JavaPlugin {
    
    @EventHandler
    public void onPlayerJoin(PlayerJoinEvent event) {
        // Получить данные игрока через API
        CompletableFuture.supplyAsync(() -> {
            return callShrekAPI("/api/mc/players/profile/" + event.getPlayer().getUniqueId());
        }).thenAccept(playerData -> {
            // Использовать данные
            event.getPlayer().sendMessage("Добро пожаловать! Ранг: " + playerData.getRank());
        });
    }
}
```

### Python
```python
import requests

# Анализ производительности сервера
def check_server_performance(server_ip):
    response = requests.post('http://your-api.com/api/mc/performance/analyze', {
        'serverIp': server_ip,
        'metrics': ['tps', 'memory', 'cpu']
    })
    
    data = response.json()
    return data['analysis']['health']['score']
```

## 📡 **Доступные эндпоинты**

### Server Management
- `POST /api/mc/servers/ping` - Пинг серверов
- `POST /api/mc/config/add` - Добавить сервер в мониторинг
- `GET /api/mc/dashboard/:serverId` - Дашборд сервера

### Player Tools  
- `GET /api/mc/players/profile/:uuid` - Профиль игрока
- `POST /api/mc/permissions/users/manage` - Управление правами
- `POST /api/mc/economy/balance/manage` - Управление балансом

### Content Generation
- `POST /api/mc/commands/generate` - Генерация команд с ИИ
- `POST /api/mc/datapacks/generate` - Создание датапаков
- `POST /api/mc/plugins/template` - Шаблоны плагинов

### Performance & Optimization
- `POST /api/mc/performance/analyze` - Анализ производительности
- `POST /api/mc/performance/optimize` - Рекомендации по оптимизации
- `POST /api/mc/performance/benchmark` - Бенчмарки

### Moderation & Security
- `POST /api/mc/moderation/chat/analyze` - Анализ чата
- `POST /api/mc/permissions/system/create` - Система прав
- `POST /api/mc/moderation/auto-mod/configure` - Автомодерация

## 🚀 **Развертывание**

### Локальная разработка
```bash
git clone https://github.com/your-repo/ShrekAPI
cd ShrekAPI
npm install
npm start
```

### Docker
```bash
docker build -t shrek-api .
docker run -p 3000:3000 shrek-api
```

### Heroku
```bash
git push heroku main
```

### VPS/Dedicated Server
```bash
# Установка PM2 для продакшена
npm install -g pm2
pm2 start server.js --name "shrek-api"
pm2 startup
pm2 save
```

## 🔑 **Аутентификация** (для продакшена)

```javascript
// Добавить в headers
headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}
```

## 📊 **Примеры интеграции**

### Discord Bot
```javascript
// Команда для проверки сервера
client.on('messageCreate', async message => {
    if (message.content.startsWith('!server')) {
        const serverIp = message.content.split(' ')[1];
        
        const serverData = await axios.post('http://your-api.com/api/mc/servers/ping', {
            ip: serverIp
        });
        
        message.reply(`Сервер ${serverIp}: ${serverData.data.online ? '🟢' : '🔴'}`);
    }
});
```

### Веб-панель управления
```javascript
// React компонент
function ServerManager() {
    const [servers, setServers] = useState([]);
    
    useEffect(() => {
        fetch('http://your-api.com/api/mc/config/list')
            .then(res => res.json())
            .then(data => setServers(data.servers));
    }, []);
    
    return (
        <div>
            {servers.map(server => (
                <ServerCard key={server.id} server={server} />
            ))}
        </div>
    );
}
```

### Мобильное приложение (React Native)
```javascript
// Проверка статуса серверов
const checkServers = async () => {
    const response = await fetch('http://your-api.com/api/mc/servers/batch-ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servers: ['server1.com', 'server2.com'] })
    });
    
    const data = await response.json();
    setServerStatuses(data.results);
};
```

## 🛠️ **Расширение API**

### Добавление новых эндпоинтов
```javascript
// routes/minecraft/custom.js
const express = require('express');
const router = express.Router();

router.post('/my-feature', (req, res) => {
    // Ваша логика
    res.json({ success: true, data: result });
});

module.exports = router;
```

### Подключение к базе данных
```javascript
// Замените in-memory storage на MongoDB/PostgreSQL
const mongoose = require('mongoose');

const ServerSchema = new mongoose.Schema({
    ip: String,
    status: String,
    lastPing: Date
});

const Server = mongoose.model('Server', ServerSchema);
```

## 📈 **Мониторинг и логи**

```javascript
// Добавить в server.js
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'api.log' })
    ]
});

// Логирование запросов
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`, { ip: req.ip });
    next();
});
```

## 🔒 **Безопасность**

```javascript
// Rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100 // максимум 100 запросов
});

app.use('/api/', limiter);

// API ключи
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || !isValidApiKey(apiKey)) {
        return res.status(401).json({ error: 'Invalid API key' });
    }
    next();
};
```

## 🎯 **Что дальше?**

1. **Форкните проект** на GitHub
2. **Добавьте свои фичи** в новые модули
3. **Деплойте на сервер** для использования
4. **Интегрируйте в свои проекты** (плагины, боты, панели)
5. **Делитесь с сообществом** - другие разработчики смогут использовать ваш API

## 🤝 **Сообщество**

- **GitHub Issues** - баги и предложения
- **Discord** - обсуждение разработки  
- **Wiki** - документация от сообщества
- **Examples** - примеры интеграций

---

**ShrekAPI** - это инструмент для разработчиков, а не конечный продукт. Используйте его как основу для создания мощных Minecraft-приложений!
