import { Hono } from 'hono';
import { ulid } from 'ulid';
import { eq, and, desc, sql } from 'drizzle-orm';
import { Bindings, Variables } from '../index';
import { sources } from '../../db/schema';
import { createDb } from '../../db';

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET / - List sources
router.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const active = c.req.query('active');
    const limit = Math.min(parseInt(c.req.query('limit') || '100'), 100);
    const offset = parseInt(c.req.query('offset') || '0');

    const db = createDb(c.env.DB);

    const conditions = [eq(sources.tenantId, tenantId)];

    if (active !== undefined) {
      conditions.push(eq(sources.isActive, active === 'true'));
    }

    const result = await db
      .select()
      .from(sources)
      .where(and(...conditions))
      .orderBy(desc(sources.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(sources)
      .where(and(...conditions));

    const total = countResult[0]?.count || 0;

    return c.json({
      data: result.map((source) => ({
        ...source,
        scanConfig: source.scanConfig ? JSON.parse(source.scanConfig) : null,
        keywords: source.keywords ? JSON.parse(source.keywords) : [],
      })),
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error listing sources:', error);
    return c.json({ error: 'Failed to list sources' }, 500);
  }
});

// POST / - Create source
router.post('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();
    const { name, type, url, config } = body;

    if (!name || !type) {
      return c.json({ error: 'name and type required' }, 400);
    }

    const db = createDb(c.env.DB);

    const sourceId = ulid();
    const now = new Date().toISOString();

    await db.insert(sources).values({
      id: sourceId,
      tenantId,
      name,
      platform: type,
      url: url || '',
      scanConfig: config ? JSON.stringify(config) : null,
      isActive: true,
      createdAt: new Date(now),
    });

    return c.json(
      {
        id: sourceId,
        tenantId,
        name,
        platform: type,
        url,
        isActive: true,
        createdAt: now,
      },
      201
    );
  } catch (error) {
    console.error('Error creating source:', error);
    return c.json({ error: 'Failed to create source' }, 500);
  }
});

// PATCH /:id - Update source
router.patch('/:id', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');
    const body = await c.req.json();
    const { name, url, config, is_active } = body;

    const db = createDb(c.env.DB);

    const existing = await db
      .select()
      .from(sources)
      .where(and(eq(sources.id, id), eq(sources.tenantId, tenantId)))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: 'Source not found' }, 404);
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (url !== undefined) updateData.url = url;
    if (config !== undefined) updateData.scanConfig = JSON.stringify(config);
    if (is_active !== undefined) updateData.isActive = is_active;

    await db.update(sources).set(updateData).where(eq(sources.id, id));

    const updated = await db
      .select()
      .from(sources)
      .where(eq(sources.id, id))
      .limit(1);

    return c.json({
      ...updated[0],
      scanConfig: updated[0].scanConfig ? JSON.parse(updated[0].scanConfig) : null,
    });
  } catch (error) {
    console.error('Error updating source:', error);
    return c.json({ error: 'Failed to update source' }, 500);
  }
});

export default router;
