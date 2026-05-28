const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const pool = require('./db/pool');
const subdomainRouter = require('./middleware/subdomainRouter');
const proxyRouter = require('./proxy/router');
const trafficRouter = require('./api/traffic');
const rulesRouter = require('./api/rules');
const serversRouter = require('./api/servers');
const authRouter = require('./auth/routes');
const collaboratorsRouter = require('./api/collaborators');
const inviteRouter = require('./api/invite');
const meRouter = require('./api/me');
const passport = require('./auth/passport');
const { authRequired, requireServerAccess, requireOwner } = require('./auth/middleware');
const metrics = require('./observability/metrics');
const { version } = require('../package.json');


const app = express();

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'localhost';

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true);
}

app.use(cors({
  origin: [
    `http://${ROOT_DOMAIN}`,
    `https://${ROOT_DOMAIN}`,
    `http://app.${ROOT_DOMAIN}`,
    `https://app.${ROOT_DOMAIN}`
  ],
  credentials: true
}));

app.use(subdomainRouter);

app.use(session({
  store: new PgSession({ pool }),
  secret: process.env.SESSION_SECRET || 'change-me-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    domain: ROOT_DOMAIN === 'localhost' ? undefined : `.${ROOT_DOMAIN}`,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  },
  name: 'faultend.sid'
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/health', async (req, res) => {
  let dbStatus = 'ok';
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
  } catch {
    dbStatus = 'error';
  }

  res.json({
    status: dbStatus === 'ok' ? 'ok' : 'degraded',
    db: dbStatus,
    uptime_seconds: Math.floor(process.uptime()),
    version,
    service: 'Faultend',
    timestamp: new Date().toISOString()
  });
});

app.get('/metrics', async (req, res) => {
  const token = process.env.METRICS_TOKEN;
  if (token) {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${token}`) {
      res.set('WWW-Authenticate', 'Bearer');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  if (!metrics.isEnabled()) {
    return res.status(404).json({ error: 'Metrics not enabled. Set METRICS_ENABLED=true.' });
  }

  const data = await metrics.getMetrics();
  res.set('Content-Type', metrics.getContentType());
  res.end(data);
});

const staticMiddleware = express.static(path.join(__dirname, '../public'), { maxAge: 3600000 });

// Legal pages — served from both landing and app subdomains
const LEGAL_PAGES = { '/privacy': 'privacy.html', '/terms': 'terms.html', '/dpa': 'dpa.html' };
// Static asset path prefixes shared across all page types
const STATIC_PREFIXES = ['/css/', '/js/', '/fonts/', '/vendor/', '/img/', '/.well-known/'];

app.use((req, res, next) => {
  const { routeType } = req;

  // Static assets and legal pages are available on every subdomain type
  if (STATIC_PREFIXES.some(p => req.path.startsWith(p)) || req.path === '/site.webmanifest') {
    return staticMiddleware(req, res, next);
  }

  // Legal pages: /privacy, /terms, /dpa (no trailing slash)
  const legalFile = LEGAL_PAGES[req.path];
  if (legalFile) {
    return res.sendFile(path.join(__dirname, '../public', legalFile));
  }

  if (routeType === 'landing') {
    if (req.path === '/' || req.path === '/index.html') {
      return res.sendFile(path.join(__dirname, '../public/landing.html'));
    }
    return res.status(404).json({
      error: 'Not Found',
      message: 'Landing page only. Use app.* for UI or [server].* for fault servers.',
      availableRoutes: ['/health', '/privacy', '/terms', '/dpa']
    });
  }

  if (routeType === 'app') {
    if (req.path === '/' || req.path === '/index.html' || req.path === '/app.html') {
      return res.sendFile(path.join(__dirname, '../public/app.html'));
    }
    return next();
  }

  if (routeType === 'fault-server') {
    return next();
  }

  res.status(500).json({ error: 'Unknown route type' });
});

app.use('/api/auth', authRouter);

app.use(authRequired);

app.use('/api', (req, res, next) => {
  if (req.routeType === 'app') {
    return serversRouter(req, res, next);
  }
  next();
});

app.use('/api/servers/:serverId/traffic', (req, res, next) => {
  if (req.routeType !== 'app') {
    return next();
  }
  requireServerAccess(req, res, (err) => {
    if (err) return next(err);
    trafficRouter(req, res, next);
  });
});

app.use('/api/servers/:serverId/rules', (req, res, next) => {
  if (req.routeType !== 'app') {
    return next();
  }
  requireServerAccess(req, res, (err) => {
    if (err) return next(err);
    rulesRouter(req, res, next);
  });
});

app.use('/api/servers/:serverId/invite', (req, res, next) => {
  if (req.routeType !== 'app') {
    return next();
  }
  requireServerAccess(req, res, (err) => {
    if (err) return next(err);
    collaboratorsRouter(req, res, next);
  });
});

app.use('/api/invite', (req, res, next) => {
  if (req.routeType !== 'app') {
    return next();
  }
  inviteRouter(req, res, next);
});

app.use('/api/me', (req, res, next) => {
  if (req.routeType !== 'app') {
    return next();
  }
  meRouter(req, res, next);
});

app.use((req, res, next) => {
  if (req.routeType === 'fault-server') {
    return proxyRouter(req, res, next);
  }
  next();
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Route not found',
    subdomain: req.subdomain,
    routeType: req.routeType
  });
});

app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

module.exports = app;
