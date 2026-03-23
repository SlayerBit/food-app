import cors from 'cors';
import express from 'express';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { fail, ok } from './utils/apiResponse';
import { requestIdMiddleware } from './middleware/requestIdMiddleware';
import { requestLoggerMiddleware } from './middleware/requestLoggerMiddleware';
import { rateLimitMiddleware } from './middleware/rateLimitMiddleware';
import { prisma } from './config/prisma';
import { metricsService } from './services/metricsService';
import { cacheService } from './services/cacheService';
import { jobQueueService } from './services/jobQueueService';
import { env } from './config/env';

/* ===================== PROMETHEUS SETUP (PRODUCTION) ===================== */
import client from 'prom-client';

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

const httpRequestCount = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

const httpErrors = new client.Counter({
  name: 'http_errors_total',
  help: 'Total HTTP 5xx errors',
  registers: [register],
});

const activeRequests = new client.Gauge({
  name: 'http_active_requests',
  help: 'Number of active requests',
  registers: [register],
});
/* ======================================================================== */

const app = express();

if (env.trustProxy) {
  app.set('trust proxy', 1);
}

app.use(
  cors({
    origin: env.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);
app.use(rateLimitMiddleware);
app.use(express.json({ limit: env.jsonBodyLimit }));

/* ===================== PROMETHEUS MIDDLEWARE ===================== */
app.use((req, res, next) => {
  if (req.path === '/metrics') return next();

  activeRequests.inc();

  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const duration = diff[0] + diff[1] / 1e9;

    let route = req.route?.path;

    if (!route) {
      if (req.baseUrl) {
        route = req.baseUrl;
      } else {
        route = 'unknown';
      }
    }

    httpRequestDuration.labels(req.method, route, res.statusCode.toString()).observe(duration);

    httpRequestCount.labels(req.method, route, res.statusCode.toString()).inc();

    if (res.statusCode >= 500) {
      httpErrors.inc();
    }

    activeRequests.dec();
  });

  next();
});
/* ================================================================ */

app.get('/health', (req, res) => {
  const requestId = req.headers['x-request-id'] as string | undefined;
  res.status(200).json(ok({ status: 'ok' }, requestId));
});

app.get('/ready', async (req, res) => {
  const requestId = req.headers['x-request-id'] as string | undefined;
  const checks: Record<string, 'up' | 'down'> = {
    database: 'down',
    cache: 'down',
    queue: 'down',
  };
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'up';
  } catch {
    checks.database = 'down';
  }
  try {
    checks.cache = cacheService.ping() ? 'up' : 'down';
  } catch {
    checks.cache = 'down';
  }
  try {
    const qh = jobQueueService.health();
    checks.queue = qh.ok ? 'up' : 'down';
  } catch {
    checks.queue = 'down';
  }

  const dbOk = checks.database === 'up';
  if (!dbOk) {
    res.status(503).json(fail('Database unavailable', 'NOT_READY', requestId, checks));
    return;
  }
  res.status(200).json(
    ok(
      {
        status: 'ready',
        checks,
      },
      requestId
    )
  );
});

/* ===================== PROMETHEUS METRICS ENDPOINT ===================== */
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
/* ====================================================================== */

app.use('/api', routes);

app.use((req, res) =>
  res
    .status(404)
    .json(fail('Route not found', 'NOT_FOUND', req.headers['x-request-id'] as string | undefined))
);

app.use(errorHandler);

export default app;
