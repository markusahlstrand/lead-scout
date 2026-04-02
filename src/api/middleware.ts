import { Context, Next } from 'hono';
import { Bindings, Variables } from './index';

const authMiddleware = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next
) => {
  const authHeader = c.req.header('Authorization');
  const tenantId = c.req.header('X-Tenant-Id');
  const origin = c.req.header('Origin');
  const referer = c.req.header('Referer');

  let isAuthenticated = false;
  let extractedTenantId = tenantId || '';

  // Check for Bearer token authentication
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const apiKey = c.env.API_KEY;

    if (token === apiKey) {
      isAuthenticated = true;
      // For API key auth, tenant ID must be provided in header
      if (!extractedTenantId) {
        return c.json({ error: 'X-Tenant-Id header required' }, 400);
      }
    }
  }

  // Check for same-origin requests (UI requests with valid session/cookie)
  const requestOrigin = origin || (referer ? new URL(referer).origin : undefined);
  if (!isAuthenticated && requestOrigin) {
    // In a real app, you'd check for a valid session cookie here
    // For now, we allow same-origin requests if they have a tenant ID
    const currentHost = c.req.header('Host');
    const isSameOrigin = currentHost ? requestOrigin.includes(currentHost) : false;

    if (isSameOrigin && extractedTenantId) {
      isAuthenticated = true;
    }
  }

  // Allow unauthenticated access to health check
  if (c.req.path === '/health') {
    return next();
  }

  if (!isAuthenticated) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Set tenant ID in context
  c.set('tenantId', extractedTenantId);

  await next();
};

export { authMiddleware };
