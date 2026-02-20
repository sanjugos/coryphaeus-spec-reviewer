import { EntityMatcher } from "./entity-matcher";
import { InsightExtractor } from "./insight-extractor";
import { InsightStore } from "./insight-store";
import { ObserveMessage, DealInsight, EntityType, InsightType } from "./types";

const STALENESS_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

export class DealIntelligenceObserver {
  private matcher: EntityMatcher;
  private extractor: InsightExtractor;
  private store: InsightStore;
  private lastStalenessCheck = 0;

  constructor() {
    this.matcher = new EntityMatcher();
    this.extractor = new InsightExtractor();
    this.store = new InsightStore();
  }

  /**
   * Fire-and-forget: observe a message and extract insights if relevant.
   * Never throws — errors are logged and swallowed.
   */
  observe(message: ObserveMessage): void {
    this.processMessage(message).catch((err) => {
      console.error("[Observer] Error processing message:", err);
    });
  }

  /**
   * Retrieve accumulated intelligence for a given entity.
   */
  async getIntelligence(
    entityName: string,
    entityType?: EntityType,
    insightType?: InsightType,
    limit?: number
  ): Promise<{ insights: DealInsight[]; summary_count: number }> {
    const insights = await this.store.queryByEntity(
      entityName,
      entityType,
      insightType,
      limit || 20
    );
    return { insights, summary_count: insights.length };
  }

  /**
   * Get recent insights across all entities.
   */
  async getRecentInsights(limit?: number): Promise<DealInsight[]> {
    return this.store.getRecent(limit || 10);
  }

  private async processMessage(message: ObserveMessage): Promise<void> {
    // Skip very short messages
    if (message.text.length < 10) return;

    // Tier 1: local keyword/entity match
    const matchResult = await this.matcher.match(message.text);
    if (!matchResult.matched) return;

    console.log(
      `[Observer] Tier 1 match — entities: [${matchResult.entities.map((e) => e.name).join(", ")}], keywords: [${matchResult.keywords.join(", ")}]`
    );

    // Tier 2: Claude Haiku extraction
    const extractions = await this.extractor.extract(
      message.text,
      matchResult.entities,
      message.speaker_name
    );

    if (extractions.length === 0) return;

    console.log(`[Observer] Tier 2 extracted ${extractions.length} insight(s)`);

    // Store each insight
    for (const extraction of extractions) {
      // Try to resolve entity_id from matched entities
      const matchedEntity = matchResult.entities.find(
        (e) =>
          e.name.toLowerCase() === extraction.entity_name.toLowerCase() ||
          e.type === extraction.entity_type
      );

      await this.store.save(
        extraction,
        message.text,
        message.source_type,
        matchedEntity?.id || null,
        message.conversation_id,
        message.meeting_id,
        message.speaker_name
      );
    }

    // Periodic staleness cleanup
    this.maybeMarkStale();
  }

  private maybeMarkStale(): void {
    const now = Date.now();
    if (now - this.lastStalenessCheck < STALENESS_CHECK_INTERVAL_MS) return;
    this.lastStalenessCheck = now;

    this.store.markStale().then((count) => {
      if (count > 0) {
        console.log(`[Observer] Marked ${count} insight(s) as stale`);
      }
    }).catch((err) => {
      console.error("[Observer] Staleness check failed:", err);
    });
  }
}
