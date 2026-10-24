import type { NextFunction, Request, Response } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

export type AuthedRequest = Request & {
  user?: {
    sub: string;
    email?: string;
    username?: string;
  };
};

let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getVerifier() {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;
  if (!userPoolId || !clientId) {
    return null;
  }
  if (!verifier) {
    verifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: 'id',
      clientId,
    });
  }
  return verifier;
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  const v = getVerifier();

  if (!v) {
    // Local fallback when Cognito is not configured yet
    if (process.env.ALLOW_DEV_AUTH === 'true' && token === 'dev') {
      req.user = { sub: 'dev-user', email: 'dev@example.com', username: 'dev' };
      next();
      return;
    }
    res.status(503).json({ error: 'Auth not configured' });
    return;
  }

  try {
    const payload = await v.verify(token);
    req.user = {
      sub: String(payload.sub),
      email: typeof payload.email === 'string' ? payload.email : undefined,
      username: typeof payload['cognito:username'] === 'string' ? payload['cognito:username'] : undefined,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
