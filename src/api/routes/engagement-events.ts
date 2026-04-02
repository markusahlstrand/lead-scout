import { Hono } from 'hono';
import { ulid } from 'ulid';
import { eq, and, desc, sql } from 'drizzle-orm';
import { Bindings, Variables } from '../index';
import { engagementEvents, leads } from '../../db/schema';
import { createDb } from '../../db';

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// POST / - Record an engagement event
router.post('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();
    const {
      media_asset_id,
      event_type,
      actor_name,
      actor_handle,
      actor_profile_url,
      actor_platform,
      event_url,
      event_content,
      event_date,
    } = body;

    if (!media_asset_id || !event_type || !actor_handle) {
      return c.json(
        {
          error:
            'media_asset_id, event_type, and actor_handle required',
        },
        400
      );
    }

    const db = createDb(c.env.DB);

    const eventId = ulid();
    const now = new Date();

    await db.insert(engagementEvents).values({
      id: eventId,
      tenantId,
      mediaAssetId: media_asset_id,
      eventType: event_type,
      actorName: actor_name || null,
      actorHandle: actor_handle,
      actorProfileUrl: actor_profile_url || null,
      actorPlatform: actor_platform || null,
      eventUrl: event_url || null,
      eventContent: event_content || null,
      eventDate: event_date ? new Date(event_date) : now,
      convertedToLeadId: null,
      createdAt: now,
    });

    return c.json(
      {
        id: eventId,
        tenantId,
        mediaAssetId: media_asset_id,
        eventType: event_type,
        actorName: actor_name,
        actorHandle: actor_handle,
        actorProfileUrl: actor_profile_url,
        actorPlatform: actor_platform,
        eventUrl: event_url,
        eventContent: event_content,
        eventDate: event_date || now.toISOString(),
        convertedToLeadId: null,
        createdAt: now.toISOString(),
      },
      201
    );
  } catch (error) {
    console.error('Error creating engagement event:', error);
    return c.json({ error: 'Failed to create engagement event' }, 500);
  }
});

// GET / - List events with filters (paginated)
router.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const media_asset_id = c.req.query('media_asset_id');
    const event_type = c.req.query('event_type');
    const actor_handle = c.req.query('actor_handle');
    const from_date = c.req.query('from_date');
    const to_date = c.req.query('to_date');
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
    const offset = parseInt(c.req.query('offset') || '0');

    const db = createDb(c.env.DB);

    const conditions = [eq(engagementEvents.tenantId, tenantId)];

    if (media_asset_id) {
      conditions.push(eq(engagementEvents.mediaAssetId, media_asset_id));
    }
    if (event_type) {
      conditions.push(eq(engagementEvents.eventType, event_type as any));
    }
    if (actor_handle) {
      conditions.push(eq(engagementEvents.actorHandle, actor_handle));
    }

    const result = await db
      .select()
      .from(engagementEvents)
      .where(and(...conditions))
      .orderBy(desc(engagementEvents.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(engagementEvents)
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
    console.error('Error listing engagement events:', error);
    return c.json({ error: 'Failed to list engagement events' }, 500);
  }
});

// POST /:id/convert-to-lead - Convert an engagement event to a lead
router.post('/:id/convert-to-lead', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const eventId = c.req.param('id');
    const body = await c.req.json();
    const { email, role, company_id } = body;

    const db = createDb(c.env.DB);

    // Get the engagement event
    const event = await db
      .select()
      .from(engagementEvents)
      .where(
        and(
          eq(engagementEvents.id, eventId),
          eq(engagementEvents.tenantId, tenantId)
        )
      )
      .limit(1);

    if (event.length === 0) {
      return c.json({ error: 'Engagement event not found' }, 404);
    }

    const engagementEvent = event[0];

    // Create a new lead
    const leadId = ulid();
    const now = new Date();

    await db.insert(leads).values({
      id: leadId,
      tenantId,
      companyId: company_id || null,
      name: engagementEvent.actorName || engagementEvent.actorHandle,
      handle: engagementEvent.actorHandle,
      platform: engagementEvent.actorPlatform || null,
      profileUrl: engagementEvent.actorProfileUrl || null,
      email: email || null,
      role: role || null,
      status: 'new',
      leadType: 'engaged',
      signal: engagementEvent.eventType,
      signalStrength: 'warm',
      sourceUrl: engagementEvent.eventUrl || null,
      createdAt: now,
      updatedAt: now,
    });

    // Update the engagement event to link it to the lead
    await db
      .update(engagementEvents)
      .set({ convertedToLeadId: leadId })
      .where(eq(engagementEvents.id, eventId));

    return c.json(
      {
        id: leadId,
        tenantId,
        companyId: company_id,
        name: engagementEvent.actorName || engagementEvent.actorHandle,
        handle: engagementEvent.actorHandle,
        platform: engagementEvent.actorPlatform,
        profileUrl: engagementEvent.actorProfileUrl,
        email,
        role,
        status: 'new',
        leadType: 'engaged',
        signal: engagementEvent.eventType,
        signalStrength: 'warm',
        sourceUrl: engagementEvent.eventUrl,
        createdAt: now.toISOString(),
      },
      201
    );
  } catch (error) {
    console.error('Error converting engagement event to lead:', error);
    return c.json({ error: 'Failed to convert engagement event to lead' }, 500);
  }
});

// GET /recent - Last 50 events across all assets for the tenant
router.get('/recent', async (c) => {
  try {
    const tenantId = c.get('tenantId');

    const db = createDb(c.env.DB);

    const result = await db
      .select()
      .from(engagementEvents)
      .where(eq(engagementEvents.tenantId, tenantId))
      .orderBy(desc(engagementEvents.createdAt))
      .limit(50);

    return c.json({
      data: result,
      total: result.length,
    });
  } catch (error) {
    console.error('Error getting recent engagement events:', error);
    return c.json({ error: 'Failed to get recent engagement events' }, 500);
  }
});

export default router;
