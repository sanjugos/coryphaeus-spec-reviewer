// Coryphaeus CRM Entity Types (aligned with v3.1 48-entity data model)

export interface Account {
  id: string;
  tenant_id: string;
  name: string;
  domain: string;
  industry: string;
  employee_count: number;
  annual_revenue: number;
  currency: string;
  stage: "prospect" | "active" | "churned" | "partner";
  owner_id: string;
  owner_name: string;
  health_score: number; // 0-100
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  tenant_id: string;
  account_id: string;
  account_name: string;
  first_name: string;
  last_name: string;
  title: string;
  email: string;
  phone: string;
  role: "decision_maker" | "influencer" | "champion" | "blocker" | "end_user";
  sentiment: "positive" | "neutral" | "negative";
  last_contacted: string;
  created_at: string;
}

export interface Opportunity {
  id: string;
  tenant_id: string;
  account_id: string;
  account_name: string;
  name: string;
  stage: "qualification" | "discovery" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
  amount: number;
  currency: string;
  close_date: string;
  probability: number; // 0-100
  owner_id: string;
  owner_name: string;
  products: string[];
  competitor: string | null;
  next_step: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  tenant_id: string;
  type: "call" | "email" | "meeting" | "task" | "note";
  subject: string;
  description: string;
  entity_type: "account" | "contact" | "opportunity";
  entity_id: string;
  entity_name: string;
  owner_id: string;
  owner_name: string;
  status: "completed" | "scheduled" | "overdue" | "cancelled";
  due_date: string;
  completed_at: string | null;
  created_at: string;
}

export interface AccountPlan {
  id: string;
  tenant_id: string;
  account_id: string;
  account_name: string;
  fiscal_year: string;
  target_revenue: number;
  actual_revenue: number;
  currency: string;
  status: "draft" | "active" | "completed";
  objectives: string[];
  risks: string[];
  whitespace: string[];
  owner_id: string;
  owner_name: string;
  created_at: string;
  updated_at: string;
}

export interface PipelineSummary {
  total_value: number;
  currency: string;
  deal_count: number;
  weighted_value: number;
  by_stage: Record<string, { count: number; value: number }>;
  avg_deal_size: number;
  avg_close_days: number;
  win_rate: number;
}

export interface ActivitySummary {
  period: string;
  calls: number;
  emails: number;
  meetings: number;
  tasks_completed: number;
  tasks_overdue: number;
  notes: number;
  total: number;
  top_accounts: { name: string; activity_count: number }[];
}

export interface CrmQueryResult {
  success: boolean;
  data: unknown;
  message?: string;
}
