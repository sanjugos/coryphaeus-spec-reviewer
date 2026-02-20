import Anthropic from "@anthropic-ai/sdk";

// CRM tool definitions for Claude function calling

export const CRM_TOOLS: Anthropic.Tool[] = [
  {
    name: "crm_query",
    description: `Execute a read-only SQL query against the Coryphaeus CRM database. Use this for ANY CRM data question.

Available tables and their key columns:

ACCOUNTS: id, name, industry, type (Customer/Prospect/Partner), city, country, annual_revenue, currency, employees, owner, health_score, created_at
CONTACTS: id, full_name, email, phone, account_id, account_name, title, department, lifecycle_stage, role (decision_maker/influencer/champion/blocker/end_user), sentiment (positive/neutral/negative), owner, last_contacted, created_at
OPPORTUNITIES: id, name, account_id, account_name, amount, currency, stage (Prospecting/Qualification/Proposal/Negotiation/Closed Won/Closed Lost), probability, close_date, type, owner, products (text array), competitor, next_step, created_at
ACTIVITIES: id, subject, type (Call/Email/Meeting/Task/Note), status (Completed/Planned/In Progress/Cancelled), related_entity, related_id, related_name, due_date, duration_minutes, description, owner, created_at
ACCOUNT_PLANS: id, name, account_id, account_name, fiscal_year, target_revenue, current_revenue, currency, status, strategy, objectives (text array), risks (text array), whitespace (text array), owner, created_at
COMPETITORS: id, name, strength, weakness

Use standard PostgreSQL syntax. Only SELECT queries are allowed. Always use LIMIT for large result sets.

Examples:
- "How many contacts?" → SELECT COUNT(*) FROM contacts
- "Top 5 accounts by revenue" → SELECT name, annual_revenue, industry FROM accounts ORDER BY annual_revenue DESC LIMIT 5
- "Deals closing this month" → SELECT name, account_name, amount, close_date FROM opportunities WHERE close_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days') AND stage NOT IN ('Closed Won', 'Closed Lost')
- "Who owns the most deals?" → SELECT owner, COUNT(*) as deal_count, SUM(amount) as total_value FROM opportunities WHERE stage NOT IN ('Closed Won', 'Closed Lost') GROUP BY owner ORDER BY total_value DESC`,
    input_schema: {
      type: "object" as const,
      properties: {
        sql: { type: "string", description: "The SELECT SQL query to execute" },
        explanation: { type: "string", description: "Brief explanation of what this query does (for logging)" }
      },
      required: ["sql"]
    }
  },
  {
    name: "search_accounts",
    description: "Quick search for accounts by name, industry, or location. Use crm_query for more complex account queries.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Company name, industry, or location to search for" }
      },
      required: ["query"]
    }
  },
  {
    name: "search_contacts",
    description: "Quick search for contacts by name, email, title, or company. Use crm_query for more complex contact queries.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Contact name, email, title, or company name" },
        account_id: { type: "string", description: "Optional: filter by account ID" }
      },
      required: ["query"]
    }
  },
  {
    name: "get_top_deals",
    description: "Get top open deals sorted by value, close date, or probability.",
    input_schema: {
      type: "object" as const,
      properties: {
        sort_by: {
          type: "string",
          enum: ["amount", "close_date", "probability"],
          description: "How to sort"
        },
        limit: { type: "number", description: "Number of deals (default 5)" },
        owner_id: { type: "string", description: "Optional: filter by deal owner name" }
      },
      required: ["sort_by"]
    }
  },
  {
    name: "get_pipeline_summary",
    description: "Get pipeline summary with total value, deal count, weighted value, win rate, and stage breakdown.",
    input_schema: {
      type: "object" as const,
      properties: {
        owner_id: { type: "string", description: "Optional: filter by owner name" }
      },
      required: []
    }
  },
  {
    name: "get_activity_summary",
    description: "Get activity summary (calls, emails, meetings, tasks) for a time period.",
    input_schema: {
      type: "object" as const,
      properties: {
        entity_type: { type: "string", enum: ["account", "contact", "opportunity"], description: "Optional: filter by entity type" },
        entity_id: { type: "string", description: "Optional: filter by entity ID" },
        time_range: { type: "string", description: "Time period: 'past week', 'past month', 'past quarter'" }
      },
      required: []
    }
  },
  {
    name: "get_account_plan",
    description: "Get account plan with targets, objectives, risks, and whitespace.",
    input_schema: {
      type: "object" as const,
      properties: {
        account_id: { type: "string", description: "The account ID" }
      },
      required: ["account_id"]
    }
  },
  {
    name: "get_recent_activities",
    description: "Get the most recent activities across all accounts.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Number of activities (default 10)" },
        owner_id: { type: "string", description: "Optional: filter by owner name" }
      },
      required: []
    }
  },
  {
    name: "get_deal_intelligence",
    description: `Retrieve accumulated intelligence and observations about a deal, account, or contact. This data comes from passively observing team conversations and meetings — it captures deal risks, budget signals, sentiment, competitive intel, timeline changes, stakeholder changes, and next steps that were discussed.

Use this tool when someone asks "what do you think?", "any thoughts?", "what have you heard?", "what's the latest on...", or similar open-ended questions about a deal or account. Also use it to supplement CRM data with conversational intelligence.

The results are observational (from conversations) — distinguish them from factual CRM data when presenting to users.`,
    input_schema: {
      type: "object" as const,
      properties: {
        entity_name: { type: "string", description: "Name of the account, deal, or contact to look up intelligence for" },
        entity_type: { type: "string", enum: ["account", "opportunity", "contact"], description: "Optional: filter by entity type" },
        insight_type: { type: "string", enum: ["deal_risk", "budget_signal", "sentiment", "competitive_intel", "timeline_change", "stakeholder_change", "next_step", "general"], description: "Optional: filter by insight type" },
        limit: { type: "number", description: "Number of insights to return (default 20)" }
      },
      required: ["entity_name"]
    }
  }
];
