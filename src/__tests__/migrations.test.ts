import { describe, it, expect } from "vitest";
// @ts-expect-error - fs is available in vitest node environment
import { readFileSync } from "fs";
// @ts-expect-error - path is available in vitest node environment
import { join } from "path";

// vitest provides __dirname in node environment
declare const __dirname: string;

describe("SQL Migrations", () => {
  const migrationsDir = join(__dirname, "../../drizzle");

  describe("0000_init.sql", () => {
    const sql = readFileSync(join(migrationsDir, "0000_init.sql"), "utf-8");

    it("should create all core tables", () => {
      const tables = [
        "tenants",
        "sources",
        "threads",
        "companies",
        "leads",
        "responses",
        "knowledge",
        "scan_logs",
        "media_assets",
      ];

      for (const table of tables) {
        expect(sql, `should contain CREATE TABLE ${table}`).toContain(
          `CREATE TABLE ${table}`
        );
      }
    });

    it("should have foreign keys to tenants on all data tables", () => {
      // Count FOREIGN KEY references to tenants(id)
      const fkMatches = sql.match(/REFERENCES tenants\(id\)/g);
      expect(fkMatches).not.toBeNull();
      expect(fkMatches!.length).toBeGreaterThanOrEqual(7);
    });

    it("should create indexes for performance", () => {
      const indexMatches = sql.match(/CREATE INDEX/g);
      expect(indexMatches).not.toBeNull();
      expect(indexMatches!.length).toBeGreaterThanOrEqual(10);
    });

    it("should have unique constraint on threads URL per tenant", () => {
      expect(sql).toContain("UNIQUE(url, tenant_id)");
    });

    it("sources table should have source_type and keywords columns", () => {
      expect(sql).toContain("source_type TEXT NOT NULL DEFAULT 'scan'");
      expect(sql).toContain("keywords TEXT");
    });
  });

  describe("0001_lead_types_and_media_metrics.sql", () => {
    const sql = readFileSync(
      join(migrationsDir, "0001_lead_types_and_media_metrics.sql"),
      "utf-8"
    );

    it("should add lead type fields to leads table", () => {
      expect(sql).toContain("lead_type");
      expect(sql).toContain("signal");
      expect(sql).toContain("signal_strength");
      expect(sql).toContain("source_url");
    });

    it("should add response automation fields", () => {
      expect(sql).toContain("auto_generated");
      expect(sql).toContain("scheduled_post_at");
      expect(sql).toContain("parent_url");
    });

    it("should create media_metric_snapshots table", () => {
      expect(sql).toContain("CREATE TABLE media_metric_snapshots");
      expect(sql).toContain("snapshot_date");
      expect(sql).toContain("engagement_rate");
    });

    it("should create engagement_events table", () => {
      expect(sql).toContain("CREATE TABLE engagement_events");
      expect(sql).toContain("event_type");
      expect(sql).toContain("actor_handle");
      expect(sql).toContain("converted_to_lead_id");
    });

    it("should create indexes for new tables", () => {
      expect(sql).toContain(
        "CREATE INDEX media_metric_snapshots_asset_idx"
      );
      expect(sql).toContain("CREATE INDEX engagement_events_asset_idx");
      expect(sql).toContain("CREATE INDEX engagement_events_actor_idx");
    });
  });
});
