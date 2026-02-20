import Anthropic from "@anthropic-ai/sdk";
import { CRM_TOOLS } from "./tools";
import { CHAT_SYSTEM_PROMPT, MEETING_SYSTEM_PROMPT, MEETING_CHAT_SYSTEM_PROMPT } from "./prompts";
import { CrmClient } from "../crm/client";
import { getPool } from "../crm/database";

export type AgentMode = "chat" | "meeting" | "meeting_chat";

interface ToolInput {
  query?: string;
  sql?: string;
  explanation?: string;
  account_id?: string;
  sort_by?: string;
  limit?: number;
  owner_id?: string;
  entity_type?: string;
  entity_id?: string;
  time_range?: string;
}

const SYSTEM_PROMPTS: Record<AgentMode, string> = {
  chat: CHAT_SYSTEM_PROMPT,
  meeting: MEETING_SYSTEM_PROMPT,
  meeting_chat: MEETING_CHAT_SYSTEM_PROMPT,
};

export class ClaudeEngine {
  private client: Anthropic;
  private crm: CrmClient;
  private model: string;
  private conversationHistory: Map<string, Anthropic.MessageParam[]>;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.crm = new CrmClient();
    this.model = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";
    this.conversationHistory = new Map();
  }

  async processMessage(
    conversationId: string,
    userMessage: string,
    mode: AgentMode = "chat"
  ): Promise<string> {
    // Get or create conversation history
    if (!this.conversationHistory.has(conversationId)) {
      this.conversationHistory.set(conversationId, []);
    }
    const history = this.conversationHistory.get(conversationId)!;

    // Add user message
    history.push({ role: "user", content: userMessage });

    // Keep history manageable (last 20 turns)
    if (history.length > 40) {
      history.splice(0, history.length - 40);
    }

    try {
      let response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: SYSTEM_PROMPTS[mode],
        tools: CRM_TOOLS,
        messages: history,
      });

      // Tool use loop — execute tools until Claude produces a text response
      while (response.stop_reason === "tool_use") {
        const toolUseBlocks = response.content.filter(
          (block): block is Anthropic.ContentBlockParam & { type: "tool_use"; id: string; name: string; input: ToolInput } =>
            block.type === "tool_use"
        );

        // Add assistant response with tool calls to history
        history.push({ role: "assistant", content: response.content });

        // Execute each tool and collect results — catch per-tool errors
        // so the tool_result is always paired with its tool_use
        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const toolUse of toolUseBlocks) {
          let result: unknown;
          try {
            result = await this.executeTool(toolUse.name, toolUse.input);
          } catch (toolErr: unknown) {
            const msg = toolErr instanceof Error ? toolErr.message : String(toolErr);
            console.error(`[Tool Error] ${toolUse.name}: ${msg}`);
            result = { error: `Tool execution failed: ${msg}` };
          }
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          });
        }

        // Add tool results to history
        history.push({ role: "user", content: toolResults });

        // Get next response from Claude
        response = await this.client.messages.create({
          model: this.model,
          max_tokens: 1024,
          system: SYSTEM_PROMPTS[mode],
          tools: CRM_TOOLS,
          messages: history,
        });
      }

      // Extract text response
      const textBlocks = response.content.filter(
        (block): block is Anthropic.TextBlock => block.type === "text"
      );
      const reply = textBlocks.map((b) => b.text).join("\n");

      // Add assistant response to history
      history.push({ role: "assistant", content: reply });

      return reply;
    } catch (error: unknown) {
      console.error("Claude API error:", error);

      // History may be corrupted (tool_use without tool_result) — reset it
      this.conversationHistory.delete(conversationId);

      // Surface actionable details in Teams
      if (error instanceof Anthropic.AuthenticationError) {
        return "**Claude API error:** Authentication failed. The `ANTHROPIC_API_KEY` is missing or invalid.";
      }
      if (error instanceof Anthropic.NotFoundError) {
        return `**Claude API error:** Model \`${this.model}\` not found. Check the \`CLAUDE_MODEL\` env var.`;
      }
      if (error instanceof Anthropic.RateLimitError) {
        return "**Claude API error:** Rate limit exceeded. Please wait a moment and try again.";
      }
      if (error instanceof Anthropic.APIConnectionError) {
        return "**Claude API error:** Cannot reach the Anthropic API. Check network/firewall on the App Service.";
      }
      if (error instanceof Anthropic.APIError) {
        return `**Claude API error:** ${error.status} — ${error.message}`;
      }

      const message = error instanceof Error ? error.message : String(error);
      return `**Error:** ${message}`;
    }
  }

  // Process meeting transcript and decide whether to interject
  async processMeetingTranscript(
    meetingId: string,
    transcript: string,
    speaker: string
  ): Promise<{ shouldInterject: boolean; response: string | null }> {
    const prompt = `Meeting transcript update from ${speaker}:\n"${transcript}"\n\nBased on the interjection rules, should you respond? If yes, provide a concise response. If no, respond with exactly "NO_INTERJECTION".`;

    const response = await this.processMessage(
      `meeting-${meetingId}`,
      prompt,
      "meeting"
    );

    if (response.trim() === "NO_INTERJECTION") {
      return { shouldInterject: false, response: null };
    }

    return { shouldInterject: true, response };
  }

  clearConversation(conversationId: string): void {
    this.conversationHistory.delete(conversationId);
  }

  private async executeTool(name: string, input: ToolInput): Promise<unknown> {
    switch (name) {
      case "crm_query":
        return await this.executeSqlQuery(input.sql || "", input.explanation);

      case "search_accounts":
        return await this.crm.searchAccounts(input.query || "");

      case "search_contacts":
        return await this.crm.searchContacts(input.query || "", input.account_id);

      case "get_top_deals":
        return await this.crm.getTopDeals(
          input.sort_by || "amount",
          input.limit || 5,
          input.owner_id
        );

      case "get_pipeline_summary":
        return await this.crm.getPipelineSummary(input.owner_id);

      case "get_activity_summary":
        return await this.crm.getActivitySummary(
          input.entity_type,
          input.entity_id,
          input.time_range
        );

      case "get_account_plan":
        return await this.crm.getAccountPlan(input.account_id || "");

      case "get_recent_activities":
        return await this.crm.getRecentActivities(input.limit || 10, input.owner_id);

      default:
        return { error: `Unknown tool: ${name}` };
    }
  }

  private async executeSqlQuery(sql: string, explanation?: string): Promise<unknown> {
    // Safety: only allow SELECT queries
    const trimmed = sql.trim().toUpperCase();
    if (!trimmed.startsWith("SELECT")) {
      return { error: "Only SELECT queries are allowed" };
    }
    if (trimmed.includes("DROP") || trimmed.includes("DELETE") || trimmed.includes("INSERT") ||
        trimmed.includes("UPDATE") || trimmed.includes("ALTER") || trimmed.includes("TRUNCATE")) {
      return { error: "Only read-only queries are allowed" };
    }

    try {
      console.log(`[SQL] ${explanation || "Query"}: ${sql}`);
      const db = getPool();
      const result = await db.query(sql);
      return { rows: result.rows, rowCount: result.rowCount };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[SQL Error] ${message}`);
      return { error: `Query failed: ${message}` };
    }
  }
}
