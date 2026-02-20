import {
  TurnContext,
  TeamsInfo,
  MessageFactory,
  CardFactory,
} from "botbuilder";
import { ClaudeEngine } from "../claude/engine";
import { DealIntelligenceObserver } from "../intelligence/observer";

// Meeting state tracked per active meeting
interface MeetingState {
  meetingId: string;
  conversationId: string;
  startTime: Date;
  transcriptBuffer: string[];
  lastInterjectionTime: number;
  participants: Map<string, string>; // userId -> displayName
}

// Minimum seconds between automatic interjections
const INTERJECTION_COOLDOWN_SECONDS = 120;

export class MeetingHandler {
  private engine: ClaudeEngine;
  private observer: DealIntelligenceObserver | null;
  private activeMeetings: Map<string, MeetingState>;

  constructor(engine: ClaudeEngine, observer?: DealIntelligenceObserver) {
    this.engine = engine;
    this.observer = observer || null;
    this.activeMeetings = new Map();
  }

  // Called when the bot joins a meeting
  async onMeetingJoined(context: TurnContext, meetingId: string): Promise<void> {
    const state: MeetingState = {
      meetingId,
      conversationId: context.activity.conversation?.id || "",
      startTime: new Date(),
      transcriptBuffer: [],
      lastInterjectionTime: 0,
      participants: new Map(),
    };

    this.activeMeetings.set(meetingId, state);

    // Send greeting in meeting chat
    await context.sendActivity(
      MessageFactory.text(
        "**Coryphaeus** has joined the meeting.\n\n" +
        "I'll listen for CRM-related topics and can help with:\n" +
        "- Account and deal lookups\n" +
        "- Contact information\n" +
        "- Pipeline data\n\n" +
        "Just mention me or ask a question!"
      )
    );

    console.log(`[Meeting] Joined meeting ${meetingId}`);
  }

  // Called when the bot leaves a meeting
  async onMeetingLeft(context: TurnContext, meetingId: string): Promise<void> {
    const state = this.activeMeetings.get(meetingId);

    if (state) {
      // Generate meeting summary
      const summary = await this.generateMeetingSummary(meetingId);
      if (summary) {
        await context.sendActivity(
          MessageFactory.text(`**Meeting Summary (CRM highlights)**\n\n${summary}`)
        );
      }
    }

    this.activeMeetings.delete(meetingId);
    this.engine.clearConversation(`meeting-${meetingId}`);
    console.log(`[Meeting] Left meeting ${meetingId}`);
  }

  // Process a transcript segment from the meeting
  // In production, this is fed by real-time audio STT or Teams transcript events
  async onTranscriptSegment(
    context: TurnContext,
    meetingId: string,
    speaker: string,
    text: string
  ): Promise<void> {
    const state = this.activeMeetings.get(meetingId);
    if (!state) return;

    // Passive observation: fire-and-forget
    if (this.observer) {
      this.observer.observe({
        text,
        source_type: "meeting",
        meeting_id: meetingId,
        speaker_name: speaker,
      });
    }

    // Buffer the transcript
    state.transcriptBuffer.push(`${speaker}: ${text}`);

    // Keep buffer at last 50 utterances
    if (state.transcriptBuffer.length > 50) {
      state.transcriptBuffer.shift();
    }

    // Check if we should interject
    const now = Date.now();
    const timeSinceLastInterjection = (now - state.lastInterjectionTime) / 1000;

    // Respect cooldown unless directly addressed
    const directlyAddressed = text.toLowerCase().includes("coryphaeus") ||
                               text.toLowerCase().includes("hey crm") ||
                               text.toLowerCase().includes("@coryphaeus");

    if (!directlyAddressed && timeSinceLastInterjection < INTERJECTION_COOLDOWN_SECONDS) {
      return;
    }

    // Ask Claude if we should interject
    const result = await this.engine.processMeetingTranscript(meetingId, text, speaker);

    if (result.shouldInterject && result.response) {
      state.lastInterjectionTime = now;

      // Send to meeting chat
      await context.sendActivity(MessageFactory.text(result.response));
      console.log(`[Meeting] Interjection in ${meetingId}: ${result.response.substring(0, 100)}...`);
    }
  }

  // Generate a summary of CRM-relevant discussion points from the meeting
  private async generateMeetingSummary(meetingId: string): Promise<string | null> {
    const state = this.activeMeetings.get(meetingId);
    if (!state || state.transcriptBuffer.length === 0) return null;

    const transcript = state.transcriptBuffer.join("\n");
    const response = await this.engine.processMessage(
      `meeting-${meetingId}-summary`,
      `Generate a brief CRM-focused summary of this meeting discussion. Highlight any accounts, deals, contacts, or action items mentioned:\n\n${transcript}`,
      "meeting_chat"
    );

    return response;
  }

  // Get active meeting IDs
  getActiveMeetings(): string[] {
    return Array.from(this.activeMeetings.keys());
  }
}
