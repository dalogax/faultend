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
const passport = require('./auth/passport');
const { authRequired, requireServerAccess, requireOwner } = require('./auth/middleware');


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

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Faultend',
    version: '0.1.0',
    subdomain: req.subdomain,
    routeType: req.routeType,
    serverId: req.serverId || null,
    timestamp: new Date().toISOString()
  });
});

const staticMiddleware = express.static(path.join(__dirname, '../public'), { maxAge: 3600000 });

app.use((req, res, next) => {
  const { routeType } = req;
  
  if (routeType === 'landing') {
    if (req.path.startsWith('/css/') || req.path.startsWith('/js/') || req.path.startsWith('/fonts/') || req.path.startsWith('/img/') || req.path === '/img/faultend.svg' || req.path === '/site.webmanifest') {
      return staticMiddleware(req, res, next);
    }
    if (req.path === '/' || req.path === '/index.html') {
      return res.sendFile(path.join(__dirname, '../public/landing.html'));
    }
    return res.status(404).json({
      error: 'Not Found',
      message: 'Landing page only. Use app.* for UI or [server].* for fault servers.',
      availableRoutes: ['/health']
    });
  }
  
  if (routeType === 'app') {
    if (req.path.startsWith('/css/') || req.path.startsWith('/js/') || req.path.startsWith('/fonts/') || req.path.startsWith('/img/') || req.path === '/img/faultend.svg' || req.path === '/site.webmanifest') {
      return staticMiddleware(req, res, next);
    }
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
