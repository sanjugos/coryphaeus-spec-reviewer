// Adaptive Card templates for rich CRM data display in Teams

export interface AdaptiveCard {
  type: "AdaptiveCard";
  $schema: string;
  version: string;
  body: unknown[];
  actions?: unknown[];
}

const SCHEMA = "http://adaptivecards.io/schemas/adaptive-card.json";

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function stageColor(stage: string): string {
  const colors: Record<string, string> = {
    qualification: "warning",
    discovery: "warning",
    proposal: "accent",
    negotiation: "good",
    closed_won: "good",
    closed_lost: "attention",
  };
  return colors[stage] || "default";
}

export function createDealCard(deal: {
  name: string;
  account_name: string;
  stage: string;
  amount: number;
  currency: string;
  close_date: string;
  probability: number;
  owner_name: string;
  competitor: string | null;
  next_step: string;
}): AdaptiveCard {
  return {
    type: "AdaptiveCard",
    $schema: SCHEMA,
    version: "1.5",
    body: [
      {
        type: "ColumnSet",
        columns: [
          {
            type: "Column",
            width: "stretch",
            items: [
              { type: "TextBlock", text: deal.name, weight: "bolder", size: "medium", wrap: true },
              { type: "TextBlock", text: deal.account_name, spacing: "none", isSubtle: true }
            ]
          },
          {
            type: "Column",
            width: "auto",
            items: [
              { type: "TextBlock", text: formatCurrency(deal.amount, deal.currency), weight: "bolder", size: "large", color: "good" }
            ]
          }
        ]
      },
      {
        type: "FactSet",
        facts: [
          { title: "Stage", value: deal.stage.replace(/_/g, " ").toUpperCase() },
          { title: "Probability", value: `${deal.probability}%` },
          { title: "Close Date", value: deal.close_date },
          { title: "Owner", value: deal.owner_name },
          ...(deal.competitor ? [{ title: "Competitor", value: deal.competitor }] : []),
          { title: "Next Step", value: deal.next_step },
        ]
      }
    ]
  };
}

export function createPipelineCard(pipeline: {
  total_value: number;
  currency: string;
  deal_count: number;
  weighted_value: number;
  win_rate: number;
  by_stage: Record<string, { count: number; value: number }>;
}): AdaptiveCard {
  const stageRows = Object.entries(pipeline.by_stage).map(([stage, data]) => ({
    type: "ColumnSet",
    columns: [
      { type: "Column", width: "stretch", items: [{ type: "TextBlock", text: stage.replace(/_/g, " ").toUpperCase(), weight: "bolder" }] },
      { type: "Column", width: "auto", items: [{ type: "TextBlock", text: `${data.count} deals` }] },
      { type: "Column", width: "auto", items: [{ type: "TextBlock", text: formatCurrency(data.value, pipeline.currency), weight: "bolder" }] },
    ]
  }));

  return {
    type: "AdaptiveCard",
    $schema: SCHEMA,
    version: "1.5",
    body: [
      { type: "TextBlock", text: "Pipeline Summary", weight: "bolder", size: "large" },
      {
        type: "ColumnSet",
        columns: [
          {
            type: "Column", width: "stretch",
            items: [
              { type: "TextBlock", text: "Total Pipeline", isSubtle: true, spacing: "none" },
              { type: "TextBlock", text: formatCurrency(pipeline.total_value, pipeline.currency), weight: "bolder", size: "extraLarge", color: "accent", spacing: "none" }
            ]
          },
          {
            type: "Column", width: "stretch",
            items: [
              { type: "TextBlock", text: "Weighted Value", isSubtle: true, spacing: "none" },
              { type: "TextBlock", text: formatCurrency(pipeline.weighted_value, pipeline.currency), weight: "bolder", size: "extraLarge", color: "good", spacing: "none" }
            ]
          }
        ]
      },
      {
        type: "FactSet",
        facts: [
          { title: "Open Deals", value: `${pipeline.deal_count}` },
          { title: "Win Rate", value: `${pipeline.win_rate}%` },
        ]
      },
      { type: "TextBlock", text: "By Stage", weight: "bolder", spacing: "medium" },
      ...stageRows,
    ]
  };
}

export function createActivitySummaryCard(summary: {
  period: string;
  calls: number;
  emails: number;
  meetings: number;
  tasks_completed: number;
  tasks_overdue: number;
  total: number;
  top_accounts: { name: string; activity_count: number }[];
}): AdaptiveCard {
  return {
    type: "AdaptiveCard",
    $schema: SCHEMA,
    version: "1.5",
    body: [
      { type: "TextBlock", text: `Activity Summary — ${summary.period}`, weight: "bolder", size: "large" },
      { type: "TextBlock", text: `${summary.total} total activities`, size: "medium", color: "accent" },
      {
        type: "ColumnSet",
        columns: [
          {
            type: "Column", width: "stretch",
            items: [
              { type: "FactSet", facts: [
                { title: "Calls", value: `${summary.calls}` },
                { title: "Emails", value: `${summary.emails}` },
                { title: "Meetings", value: `${summary.meetings}` },
              ]}
            ]
          },
          {
            type: "Column", width: "stretch",
            items: [
              { type: "FactSet", facts: [
                { title: "Tasks Done", value: `${summary.tasks_completed}` },
                { title: "Tasks Overdue", value: summary.tasks_overdue > 0 ? `⚠ ${summary.tasks_overdue}` : "0" },
              ]}
            ]
          }
        ]
      },
      ...(summary.top_accounts.length > 0 ? [
        { type: "TextBlock", text: "Most Active Accounts", weight: "bolder", spacing: "medium" },
        ...summary.top_accounts.map(a => ({
          type: "ColumnSet",
          columns: [
            { type: "Column", width: "stretch", items: [{ type: "TextBlock", text: a.name }] },
            { type: "Column", width: "auto", items: [{ type: "TextBlock", text: `${a.activity_count} activities`, weight: "bolder" }] },
          ]
        }))
      ] : []),
    ]
  };
}

export function createAccountCard(account: {
  name: string;
  industry: string;
  employee_count: number;
  annual_revenue: number;
  currency: string;
  stage: string;
  owner_name: string;
  health_score: number;
}): AdaptiveCard {
  const healthColor = account.health_score >= 80 ? "good" : account.health_score >= 60 ? "warning" : "attention";
  return {
    type: "AdaptiveCard",
    $schema: SCHEMA,
    version: "1.5",
    body: [
      {
        type: "ColumnSet",
        columns: [
          {
            type: "Column", width: "stretch",
            items: [
              { type: "TextBlock", text: account.name, weight: "bolder", size: "large", wrap: true },
              { type: "TextBlock", text: account.industry, spacing: "none", isSubtle: true }
            ]
          },
          {
            type: "Column", width: "auto",
            items: [
              { type: "TextBlock", text: "Health", isSubtle: true, horizontalAlignment: "right", spacing: "none" },
              { type: "TextBlock", text: `${account.health_score}/100`, weight: "bolder", size: "extraLarge", color: healthColor, horizontalAlignment: "right", spacing: "none" }
            ]
          }
        ]
      },
      {
        type: "FactSet",
        facts: [
          { title: "Revenue", value: formatCurrency(account.annual_revenue, account.currency) },
          { title: "Employees", value: account.employee_count.toLocaleString() },
          { title: "Stage", value: account.stage.toUpperCase() },
          { title: "Owner", value: account.owner_name },
        ]
      }
    ]
  };
}
