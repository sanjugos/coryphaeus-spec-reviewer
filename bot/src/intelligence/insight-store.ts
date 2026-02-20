import { getPool } from "../crm/database";
import { DealInsight, ExtractionResult, SourceType, InsightType, EntityType } from "./types";
import { createHash } from "crypto";

const STALENESS_DAYS = 90;
const DEDUP_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export class InsightStore {
  private get db() {
    return getPool();
  }

  async save(
    extraction: ExtractionResult,
    rawText: string,
    sourceType: SourceType,
    entityId: string | null,
    conversationId?: string,
    meetingId?: string,
    speakerName?: string
  ): Promise<void> {
    // Deduplication: hash of entity + insight_type + first 50 chars of summary
    const dedupKey = this.dedupHash(
      entityId || extraction.entity_name,
      extraction.insight_type,
      extraction.summary.substring(0, 50)
    );

    // Check for recent duplicate
    const existing = await this.db.query(
      `SELECT id FROM deal_insights
       WHERE id = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
      [dedupKey]
    );
    if (existing.rows.length > 0) return;

    await this.db.query(
      `INSERT INTO deal_insights
        (id, entity_type, entity_id, entity_name, insight_type, summary, raw_text,
         confidence, source_type, source_conversation_id, source_meeting_id,
         speaker_name, observed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [
        dedupKey,
        extraction.entity_type,
        entityId,
        extraction.entity_name,
        extraction.insight_type,
        extraction.summary,
        rawText,
        extraction.confidence,
        sourceType,
        conversationId || null,
        meetingId || null,
        speakerName || null,
      ]
    );
  }

  async queryByEntity(
    entityName: string,
    entityType?: EntityType,
    insightType?: InsightType,
    limit: number = 20
  ): Promise<DealInsight[]> {
    const params: (string | number)[] = [`%${entityName}%`];
    let where = "WHERE entity_name ILIKE $1 AND NOT is_stale";

    if (entityType) {
      params.push(entityType);
      where += ` AND entity_type = $${params.length}`;
    }
    if (insightType) {
      params.push(insightType);
      where += ` AND insight_type = $${params.length}`;
    }

    params.push(limit);

    const result = await this.db.query(
      `SELECT * FROM deal_insights ${where}
       ORDER BY observed_at DESC LIMIT $${params.length}`,
      params
    );
    return result.rows as DealInsight[];
  }

  async queryById(entityId: string, limit: number = 20): Promise<DealInsight[]> {
    const result = await this.db.query(
      `SELECT * FROM deal_insights
       WHERE entity_id = $1 AND NOT is_stale
       ORDER BY observed_at DESC LIMIT $2`,
      [entityId, limit]
    );
    return result.rows as DealInsight[];
  }

  async getRecent(limit: number = 10): Promise<DealInsight[]> {
    const result = await this.db.query(
      `SELECT * FROM deal_insights
       WHERE NOT is_stale
       ORDER BY observed_at DESC LIMIT $1`,
      [limit]
    );
    return result.rows as DealInsight[];
  }

  async markStale(): Promise<number> {
    const result = await this.db.query(
      `UPDATE deal_insights SET is_stale = TRUE
       WHERE NOT is_stale AND observed_at < NOW() - INTERVAL '${STALENESS_DAYS} days'`
    );
    return result.rowCount || 0;
  }

  private dedupHash(entityKey: string, insightType: string, summaryPrefix: string): string {
    const input = `${entityKey}|${insightType}|${summaryPrefix}`.toLowerCase();
    return createHash("sha256").update(input).digest("hex").substring(0, 32);
  }
}
