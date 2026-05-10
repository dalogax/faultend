# Phase 1: Project Setup and Core Infrastructure

## Objective
Set up a single Node.js project structure with backend and frontend in the same repository. Initialize package.json, configure basic directory structure for server code and static frontend files. Use vanilla JavaScript with no compilation step required.

## Tasks

### 1.1 Initialize Node.js Project
- Run `npm init -y` to create package.json
- Set project name to "Faultend"
- Set description: "Lightweight proxy tool for testing application resilience"
- Set main entry point to "src/index.js"
- Set version to "0.1.0"

### 1.2 Install Core Dependencies
```bash
npm install express http-proxy-middleware
```

**Dependencies:**
- `express`: Web framework for backend server and serving static files
- `http-proxy-middleware`: For proxying HTTP requests to real backend

**Dev Dependencies (optional):**
- `nodemon`: For auto-restarting during development
```bash
npm install --save-dev nodemon
```

### 1.3 Create Directory Structure
```
Faultend/
├── package.json
├── README.md
├── plan.md
├── src/
│   ├── index.js              # Main entry point
│   ├── server.js             # Express server setup
│   ├── proxy/                # Proxy logic
│   │   └── proxyHandler.js
│   ├── traffic/              # Traffic logging
│   │   └── trafficLogger.js
│   ├── rules/                # Mock rules engine
│   │   ├── rulesEngine.js
│   │   └── rulesManager.js
│   ├── api/                  # API routes
│   │   └── routes.js
│   └── storage/              # Data persistence
│       └── storage.js
├── public/                   # Static frontend files
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── app.js
└── data/                     # Runtime data storage
    ├── traffic.json
    └── rules.json
```

### 1.4 Create Basic Entry Point (src/index.js)
```javascript
const server = require('./server');

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Faultend proxy running on http://localhost:${PORT}`);
  console.log(`UI available at http://localhost:${PORT}`);
});
```

### 1.5 Create Basic Express Server (src/server.js)
```javascript
const express = require('express');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Faultend' });
});

module.exports = app;
```

### 1.6 Create Basic HTML Template (public/index.html)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Faultend - Resilience Testing Proxy</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <header>
    <h1>Faultend</h1>
    <p>Lightweight proxy for testing application resilience</p>
  </header>
  
  <main id="app">
    <p>Loading...</p>
  </main>
  
  <script src="/js/app.js"></script>
</body>
</html>
```

### 1.7 Create Basic CSS (public/css/styles.css)
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f5f5f5;
  color: #333;
}

header {
  background-color: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

header h1 {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

header p {
  font-size: 0.9rem;
  opacity: 0.8;
}

main {
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 2rem;
}
```

### 1.8 Create Basic Frontend JS (public/js/app.js)
```javascript
// Simple startup message
document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  app.innerHTML = '<p>Faultend is ready. Waiting for implementation...</p>';
});
```

### 1.9 Update package.json Scripts
Add the following scripts to package.json:
```json
"scripts": {
  "start": "node src/index.js",
  "dev": "nodemon src/index.js",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

### 1.10 Create .gitignore
```
node_modules/
data/traffic.json
data/rules.json
*.log
.env
.DS_Store
```

## Validation Steps

1. **Verify Project Structure:**
   - All directories created as specified
   - All placeholder files exist

2. **Install and Run:**
   ```bash
   npm install
   npm run dev
   ```

3. **Test Endpoints:**
   - Visit `http://localhost:3000` - should show basic UI
   - Visit `http://localhost:3000/health` - should return JSON: `{"status":"ok","service":"Faultend"}`

4. **Verify Development Workflow:**
   - Server should auto-restart on file changes (with nodemon)
   - No compilation errors
   - Clean console output

## Success Criteria

- [x] Node.js project initialized with package.json
- [x] Directory structure created
- [x] Core dependencies installed
- [x] Basic Express server running
- [x] Static frontend served correctly
- [x] Health check endpoint working
- [x] Development scripts configured
- [x] .gitignore in place

## Next Phase Preview
Phase 2 will build the core HTTP proxy functionality on top of this foundation, using the http-proxy-middleware to intercept and forward REST + JSON requests.
