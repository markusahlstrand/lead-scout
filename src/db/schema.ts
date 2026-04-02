import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
  foreignKey,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ============================================================================
// Tenants
// ============================================================================

export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// Sources
// ============================================================================

export const sources = sqliteTable(
  "sources",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    name: text("name").notNull(),
    platform: text("platform", {
      enum: [
        "reddit",
        "hackernews",
        "twitter",
        "linkedin",
        "g2",
        "producthunt",
        "stackoverflow",
        "github",
        "devto",
        "medium",
        "discord",
        "cloudflare_community",
        "bluesky",
        "facebook",
        "youtube",
      ],
    }).notNull(),
    sourceType: text("source_type", {
      enum: ["scan", "owned"],
    })
      .default("scan")
      .notNull(),
    url: text("url").notNull(),
    keywords: text("keywords"), // JSON array of keyword strings
    scanConfig: text("scan_config"), // JSON string
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    lastScannedAt: integer("last_scanned_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => {
    return {
      tenantIdIdx: index("sources_tenant_id_idx").on(table.tenantId),
      platformIdx: index("sources_platform_idx").on(table.platform),
      sourceTypeIdx: index("sources_source_type_idx").on(table.sourceType),
      tenantFk: foreignKey({
        columns: [table.tenantId],
        foreignColumns: [tenants.id],
      }),
    };
  }
);

// ============================================================================
// Threads
// ============================================================================

export const threads = sqliteTable(
  "threads",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    sourceId: text("source_id").notNull(),
    externalId: text("external_id"),
    url: text("url").notNull(),
    title: text("title").notNull(),
    bodySnippet: text("body_snippet"),
    author: text("author"),
    platform: text("platform", {
      enum: [
        "reddit",
        "hackernews",
        "twitter",
        "linkedin",
        "g2",
        "producthunt",
        "stackoverflow",
        "github",
        "devto",
        "medium",
        "discord",
        "cloudflare_community",
        "bluesky",
        "facebook",
        "youtube",
      ],
    }).notNull(),
    relevanceScore: real("relevance_score"),
    relevanceReason: text("relevance_reason"),
    status: text("status", {
      enum: ["new", "reviewed", "responded", "dismissed"],
    })
      .default("new")
      .notNull(),
    discoveredAt: integer("discovered_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => {
    return {
      tenantIdIdx: index("threads_tenant_id_idx").on(table.tenantId),
      sourceIdIdx: index("threads_source_id_idx").on(table.sourceId),
      statusIdx: index("threads_status_idx").on(table.status),
      urlUnique: uniqueIndex("threads_url_tenant_idx").on(
        table.url,
        table.tenantId
      ),
      tenantFk: foreignKey({
        columns: [table.tenantId],
        foreignColumns: [tenants.id],
      }),
      sourceFk: foreignKey({
        columns: [table.sourceId],
        foreignColumns: [sources.id],
      }),
    };
  }
);

// ============================================================================
// Companies
// ============================================================================

export const companies = sqliteTable(
  "companies",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    name: text("name").notNull(),
    domain: text("domain"),
    description: text("description"),
    industry: text("industry"),
    sizeEstimate: text("size_estimate", {
      enum: ["startup", "smb", "enterprise"],
    }),
    relevanceScore: real("relevance_score"),
    sourceThreadId: text("source_thread_id"),
    status: text("status", {
      enum: ["new", "researched", "contacted", "qualified", "disqualified"],
    })
      .default("new")
      .notNull(),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => {
    return {
      tenantIdIdx: index("companies_tenant_id_idx").on(table.tenantId),
      sourceThreadIdIdx: index("companies_source_thread_id_idx").on(
        table.sourceThreadId
      ),
      statusIdx: index("companies_status_idx").on(table.status),
      tenantFk: foreignKey({
        columns: [table.tenantId],
        foreignColumns: [tenants.id],
      }),
      sourceThreadFk: foreignKey({
        columns: [table.sourceThreadId],
        foreignColumns: [threads.id],
      }),
    };
  }
);

// ============================================================================
// Leads
// ============================================================================

