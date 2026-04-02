import { Hono } from 'hono';
import { eq, and, desc, sql } from 'drizzle-orm';
import { Bindings, Variables } from '../index';
import { threads, companies, leads, responses } from '../../db/schema';
import { createDb } from '../../db';

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET / - Dashboard stats
router.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');

    const db = createDb(c.env.DB);

    // Get thread counts by status
    const threadCounts = await db
      .select({
        status: threads.status,
        count: sql<number>`COUNT(*) as count`,
      })
      .from(threads)
      .where(eq(threads.tenantId, tenantId))
      .groupBy(threads.status);

    // Get company counts by status
    const companyCounts = await db
      .select({
        status: companies.status,
        count: sql<number>`COUNT(*) as count`,
      })
      .from(companies)
      .where(eq(companies.tenantId, tenantId))
      .groupBy(companies.status);

    // Get lead counts by status
    const leadCounts = await db
      .select({
        status: leads.status,
        count: sql<number>`COUNT(*) as count`,
      })
      .from(leads)
      .where(eq(leads.tenantId, tenantId))
      .groupBy(leads.status);

    // Get total counts
    const totalThreads = await db
      .select({ count: sql<number>`COUNT(*) as count` })
      .from(threads)
      .where(eq(threads.tenantId, tenantId));

    const totalCompanies = await db
      .select({ count: sql<number>`COUNT(*) as count` })
      .from(companies)
      .where(eq(companies.tenantId, tenantId));

    const totalLeads = await db
      .select({ count: sql<number>`COUNT(*) as count` })
      .from(leads)
      .where(eq(leads.tenantId, tenantId));

    // Recent activity: last 10 threads created
    const recentThreads = await db
      .select()
      .from(threads)
      .where(eq(threads.tenantId, tenantId))
      .orderBy(desc(threads.createdAt))
      .limit(10);

    // Recent activity: last 10 leads created
    const recentLeads = await db
      .select()
      .from(leads)
      .where(eq(leads.tenantId, tenantId))
      .orderBy(desc(leads.createdAt))
      .limit(10);

    const statsByStatus = (items: Array<{ status: string; count: number }>) => {
      const result: Record<string, number> = {};
      items.forEach((item) => {
        result[item.status] = item.count;
      });
      return result;
    };

    return c.json({
      threads: {
        total: totalThreads[0]?.count || 0,
        byStatus: statsByStatus(threadCounts),
      },
      companies: {
        total: totalCompanies[0]?.count || 0,
        byStatus: statsByStatus(companyCounts),
      },
      leads: {
        total: totalLeads[0]?.count || 0,
        byStatus: statsByStatus(leadCounts),
      },
      recentActivity: {
        threads: recentThreads,
        leads: recentLeads,
      },
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    return c.json({ error: 'Failed to get stats' }, 500);
  }
});

// GET /digest - Today's digest
router.get('/digest', async (c) => {
  try {
    const tenantId = c.get('tenantId');

    const db = createDb(c.env.DB);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayString = today.toISOString();
    const tomorrowString = tomorrow.toISOString();

    // New threads created today
    const newThreadsToday = await db
      .select()
      .from(threads)
      .where(
        and(
          eq(threads.tenantId, tenantId),
          sql`${threads.createdAt} >= ${todayString}`,
          sql`${threads.createdAt} < ${tomorrowString}`
        )
      )
      .orderBy(desc(threads.createdAt));

    // High relevance items
    const highRelevanceItems = await db
      .select()
      .from(threads)
      .where(
        and(
          eq(threads.tenantId, tenantId),
          sql`${threads.relevanceScore} >= 0.8`
        )
      )
      .orderBy(desc(threads.relevanceScore))
      .limit(20);

    // New leads created today
    const newLeadsToday = await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.tenantId, tenantId),
          sql`${leads.createdAt} >= ${todayString}`,
          sql`${leads.createdAt} < ${tomorrowString}`
        )
      )
      .orderBy(desc(leads.createdAt));

    // New companies created today
    const newCompaniesToday = await db
      .select()
      .from(companies)
      .where(
        and(
          eq(companies.tenantId, tenantId),
          sql`${companies.createdAt} >= ${todayString}`,
          sql`${companies.createdAt} < ${tomorrowString}`
        )
      )
      .orderBy(desc(companies.createdAt));

    return c.json({
      date: today.toISOString().split('T')[0],
      newThreads: {
        count: newThreadsToday.length,
        items: newThreadsToday,
      },
      newLeads: {
        count: newLeadsToday.length,
        items: newLeadsToday,
      },
      newCompanies: {
        count: newCompaniesToday.length,
        items: newCompaniesToday,
      },
      highRelevance: {
        count: highRelevanceItems.length,
        items: highRelevanceItems,
      },
    });
  } catch (error) {
    console.error('Error getting digest:', error);
    return c.json({ error: 'Failed to get digest' }, 500);
  }
});

export default router;
