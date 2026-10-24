import type { NextFunction, Request, Response } from 'express';

/**
 * Validates the CloudFront → origin custom header.
 * In local dev, ORIGIN_VERIFY_SECRET defaults to a known value (or is skipped if unset).
 */
export function requireOriginSecret(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.ORIGIN_VERIFY_SECRET;
  if (!expected) {
    next();
    return;
  }

  const provided = req.header('x-origin-verify');
  if (provided !== expected) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  next();
}
