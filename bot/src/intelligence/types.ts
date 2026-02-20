// Deal Intelligence — type definitions

export type InsightType =
  | "deal_risk"
  | "budget_signal"
  | "sentiment"
  | "competitive_intel"
  | "timeline_change"
  | "stakeholder_change"
  | "next_step"
  | "general";

export type EntityType = "account" | "opportunity" | "contact";

export type SourceType = "chat" | "meeting" | "voice";

export interface DealInsight {
  id: string;
  entity_type: EntityType;
  entity_id: string | null;
  entity_name: string;
  insight_type: InsightType;
  summary: string;
  raw_text: string;
  confidence: number;
  source_type: SourceType;
  source_conversation_id: string | null;
  source_meeting_id: string | null;
  speaker_name: string | null;
  observed_at: Date;
  created_at: Date;
  is_stale: boolean;
}

export interface MatchResult {
  matched: boolean;
  entities: MatchedEntity[];
  keywords: string[];
}

export interface MatchedEntity {
  type: EntityType;
  id: string;
  name: string;
}

export interface ExtractionResult {
  entity_type: EntityType;
  entity_name: string;
  insight_type: InsightType;
  summary: string;
  confidence: number;
}

export interface ObserveMessage {
  text: string;
  source_type: SourceType;
  conversation_id?: string;
  meeting_id?: string;
  speaker_name?: string;
}
