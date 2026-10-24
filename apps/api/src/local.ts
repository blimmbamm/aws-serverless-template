import { createApp } from './app';

const port = Number(process.env.PORT ?? 3000);

// Skip origin secret locally (middleware no-ops when unset). Set
// ORIGIN_VERIFY_SECRET=dev-origin-secret to mirror CloudFront behavior.
process.env.ALLOW_DEV_AUTH ??= 'true';
process.env.CORS_ORIGIN ??= 'http://localhost:4200';

const app = createApp();

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
  console.log('Dev auth: Authorization: Bearer dev (when Cognito env is unset)');
});
