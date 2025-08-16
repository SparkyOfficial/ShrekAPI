# 🚀 ShrekAPI

**Comprehensive API for developers with utilities, Minecraft tools, and more**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![API Status](https://img.shields.io/badge/API-Online-success)](https://your-shrekapi-url.com/health)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

ShrekAPI is a comprehensive REST API designed for developers, providing a wide range of utilities from data manipulation and Minecraft tools to code quality analysis and performance monitoring. Built with Node.js and Express, it's designed to be fast, reliable, and easy to use.

### Key Features

- **📊 Data & Utils**: UUID generation, password creation, hashing, encoding, validation
- **🎮 Minecraft Utilities**: Server pinging, skin downloads, UUID lookups, MOTD generation
- **☕ Java/Kotlin Tools**: Code decompilation, conversion, regex testing, build tools
- **📱 Android Helpers**: Manifest permissions, resource optimization, ProGuard rules
- **🌐 Network & Web**: IP lookup, URL shortening, DNS queries, SSL checking
- **🔍 Code Quality**: Complexity analysis, code formatting, smell detection
- **⚙️ Development Utils**: Cron parsing, environment validation, log analysis
- **🎯 Game Development**: Plugin templates, command generation, world tools
- **📈 Analytics & Monitoring**: Performance benchmarks, memory analysis, uptime tracking

## 🚀 Quick Start

### Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/shrekapi.git
   cd shrekapi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

5. **Test the API**
   ```bash
   curl http://localhost:3000/health
   ```

The API will be available at `http://localhost:3000`

## 📖 API Documentation

### Base URL
```
https://your-shrekapi-url.com/api
```

### Authentication
Currently, no authentication is required. Rate limiting is applied (100 requests per minute per IP).

### Response Format
All endpoints return JSON responses with consistent structure:

```json
{
  "data": "response_data",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Format
```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 📊 Data & Utils Endpoints

### Generate UUID
```http
GET /api/random/uuid?version=4
```

**Parameters:**
- `version` (optional): UUID version (1, 4, 5, 6). Default: 4
- `namespace` (required for v5): Namespace for UUID v5
- `name` (required for v5): Name for UUID v5

**Example Response:**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "version": "4",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Generate Password
```http
GET /api/random/password?length=12&includeSymbols=true
```

**Parameters:**
- `length` (optional): Password length (4-128). Default: 12
- `includeUppercase` (optional): Include uppercase letters. Default: true
- `includeLowercase` (optional): Include lowercase letters. Default: true
- `includeNumbers` (optional): Include numbers. Default: true
- `includeSymbols` (optional): Include symbols. Default: false
- `excludeSimilar` (optional): Exclude similar characters. Default: false

### Hash Text
```http
POST /api/hash/md5
POST /api/hash/sha256
```

**Request Body:**
```json
{
  "text": "Hello World"
}
```

### Base64 Encode/Decode
```http
POST /api/encode/base64
```

**Request Body:**
```json
{
  "text": "Hello World",
  "operation": "encode"
}
```

### Format JSON
```http
POST /api/format/json
```

**Request Body:**
```json
{
  "json": {"key":"value"},
  "operation": "format",
  "indent": 2
}
```

### Validate Email
```http
POST /api/validate/email
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### Color Conversion
```http
GET /api/color/hex2rgb?hex=#FF5733
```

### Timestamp Conversion
```http
GET /api/timestamp/convert?timestamp=1640995200&format=ISO
```

### Generate QR Code
```http
POST /api/qr/generate
```

**Request Body:**
```json
{
  "text": "https://example.com",
  "size": 200,
  "format": "png"
}
```

---

## 🎮 Minecraft Utilities

### Ping Server
```http
GET /api/mc/server/ping?host=mc.hypixel.net&port=25565
```

### Download Skin
```http
GET /api/mc/skin/download?username=Notch
```

### UUID Lookup
```http
GET /api/mc/uuid/lookup?username=Notch
```

### Username History
```http
GET /api/mc/username/history?uuid=069a79f4-44e9-4726-a5be-fca90e38aaf5
```

### Generate MOTD
```http
POST /api/mc/server/motd
```

**Request Body:**
```json
{
  "text": "Welcome to my server!",
  "style": "modern"
}
```

### Convert Color Codes
```http
POST /api/mc/color/codes
```

**Request Body:**
```json
{
  "text": "&aHello &cWorld",
  "from": "ampersand",
  "to": "section"
}
```

---

## ☕ Java/Kotlin Tools

### Decompile Java Class
```http
POST /api/java/class/decompile
```

**Request Body:**
```json
{
  "bytecode": "compiled_bytecode_here",
  "className": "MyClass"
}
```

### Convert Kotlin ↔ Java
```http
POST /api/kotlin/java/convert
```

**Request Body:**
```json
{
  "code": "fun hello() { println(\"Hello\") }",
  "direction": "kotlin-to-java"
}
```

### Test Regex
```http
POST /api/regex/test
```

**Request Body:**
```json
{
  "pattern": "\\d+",
  "text": "Hello 123 World",
  "flags": "g"
}
```

### Format SQL
```http
POST /api/sql/format
```

**Request Body:**
```json
{
  "sql": "SELECT * FROM users WHERE id = 1",
  "style": "standard"
}
```

### Generate Lombok Code
```http
POST /api/lombok/generate
```

**Request Body:**
```json
{
  "className": "User",
  "fields": [
    {"name": "id", "type": "Long"},
    {"name": "name", "type": "String"}
  ],
  "annotations": ["@Data", "@Builder"]
}
```

---

## 📱 Android Helpers

### Get Manifest Permissions
```http
GET /api/android/manifest/permissions?feature=camera
```

### Optimize Resources
```http
POST /api/android/resource/optimizer
```

**Request Body:**
```json
{
  "resources": [
    {"name": "icon.png", "size": "100KB", "type": "image"}
  ],
  "optimization": "size"
}
```

### Generate ProGuard Rules
```http
POST /api/android/proguard/rules
```

**Request Body:**
```json
{
  "packageName": "com.example.app",
  "keepClasses": ["com.example.Important"],
  "libraries": ["retrofit2"]
}
```

### Convert Density Units
```http
GET /api/android/density/converter?value=16&from=dp&to=px&density=xhdpi
```

---

## 🌐 Network & Web Tools

### IP Information
```http
GET /api/ip/info?ip=8.8.8.8
```

### Shorten URL
```http
POST /api/url/shortener
```

**Request Body:**
```json
{
  "url": "https://very-long-url.com/path/to/resource",
  "customAlias": "mylink",
  "expiresIn": 30
}
```

### DNS Lookup
```http
GET /api/dns/lookup?domain=google.com&type=A
```

### HTTP Status Codes
```http
GET /api/http/status?code=404
```

### SSL Certificate Check
```http
GET /api/ssl/checker?domain=google.com&port=443
```

### Analyze HTTP Headers
```http
POST /api/headers/analyzer
```

**Request Body:**
```json
{
  "headers": {
    "Content-Type": "application/json",
    "X-Frame-Options": "DENY"
  },
  "url": "https://example.com"
}
```

---

## 🔍 Code Quality Tools

### Analyze Code Complexity
```http
POST /api/code/complexity
```

**Request Body:**
```json
{
  "code": "function example() { if (true) { return 1; } }",
  "language": "javascript"
}
```

### Format Java Code
```http
POST /api/code/formatter/java
```

**Request Body:**
```json
{
  "code": "public class Test{public void method(){}}",
  "style": "google"
}
```

### Detect Code Smells
```http
POST /api/code/smell/detector
```

**Request Body:**
```json
{
  "code": "your_code_here",
  "language": "java",
  "severity": "all"
}
```

---

## ⚙️ Development Utils

### Parse Cron Expression
```http
POST /api/cron/parser
```

**Request Body:**
```json
{
  "expression": "0 9 * * 1-5",
  "timezone": "UTC"
}
```

### Validate Environment Variables
```http
POST /api/env/validator
```

**Request Body:**
```json
{
  "variables": {
    "NODE_ENV": "production",
    "PORT": "3000"
  },
  "required": ["NODE_ENV", "PORT"],
  "optional": ["DEBUG"]
}
```

### Parse Logs
```http
POST /api/log/parser
```

**Request Body:**
```json
{
  "logs": "2024-01-01 10:00:00 INFO Application started\n2024-01-01 10:01:00 ERROR Connection failed",
  "format": "auto",
  "level": "all"
}
```

---

## 🎯 Game Development

### Generate Plugin Template
```http
POST /api/mc/plugin/template
```

**Request Body:**
```json
{
  "pluginName": "MyPlugin",
  "author": "Developer",
  "version": "1.0.0",
  "minecraftVersion": "1.20",
  "features": ["commands", "listeners"]
}
```

### Generate Command Code
```http
POST /api/mc/command/generator
```

**Request Body:**
```json
{
  "commandName": "heal",
  "permission": "myplugin.heal",
  "description": "Heal the player",
  "aliases": ["h"]
}
```

### Create Hologram
```http
POST /api/mc/hologram/creator
```

**Request Body:**
```json
{
  "text": ["Welcome to", "My Server!"],
  "location": {"x": 0, "y": 100, "z": 0},
  "touchable": false,
  "followPlayer": false
}
```

---

## 📈 Analytics & Monitoring

### Performance Benchmark
```http
POST /api/performance/benchmark
```

**Request Body:**
```json
{
  "testType": "cpu",
  "duration": 5,
  "threads": 4,
  "iterations": 1000
}
```

### Analyze Memory Leaks
```http
POST /api/memory/leak/detector
```

**Request Body:**
```json
{
  "heapSnapshots": [
    {"timestamp": "2024-01-01T10:00:00Z", "heapUsed": 100000000},
    {"timestamp": "2024-01-01T10:05:00Z", "heapUsed": 120000000}
  ],
  "threshold": 10,
  "timeWindow": 60
}
```

### Monitor CPU Usage
```http
GET /api/cpu/usage/monitor?interval=1&duration=60&includeProcesses=true
```

### Calculate Throughput
```http
GET /api/throughput/calculator?requests=1000&timeWindow=60&unit=seconds&targetThroughput=20
```

---

## 🚀 Deployment

ShrekAPI is ready to deploy on various platforms:

### Deploy to Render
1. Connect your GitHub repository to Render
2. Use the included `render.yaml` configuration
3. Deploy automatically

### Deploy to Railway
1. Connect your GitHub repository to Railway
2. Railway will detect the `railway.json` configuration
3. Deploy with one click

### Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

### Deploy to Heroku
1. Install Heroku CLI
2. Create app: `heroku create your-app-name`
3. Deploy: `git push heroku main`

### Docker Deployment
```bash
# Build image
docker build -t shrekapi .

# Run container
docker run -p 3000:3000 shrekapi
```

### Environment Variables

Set these environment variables in your deployment platform:

- `NODE_ENV=production`
- `PORT=3000` (or your preferred port)
- `RATE_LIMIT_POINTS=100`
- `RATE_LIMIT_DURATION=60`

## 📊 Rate Limiting

- **Default**: 100 requests per minute per IP address
- **Configurable**: Set `RATE_LIMIT_POINTS` and `RATE_LIMIT_DURATION` environment variables
- **Headers**: Rate limit info included in response headers

## 🔒 Security Features

- **Helmet**: Security headers enabled
- **CORS**: Configurable cross-origin requests
- **Rate Limiting**: Prevents abuse
- **Input Validation**: All inputs validated
- **Error Handling**: Secure error responses

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run linting
npm run lint
```

## 📝 API Status Codes

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (endpoint doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/shrekapi.git

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Express.js](https://expressjs.com/)
- Uses [Axios](https://axios-http.com/) for HTTP requests
- QR Code generation with [qrcode](https://www.npmjs.com/package/qrcode)
- UUID generation with [uuid](https://www.npmjs.com/package/uuid)
- And many other amazing open-source libraries

## 📞 Support

- 📧 Email: support@shrekapi.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/shrekapi/issues)
- 📖 Documentation: [API Docs](https://your-shrekapi-url.com/api/docs)
- 💬 Discord: [Join our community](https://discord.gg/shrekapi)

## 🗺️ Roadmap

- [ ] Authentication system
- [ ] Database integration
- [ ] WebSocket support
- [ ] GraphQL endpoint
- [ ] SDK libraries for popular languages
- [ ] Advanced analytics dashboard
- [ ] Plugin system for custom endpoints

---

**Made with ❤️ by the ShrekAPI team**

*ShrekAPI - Because every developer deserves powerful tools!* 🚀
