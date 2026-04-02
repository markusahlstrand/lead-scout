import { Hono } from 'hono';
import { ulid } from 'ulid';
import { eq, and, desc, sql } from 'drizzle-orm';
import { Bindings, Variables } from '../index';
import { companies, leads } from '../../db/schema';
import { createDb } from '../../db';

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// POST / - Create company
router.post('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();
    const { name, domain, industry, size, metadata, thread_id } = body;

    if (!name) {
      return c.json({ error: 'name required' }, 400);
    }

    const db = createDb(c.env.DB);

    const companyId = ulid();
    const now = new Date().toISOString();

    await db.insert(companies).values({
      id: companyId,
      tenantId,
      name,
      domain: domain || null,
      industry: industry || null,
      sizeEstimate: size || null,
      status: 'new',
      sourceThreadId: thread_id || null,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    });

    return c.json(
      {
        id: companyId,
        tenantId,
        name,
        domain,
        industry,
        sizeEstimate: size,
        status: 'new',
        sourceThreadId: thread_id,
        createdAt: now,
      },
      201
    );
  } catch (error) {
    console.error('Error creating company:', error);
    return c.json({ error: 'Failed to create company' }, 500);
  }
});

// GET / - List companies with filters and pagination
router.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const status = c.req.query('status');
    const industry = c.req.query('industry');
    const size = c.req.query('size');
    const search = c.req.query('search');
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
    const offset = parseInt(c.req.query('offset') || '0');

    const db = createDb(c.env.DB);

    const conditions = [eq(companies.tenantId, tenantId)];

    if (status) {
      conditions.push(eq(companies.status, status as any));
    }
    if (industry) {
      conditions.push(eq(companies.industry, industry as any));
    }
    if (size) {
      conditions.push(eq(companies.sizeEstimate, size as any));
    }
    if (search) {
      conditions.push(
        sql`${companies.name} LIKE ${`%${search}%`} OR ${companies.domain} LIKE ${`%${search}%`}`
      );
    }

    const result = await db
      .select()
      .from(companies)
      .where(and(...conditions))
      .orderBy(desc(companies.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(companies)
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
    console.error('Error listing companies:', error);
    return c.json({ error: 'Failed to list companies' }, 500);
  }
});

// GET /:id - Get single company with related leads
router.get('/:id', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');

    const db = createDb(c.env.DB);

    const company = await db
      .select()
      .from(companies)
      .where(and(eq(companies.id, id), eq(companies.tenantId, tenantId)))
      .limit(1);

    if (company.length === 0) {
      return c.json({ error: 'Company not found' }, 404);
    }

    const relatedLeads = await db
      .select()
      .from(leads)
      .where(eq(leads.companyId, id))
      .orderBy(desc(leads.createdAt));

    return c.json({
      ...company[0],
      leads: relatedLeads,
    });
  } catch (error) {
    console.error('Error getting company:', error);
    return c.json({ error: 'Failed to get company' }, 500);
  }
});

// PATCH /:id - Update company
router.patch('/:id', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');
    const body = await c.req.json();
    const { name, domain, industry, size, status, metadata } = body;

    const db = createDb(c.env.DB);

    const existing = await db
      .select()
      .from(companies)
      .where(and(eq(companies.id, id), eq(companies.tenantId, tenantId)))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: 'Company not found' }, 404);
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (domain !== undefined) updateData.domain = domain;
    if (industry !== undefined) updateData.industry = industry;
    if (size !== undefined) updateData.sizeEstimate = size;
    if (status !== undefined) updateData.status = status;

    await db.update(companies).set(updateData).where(eq(companies.id, id));

    const updated = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id))
      .limit(1);

    return c.json(updated[0]);
  } catch (error) {
    console.error('Error updating company:', error);
    return c.json({ error: 'Failed to update company' }, 500);
  }
});

export default router;
