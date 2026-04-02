import { Hono } from 'hono';
import { ulid } from 'ulid';
import { eq, and, like, desc, sql } from 'drizzle-orm';
import { Bindings, Variables } from '../index';
import { threads, companies, leads, responses as responsesTable } from '../../db/schema';
import { createDb } from '../../db';

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// POST / - Create thread with dedup check
router.post('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();
    const { url, platform, source_id, title, content, metadata } = body;

    if (!url || !platform || !source_id) {
      return c.json({ error: 'url, platform, and source_id required' }, 400);
    }

    const db = createDb(c.env.DB);

    // Check for existing thread with same tenant_id, url
    const existing = await db
      .select()
      .from(threads)
      .where(and(eq(threads.tenantId, tenantId), eq(threads.url, url)))
      .limit(1);

    if (existing.length > 0) {
      return c.json(
        { error: 'Thread already exists for this URL', id: existing[0].id },
        409
      );
    }

    const threadId = ulid();
    const now = new Date().toISOString();

    const result = await db.insert(threads).values({
      id: threadId,
      tenantId,
      url,
      platform,
      sourceId: source_id,
      title: title || null,
      bodySnippet: content || null,
      status: 'new',
      relevanceScore: 0.5,
      discoveredAt: new Date(now),
      createdAt: new Date(now),
    });

    return c.json(
      {
        id: threadId,
        tenantId,
        url,
        platform,
        sourceId: source_id,
        title,
        status: 'new',
        relevanceScore: 0.5,
        createdAt: now,
      },
      201
    );
  } catch (error) {
    console.error('Error creating thread:', error);
    return c.json({ error: 'Failed to create thread' }, 500);
  }
});

// GET / - List threads with filters and pagination
router.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const status = c.req.query('status');
    const platform = c.req.query('platform');
    const source_id = c.req.query('source_id');
    const dateFrom = c.req.query('date_from');
    const dateTo = c.req.query('date_to');
    const search = c.req.query('search');
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
    const offset = parseInt(c.req.query('offset') || '0');

    const db = createDb(c.env.DB);

    // Build where conditions
    const conditions = [eq(threads.tenantId, tenantId)];

    if (status) {
      conditions.push(eq(threads.status, status));
    }
    if (platform) {
      conditions.push(eq(threads.platform, platform));
    }
    if (source_id) {
      conditions.push(eq(threads.sourceId, source_id));
    }
    if (dateFrom) {
      conditions.push(sql`${threads.createdAt} >= ${dateFrom}`);
    }
    if (dateTo) {
      conditions.push(sql`${threads.createdAt} <= ${dateTo}`);
    }
    if (search) {
      conditions.push(
        sql`${threads.title} LIKE ${`%${search}%`} OR ${threads.bodySnippet} LIKE ${`%${search}%`}`
      );
    }

    const result = await db
      .select()
      .from(threads)
      .where(and(...conditions))
      .orderBy(desc(threads.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threads)
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
    console.error('Error listing threads:', error);
    return c.json({ error: 'Failed to list threads' }, 500);
  }
});

// GET /:id - Get single thread with related data
router.get('/:id', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');

    const db = createDb(c.env.DB);

    const thread = await db
      .select()
      .from(threads)
      .where(and(eq(threads.id, id), eq(threads.tenantId, tenantId)))
      .limit(1);

    if (thread.length === 0) {
      return c.json({ error: 'Thread not found' }, 404);
    }

    const threadData = thread[0];

    // Fetch related companies
    const relatedCompanies = await db
      .select()
      .from(companies)
      .where(eq(companies.sourceThreadId, id));

    // Fetch related responses
    const relatedResponses = await db
      .select()
      .from(responsesTable)
      .where(eq(responsesTable.threadId, id))
      .orderBy(desc(responsesTable.createdAt));

    return c.json({
      ...threadData,
      companies: relatedCompanies,
      responses: relatedResponses,
    });
  } catch (error) {
    console.error('Error getting thread:', error);
    return c.json({ error: 'Failed to get thread' }, 500);
  }
});

// PATCH /:id - Update thread
router.patch('/:id', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');
    const body = await c.req.json();
    const { status, notes, relevance } = body;

    const db = createDb(c.env.DB);

    // Check thread exists
    const existing = await db
      .select()
      .from(threads)
      .where(and(eq(threads.id, id), eq(threads.tenantId, tenantId)))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: 'Thread not found' }, 404);
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (status !== undefined) {
      updateData.status = status;
    }
    if (relevance !== undefined) {
      updateData.relevanceScore = relevance;
    }

    await db.update(threads).set(updateData).where(eq(threads.id, id));

    const updated = await db
      .select()
      .from(threads)
      .where(eq(threads.id, id))
      .limit(1);

    return c.json(updated[0]);
  } catch (error) {
    console.error('Error updating thread:', error);
    return c.json({ error: 'Failed to update thread' }, 500);
  }
});

export default router;
