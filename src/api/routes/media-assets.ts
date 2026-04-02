import { Hono } from 'hono';
import { ulid } from 'ulid';
import { eq, and, desc, sql } from 'drizzle-orm';
import { Bindings, Variables } from '../index';
import { mediaAssets } from '../../db/schema';
import { createDb } from '../../db';

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// POST / - Create media asset
router.post('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();
    const {
      sourceId,
      platform,
      assetType,
      name,
      url,
      handle,
      description,
      followerCount,
      metrics,
    } = body;

    if (!platform || !assetType || !name || !url) {
      return c.json(
        { error: 'platform, assetType, name, and url required' },
        400
      );
    }

    const db = createDb(c.env.DB);

    const assetId = ulid();
    const now = new Date();

    await db.insert(mediaAssets).values({
      id: assetId,
      tenantId,
      sourceId: sourceId || null,
      platform,
      assetType,
      name,
      url,
      handle: handle || null,
      description: description || null,
      followerCount: followerCount || null,
      metrics: metrics ? JSON.stringify(metrics) : null,
      lastCheckedAt: now,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return c.json(
      {
        id: assetId,
        tenantId,
        sourceId,
        platform,
        assetType,
        name,
        url,
        handle,
        description,
        followerCount,
        metrics,
        isActive: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      201
    );
  } catch (error) {
    console.error('Error creating media asset:', error);
    return c.json({ error: 'Failed to create media asset' }, 500);
  }
});

// GET / - List media assets with filters
router.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const platform = c.req.query('platform');
    const assetType = c.req.query('asset_type');
    const active = c.req.query('active');
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
    const offset = parseInt(c.req.query('offset') || '0');

    const db = createDb(c.env.DB);

    const conditions = [eq(mediaAssets.tenantId, tenantId)];

    if (platform) {
      conditions.push(eq(mediaAssets.platform, platform as any));
    }
    if (assetType) {
      conditions.push(eq(mediaAssets.assetType, assetType as any));
    }
    if (active !== undefined) {
      conditions.push(eq(mediaAssets.isActive, active === 'true'));
    }

    const result = await db
      .select()
      .from(mediaAssets)
      .where(and(...conditions))
      .orderBy(desc(mediaAssets.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(mediaAssets)
      .where(and(...conditions));

    const total = countResult[0]?.count || 0;

    return c.json({
      data: result.map((asset) => ({
        ...asset,
        metrics: asset.metrics ? JSON.parse(asset.metrics) : null,
      })),
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error listing media assets:', error);
    return c.json({ error: 'Failed to list media assets' }, 500);
  }
});

// GET /:id - Get single media asset with metrics
router.get('/:id', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');

    const db = createDb(c.env.DB);

    const asset = await db
      .select()
      .from(mediaAssets)
      .where(and(eq(mediaAssets.id, id), eq(mediaAssets.tenantId, tenantId)))
      .limit(1);

    if (asset.length === 0) {
      return c.json({ error: 'Media asset not found' }, 404);
    }

    const assetData = asset[0];
    return c.json({
      ...assetData,
      metrics: assetData.metrics ? JSON.parse(assetData.metrics) : null,
    });
  } catch (error) {
    console.error('Error getting media asset:', error);
    return c.json({ error: 'Failed to get media asset' }, 500);
  }
});

// PATCH /:id - Update media asset (metrics, follower count, etc.)
router.patch('/:id', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');
    const body = await c.req.json();
    const {
      name,
      description,
      followerCount,
      metrics,
      isActive,
      handle,
    } = body;

    const db = createDb(c.env.DB);

    const existing = await db
      .select()
      .from(mediaAssets)
      .where(and(eq(mediaAssets.id, id), eq(mediaAssets.tenantId, tenantId)))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: 'Media asset not found' }, 404);
    }

    const now = new Date();
    const updateData: Record<string, any> = {
      lastCheckedAt: now,
      updatedAt: now,
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (handle !== undefined) updateData.handle = handle;
    if (followerCount !== undefined) updateData.followerCount = followerCount;
    if (metrics !== undefined) updateData.metrics = JSON.stringify(metrics);
    if (isActive !== undefined) updateData.isActive = isActive;

    await db.update(mediaAssets).set(updateData).where(eq(mediaAssets.id, id));

    const updated = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.id, id))
      .limit(1);

    const assetData = updated[0];
    return c.json({
      ...assetData,
      metrics: assetData.metrics ? JSON.parse(assetData.metrics) : null,
    });
  } catch (error) {
    console.error('Error updating media asset:', error);
    return c.json({ error: 'Failed to update media asset' }, 500);
  }
});

export default router;
