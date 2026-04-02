import { Hono } from 'hono';
import { ulid } from 'ulid';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { Bindings, Variables } from '../index';
import { mediaMetricSnapshots } from '../../db/schema';
import { createDb } from '../../db';

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// POST / - Record a metric snapshot for a media asset
router.post('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();
    const {
      media_asset_id,
      snapshot_date,
      followers,
      stars,
      forks,
      likes,
      comments,
      shares,
      engagement_rate,
      raw_metrics,
    } = body;

    if (!media_asset_id || !snapshot_date) {
      return c.json(
        { error: 'media_asset_id and snapshot_date required' },
        400
      );
    }

    const db = createDb(c.env.DB);

    const snapshotId = ulid();
    const now = new Date();

    await db.insert(mediaMetricSnapshots).values({
      id: snapshotId,
      mediaAssetId: media_asset_id,
      tenantId,
      snapshotDate: snapshot_date,
      followers: followers || 0,
      stars: stars || 0,
      forks: forks || 0,
      likes: likes || 0,
      comments: comments || 0,
      shares: shares || 0,
      engagementRate: engagement_rate || 0.0,
      rawMetrics: raw_metrics ? JSON.stringify(raw_metrics) : null,
      createdAt: now,
    });

    return c.json(
      {
        id: snapshotId,
        mediaAssetId: media_asset_id,
        tenantId,
        snapshotDate: snapshot_date,
        followers: followers || 0,
        stars: stars || 0,
        forks: forks || 0,
        likes: likes || 0,
        comments: comments || 0,
        shares: shares || 0,
        engagementRate: engagement_rate || 0.0,
        rawMetrics: raw_metrics,
        createdAt: now.toISOString(),
      },
      201
    );
  } catch (error) {
    console.error('Error creating metric snapshot:', error);
    return c.json({ error: 'Failed to create metric snapshot' }, 500);
  }
});

// GET / - List snapshots with filters (media_asset_id required, date range optional)
router.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const media_asset_id = c.req.query('media_asset_id');
    const from_date = c.req.query('from_date');
    const to_date = c.req.query('to_date');
    const limit = Math.min(parseInt(c.req.query('limit') || '100'), 200);
    const offset = parseInt(c.req.query('offset') || '0');

    if (!media_asset_id) {
      return c.json({ error: 'media_asset_id required' }, 400);
    }

    const db = createDb(c.env.DB);

    const conditions = [
      eq(mediaMetricSnapshots.tenantId, tenantId),
      eq(mediaMetricSnapshots.mediaAssetId, media_asset_id),
    ];

    if (from_date) {
      conditions.push(gte(mediaMetricSnapshots.snapshotDate, from_date));
    }
    if (to_date) {
      conditions.push(lte(mediaMetricSnapshots.snapshotDate, to_date));
    }

    const result = await db
      .select()
      .from(mediaMetricSnapshots)
      .where(and(...conditions))
      .orderBy(desc(mediaMetricSnapshots.snapshotDate))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(mediaMetricSnapshots)
      .where(and(...conditions));

    const total = countResult[0]?.count || 0;

    return c.json({
      data: result.map((snapshot) => ({
        ...snapshot,
        rawMetrics: snapshot.rawMetrics ? JSON.parse(snapshot.rawMetrics) : null,
      })),
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error listing metric snapshots:', error);
    return c.json({ error: 'Failed to list metric snapshots' }, 500);
  }
});

// GET /trends/:assetId - Return snapshots for an asset over time
router.get('/trends/:assetId', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const assetId = c.req.param('assetId');
    const days = parseInt(c.req.query('days') || '30');

    if (!['30', '60', '90'].includes(days.toString())) {
      return c.json(
        { error: 'days must be 30, 60, or 90' },
        400
      );
    }

    const db = createDb(c.env.DB);

    // Calculate date range
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const fromDateStr = fromDate.toISOString().split('T')[0];
    const toDateStr = toDate.toISOString().split('T')[0];

    const result = await db
      .select()
      .from(mediaMetricSnapshots)
      .where(
        and(
          eq(mediaMetricSnapshots.tenantId, tenantId),
          eq(mediaMetricSnapshots.mediaAssetId, assetId),
          gte(mediaMetricSnapshots.snapshotDate, fromDateStr),
          lte(mediaMetricSnapshots.snapshotDate, toDateStr)
        )
      )
      .orderBy(desc(mediaMetricSnapshots.snapshotDate));

    return c.json({
      assetId,
      days,
      dateRange: {
        from: fromDateStr,
        to: toDateStr,
      },
      data: result.map((snapshot) => ({
        ...snapshot,
        rawMetrics: snapshot.rawMetrics ? JSON.parse(snapshot.rawMetrics) : null,
      })),
      total: result.length,
    });
  } catch (error) {
    console.error('Error getting metric trends:', error);
    return c.json({ error: 'Failed to get metric trends' }, 500);
  }
});

export default router;