export const leads = sqliteTable(
  "leads",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    companyId: text("company_id"),
    name: text("name").notNull(),
    handle: text("handle"),
    platform: text("platform"),
    profileUrl: text("profile_url"),
    email: text("email"),
    role: text("role"),
    leadType: text("lead_type", {
      enum: ["community", "prospect", "company", "engaged"],
    }).notNull(),
    signal: text("signal"),
    signalStrength: text("signal_strength", {
      enum: ["hot", "warm", "cold"],
    }),
    sourceUrl: text("source_url"),
    relevanceScore: real("relevance_score"),
    status: text("status", {
      enum: ["new", "contacted", "engaged", "converted", "inactive"],
    })
      .default("new")
      .notNull(),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => {
    return {
      tenantIdIdx: index("leads_tenant_id_idx").on(table.tenantId),
      companyIdIdx: index("leads_company_id_idx").on(table.companyId),
      statusIdx: index("leads_status_idx").on(table.status),
      leadTypeIdx: index("leads_lead_type_idx").on(table.leadType),
      emailIdx: index("leads_email_idx").on(table.email),
      tenantFk: foreignKey({
        columns: [table.tenantId],
        foreignColumns: [tenants.id],
      }),
      companyFk: foreignKey({
        columns: [table.companyId],
        foreignColumns: [companies.id],
      }),
    };
  }
);

// ============================================================================
// Responses
// ============================================================================

export const responses = sqliteTable(
  "responses",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    threadId: text("thread_id").notNull(),
    draftText: text("draft_text").notNull(),
    tone: text("tone", {
      enum: ["helpful", "technical", "casual"],
    })
      .default("helpful")
      .notNull(),
    status: text("status", {
      enum: ["draft", "approved", "posted", "rejected"],
    })
      .default("draft")
      .notNull(),
    autoGenerated: integer("auto_generated", { mode: "boolean" })
      .default(false)
      .notNull(),
    scheduledPostAt: integer("scheduled_post_at", { mode: "timestamp" }),
    platform: text("platform", {
      enum: [
        "reddit",
        "hackernews",
        "twitter",
        "linkedin",
        "g2",
        "producthunt",
        "stackoverflow",
        "github",
        "devto",
        "medium",
        "discord",
        "cloudflare_community",
        "bluesky",
        "facebook",
        "youtube",
      ],
    }),
    parentUrl: text("parent_url"),
    postedAt: integer("posted_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => {
    return {
      tenantIdIdx: index("responses_tenant_id_idx").on(table.tenantId),
      threadIdIdx: index("responses_thread_id_idx").on(table.threadId),
      statusIdx: index("responses_status_idx").on(table.status),
      tenantFk: foreignKey({
        columns: [table.tenantId],
        foreignColumns: [tenants.id],
      }),
      threadFk: foreignKey({
        columns: [table.threadId],
        foreignColumns: [threads.id],
      }),
    };
  }
);

// ============================================================================
// Knowledge
// ============================================================================

export const knowledge = sqliteTable(
  "knowledge",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    category: text("category", {
      enum: ["product", "competitor", "talking_point", "faq"],
    }).notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    tags: text("tags"), // JSON array string
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => {
    return {
      tenantIdIdx: index("knowledge_tenant_id_idx").on(table.tenantId),
      categoryIdx: index("knowledge_category_idx").on(table.category),
      tenantFk: foreignKey({
        columns: [table.tenantId],
        foreignColumns: [tenants.id],
      }),
    };
  }
);

// ============================================================================
// Scan Logs
// ============================================================================

export const scanLogs = sqliteTable(
  "scan_logs",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    sourceId: text("source_id").notNull(),
    startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    threadsFound: integer("threads_found").default(0).notNull(),
    companiesFound: integer("companies_found").default(0).notNull(),
    leadsFound: integer("leads_found").default(0).notNull(),
    status: text("status", {
      enum: ["running", "completed", "failed"],
    })
      .default("running")
      .notNull(),
    summary: text("summary"),
    error: text("error"),
  },
  (table) => {
    return {
      tenantIdIdx: index("scan_logs_tenant_id_idx").on(table.tenantId),
      sourceIdIdx: index("scan_logs_source_id_idx").on(table.sourceId),
      statusIdx: index("scan_logs_status_idx").on(table.status),
      tenantFk: foreignKey({
        columns: [table.tenantId],
        foreignColumns: [tenants.id],
      }),
      sourceFk: foreignKey({
        columns: [table.sourceId],
        foreignColumns: [sources.id],
      }),
    };
  }
);

