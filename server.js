const express = require('express');
const path = require('path');
const fs = require('fs');
const next = require('next');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isDev = process.env.NODE_ENV !== 'production';

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Next.js
const nextApp = next({ dev: isDev, dir: __dirname });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  // Serve static files
  const publicDir = path.join(__dirname, 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
  }

  // Serve Next.js static files
  app.use('/_next/static', express.static(path.join(__dirname, '.next/static'), { maxAge: '365d' }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes - Proxy to backend or handle directly
  app.use('/api', (req, res) => {
    // In production with Render, route to backend service
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const protocol = backendUrl.startsWith('https') ? require('https') : require('http');
    
    const url = new URL(`${backendUrl}${req.url}`);
    const proxyReq = protocol.request(url, {
      method: req.method,
      headers: {
        ...req.headers,
        'host': url.host,
      },
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('API proxy error:', err);
      res.status(502).json({ error: 'Backend service unavailable' });
    });

    if (req.body && Object.keys(req.body).length > 0) {
      proxyReq.write(JSON.stringify(req.body));
    }
    proxyReq.end();
  });

  // Next.js frontend routes
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  app.listen(PORT, () => {
    console.log(`\n✨ InventraERP Running`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🔗 API Endpoint: /api`);
    console.log(`📊 Environment: ${isDev ? 'Development' : 'Production'}`);
  });
});


