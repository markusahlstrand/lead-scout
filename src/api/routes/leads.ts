import { Hono } from 'hono';
import { ulid } from 'ulid';
import { eq, and, like, desc, sql } from 'drizzle-orm';
import { Bindings, Variables } from '../index';
import { leads } from '../../db/schema';
import { createDb } from '../../db';

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// POST / - Create lead
router.post('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();
    const {
      name,
      email,
      role,
      company_id,
      thread_id,
      metadata,
      leadType,
      signal,
      signalStrength,
      sourceUrl,
    } = body;

    if (!name || !email) {
      return c.json({ error: 'name and email required' }, 400);
    }

    const db = createDb(c.env.DB);

    const leadId = ulid();
    const now = new Date();

    await db.insert(leads).values({
      id: leadId,
      tenantId,
      name,
      email,
      role: role || null,
      companyId: company_id || null,
      platform: null,
      profileUrl: null,
      status: 'new',
      leadType: leadType || 'prospect',
      signal: signal || null,
      signalStrength: signalStrength || 'warm',
      sourceUrl: sourceUrl || null,
      createdAt: now,
      updatedAt: now,
    });

    return c.json(
      {
        id: leadId,
        tenantId,
        name,
        email,
        role,
        companyId: company_id,
        status: 'new',
        leadType: leadType || 'prospect',
        signal,
        signalStrength: signalStrength || 'warm',
        sourceUrl,
        createdAt: now.toISOString(),
      },
      201
    );
  } catch (error) {
    console.error('Error creating lead:', error);
    return c.json({ error: 'Failed to create lead' }, 500);
  }
});

// GET / - List leads with filters and pagination
router.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const status = c.req.query('status');
    const company_id = c.req.query('company_id');
    const thread_id = c.req.query('thread_id');
    const search = c.req.query('search');
    const leadType = c.req.query('leadType');
    const signalStrength = c.req.query('signalStrength');
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
    const offset = parseInt(c.req.query('offset') || '0');

    const db = createDb(c.env.DB);

    const conditions = [eq(leads.tenantId, tenantId)];

    if (status) {
      conditions.push(eq(leads.status, status));
    }
    if (company_id) {
      conditions.push(eq(leads.companyId, company_id));
    }
    if (leadType) {
      conditions.push(eq(leads.leadType, leadType));
    }
    if (signalStrength) {
      conditions.push(eq(leads.signalStrength, signalStrength));
    }
    if (search) {
      conditions.push(
        sql`${leads.name} LIKE ${`%${search}%`} OR ${leads.email} LIKE ${`%${search}%`}`
      );
    }

    const result = await db
      .select()
      .from(leads)
      .where(and(...conditions))
      .orderBy(desc(leads.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(leads)
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
    console.error('Error listing leads:', error);
    return c.json({ error: 'Failed to list leads' }, 500);
  }
});

// GET /:id - Get single lead
router.get('/:id', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');

    const db = createDb(c.env.DB);

    const lead = await db
      .select()
      .from(leads)
      .where(and(eq(leads.id, id), eq(leads.tenantId, tenantId)))
      .limit(1);

    if (lead.length === 0) {
      return c.json({ error: 'Lead not found' }, 404);
    }

    return c.json(lead[0]);
  } catch (error) {
    console.error('Error getting lead:', error);
    return c.json({ error: 'Failed to get lead' }, 500);
  }
});

// PATCH /:id - Update lead
router.patch('/:id', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');
    const body = await c.req.json();
    const { name, email, role, company_id, status, metadata } = body;

    const db = createDb(c.env.DB);

    const existing = await db
      .select()
      .from(leads)
      .where(and(eq(leads.id, id), eq(leads.tenantId, tenantId)))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: 'Lead not found' }, 404);
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (company_id !== undefined) updateData.companyId = company_id;
    if (status !== undefined) updateData.status = status;

    await db.update(leads).set(updateData).where(eq(leads.id, id));

    const updated = await db
      .select()
      .from(leads)
      .where(eq(leads.id, id))
      .limit(1);

    return c.json(updated[0]);
  } catch (error) {
    console.error('Error updating lead:', error);
    return c.json({ error: 'Failed to update lead' }, 500);
  }
});

export default router;
