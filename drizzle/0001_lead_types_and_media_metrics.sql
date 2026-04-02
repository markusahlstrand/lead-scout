-- Add lead type fields to leads
ALTER TABLE leads ADD COLUMN lead_type TEXT NOT NULL DEFAULT 'prospect';
ALTER TABLE leads ADD COLUMN signal TEXT;
ALTER TABLE leads ADD COLUMN signal_strength TEXT DEFAULT 'warm';
ALTER TABLE leads ADD COLUMN source_url TEXT;

-- Add response automation fields
ALTER TABLE responses ADD COLUMN auto_generated INTEGER NOT NULL DEFAULT 0;
ALTER TABLE responses ADD COLUMN scheduled_post_at INTEGER;
ALTER TABLE responses ADD COLUMN platform TEXT;
ALTER TABLE responses ADD COLUMN parent_url TEXT;

-- Create media_metric_snapshots table
CREATE TABLE media_metric_snapshots (
  id TEXT PRIMARY KEY,
  media_asset_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  snapshot_date TEXT NOT NULL,
  followers INTEGER DEFAULT 0,
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  engagement_rate REAL DEFAULT 0.0,
  raw_metrics TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (media_asset_id) REFERENCES media_assets(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX media_metric_snapshots_asset_idx ON media_metric_snapshots(media_asset_id);
CREATE INDEX media_metric_snapshots_date_idx ON media_metric_snapshots(snapshot_date);
CREATE INDEX media_metric_snapshots_tenant_idx ON media_metric_snapshots(tenant_id);

-- Create engagement_events table
CREATE TABLE engagement_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  media_asset_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor_name TEXT,
  actor_handle TEXT,
  actor_profile_url TEXT,
  actor_platform TEXT,
  event_url TEXT,
  event_content TEXT,
  event_date INTEGER NOT NULL,
  converted_to_lead_id TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (media_asset_id) REFERENCES media_assets(id),
  FOREIGN KEY (converted_to_lead_id) REFERENCES leads(id)
);

CREATE INDEX engagement_events_asset_idx ON engagement_events(media_asset_id);
CREATE INDEX engagement_events_actor_idx ON engagement_events(actor_handle);
CREATE INDEX engagement_events_date_idx ON engagement_events(event_date);
CREATE INDEX engagement_events_tenant_idx ON engagement_events(tenant_id);
CREATE INDEX engagement_events_lead_idx ON engagement_events(converted_to_lead_id);
