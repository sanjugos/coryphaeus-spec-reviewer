import { getPool } from "../crm/database";
import { MatchResult, MatchedEntity } from "./types";

// Deal-related keywords that signal CRM-relevant conversation
const DEAL_KEYWORDS = [
  "deal", "pipeline", "proposal", "contract", "renewal",
  "budget", "pricing", "discount", "revenue", "forecast",
  "close", "closing", "closed", "won", "lost",
  "competitor", "competing", "switched",
  "risk", "blocker", "concern", "objection", "pushback",
  "champion", "sponsor", "decision maker", "stakeholder",
  "timeline", "deadline", "quarter", "fiscal",
  "upsell", "cross-sell", "expansion",
  "churn", "cancel", "downgrade",
  "poc", "proof of concept", "pilot", "trial",
  "rfi", "rfp", "rfq",
];

interface CachedEntity {
  type: "account" | "opportunity" | "contact";
  id: string;
  name: string;
  nameLower: string;
}

const CACHE_REFRESH_MS = 5 * 60 * 1000; // 5 minutes

export class EntityMatcher {
  private cache: CachedEntity[] = [];
  private lastRefresh = 0;
  private refreshPromise: Promise<void> | null = null;

  async match(text: string): Promise<MatchResult> {
    await this.ensureCache();

    const textLower = text.toLowerCase();

    // Check deal keywords
    const matchedKeywords = DEAL_KEYWORDS.filter((kw) => textLower.includes(kw));

    // Check entity names
    const matchedEntities: MatchedEntity[] = [];
    const seen = new Set<string>();

    for (const entity of this.cache) {
      // Skip short names (< 3 chars) to avoid false positives
      if (entity.nameLower.length < 3) continue;

      if (textLower.includes(entity.nameLower) && !seen.has(entity.id)) {
        seen.add(entity.id);
        matchedEntities.push({
          type: entity.type,
          id: entity.id,
          name: entity.name,
        });
      }
    }

    const matched = matchedEntities.length > 0 || matchedKeywords.length >= 2;

    return { matched, entities: matchedEntities, keywords: matchedKeywords };
  }

  private async ensureCache(): Promise<void> {
    const now = Date.now();
    if (now - this.lastRefresh < CACHE_REFRESH_MS && this.cache.length > 0) {
      return;
    }

    // Deduplicate concurrent refresh calls
    if (this.refreshPromise) {
      await this.refreshPromise;
      return;
    }

    this.refreshPromise = this.refreshCache();
    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async refreshCache(): Promise<void> {
    try {
      const db = getPool();
      const entities: CachedEntity[] = [];

      const [accounts, opportunities, contacts] = await Promise.all([
        db.query("SELECT id, name FROM accounts"),
        db.query("SELECT id, name FROM opportunities"),
        db.query("SELECT id, full_name FROM contacts"),
      ]);

      for (const row of accounts.rows) {
        entities.push({ type: "account", id: row.id, name: row.name, nameLower: row.name.toLowerCase() });
      }
      for (const row of opportunities.rows) {
        entities.push({ type: "opportunity", id: row.id, name: row.name, nameLower: row.name.toLowerCase() });
      }
      for (const row of contacts.rows) {
        entities.push({ type: "contact", id: row.id, name: row.full_name, nameLower: row.full_name.toLowerCase() });
      }

      this.cache = entities;
      this.lastRefresh = Date.now();
      console.log(`[EntityMatcher] Cache refreshed: ${entities.length} entities`);
    } catch (err) {
      console.error("[EntityMatcher] Cache refresh failed:", err);
      // Keep stale cache rather than clearing it
    }
  }
}
