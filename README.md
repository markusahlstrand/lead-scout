# Lead Scout

Automated lead discovery and community engagement CRM for **Sesamy** and **AuthHero**.

Combines **Claude Cowork** (daily web scanning operator) with a **Cloudflare Workers** backend (persistent CRM and knowledge store) to find and track leads across forums, social media, and review sites.

## Stack

- **Backend**: Cloudflare Workers + Pages Functions (Hono)
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Frontend**: React + Tailwind CSS + shadcn/ui components
- **AI**: Cloudflare Workers AI (classification) + Claude (deep analysis via Cowork)
- **CI/CD**: GitHub Actions → Cloudflare Pages

## Features

- **Multi-tenant**: Separate configurations for Sesamy and AuthHero
- **Source management**: Configure websites to scan with keywords (Reddit, HN, LinkedIn, Discord, dev.to, Medium, etc.)
- **Thread discovery**: Track discussions, classify relevance, manage status
- **Lead & company tracking**: Full CRM pipeline from discovery to conversion
- **Response drafting**: Create and manage draft responses for high-value threads
- **Knowledge base**: Store product info, talking points, and competitor intel
- **Owned media tracking**: Monitor your own GitHub repos, social accounts, and pages
- **Daily scanning**: Automated via Claude Cowork scheduled tasks

## Setup

```bash
# Install dependencies
pnpm install

# Create the D1 database
npx wrangler d1 create lead-scout-db
# Update wrangler.toml with the database_id from the output

# Run migrations locally
pnpm run db:migrate:local

# Set API key secret
npx wrangler secret put API_KEY

# Start dev server
pnpm run dev
```

## Deploy

```bash
# Run migrations on production
pnpm run db:migrate:remote

# Build and deploy
pnpm run build
pnpm run deploy
```

## Project Structure

```
├── src/
│   ├── api/              # Hono API backend
│   │   ├── index.ts      # App entry + route mounting
│   │   ├── middleware.ts  # Auth + tenant extraction
│   │   └── routes/       # CRUD routes per entity
│   ├── db/
│   │   ├── schema.ts     # Drizzle ORM schema
│   │   └── index.ts      # DB client factory
│   ├── components/       # React UI components
│   │   ├── ui/           # Reusable shadcn-style components
│   │   └── layout/       # Sidebar, header
│   ├── pages/            # Route pages
│   ├── hooks/            # React Query hooks
│   └── lib/              # Utilities, API client
├── functions/
│   └── api/[[route]].ts  # Pages Functions entry
├── drizzle/              # D1 migrations
└── .github/workflows/    # CI/CD
```

## GitHub Secrets Required

- `CLOUDFLARE_API_TOKEN` - Cloudflare API token with Pages + D1 permissions
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
