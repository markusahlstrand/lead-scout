import { Hono } from 'hono';
import { ulid } from 'ulid';
import { eq, and, desc, sql } from 'drizzle-orm';
import { Bindings, Variables } from '../index';
import { scanLogs } from '../../db/schema';
import { createDb } from '../../db';

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// POST /start - Create scan log
router.post('/start', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();
    const { source_id, metadata } = body;

    if (!source_id) {
      return c.json({ error: 'source_id required' }, 400);
    }

    const db = createDb(c.env.DB);

    const scanId = ulid();
    const now = new Date();

    await db.insert(scanLogs).values({
      id: scanId,
      tenantId,
      sourceId: source_id,
      status: 'running',
      startedAt: now,
      threadsFound: 0,
      companiesFound: 0,
      leadsFound: 0,
    });

    return c.json(
      {
        id: scanId,
        tenantId,
        sourceId: source_id,
        status: 'running',
        startedAt: now.toISOString(),
      },
      201
    );
  } catch (error) {
    console.error('Error creating scan:', error);
    return c.json({ error: 'Failed to create scan' }, 500);
  }
});

// PATCH /:id/complete - Mark scan complete with stats
router.patch('/:id/complete', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');
    const body = await c.req.json();
    const { items_found, items_processed, errors, metadata } = body;

    const db = createDb(c.env.DB);

    const existing = await db
      .select()
      .from(scanLogs)
      .where(and(eq(scanLogs.id, id), eq(scanLogs.tenantId, tenantId)))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: 'Scan not found' }, 404);
    }

    const now = new Date();

    const updateData: Record<string, any> = {
      status: 'completed',
      completedAt: now,
      threadsFound: items_found || 0,
      companiesFound: items_processed || 0,
      leadsFound: errors || 0,
    };

    await db.update(scanLogs).set(updateData).where(eq(scanLogs.id, id));

    const updated = await db
      .select()
      .from(scanLogs)
      .where(eq(scanLogs.id, id))
      .limit(1);

    return c.json(updated[0]);
  } catch (error) {
    console.error('Error completing scan:', error);
    return c.json({ error: 'Failed to complete scan' }, 500);
  }
});

// GET / - List recent scans
router.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const source_id = c.req.query('source_id');
    const status = c.req.query('status');
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
    const offset = parseInt(c.req.query('offset') || '0');

    const db = createDb(c.env.DB);

    const conditions = [eq(scanLogs.tenantId, tenantId)];

    if (source_id) {
      conditions.push(eq(scanLogs.sourceId, source_id));
    }

    if (status) {
      conditions.push(eq(scanLogs.status, status));
    }

    const result = await db
      .select()
      .from(scanLogs)
      .where(and(...conditions))
      .orderBy(desc(scanLogs.startedAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(scanLogs)
      .where(and(...conditions));

    const total = countResult[0]?.count || 0;

    return c.json({
      data: result,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error listing scans:', error);
    return c.json({ error: 'Failed to list scans' }, 500);
  }
});

export default router;
