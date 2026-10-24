import cors from 'cors';
import express from 'express';
import { publicItems } from './data/items';
import { getDb } from './db';
import { requireAuth, type AuthedRequest } from './middleware/auth';
import { requireOriginSecret } from './middleware/origin';

export function createApp() {
  const app = express();

  app.use(express.json());

  // Behind CloudFront same-origin; CORS mainly for local Angular → API
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()).filter(Boolean) ?? true,
      credentials: true,
    }),
  );

  app.use(requireOriginSecret);

  app.get('/api/health', (_req, res) => {
    const db = getDb();
    res.json({
      ok: true,
      service: 'api',
      db: db.enabled ? 'configured' : 'in-memory',
    });
  });

  app.get('/api/public/items', (_req, res) => {
    res.json({ items: publicItems });
  });

  app.get('/api/me', requireAuth, (req: AuthedRequest, res) => {
    res.json({
      user: req.user,
      message: `Hello, ${req.user?.email ?? req.user?.username ?? req.user?.sub}`,
    });
  });

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
}
