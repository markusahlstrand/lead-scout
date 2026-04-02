-- Create tenants table
CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Create sources table
CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'scan',
  url TEXT NOT NULL,
  keywords TEXT,
  scan_config TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_scanned_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX sources_tenant_id_idx ON sources(tenant_id);
CREATE INDEX sources_platform_idx ON sources(platform);
CREATE INDEX sources_source_type_idx ON sources(source_type);

-- Create threads table
CREATE TABLE threads (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  external_id TEXT,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  body_snippet TEXT,
  author TEXT,
  platform TEXT NOT NULL,
  relevance_score REAL,
  relevance_reason TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  discovered_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (source_id) REFERENCES sources(id),
  UNIQUE(url, tenant_id)
);

CREATE INDEX threads_tenant_id_idx ON threads(tenant_id);
CREATE INDEX threads_source_id_idx ON threads(source_id);
CREATE INDEX threads_status_idx ON threads(status);
CREATE UNIQUE INDEX threads_url_tenant_idx ON threads(url, tenant_id);

-- Create companies table
CREATE TABLE companies (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  domain TEXT,
  description TEXT,
  industry TEXT,
  size_estimate TEXT,
  relevance_score REAL,
  source_thread_id TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (source_thread_id) REFERENCES threads(id)
);

CREATE INDEX companies_tenant_id_idx ON companies(tenant_id);
CREATE INDEX companies_source_thread_id_idx ON companies(source_thread_id);
CREATE INDEX companies_status_idx ON companies(status);

-- Create leads table
CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  handle TEXT,
  platform TEXT,
  profile_url TEXT,
  email TEXT,
  role TEXT,
  relevance_score REAL,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX leads_tenant_id_idx ON leads(tenant_id);
CREATE INDEX leads_company_id_idx ON leads(company_id);
CREATE INDEX leads_status_idx ON leads(status);
CREATE INDEX leads_email_idx ON leads(email);

-- Create responses table
CREATE TABLE responses (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  draft_text TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'helpful',
  status TEXT NOT NULL DEFAULT 'draft',
  posted_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (thread_id) REFERENCES threads(id)
);

CREATE INDEX responses_tenant_id_idx ON responses(tenant_id);
CREATE INDEX responses_thread_id_idx ON responses(thread_id);
CREATE INDEX responses_status_idx ON responses(status);

-- Create knowledge table
CREATE TABLE knowledge (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX knowledge_tenant_id_idx ON knowledge(tenant_id);
CREATE INDEX knowledge_category_idx ON knowledge(category);

-- Create scan_logs table
CREATE TABLE scan_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  threads_found INTEGER NOT NULL DEFAULT 0,
  companies_found INTEGER NOT NULL DEFAULT 0,
  leads_found INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running',
  summary TEXT,
  error TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE INDEX scan_logs_tenant_id_idx ON scan_logs(tenant_id);
CREATE INDEX scan_logs_source_id_idx ON scan_logs(source_id);
CREATE INDEX scan_logs_status_idx ON scan_logs(status);

-- Create media_assets table
CREATE TABLE media_assets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  source_id TEXT,
  platform TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  handle TEXT,
  description TEXT,
  follower_count INTEGER,
  last_checked_at INTEGER,
  metrics TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE INDEX media_assets_tenant_id_idx ON media_assets(tenant_id);
CREATE INDEX media_assets_platform_idx ON media_assets(platform);
