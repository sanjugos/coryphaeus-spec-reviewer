import { Pool, PoolConfig } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL not set");
    }
    const config: PoolConfig = {
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
    pool = new Pool(config);
    pool.on("error", (err) => {
      console.error("[DB Pool Error]", err.message);
    });
  }
  return pool;
}

// Create CRM tables if they don't exist
export async function initializeDatabase(): Promise<void> {
  const db = getPool();

  await db.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      industry TEXT,
      type TEXT DEFAULT 'Customer',
      website TEXT,
      phone TEXT,
      email TEXT,
      city TEXT,
      country TEXT,
      annual_revenue NUMERIC,
      currency TEXT DEFAULT 'SGD',
      employees INTEGER,
      owner TEXT,
      health_score INTEGER DEFAULT 70,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      account_id TEXT REFERENCES accounts(id),
      account_name TEXT,
      title TEXT,
      department TEXT,
      lifecycle_stage TEXT DEFAULT 'Customer',
      role TEXT DEFAULT 'influencer',
      sentiment TEXT DEFAULT 'neutral',
      owner TEXT,
      last_contacted TIMESTAMPTZ,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      account_id TEXT REFERENCES accounts(id),
      account_name TEXT,
      amount NUMERIC NOT NULL DEFAULT 0,
      currency TEXT DEFAULT 'SGD',
      stage TEXT DEFAULT 'Prospecting',
      probability INTEGER DEFAULT 0,
      close_date DATE,
      type TEXT DEFAULT 'New Business',
      source TEXT,
      owner TEXT,
      products TEXT[],
      competitor TEXT,
      next_step TEXT,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'Completed',
      related_entity TEXT,
      related_id TEXT,
      related_name TEXT,
      due_date DATE,
      duration_minutes INTEGER,
      description TEXT,
      owner TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS account_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      account_id TEXT REFERENCES accounts(id),
      account_name TEXT,
      fiscal_year TEXT,
      target_revenue NUMERIC DEFAULT 0,
      current_revenue NUMERIC DEFAULT 0,
      currency TEXT DEFAULT 'SGD',
      status TEXT DEFAULT 'Draft',
      strategy TEXT,
      objectives TEXT[],
      risks TEXT[],
      whitespace TEXT[],
      owner TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS competitors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      strength TEXT,
      weakness TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS deal_insights (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      entity_name TEXT NOT NULL,
      insight_type TEXT NOT NULL,
      summary TEXT NOT NULL,
      raw_text TEXT NOT NULL,
      confidence REAL DEFAULT 0.8,
      source_type TEXT NOT NULL,
      source_conversation_id TEXT,
      source_meeting_id TEXT,
      speaker_name TEXT,
      observed_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      is_stale BOOLEAN DEFAULT FALSE
    );

    CREATE INDEX IF NOT EXISTS idx_deal_insights_entity
      ON deal_insights(entity_type, entity_id) WHERE NOT is_stale;
    CREATE INDEX IF NOT EXISTS idx_deal_insights_name
      ON deal_insights(entity_name) WHERE NOT is_stale;
  `);

  console.log("[DB] Tables initialized");
}

// Check if data needs seeding
export async function needsSeeding(): Promise<boolean> {
  const db = getPool();
  const result = await db.query("SELECT COUNT(*) as count FROM accounts");
  return parseInt(result.rows[0].count) === 0;
}
