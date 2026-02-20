import Anthropic from "@anthropic-ai/sdk";
import { ExtractionResult, MatchedEntity } from "./types";

const EXTRACTION_PROMPT = `You extract CRM-relevant insights from conversation snippets. Given a message and optionally matched CRM entities, return a JSON array of insights.

Each insight should have:
- entity_type: "account" | "opportunity" | "contact"
- entity_name: the name of the entity this insight is about
- insight_type: one of "deal_risk", "budget_signal", "sentiment", "competitive_intel", "timeline_change", "stakeholder_change", "next_step", "general"
- summary: 1-2 sentence summary of the insight (what was learned)
- confidence: 0.0-1.0 how confident you are this is a real CRM insight

Rules:
- Only extract genuinely CRM-relevant insights — skip small talk and logistics
- If no CRM insight exists in the message, return an empty array []
- Be specific in summaries — include numbers, names, dates when mentioned
- Confidence should be lower for vague/indirect references

Return ONLY valid JSON — no markdown, no explanation.`;

export class InsightExtractor {
  private client: Anthropic;
  private model: string;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.model = process.env.CLAUDE_EXTRACTION_MODEL || "claude-haiku-4-5-20251001";
  }

  async extract(
    text: string,
    matchedEntities: MatchedEntity[],
    speakerName?: string
  ): Promise<ExtractionResult[]> {
    const entityContext =
      matchedEntities.length > 0
        ? `\nMatched CRM entities: ${matchedEntities.map((e) => `${e.name} (${e.type})`).join(", ")}`
        : "";

    const speakerContext = speakerName ? `\nSpeaker: ${speakerName}` : "";

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 512,
        system: EXTRACTION_PROMPT,
        messages: [
          {
            role: "user",
            content: `Message: "${text}"${entityContext}${speakerContext}`,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== "text") return [];

      const parsed = JSON.parse(content.text);
      if (!Array.isArray(parsed)) return [];

      return parsed.filter(
        (item: Record<string, unknown>) =>
          item.entity_type &&
          item.entity_name &&
          item.insight_type &&
          item.summary &&
          typeof item.confidence === "number"
      ) as ExtractionResult[];
    } catch (err) {
      console.error("[InsightExtractor] Extraction failed:", err);
      return [];
    }
  }
}
