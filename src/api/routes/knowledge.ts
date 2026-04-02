import { Hono } from 'hono';
import { ulid } from 'ulid';
import { eq, and, like, desc, sql } from 'drizzle-orm';
import { Bindings, Variables } from '../index';
import { knowledge } from '../../db/schema';
import { createDb } from '../../db';

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// POST / - Create knowledge entry
router.post('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();
    const { title, content, category, tags, metadata } = body;

    if (!title || !content) {
      return c.json({ error: 'title and content required' }, 400);
    }

    const db = createDb(c.env.DB);

    const knowledgeId = ulid();
    const now = new Date().toISOString();

    await db.insert(knowledge).values({
      id: knowledgeId,
      tenantId,
      title,
      content,
      category: category || 'product',
      tags: tags ? JSON.stringify(tags) : null,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    });

    return c.json(
      {
        id: knowledgeId,
        tenantId,
        title,
        content,
        category,
        tags,
        createdAt: now,
      },
      201
    );
  } catch (error) {
    console.error('Error creating knowledge entry:', error);
    return c.json({ error: 'Failed to create knowledge entry' }, 500);
  }
});

// GET / - Search knowledge base
router.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const category = c.req.query('category');
    const tags = c.req.query('tags');
    const search = c.req.query('search');
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
    const offset = parseInt(c.req.query('offset') || '0');

    const db = createDb(c.env.DB);

    const conditions = [eq(knowledge.tenantId, tenantId)];

    if (category) {
      conditions.push(eq(knowledge.category, category));
    }

    if (search) {
      conditions.push(
        sql`${knowledge.title} LIKE ${`%${search}%`} OR ${knowledge.content} LIKE ${`%${search}%`}`
      );
    }

    // Note: Tag filtering would require JSON parsing in the database
    // For now, we search by title and content
    if (tags) {
      // Tags are stored as JSON, so we can use LIKE for simple matching
      const tagString = Array.isArray(tags) ? tags.join('|') : tags;
      conditions.push(sql`${knowledge.tags} LIKE ${`%${tagString}%`}`);
    }

    const result = await db
      .select()
      .from(knowledge)
      .where(and(...conditions))
      .orderBy(desc(knowledge.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(knowledge)
      .where(and(...conditions));

    const total = countResult[0]?.count || 0;

    return c.json({
      data: result.map((item) => ({
        ...item,
        tags: item.tags ? JSON.parse(item.tags) : [],
        metadata: item.metadata ? JSON.parse(item.metadata) : null,
      })),
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error searching knowledge:', error);
    return c.json({ error: 'Failed to search knowledge' }, 500);
  }
});

// PUT /:id - Update knowledge entry
router.put('/:id', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');
    const body = await c.req.json();
    const { title, content, category, tags, metadata } = body;

    const db = createDb(c.env.DB);

    const existing = await db
      .select()
      .from(knowledge)
      .where(and(eq(knowledge.id, id), eq(knowledge.tenantId, tenantId)))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: 'Knowledge entry not found' }, 404);
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);

    await db.update(knowledge).set(updateData).where(eq(knowledge.id, id));

    const updated = await db
      .select()
      .from(knowledge)
      .where(eq(knowledge.id, id))
      .limit(1);

    const item = updated[0];
    return c.json({
      ...item,
      tags: item.tags ? JSON.parse(item.tags) : [],
      metadata: item.metadata ? JSON.parse(item.metadata) : null,
    });
  } catch (error) {
    console.error('Error updating knowledge entry:', error);
    return c.json({ error: 'Failed to update knowledge entry' }, 500);
  }
});

// DELETE /:id - Delete knowledge entry
router.delete('/:id', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');

    const db = createDb(c.env.DB);

    const existing = await db
      .select()
      .from(knowledge)
      .where(and(eq(knowledge.id, id), eq(knowledge.tenantId, tenantId)))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: 'Knowledge entry not found' }, 404);
    }

    await db.delete(knowledge).where(eq(knowledge.id, id));

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge entry:', error);
    return c.json({ error: 'Failed to delete knowledge entry' }, 500);
  }
});

export default router;
