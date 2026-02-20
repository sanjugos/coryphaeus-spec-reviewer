import { Account, Contact, Opportunity, Activity, AccountPlan } from "./types";

// Realistic mock CRM data for development and demo
// Replace with real data layer (Azure Table Storage / PostgreSQL) for production

export function getMockData() {
  const accounts: Account[] = [
    {
      id: "acc-001", tenant_id: "t1", name: "Northwind Traders", domain: "northwindtraders.com",
      industry: "Manufacturing", employee_count: 2500, annual_revenue: 450000000, currency: "USD",
      stage: "active", owner_id: "user-01", owner_name: "Sarah Chen", health_score: 85,
      created_at: "2024-03-15", updated_at: "2026-02-10"
    },
    {
      id: "acc-002", tenant_id: "t1", name: "Contoso Ltd", domain: "contoso.com",
      industry: "Technology", employee_count: 8000, annual_revenue: 1200000000, currency: "USD",
      stage: "active", owner_id: "user-01", owner_name: "Sarah Chen", health_score: 72,
      created_at: "2024-06-20", updated_at: "2026-02-14"
    },
    {
      id: "acc-003", tenant_id: "t1", name: "Adventure Works", domain: "adventureworks.com",
      industry: "Retail", employee_count: 5000, annual_revenue: 800000000, currency: "USD",
      stage: "active", owner_id: "user-02", owner_name: "Marcus Johnson", health_score: 91,
      created_at: "2024-01-10", updated_at: "2026-02-18"
    },
    {
      id: "acc-004", tenant_id: "t1", name: "Fabrikam Inc", domain: "fabrikam.com",
      industry: "Financial Services", employee_count: 12000, annual_revenue: 3500000000, currency: "USD",
      stage: "prospect", owner_id: "user-01", owner_name: "Sarah Chen", health_score: 60,
      created_at: "2025-11-05", updated_at: "2026-02-15"
    },
    {
      id: "acc-005", tenant_id: "t1", name: "Woodgrove Bank", domain: "woodgrovebank.com",
      industry: "Financial Services", employee_count: 20000, annual_revenue: 5000000000, currency: "USD",
      stage: "active", owner_id: "user-02", owner_name: "Marcus Johnson", health_score: 78,
      created_at: "2024-09-12", updated_at: "2026-02-12"
    },
    {
      id: "acc-006", tenant_id: "t1", name: "Tailspin Toys", domain: "tailspintoys.com",
      industry: "Consumer Goods", employee_count: 1200, annual_revenue: 180000000, currency: "USD",
      stage: "active", owner_id: "user-03", owner_name: "Priya Sharma", health_score: 88,
      created_at: "2025-02-28", updated_at: "2026-02-16"
    }
  ];

  const contacts: Contact[] = [
    {
      id: "con-001", tenant_id: "t1", account_id: "acc-001", account_name: "Northwind Traders",
      first_name: "James", last_name: "Wilson", title: "VP of Operations",
      email: "jwilson@northwindtraders.com", phone: "+1-555-0101",
      role: "decision_maker", sentiment: "positive", last_contacted: "2026-02-15", created_at: "2024-03-20"
    },
    {
      id: "con-002", tenant_id: "t1", account_id: "acc-001", account_name: "Northwind Traders",
      first_name: "Emily", last_name: "Chang", title: "Director of IT",
      email: "echang@northwindtraders.com", phone: "+1-555-0102",
      role: "influencer", sentiment: "positive", last_contacted: "2026-02-10", created_at: "2024-04-05"
    },
    {
      id: "con-003", tenant_id: "t1", account_id: "acc-002", account_name: "Contoso Ltd",
      first_name: "Robert", last_name: "Kim", title: "CTO",
      email: "rkim@contoso.com", phone: "+1-555-0201",
      role: "decision_maker", sentiment: "neutral", last_contacted: "2026-02-12", created_at: "2024-06-25"
    },
    {
      id: "con-004", tenant_id: "t1", account_id: "acc-002", account_name: "Contoso Ltd",
      first_name: "Lisa", last_name: "Park", title: "Head of Procurement",
      email: "lpark@contoso.com", phone: "+1-555-0202",
      role: "champion", sentiment: "positive", last_contacted: "2026-02-18", created_at: "2024-07-15"
    },
    {
      id: "con-005", tenant_id: "t1", account_id: "acc-003", account_name: "Adventure Works",
      first_name: "David", last_name: "Martinez", title: "CEO",
      email: "dmartinez@adventureworks.com", phone: "+1-555-0301",
      role: "decision_maker", sentiment: "positive", last_contacted: "2026-02-17", created_at: "2024-01-15"
    },
    {
      id: "con-006", tenant_id: "t1", account_id: "acc-004", account_name: "Fabrikam Inc",
      first_name: "Jennifer", last_name: "Lee", title: "VP of Digital Transformation",
      email: "jlee@fabrikam.com", phone: "+1-555-0401",
      role: "champion", sentiment: "positive", last_contacted: "2026-02-14", created_at: "2025-11-10"
    },
    {
      id: "con-007", tenant_id: "t1", account_id: "acc-004", account_name: "Fabrikam Inc",
      first_name: "Thomas", last_name: "Brown", title: "CFO",
      email: "tbrown@fabrikam.com", phone: "+1-555-0402",
      role: "blocker", sentiment: "negative", last_contacted: "2026-01-28", created_at: "2025-12-01"
    },
    {
      id: "con-008", tenant_id: "t1", account_id: "acc-005", account_name: "Woodgrove Bank",
      first_name: "Anna", last_name: "Nguyen", title: "Head of Technology",
      email: "anguyen@woodgrovebank.com", phone: "+1-555-0501",
      role: "decision_maker", sentiment: "neutral", last_contacted: "2026-02-11", created_at: "2024-09-20"
    }
  ];

  const opportunities: Opportunity[] = [
    {
      id: "opp-001", tenant_id: "t1", account_id: "acc-001", account_name: "Northwind Traders",
      name: "Northwind ERP Modernization", stage: "negotiation", amount: 850000, currency: "USD",
      close_date: "2026-03-30", probability: 75, owner_id: "user-01", owner_name: "Sarah Chen",
      products: ["Enterprise CRM", "Account Planning Module", "Integration Suite"],
      competitor: "Salesforce", next_step: "Final pricing review with VP Ops",
      created_at: "2025-08-15", updated_at: "2026-02-15"
    },
    {
      id: "opp-002", tenant_id: "t1", account_id: "acc-002", account_name: "Contoso Ltd",
      name: "Contoso CRM Replacement", stage: "proposal", amount: 1200000, currency: "USD",
      close_date: "2026-04-15", probability: 50, owner_id: "user-01", owner_name: "Sarah Chen",
      products: ["Enterprise CRM", "AI Intelligence Module", "Service Module"],
      competitor: "Microsoft Dynamics 365", next_step: "Present technical architecture to CTO",
      created_at: "2025-10-01", updated_at: "2026-02-14"
    },
    {
      id: "opp-003", tenant_id: "t1", account_id: "acc-003", account_name: "Adventure Works",
      name: "Adventure Works Account Planning", stage: "discovery", amount: 450000, currency: "USD",
      close_date: "2026-06-30", probability: 35, owner_id: "user-02", owner_name: "Marcus Johnson",
      products: ["Account Planning Module", "Analytics Dashboard"],
      competitor: null, next_step: "Discovery workshop scheduled for March 5",
      created_at: "2026-01-10", updated_at: "2026-02-18"
    },
    {
      id: "opp-004", tenant_id: "t1", account_id: "acc-004", account_name: "Fabrikam Inc",
      name: "Fabrikam Digital CRM", stage: "qualification", amount: 2500000, currency: "USD",
      close_date: "2026-09-30", probability: 20, owner_id: "user-01", owner_name: "Sarah Chen",
      products: ["Enterprise CRM", "Account Planning Module", "AI Intelligence Module", "Marketing Module"],
      competitor: "HubSpot Enterprise", next_step: "Qualify budget with CFO — known blocker",
      created_at: "2025-12-15", updated_at: "2026-02-15"
    },
    {
      id: "opp-005", tenant_id: "t1", account_id: "acc-005", account_name: "Woodgrove Bank",
      name: "Woodgrove Service Desk", stage: "proposal", amount: 680000, currency: "USD",
      close_date: "2026-05-15", probability: 60, owner_id: "user-02", owner_name: "Marcus Johnson",
      products: ["Service Module", "Case Management", "Knowledge Base"],
      competitor: "ServiceNow", next_step: "RFP response due March 1",
      created_at: "2025-11-20", updated_at: "2026-02-12"
    },
    {
      id: "opp-006", tenant_id: "t1", account_id: "acc-006", account_name: "Tailspin Toys",
      name: "Tailspin Sales Automation", stage: "negotiation", amount: 320000, currency: "USD",
      close_date: "2026-03-15", probability: 80, owner_id: "user-03", owner_name: "Priya Sharma",
      products: ["Enterprise CRM", "Sales Automation"],
      competitor: "Pipedrive", next_step: "Contract review with legal",
      created_at: "2025-09-10", updated_at: "2026-02-16"
    },
    {
      id: "opp-007", tenant_id: "t1", account_id: "acc-001", account_name: "Northwind Traders",
      name: "Northwind Marketing Suite", stage: "closed_won", amount: 180000, currency: "USD",
      close_date: "2026-01-20", probability: 100, owner_id: "user-01", owner_name: "Sarah Chen",
      products: ["Marketing Module", "Campaign Manager"],
      competitor: "Marketo", next_step: "Implementation kickoff Feb 28",
      created_at: "2025-06-15", updated_at: "2026-01-20"
    },
    {
      id: "opp-008", tenant_id: "t1", account_id: "acc-003", account_name: "Adventure Works",
      name: "Adventure Works Pilot", stage: "closed_lost", amount: 95000, currency: "USD",
      close_date: "2025-12-15", probability: 0, owner_id: "user-02", owner_name: "Marcus Johnson",
      products: ["Enterprise CRM"],
      competitor: "Salesforce", next_step: "Lost — budget frozen. Re-engage Q2.",
      created_at: "2025-05-01", updated_at: "2025-12-15"
    }
  ];

  const now = new Date();
  const daysAgo = (d: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    return date.toISOString().split("T")[0];
  };

  const activities: Activity[] = [
    {
      id: "act-001", tenant_id: "t1", type: "meeting", subject: "Quarterly Business Review",
      description: "QBR with Northwind leadership. Discussed expansion into supply chain module.",
      entity_type: "account", entity_id: "acc-001", entity_name: "Northwind Traders",
      owner_id: "user-01", owner_name: "Sarah Chen", status: "completed",
      due_date: daysAgo(2), completed_at: daysAgo(2), created_at: daysAgo(2)
    },
    {
      id: "act-002", tenant_id: "t1", type: "call", subject: "Pricing discussion with James Wilson",
      description: "Reviewed enterprise pricing. James wants 15% volume discount for 3-year commitment.",
      entity_type: "opportunity", entity_id: "opp-001", entity_name: "Northwind ERP Modernization",
      owner_id: "user-01", owner_name: "Sarah Chen", status: "completed",
      due_date: daysAgo(1), completed_at: daysAgo(1), created_at: daysAgo(1)
    },
    {
      id: "act-003", tenant_id: "t1", type: "email", subject: "Technical architecture deck sent",
      description: "Sent Coryphaeus platform architecture overview to Robert Kim for CTO review.",
      entity_type: "opportunity", entity_id: "opp-002", entity_name: "Contoso CRM Replacement",
      owner_id: "user-01", owner_name: "Sarah Chen", status: "completed",
      due_date: daysAgo(3), completed_at: daysAgo(3), created_at: daysAgo(3)
    },
    {
      id: "act-004", tenant_id: "t1", type: "task", subject: "Prepare RFP response for Woodgrove",
      description: "Complete RFP response for Woodgrove Bank service desk opportunity. Due March 1.",
      entity_type: "opportunity", entity_id: "opp-005", entity_name: "Woodgrove Service Desk",
      owner_id: "user-02", owner_name: "Marcus Johnson", status: "overdue",
      due_date: daysAgo(1), completed_at: null, created_at: daysAgo(7)
    },
    {
      id: "act-005", tenant_id: "t1", type: "meeting", subject: "Discovery workshop planning",
      description: "Planned discovery workshop agenda for Adventure Works. 3-hour session covering current pain points.",
      entity_type: "opportunity", entity_id: "opp-003", entity_name: "Adventure Works Account Planning",
      owner_id: "user-02", owner_name: "Marcus Johnson", status: "completed",
      due_date: daysAgo(4), completed_at: daysAgo(4), created_at: daysAgo(5)
    },
    {
      id: "act-006", tenant_id: "t1", type: "call", subject: "Budget qualification with Jennifer Lee",
      description: "Jennifer confirmed $2-3M budget allocated. CFO Thomas Brown still skeptical — needs ROI case.",
      entity_type: "opportunity", entity_id: "opp-004", entity_name: "Fabrikam Digital CRM",
      owner_id: "user-01", owner_name: "Sarah Chen", status: "completed",
      due_date: daysAgo(5), completed_at: daysAgo(5), created_at: daysAgo(5)
    },
    {
      id: "act-007", tenant_id: "t1", type: "email", subject: "Contract sent to Tailspin Toys",
      description: "Final contract with pricing terms sent to Tailspin legal team for review.",
      entity_type: "opportunity", entity_id: "opp-006", entity_name: "Tailspin Sales Automation",
      owner_id: "user-03", owner_name: "Priya Sharma", status: "completed",
      due_date: daysAgo(1), completed_at: daysAgo(1), created_at: daysAgo(1)
    },
    {
      id: "act-008", tenant_id: "t1", type: "note", subject: "Competitive intel update",
      description: "Salesforce raised prices 12% this quarter. Multiple Northwind contacts mentioned frustration. Good timing for our proposal.",
      entity_type: "account", entity_id: "acc-001", entity_name: "Northwind Traders",
      owner_id: "user-01", owner_name: "Sarah Chen", status: "completed",
      due_date: daysAgo(3), completed_at: daysAgo(3), created_at: daysAgo(3)
    },
    {
      id: "act-009", tenant_id: "t1", type: "task", subject: "Update Fabrikam ROI model",
      description: "Build ROI model showing 3-year TCO savings vs HubSpot Enterprise for CFO presentation.",
      entity_type: "opportunity", entity_id: "opp-004", entity_name: "Fabrikam Digital CRM",
      owner_id: "user-01", owner_name: "Sarah Chen", status: "scheduled",
      due_date: daysAgo(-5), completed_at: null, created_at: daysAgo(2)
    },
    {
      id: "act-010", tenant_id: "t1", type: "meeting", subject: "Contoso technical deep-dive",
      description: "2-hour session with Contoso engineering team. Covered API integration, data migration from D365.",
      entity_type: "opportunity", entity_id: "opp-002", entity_name: "Contoso CRM Replacement",
      owner_id: "user-01", owner_name: "Sarah Chen", status: "completed",
      due_date: daysAgo(6), completed_at: daysAgo(6), created_at: daysAgo(8)
    }
  ];

  const accountPlans: AccountPlan[] = [
    {
      id: "plan-001", tenant_id: "t1", account_id: "acc-001", account_name: "Northwind Traders",
      fiscal_year: "FY2026", target_revenue: 1200000, actual_revenue: 1030000, currency: "USD",
      status: "active",
      objectives: [
        "Expand from Marketing module to full CRM replacement",
        "Displace Salesforce as primary CRM by Q3",
        "Achieve 90%+ user adoption within 6 months of go-live"
      ],
      risks: [
        "Salesforce has incumbent advantage and integration lock-in",
        "IT team has concerns about migration timeline"
      ],
      whitespace: [
        "Supply chain management module — not currently using any tool",
        "Service desk — using email-based ticketing",
        "Account planning — no formal process today"
      ],
      owner_id: "user-01", owner_name: "Sarah Chen",
      created_at: "2025-10-01", updated_at: "2026-02-15"
    },
    {
      id: "plan-002", tenant_id: "t1", account_id: "acc-002", account_name: "Contoso Ltd",
      fiscal_year: "FY2026", target_revenue: 1500000, actual_revenue: 0, currency: "USD",
      status: "active",
      objectives: [
        "Win CRM replacement deal against D365",
        "Prove AI-native capabilities in POC",
        "Land initial deal and expand to marketing module in FY2027"
      ],
      risks: [
        "Strong Microsoft relationship — D365 is the safe choice",
        "CTO Robert Kim is cautious about non-Microsoft vendors",
        "Long procurement cycle — 6+ months typical"
      ],
      whitespace: [
        "AI-driven insights — current D365 lacks native AI",
        "Account planning — no tool in place",
        "Marketing automation — using basic Mailchimp"
      ],
      owner_id: "user-01", owner_name: "Sarah Chen",
      created_at: "2025-10-15", updated_at: "2026-02-14"
    }
  ];

  return { accounts, contacts, opportunities, activities, accountPlans };
}
