import {
  ActivityHandler,
  TurnContext,
  CardFactory,
  TeamsInfo,
  MessageFactory,
  Activity,
  ConversationReference,
} from "botbuilder";
import { ClaudeEngine, AgentMode } from "./claude/engine";

export class CoryphaeusBot extends ActivityHandler {
  public readonly engine: ClaudeEngine;
  private conversationRefs: Map<string, Partial<ConversationReference>>;

  constructor() {
    super();
    this.engine = new ClaudeEngine();
    this.conversationRefs = new Map();

    // Handle incoming messages
    this.onMessage(async (context: TurnContext, next) => {
      // Store conversation reference for proactive messaging
      this.storeConversationRef(context);

      const text = (context.activity.text || "").trim();
      const removedMention = this.removeBotMention(text, context);

      if (!removedMention) {
        await next();
        return;
      }

      // Determine mode based on conversation type
      const mode = this.getMode(context);

      // Show typing indicator
      await context.sendActivity({ type: "typing" });

      // Process through Claude
      const conversationId = this.getConversationId(context);
      const response = await this.engine.processMessage(conversationId, removedMention, mode);

      // Send response — use Adaptive Card if response contains structured data indicators
      await context.sendActivity(MessageFactory.text(response));
      await next();
    });

    // Handle new members added (bot installed)
    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded || [];
      for (const member of membersAdded) {
        if (member.id !== context.activity.recipient.id) {
          continue;
        }
        // Bot was added — send welcome message
        await context.sendActivity(
          MessageFactory.text(
            "**Coryphaeus CRM Assistant**\n\n" +
            "I'm your AI-powered CRM assistant. I can help you with:\n\n" +
            "- **Deal lookups** — \"What are my top deals?\"\n" +
            "- **Pipeline overview** — \"Show me the pipeline summary\"\n" +
            "- **Account info** — \"Tell me about Northwind Traders\"\n" +
            "- **Activity summaries** — \"Summarize my activity this week\"\n" +
            "- **Contact search** — \"Find contacts at Contoso\"\n" +
            "- **Account plans** — \"What's the plan for Northwind?\"\n\n" +
            "In meetings, I can listen to discussions and interject with relevant CRM data. " +
            "Just mention a company or ask me directly!"
          )
        );
      }
      await next();
    });

    // Handle conversation updates (meeting events)
    this.onConversationUpdate(async (context, next) => {
      this.storeConversationRef(context);
      await next();
    });
  }

  // Process meeting transcript segment (called by meeting handler)
  async handleMeetingTranscript(
    meetingId: string,
    transcript: string,
    speaker: string
  ): Promise<{ shouldInterject: boolean; response: string | null }> {
    return await this.engine.processMeetingTranscript(meetingId, transcript, speaker);
  }

  // Send proactive message to a conversation
  async sendProactiveMessage(
    adapter: unknown,
    conversationId: string,
    message: string
  ): Promise<void> {
    const ref = this.conversationRefs.get(conversationId);
    if (!ref) {
      console.warn(`No conversation reference found for ${conversationId}`);
      return;
    }

    // Use adapter to send proactive message
    // This requires the BotFrameworkAdapter.continueConversation method
    // Implementation depends on the adapter instance passed in
    console.log(`Proactive message to ${conversationId}: ${message}`);
  }

  getConversationRefs(): Map<string, Partial<ConversationReference>> {
    return this.conversationRefs;
  }

  private storeConversationRef(context: TurnContext): void {
    const ref = TurnContext.getConversationReference(context.activity);
    const key = ref.conversation?.id || "";
    if (key) {
      this.conversationRefs.set(key, ref);
    }
  }

  private getConversationId(context: TurnContext): string {
    return context.activity.conversation?.id || "default";
  }

  private getMode(context: TurnContext): AgentMode {
    const conversationType = context.activity.conversation?.conversationType;

    // Meeting chat
    if (context.activity.channelData?.meeting) {
      return "meeting_chat";
    }

    // Group/channel chat
    if (conversationType === "groupChat" || conversationType === "channel") {
      return "chat";
    }

    // 1:1 personal chat
    return "chat";
  }

  private removeBotMention(text: string, context: TurnContext): string {
    // Remove @mention of the bot from the message text
    const mentions = context.activity.entities?.filter(e => e.type === "mention") || [];
    let cleaned = text;
    for (const mention of mentions) {
      if (mention.mentioned?.id === context.activity.recipient.id) {
        cleaned = cleaned.replace(mention.text || "", "").trim();
      }
    }
    return cleaned;
  }
}
