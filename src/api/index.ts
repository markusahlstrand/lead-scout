import { Hono } from 'hono';
import { authMiddleware } from './middleware';
import threadsRouter from './routes/threads';
import companiesRouter from './routes/companies';
import leadsRouter from './routes/leads';
import responsesRouter from './routes/responses';
import knowledgeRouter from './routes/knowledge';
import scansRouter from './routes/scans';
import sourcesRouter from './routes/sources';
import statsRouter from './routes/stats';
import mediaAssetsRouter from './routes/media-assets';
import mediaMetricsRouter from './routes/media-metrics';
import engagementEventsRouter from './routes/engagement-events';

export type Bindings = {
  DB: D1Database;
  AI: Ai;
  API_KEY: string;
};

export type Variables = {
  tenantId: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply auth middleware to all routes
app.use('*', authMiddleware);

// Mount route groups under /api prefix
app.route('/threads', threadsRouter);
app.route('/companies', companiesRouter);
app.route('/leads', leadsRouter);
app.route('/responses', responsesRouter);
app.route('/knowledge', knowledgeRouter);
app.route('/scans', scansRouter);
app.route('/sources', sourcesRouter);
app.route('/stats', statsRouter);
app.route('/media-assets', mediaAssetsRouter);
app.route('/media-metrics', mediaMetricsRouter);
app.route('/engagement-events', engagementEventsRouter);

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

export default app;