// ============================================================================
// Media Assets
// ============================================================================

export const mediaAssets = sqliteTable(
  "media_assets",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    sourceId: text("source_id"), // FK to sources (if linked to a source)
    platform: text("platform", {
      enum: [
        "reddit",
        "hackernews",
        "twitter",
        "linkedin",
        "g2",
        "producthunt",
        "stackoverflow",
        "github",
        "devto",
        "medium",
        "discord",
        "cloudflare_community",
        "bluesky",
        "facebook",
        "youtube",
      ],
    }).notNull(),
    assetType: text("asset_type", {
      enum: ["profile", "repository", "page", "channel", "group"],
    }).notNull(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    handle: text("handle"), // @username or org name
    description: text("description"),
    followerCount: integer("follower_count"),
    lastCheckedAt: integer("last_checked_at", { mode: "timestamp" }),
    metrics: text("metrics"), // JSON: {stars, forks, followers, engagement_rate, etc}
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    tenantIdIdx: index("media_assets_tenant_id_idx").on(table.tenantId),
    platformIdx: index("media_assets_platform_idx").on(table.platform),
    tenantFk: foreignKey({
      columns: [table.tenantId],
      foreignColumns: [tenants.id],
    }),
    sourceFk: foreignKey({
      columns: [table.sourceId],
      foreignColumns: [sources.id],
    }),
  })
);

// ============================================================================
// Media Metric Snapshots
// ============================================================================

export const mediaMetricSnapshots = sqliteTable(
  "media_metric_snapshots",
  {
    id: text("id").primaryKey(),
    mediaAssetId: text("media_asset_id").notNull(),
    tenantId: text("tenant_id").notNull(),
    snapshotDate: text("snapshot_date").notNull(), // ISO date like "2026-04-02"
    followers: integer("followers"),
    stars: integer("stars"),
    forks: integer("forks"),
    likes: integer("likes"),
    comments: integer("comments"),
    shares: integer("shares"),
    engagementRate: real("engagement_rate"),
    rawMetrics: text("raw_metrics"), // JSON for platform-specific extras
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => {
    return {
      mediaAssetIdIdx: index("media_metric_snapshots_media_asset_id_idx").on(
        table.mediaAssetId
      ),
      snapshotDateIdx: index("media_metric_snapshots_snapshot_date_idx").on(
        table.snapshotDate
      ),
      tenantIdIdx: index("media_metric_snapshots_tenant_id_idx").on(
        table.tenantId
      ),
      mediaAssetFk: foreignKey({
        columns: [table.mediaAssetId],
        foreignColumns: [mediaAssets.id],
      }),
      tenantFk: foreignKey({
        columns: [table.tenantId],
        foreignColumns: [tenants.id],
      }),
    };
  }
);

// ============================================================================
// Engagement Events
// ============================================================================

export const engagementEvents = sqliteTable(
  "engagement_events",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    mediaAssetId: text("media_asset_id").notNull(),
    eventType: text("event_type", {
      enum: ["star", "fork", "like", "comment", "share", "follow", "mention", "join"],
    }).notNull(),
    actorName: text("actor_name"),
    actorHandle: text("actor_handle").notNull(),
    actorProfileUrl: text("actor_profile_url"),
    actorPlatform: text("actor_platform", {
      enum: [
        "reddit",
        "hackernews",
        "twitter",
        "linkedin",
        "g2",
        "producthunt",
        "stackoverflow",
        "github",
        "devto",
        "medium",
        "discord",
        "cloudflare_community",
        "bluesky",
        "facebook",
        "youtube",
      ],
    }).notNull(),
    eventUrl: text("event_url"),
    eventContent: text("event_content"),
    eventDate: integer("event_date", { mode: "timestamp" }).notNull(),
    convertedToLeadId: text("converted_to_lead_id"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => {
    return {
      mediaAssetIdIdx: index("engagement_events_media_asset_id_idx").on(
        table.mediaAssetId
      ),
      actorHandleIdx: index("engagement_events_actor_handle_idx").on(
        table.actorHandle
      ),
      eventDateIdx: index("engagement_events_event_date_idx").on(
        table.eventDate
      ),
      convertedToLeadIdIdx: index("engagement_events_converted_to_lead_id_idx").on(
        table.convertedToLeadId
      ),
      tenantIdIdx: index("engagement_events_tenant_id_idx").on(table.tenantId),
      mediaAssetFk: foreignKey({
        columns: [table.mediaAssetId],
        foreignColumns: [mediaAssets.id],
      }),
      tenantFk: foreignKey({
        columns: [table.tenantId],
        foreignColumns: [tenants.id],
      }),
      convertedToLeadFk: foreignKey({
        columns: [table.convertedToLeadId],
        foreignColumns: [leads.id],
      }),
    };
  }
);

// ============================================================================
// Relations
// ============================================================================

export const tenantsRelations = relations(tenants, ({ many }) => ({
  sources: many(sources),
  threads: many(threads),
  companies: many(companies),
  leads: many(leads),
  responses: many(responses),
  knowledge: many(knowledge),
  scanLogs: many(scanLogs),
  mediaAssets: many(mediaAssets),
  mediaMetricSnapshots: many(mediaMetricSnapshots),
  engagementEvents: many(engagementEvents),
}));

export const sourcesRelations = relations(sources, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [sources.tenantId],
    references: [tenants.id],
  }),
  threads: many(threads),
  scanLogs: many(scanLogs),
  mediaAssets: many(mediaAssets),
}));

export const threadsRelations = relations(threads, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [threads.tenantId],
    references: [tenants.id],
  }),
  source: one(sources, {
    fields: [threads.sourceId],
    references: [sources.id],
  }),
  companies: many(companies),
  responses: many(responses),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [companies.tenantId],
    references: [tenants.id],
  }),
  sourceThread: one(threads, {
    fields: [companies.sourceThreadId],
    references: [threads.id],
  }),
  leads: many(leads),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [leads.tenantId],
    references: [tenants.id],
  }),
  company: one(companies, {
    fields: [leads.companyId],
    references: [companies.id],
  }),
  engagementEvents: many(engagementEvents),
}));

export const responsesRelations = relations(responses, ({ one }) => ({
  tenant: one(tenants, {
    fields: [responses.tenantId],
    references: [tenants.id],
  }),
  thread: one(threads, {
    fields: [responses.threadId],
    references: [threads.id],
  }),
}));

export const knowledgeRelations = relations(knowledge, ({ one }) => ({
  tenant: one(tenants, {
    fields: [knowledge.tenantId],
    references: [tenants.id],
  }),
}));

export const scanLogsRelations = relations(scanLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [scanLogs.tenantId],
    references: [tenants.id],
  }),
  source: one(sources, {
    fields: [scanLogs.sourceId],
    references: [sources.id],
  }),
}));

export const mediaAssetsRelations = relations(mediaAssets, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [mediaAssets.tenantId],
    references: [tenants.id],
  }),
  source: one(sources, {
    fields: [mediaAssets.sourceId],
    references: [sources.id],
  }),
  mediaMetricSnapshots: many(mediaMetricSnapshots),
  engagementEvents: many(engagementEvents),
}));

export const mediaMetricSnapshotsRelations = relations(
  mediaMetricSnapshots,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [mediaMetricSnapshots.tenantId],
      references: [tenants.id],
    }),
    mediaAsset: one(mediaAssets, {
      fields: [mediaMetricSnapshots.mediaAssetId],
      references: [mediaAssets.id],
    }),
  })
);

export const engagementEventsRelations = relations(
  engagementEvents,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [engagementEvents.tenantId],
      references: [tenants.id],
    }),
    mediaAsset: one(mediaAssets, {
      fields: [engagementEvents.mediaAssetId],
      references: [mediaAssets.id],
    }),
    convertedToLead: one(leads, {
      fields: [engagementEvents.convertedToLeadId],
      references: [leads.id],
    }),
  })
);
