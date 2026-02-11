import { useState, useEffect, useRef, useCallback } from "react";

// ── Spec Data (v3.1) ──────────────────────────────────────────────────
const S = [
["00-frontmatter","Front Matter & Document Info",1,[
[0,"h","CORYPHAEUS — Enterprise CRM + Account Planning Platform",0],
[1,"p","Functional Specification v3.1",1],
[2,"p","Document Version: 3.1 | Product: Coryphaeus Enterprise CRM",0],
[3,"p","Author: Stephen Raj / ForwardAI.dev | Date: February 2026",0],
[4,"p","Status: Architecture & Design Phase",0],
[5,"p","Competitors Analysed: 27 platforms | Data Model: 48 core entities (expanded from 43 in v3.0)",0],
[6,"p","Feature Comparison: 14 features × 29 platforms | Entity Comparison: 24 entities × 29 platforms",0],
[7,"p","Cloud: Microsoft Azure | DB: PostgreSQL 15+ | Container: AKS | AI: Azure OpenAI + AI Services",0],
[8,"p","AI Architecture: 4-Pillar Command Center (Knowledge, Instructions, DB Variables, Tools)",0],
[9,"p","Currency: Multi-currency ISO 4217 | Language: Multi-language per-tenant",0],
]],
["01-executive-summary","1. Executive Summary",2,[
[0,"h","1. Executive Summary",0],
[1,"h","1.1 Product Vision",0],
[2,"p","Coryphaeus is a next-generation Enterprise CRM and Account Planning Platform — purpose-built for mid-market to large enterprise B2B organizations needing strategic account management integrated into CRM.",0],
[3,"p","Through analysis of 27 CRM platforms, 28 pricing models, two critical gaps identified: (1) no native account planning with pipeline rollup, (2) no AI-native intelligence beyond simple copilots.",0],
[4,"x","STRATEGIC POSITIONING: Rebranded from 'AI Revenue Operating System' to 'Enterprise CRM + Account Planning Platform' — positions against Salesforce install base.",1],
[5,"h","1.2.1 Salesforce Displacement Playbook",0],
[6,"p","Phase 1: $10/user/month account planning add-on with read-only CRM sync. Phase 2: Full CRM replacement at ~50% Salesforce pricing after 1-2 years.",0],
[7,"h","1.2.2 Token-Based AI Pricing",0],
[8,"p","Base: $30/user/month + 3,000 AI tokens. 25% markup on AI costs. Auto-stop on depletion. Enterprise BYOK option.",0],
[9,"h","1.3 Market Context",0],
[10,"p","No analyzed platform offers native account planning with offering-to-opportunity pipeline rollup as a built-in capability.",0],
[11,"h","1.4 Eight Key Differentiators",0],
[12,"h","1.4.1 Native Account Planning with Pipeline Rollup",0],
[13,"p","Account Plans select target Offerings with TCV targets, linked to Opportunities. System rolls up actual pipeline vs planned TCV — real-time planned-vs-actual visibility.",0],
[14,"h","1.4.2 Multi-Tenant Architecture (PostgreSQL RLS)",0],
[15,"p","Every table has mandatory tenant_id UUID NOT NULL. RLS policies enforce isolation at database layer.",0],
[16,"h","1.4.3 Four-Pillar AI Command Center",0],
[17,"p","Knowledge (RAG), Instructions (versioned prompts), Database Variables (CRM field injection), Tools (agent action registry with PPAE safety).",0],
[18,"x","INNOVATION: Plan-Preview-Approve-Execute (PPAE) Safety Pattern — every AI agent action follows PPAE. Differentiates from competitors with black-box AI.",2],
[19,"h","1.4.4 NL-Configurable Sales Stage Transitions",0],
[20,"h","1.4.5 BPMN 2.0 + NL Dual-Mode Process Automation",0],
[21,"h","1.4.6 Bidirectional Task Sync (SF, HubSpot, D365)",0],
[22,"h","1.4.7 Field-Level Encryption & PII Classification",0],
[23,"x","INNOVATION: PII Field Classes (Safe / Sensitive / Restricted) — enforced across web, mobile, API, and MCP Apps.",2],
[24,"h","1.4.8 48-Entity Data Model (v3.1)",1],
[25,"p","Expanded from 27 to 48 entities. New: Prospect, Offering, Account Plan, Case Study, Payment, SLA, Risk Register, Qualification Sheet, OKR Goals, Monthly Revenue Projection, Partner Contribution.",1],
[26,"h","1.5 Target Market",0],
[27,"p","Primary: Mid-market to large enterprise B2B (250-10,000+ employees). Secondary: Salesforce customers seeking account planning. Tertiary: Systems integrators.",0],
]],
["02-technical-architecture","2. Technical Architecture (2.1-2.3)",0,[
[0,"h","2.1 Architecture Overview",0],
[1,"p","Cloud-native 5-layer microservices: Presentation → API Gateway → Application (AKS) → Data → Integration.",0],
[2,"t",[["Layer","Technology Stack"],["1. Presentation","React SPA (TypeScript/Redux), React Native mobile (offline-first), Next.js admin portal, WebSocket real-time"],["2. API Gateway","Azure APIM, OAuth 2.0 + OIDC via Entra ID, tier-based rate limiting (100/1K/10K per min), API versioning v1/v2/v3"],["3. Application","11 Microservices on AKS: Account, Sales, Marketing, Service, Contact Center, AI, Workflow (Zeebe), Integration, Analytics, User, Billing"],["4. Data","PostgreSQL 15+ (Flexible Server), pgvector embeddings, Redis cache, Blob Storage, Azure AI Search, Synapse Analytics"],["5. Integration","Azure Service Bus (Topics+Subscriptions), Azure Functions, webhook engine with retry, polling scheduler"]],0],
[3,"h","2.2 Multi-Tenancy (RLS)",0],
[4,"p","Shared Database, Shared Schema, Tenant Column + RLS. Simpler migrations, efficient resources, transparent isolation.",0],
[5,"h","2.3 Database Architecture",0],
[6,"p","Multi-AZ, 35-day PITR, PgBouncer pooling. Partitioning by tenant_id+time. B-tree, GIN, partial, FTS, BRIN indexes.",0],
[7,"x","EAV Pattern for Custom Fields — users click '+' on any screen to add fields. ~20 custom fields per entity per tenant.",1],
[8,"x","Centralized Code Tables — all picklists managed through code table system. Tenant-configurable with system defaults.",1],
[9,"h","2.3.6 Multi-Currency",0],
[10,"p","System default per tenant, per-record override (ISO 4217), ISO currency symbol display, exchange rate table.",0],
[11,"h","2.3.8 Soft Delete",0],
[12,"x","Soft Delete with deleted_at TIMESTAMP — NULL = active, non-NULL = deleted. Hard delete only via admin action.",1],
]],
["03-security-encryption","2. Security & Encryption (2.4-2.5)",0,[
[0,"h","2.4 Field-Level Encryption & Tokenization",0],
[1,"p","Envelope encryption (DEK+KEK via Azure Key Vault) with AES-256-GCM. Tokenization for PII. Blind indexes for search.",0],
[2,"x","Three-Tier PII Classification: Safe (company name), Sensitive (email—click-to-reveal), Restricted (SSN—never leaves web UI).",2],
[3,"h","2.4.2 Encryptable Fields",0],
[4,"t",[["Entity","Encrypted Fields"],["Contact","email, phone, DOB, national_id"],["Account","phone, annual_revenue"],["Lead","email, phone"],["Employee","national_id"],["Payment","card, cvv"]],0],
[5,"h","2.5 Azure Cloud Services",0],
[6,"p","AKS, PostgreSQL Flexible, Redis, OpenAI, AI Search, Blob Storage, Service Bus, Key Vault, Entra ID, Monitor, Document Intelligence.",0],
]],
["04-ai-platform","2. AI & ML Platform (2.6-2.7)",23,[
[0,"h","2.6 AI & ML Platform",0],
[1,"h","2.6.1 Four-Pillar AI Command Center",0],
[2,"p","Pillar 1 Knowledge (RAG): Direct Upload, Folder Link, Live-Link Crawl (configurable schedule).",0],
[3,"x","INNOVATION: LazyGraphRAG — Microsoft Research, 700x cost reduction vs GraphRAG for relationship-aware retrieval.",2],
[4,"x","INNOVATION: Single Retrieval API — ADR-001, agents never know if using vector RAG, LazyGraphRAG, or SQL.",2],
[5,"p","Pillar 2 Instructions: Versioned prompts with A/B testing. Pillar 3 DB Variables: Real-time CRM field injection.",0],
[6,"x","NEW PILLAR: AI Agent Tools — create records, update fields, send emails, trigger workflows. All follow PPAE.",1],
[7,"h","2.6.1.1 Embedding Config (P0 FIX v3.1)",1],
[8,"x","P0 FIX: Embedding standardized to text-embedding-3-large @ 1536 dims (configurable 1024/1536/3072). Resolves contradictions.",1],
[9,"p","pgvector column type = vector(1536). 1/3 storage cost of 3072. Azure SQL analysis shows 1024-1536 as sweet spot.",0],
[10,"h","2.6.1.2 RAG Chunking (P0 FIX v3.1)",1],
[11,"x","P0 FIX: 512-token chunks, 50-token overlap, semantic splitting. Resolves contradictory 250/512 references.",1],
[12,"p","Retrieval: Hybrid vector+BM25 → top-10 → cross-encoder re-rank → top-5. Citations required per claim.",0],
[13,"h","2.6.2 AI Agents (12 Domain-Specific)",0],
[14,"p","Deal Analysis, Customer Research, Email Draft, Contract Summary, Case Resolution, Lead Scoring, Meeting Prep, Forecasting, Churn Detection, Competitor Intelligence, Proposal Generation, Performance Insights.",0],
[15,"x","INNOVATION: BPMN Outer Loop + LangGraph Inner Loop — two-loop orchestration (ADR-002).",2],
[16,"x","INNOVATION: Token-Aware Routing — simple queries → GPT-3.5-Turbo, complex → GPT-4. Per-task/tenant budgets.",2],
[17,"h","2.6.6 Privacy Enforcement (NEW v3.1)",1],
[18,"x","P0 ADDITION: PDP/PEP in AI Router — enforces data classification before every LLM call. Blocks unauthorized access.",1],
[19,"p","5 components: Data Classification Service, AI Router PDP, AI Router PEP, Redaction Pipeline, Per-Skill Configuration.",0],
[20,"h","2.6.7 OpenTelemetry GenAI (NEW v3.1)",1],
[21,"x","NEW: OTel GenAI Semantic Conventions — standardized spans for agent invocation, LLM completion, tool calls, RAG retrieval.",1],
[22,"h","2.6.8 Governance Mapping (NEW v3.1)",1],
[23,"x","NEW: NIST AI RMF + ISO 42001 + OWASP LLM Top 10 mapped to Coryphaeus features for procurement.",1],
[24,"h","2.7 Security Architecture",0],
[25,"p","Auth: Entra ID, OAuth 2.0+OIDC, MFA, SAML 2.0. RBAC: 5 default roles + custom. Two-tier audit logging.",0],
[26,"x","INNOVATION: MCP Tool Poisoning Defense — CVE-documented attacks. Tool scanning, server allowlisting, invariant checks.",2],
[27,"x","NEW: MCP Data Residency & Host Retention — no CRM data may transit outside tenant's region.",1],
[28,"x","NEW: MCP Selection Rubric & Degraded Mode — first apps: Deal Review Dashboard + Pipeline Health Snapshot.",1],
[29,"x","INNOVATION: MCP Apps as First-Mover Distribution — interactive dashboards inside Claude/ChatGPT. SF has no equivalent.",2],
[30,"p","Compliance targets: SOC 2 Type II, GDPR, HIPAA-ready, PCI-DSS Level 1.",0],
]],
["05-data-model-core","3. Core Data Model (3.1-3.5)",9,[
[0,"h","3. Core Data Model",0],
[1,"p","48 entities on PostgreSQL with RLS. All include tenant_id, timestamps, deleted_at, custom_fields JSONB. All monetary fields have currency_code (ISO 4217).",1],
[2,"h","3.1 Entity Overview — Original 27",0],
[3,"p","Account, Prospect, Lead, Contact, Opportunity, Activity, Task, Product, Price Book, Quote, Invoice, Sales Order, Purchase Order, Case, Knowledge Article, Subscription, Insights Card, Campaign, Website, Landing Page, Blog, Workflow, Rules, Integration, Report, Dashboard, Contract, Event, Competitor.",0],
[4,"h","New in v3.0 (14 Entities)",0],
[5,"p","Offering, Account Plan, Payment, Case Study, SLA, Risk Register, Qualification Scoring, Employee, ICP, Forms, Loyalty Points, Email/WhatsApp/SMS Templates, Report Template.",0],
[6,"h","New in v3.1 (6 Entities)",1],
[7,"p","Qualification Sheet, Goal (OKR), Fiscal Year Configuration, Sales Target, Monthly Revenue Projection, Partner Contribution.",1],
[8,"h","3.2 Account",0],
[9,"p","Master business entity. Fields: account_id, name, type, category, industry, annual_revenue, currency_code, employee_count, owner_id, addresses (primary+billing with building/unit), phone, website, parent_account_id, rating, health_score, icp_fit_score.",0],
[10,"h","3.3 Lead",0],
[11,"x","Multiple Product Interests — one-to-many via junction table lead_product_interests.",1],
[12,"p","Fields: lead_id, full_name, company, designation, status, customer_need, budget, currency_code, decision_role, phones, email, addresses, lead_source, lead_score, national_id.",0],
[13,"h","3.4 Contact",0],
[14,"x","One-to-Many Phone Numbers — child phone_numbers table with type, number, is_primary. '+' button to add.",1],
[15,"p","Fields: contact_id, full_name, salutation, account_id, designation, role, emails (work+personal), whatsapp, addresses, DOB, national_id, language, reports_to_id.",0],
[16,"h","3.5 Opportunity",0],
[17,"x","v3.1 CHANGES: Removed discounts (belong on Order). Sales TCV + Revenue split. Monthly Revenue Projections. Partner Contributions. RFP/Proposal doc links.",1],
[18,"p","Fields: opportunity_id, name, account_id, owner_id, stage, probability, sales_tcv_amount, revenue_amount, in_year_revenue_amount (calculated), remaining_revenue_amount (formula), currency_code, close_date, type, qualification_score, competitor tracking, document URLs.",0],
[19,"h","3.5.1 Monthly Revenue Projection (NEW v3.1)",1],
[20,"x","NEW CHILD: Spreads revenue across contract months. 18-month deal = 18 entries. SUM must reconcile to parent revenue_amount.",1],
[21,"p","Fields: monthly_revenue_id, opportunity_id, month, month_number, calendar_year, revenue_amount, currency_code.",0],
[22,"h","3.5.2 Partner Contribution (NEW v3.1)",1],
[23,"x","NEW CHILD: Tracks partner involvement (e.g. '10% Microsoft, 20% HP'). Percentage auto-calculates amount.",1],
[24,"p","Fields: partner_contribution_id, opportunity_id, partner_name, pct, amount (auto-calc), currency_code.",0],
]],
["06-data-model-new","3. New & Revised Entities (3.6-3.24)",24,[
[0,"h","3.6 Offering (NEW)",1],
[1,"p","Products/services for accounts/industries. Links to Products via offering_products junction (one-to-many). Account Plans select Offerings with TCV targets.",0],
[2,"h","3.7 Account Plan (NEW)",1],
[3,"p","10 drag-and-drop sections: Company Overview, Relationship Map, FY Priorities, SWOT, Whitespace, Action Items, Offerings+TCV, Org Chart+Sentiment, Competitive Landscape, Health Score.",0],
[4,"p","Junction table: account_plan_id + offering_id → target_tcv, target_revenue, actual_pipeline_tcv (calculated).",0],
[5,"h","3.8 Invoice (Revised) → Payment One-to-Many",0],
[6,"h","3.9 Payment (NEW)",1],
[7,"h","3.10 Complaint (REVISED v3.1 — Merged into Cases)",1],
[8,"x","Complaint NOT standalone. Category value in Case entity. Complaint fields activate when category=Complaint. Count: 43→42.",1],
[9,"h","3.11 Case Study (REVISED v3.1)",1],
[10,"x","Three modes: (1) WYSIWYG online editor, (2) File upload (Azure Blob), (3) External link. Template designer for Mode 1.",1],
[11,"h","3.12 Qualification Sheet (NEW v3.1)",1],
[12,"p","Configurable questionnaire linked to Opportunity. Template → Questions → Answers. Types: Yes/No, Dropdown, Multi-Select, Free Text.",0],
[13,"h","3.13-3.17 Other New Entities",0],
[14,"p","Risk Register, SLA, Employee (separate from Contact), ICP, Forms, Loyalty Points (reqs pending).",0],
[15,"h","3.18-3.21 Revised Entities",0],
[16,"p","Contract (master/detail), Competitor (per-opportunity junction), Insights Card (redesigned), remaining original entities with v3.0 field changes.",0],
[17,"h","3.22 Goal — OKR System (NEW v3.1)",1],
[18,"x","OKR with cascading hierarchy via parent_goal_id. Financial OKRs auto-populate from Opportunity data — no manual entry.",1],
[19,"p","Goal → Objectives. Measurement types: Sales_TCV, Revenue, Pipeline_Multiplier, Percentage, Currency, Custom_KPI. Auto-source from CRM data.",0],
[20,"h","3.23 Fiscal Year Configuration (NEW v3.1)",1],
[21,"p","Tenant-level FY boundaries. Supports calendar year or custom (Apr-Mar for SG gov, Jul-Jun for US federal).",0],
[22,"h","3.24 Sales Target (NEW v3.1)",1],
[23,"p","Per-salesperson per-FY targets. Pipeline sufficiency ratio: default 3× (configurable 2×/4×). Dashboard tracks pipeline_actual, pipeline_required, pipeline_gap.",0],
]],
["07-modules-sales","4. Sales Module (4.1)",6,[
[0,"h","4.1 Sales Module",0],
[1,"h","4.1.1 Lead Management",0],
[2,"p","Multi-channel capture, auto-scoring (0-100 ICP-based), multiple product interests, assignment rules, nurturing sequences, duplicate detection, conversion.",0],
[3,"h","4.1.2 Opportunity Management",0],
[4,"p","Visual pipeline ribbon, NL-configurable stages, qualification scoring, Sales TCV + Revenue split, Monthly Revenue Projections, Partner Contributions, competitor tracking, offering linkage, Qualification Sheet.",0],
[5,"h","4.1.2a Sales & Revenue Targets (NEW v3.1)",1],
[6,"p","Targets per salesperson per FY. Pipeline sufficiency ratio (default 3×). Dashboard: pipeline health per person/team/region. Integrates with OKR.",1],
[7,"h","4.1.2b SPIN Sales Methodology (NEW v3.1)",1],
[8,"p","Built-in SPIN (Situation, Problem, Implication, Need-payoff). Guided prompts, structured fields, AI coaching. Extensible to MEDDIC/Challenger/Sandler via config.",1],
[9,"h","4.1.2c Deal Close → External Systems (NEW v3.1)",1],
[10,"p","Event-driven push on Closed Won: monthly revenue, partner contributions, Sales TCV → SAP/Oracle/custom. Webhook, REST, Azure Service Bus.",1],
[11,"h","4.1.3 Account Management",0],
[12,"p","Hierarchical parent-child, health scoring, Account Plan integration with offering/TCV rollup, org chart, SWOT, whitespace analysis.",0],
[13,"h","4.1.4 Contact Management",0],
[14,"p","One-to-many phones, Teams presence, click-to-chat with screen sharing from Opportunity, communication history, relationship mapping.",0],
[15,"h","4.1.5 Account Planning (NEW MODULE)",1],
[16,"x","Core differentiator. 10 configurable sections. Offering → TCV Target with pipeline rollup from Opportunities.",1],
]],
["08-modules-marketing","4. Marketing Module (4.2)",0,[
[0,"h","4.2 Marketing Module",0],
[1,"p","Campaign Management: multi-channel, segmentation, budget, ROI, attribution, A/B testing.",0],
[2,"p","Landing Page Builder: drag-and-drop + NL creation. Blog: rich editor + NL generation. Email: templates, sequences, timezone-optimized.",0],
[3,"h","4.2.5 Case Study Designer (NEW)",1],
[4,"p","Template designer for success stories. Published case studies auto-surfaced by AI on related Opportunities.",0],
]],
["09-modules-service","4. Service & Contact Center (4.3-4.4)",0,[
[0,"h","4.3 Service Module",0],
[1,"p","Case Management: multi-channel creation, auto-triage, skills-based assignment, SLA tracking, AI summaries.",0],
[2,"h","4.3.2 Agent Desktop",0],
[3,"x","Auto-Pop Knowledge During Live Interactions — surfaces relevant docs based on real-time conversation context.",1],
[4,"p","Knowledge Base: Direct Upload, Folder Link, Live-Link Crawl. SLA: per-priority thresholds, visual timers, auto-escalation.",0],
[5,"h","4.4 Contact Center (NEW MODULE)",1],
[6,"p","Chat widget, routing rules (round-robin/least-busy/skills), mini WFM (shift scheduling), omnichannel routing (phone/email/chat/WhatsApp/SMS).",0],
]],
["10-modules-ai","4. AI & Intelligence (4.5)",0,[
[0,"h","4.5 AI & Intelligence Module",0],
[1,"p","AI Command Center (4 Pillars). 12 domain-specific agents with PPAE. AI Copilot sidebar on every record.",0],
[2,"p","12+ AI Skills: Classify, Extract Intent, Summarize, Score Lead, Sentiment, Translate, Entities, Enrich, Predict, Anomaly, Recommend, Format JSON.",0],
[3,"p","5 ML Models: Lead Scoring, Churn Prediction, Deal Forecast, Email Send Time, Account Health.",0],
[4,"x","AI Eval Harness — RAGAS metrics, OWASP LLM Top 10 red-team, tool poisoning test suite. Every agent must pass before deploy.",2],
]],
["11-modules-workflow","4. Process & Workflow (4.6-4.12)",10,[
[0,"h","4.6 Process & Workflow Module",0],
[1,"p","BPMN 2.0 Process Designer: visual canvas + NL dual mode. Version control and governance.",0],
[2,"x","P0 FIX: Workflow DSL Compiles to BPMN (ADR-007) — ONE runtime (Zeebe), ONE audit trail. Simple + Advanced modes.",1],
[3,"h","4.6.2 Rules Engine",0],
[4,"p","Visual decision table editor. Types: validation, assignment, escalation, scoring, workflow triggers.",0],
[5,"h","4.6.4 SPIN Methodology Integration (NEW v3.1)",1],
[6,"x","Configurable framework — SPIN default, extensible to MEDDPICC/Challenger/Sandler. AI coaching per deal stage.",1],
[7,"h","4.6.5 Deal Close Integration (NEW v3.1)",1],
[8,"h","4.6.6 Kanban Board UI Pattern (NEW v3.1)",1],
[9,"p","Reusable drag-and-drop Kanban. Used for: Action Items, Feature Requests, Opportunity stages, Case resolution.",0],
[10,"h","4.7-4.12 Other Modules",0],
[11,"p","Communication Hub (8+ telephony, 4 WhatsApp), Contract & Order, Analytics & Reporting, Events, Data Quality, Administration.",0],
[12,"x","Teams Click-to-Chat with Screen Sharing — from Opportunity screen, auto-start Teams call + share screen.",1],
]],
["12-integrations","5. Integration Architecture",2,[
[0,"h","5. Integration Architecture",0],
[1,"p","API: REST (OpenAPI), GraphQL, gRPC inter-service, versioning, tenant-aware rate limiting.",0],
[2,"p","Bidirectional Sync: SF, HubSpot, D365, Outlook, Planner, Google Tasks. Conflict resolution.",0],
[3,"p","Telephony: 8+ (Twilio, Vonage, etc). WhatsApp: 4. Contract: OneFlow AI. Migration: template-based from 5 CRMs.",0],
[4,"x","MCP Server — exposes intelligence (deal reasoning, relationship insights), not just CRUD. Two initial MCP Apps.",2],
[5,"h","5.8 Deal Close → External Push (NEW v3.1)",1],
[6,"p","Event-driven on Closed Won. SAP (RFC/BAPI/OData), Oracle ERP (REST), custom (webhook). Field mapping, retry, dead-letter via Service Bus.",1],
]],
["13-competitive","6. Competitive Feature Reference",0,[
[0,"h","6. Competitive Positioning Matrix",0],
[1,"t",[["Feature","Salesforce","HubSpot","D365","Coryphaeus"],["Account Planning","Add-on ($$$)","None","Limited","Built-in with rollup"],["AI Agents","Einstein (3-4)","2","Copilot (generic)","12 domain-specific + custom"],["MCP Apps","Raw CRUD","None","None","Interactive dashboards"],["AI Safety (PPAE)","None","None","None","Full PPAE"],["Token Pricing","Bundled / hidden","Bundled / hidden","Bundled / hidden","Real-time dashboard + BYOK"]],0],
]],
["14-account-planning","7. Account Planning & Strategy",8,[
[0,"h","7. Account Planning & Strategy",0],
[1,"h","7.1 Whitespace Analysis",0],
[2,"p","AI-powered identification of offerings not yet sold. Cross-references industry, size, existing purchases against full catalog.",0],
[3,"h","7.2 Org Chart with Sentiment",0],
[4,"h","7.3 Relationship Mapping Visual Builder (NEW v3.1)",1],
[5,"x","WYSIWYG drag-and-drop relationship mapper. Add contact nodes, draw lines (reports-to, influences, blocks, champions). Color-coded sentiment.",1],
[6,"h","7.4 Account Plan Template Builder (NEW v3.1)",1],
[7,"p","Admin-defined sections in order. Users click through sequentially. Different templates for strategic/named/territory accounts.",0],
[8,"h","7.5 Pipeline Rollup",0],
[9,"x","CORE DIFFERENTIATOR: Planned TCV (Account Plan) vs Actual Pipeline TCV (Opportunities) vs Closed Won TCV. No competitor has this.",2],
[10,"h","7.6 OKR Integration (NEW v3.1)",1],
[11,"p","Account Plans → OKR system. Sales TCV targets auto-feed Objectives. Pipeline health per account/salesperson. Zero manual data entry for financial metrics.",1],
]],
["15-pricing","8. Pricing Analysis",0,[
[0,"h","8. Pricing Analysis (28 Vendors)",0],
[1,"t",[["Tier","Price Range","Examples"],["Starter","$12–25 /user/mo","Zoho $14, Pipedrive $15"],["Professional","$25–75 /user/mo","HubSpot $45, SF $75"],["Enterprise","$75–300+ /user/mo","SF $150+, D365 $95–150"]],0],
[2,"x","Coryphaeus Pricing: Phase 1 $10/user/month (add-on). Phase 2 $30/user/month + AI tokens. Enterprise ~50% of SF.",1],
]],
["16-roadmap","9. Product Vision & Roadmap",0,[
[0,"h","9. Product Vision & Roadmap",0],
[1,"h","9.1 Technical Differentiation",0],
[2,"p","10 innovations: Native Account Planning, PPAE, PII Classes, MCP Apps, LazyGraphRAG, Two-Loop Orchestration, Single Retrieval API, Token Pricing, MCP Security, SimpleMem Memory.",0],
[3,"h","9.2 Implementation Roadmap",0],
[4,"t",[["Phase","Timeline","Scope"],["Phase 1","M1–6","Accounts, Contacts, Opportunities, Cases, basic Account Plans"],["Phase 2","M7–12","Full Account Planning, 12 AI agents, BPMN, Contact Center"],["Phase 3","M13–18","Marketing, MCP Apps, Integration marketplace"],["Phase 4","M19–24","Advanced analytics, LazyGraphRAG, compliance certs"]],0],
[5,"x","Priority Rollout: (1) Accounts+Contacts, (2) Opportunities+Account Plans, (3) Cases+Contact Center.",1],
]],
["17-innovations","10. Innovation Roadmap (Rounds 1-7)",8,[
[0,"h","10. Innovation Roadmap — Critical Analysis Rounds 1-7",0],
[1,"p","All innovations achieved terminal convergence with zero repudiations across 7 rounds of independent advisory analysis.",1],
[2,"h","10.1 Convergence Scorecard",0],
[3,"p","15 decisions tracked across 7 rounds. Key: RAG(Rd1), PPAE(Rd1), MCP Apps(Rd3), LazyGraphRAG(Rd4), Memory Provider(Rd4), Three-Layer(Rd6), Embedding/Chunking/PDP-PEP/OTel(Rd7).",0],
[4,"h","10.2 Priority Matrix (v3.1)",1],
[5,"t",[["Priority","Items","Status"],["P0","ADR-001 Retrieval, ADR-002 Orchestration, ADR-003 MCP Security, ADR-007 Workflow DSL (CLOSED), AI Eval, PPAE, Embedding+Chunking+PDP/PEP","APPLIED v3.1"],["P1","ADR-004 Memory, ADR-005 Agent Portfolio, ADR-006 LazyGraphRAG, OTel+Governance","APPLIED v3.1"],["P2","Stage Transition Simulation, MCP Apps build","Planned"],["P3","A2UI mobile pilot","Deferred Q4 2026"]],1],
[6,"h","10.3 Salesforce MCP Gap Analysis",0],
[7,"x","SF MCP (GA Feb 2026): Raw CRUD only. No deal reasoning, no MCP Apps, no PPAE, no AI Trust Center.",2],
[8,"h","10.4 MCP Tool Poisoning",0],
[9,"x","MCPTox Benchmark: 72.8% attack success. CVEs documented. 43% public MCP servers have command injection.",2],
[10,"h","10.5 Memory Architecture",0],
[11,"x","SimpleMem: 43.24% F1, 26.4% improvement over Mem0. MIT licensed. Memory Provider Interface ensures pluggability.",2],
[12,"h","10.6 ADR Readiness",1],
[13,"p","ADR-001: Retrieval (this week). ADR-002: Orchestration (90 days). ADR-003: MCP Security (this week). ADR-004-006: Phase 1. ADR-007: CLOSED.",0],
]],
["18-appendix","11. Appendix",4,[
[0,"h","11. Appendix",0],
[1,"h","11.1 Change Log",0],
[2,"t",[["Version","Changes"],["v2.0","Original 27 entities, 6 differentiators"],["v3.0","Review 3 (88 items), 43 entities, 8 differentiators, Rounds 1-5"],["v3.1","Stephen Review 1 (39 changes, 8 comments), Rounds 6-7, 48 entities, Complaint merged, 6 new entities, P0 fixes"]],0],
[3,"h","11.3 Naming Changes",0],
[4,"t",[["Old","New"],["zip","postal_code"],["ssn","national_id"],["title","designation"],["gross_amount","sales_tcv_amount (v3.1)"],["—","building_number (added)"],["—","unit_number (added)"],["—","currency_code (added)"],["—","deleted_at (added)"]],0],
[5,"h","11.4 Decision Register (D1-D16)",0],
[6,"t",[["Decision","Topic"],["D1","RAG"],["D2","BPMN + LangGraph"],["D3","MCP Apps"],["D4","PPAE"],["D5","Web canonical"],["D6","Memory"],["D7","LazyGraphRAG"],["D8–D16","Rounds 6-7"]],0],
[7,"h","11.5 Open Questions (OQ1-OQ8)",0],
[8,"t",[["ID","Question"],["OQ1","Agent nesting"],["OQ2","Employee entity"],["OQ3","Search vs pgvector"],["OQ4","Loyalty reqs"],["OQ5","DSL compiler"],["OQ6","Redaction scope"],["OQ7","SF MCP"],["OQ8","Cold-start cost"]],0],
[9,"h","11.6 Glossary",0],
[10,"p","PPAE, MCP, BPMN, DMN, RLS, EAV, RAG, LazyGraphRAG, LangGraph, ADR, TCV, ICP, PII, PDP/PEP, OTel, OKR, SPIN, BYOK, NL, WFM, NIST AI RMF, ISO 42001.",0],
]],
];

const VERSIONS = [
  { id: "3.1", date: "Feb 2026", label: "v3.1 — Current", changes: 97, desc: "Stephen Review 1, Rounds 6-7, 48 entities, 6 new entities, P0 fixes" },
  { id: "3.0", date: "Feb 2026", label: "v3.0", changes: 88, desc: "Review 3 feedback, 43 entities, 8 differentiators, Rounds 1-5" },
  { id: "2.0", date: "Feb 2026", label: "v2.0 — Original", changes: 0, desc: "Original spec with 27 entities, 6 differentiators" },
];

const COMPETITORS_LIST = ["Close", "Copper", "Dynamics 365", "Freshsales", "HubSpot", "Monday CRM", "Pipedrive", "Salesforce", "Zoho", "Other"];
const FEATURES_LIST = ["Account Planning", "AI Agents", "AI Safety", "Contact Center", "Data Model", "General", "Integrations", "Marketing", "MCP Apps", "Mobile", "Pricing", "Reporting", "Security", "Workflow"];

// ── API helpers (Azure Table Storage backed) ──
const API_BASE = "/api/comments";

async function apiGet() {
  try {
    const r = await fetch(API_BASE);
    if (!r.ok) throw new Error(r.statusText);
    return await r.json();
  } catch {
    // Fallback to localStorage when API unavailable (local dev)
    try { return JSON.parse(localStorage.getItem("coryphaeus-comments") || "{}"); } catch { return {}; }
  }
}

async function apiSave(data) {
  try {
    const r = await fetch(API_BASE, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!r.ok) throw new Error(r.statusText);
  } catch {
    try { localStorage.setItem("coryphaeus-comments", JSON.stringify(data)); } catch {}
  }
}

const COMP_API = "/api/competitors";

async function compApiGet() {
  try {
    const r = await fetch(COMP_API);
    if (!r.ok) throw new Error(r.statusText);
    return await r.json();
  } catch {
    try { return JSON.parse(localStorage.getItem("coryphaeus-competitors") || "[]"); } catch { return []; }
  }
}

async function compApiSave(data) {
  try {
    const r = await fetch(COMP_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!r.ok) throw new Error(r.statusText);
  } catch {
    try { localStorage.setItem("coryphaeus-competitors", JSON.stringify(data)); } catch {}
  }
}

// ── Main App ──
export default function App() {
  const [activeSection, setActiveSection] = useState(() => {
    const hash = window.location.hash.slice(1);
    const idx = S.findIndex(s => s[0] === hash);
    return idx >= 0 ? idx : 0;
  });
  const [comments, setComments] = useState({});
  const [commentingOn, setCommentingOn] = useState(null);
  const [commentAuthor, setCommentAuthor] = useState(() => {
    try { return localStorage.getItem("spec-author") || ""; } catch { return ""; }
  });

  // Auto-detect logged-in user from Entra ID
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/.auth/me");
        if (r.ok) {
          const data = await r.json();
          const principal = data?.clientPrincipal;
          if (principal?.userDetails && !commentAuthor) {
            const name = principal.userDetails.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, c => c.toUpperCase());
            setCommentAuthor(name);
            try { localStorage.setItem("spec-author", name); } catch {}
          }
        }
      } catch {} // Not behind auth (local dev)
    })();
  }, []);
  const [search, setSearch] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("3.1");
  const [showChanges, setShowChanges] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [filterV31, setFilterV31] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [modalImage, setModalImage] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [showCompetitors, setShowCompetitors] = useState(() => window.location.hash === '#competitors');
  const [competitorData, setCompetitorData] = useState([]);
  const [compFilter, setCompFilter] = useState('');
  const [featureFilter, setFeatureFilter] = useState('');
  const [compSearch, setCompSearch] = useState('');
  const [addingIntel, setAddingIntel] = useState(false);
  const [intelForm, setIntelForm] = useState({ competitor: '', features: [], title: '', links: [] });
  const [newLink, setNewLink] = useState('');
  const [compVideo, setCompVideo] = useState(null);
  const contentRef = useRef(null);
  const inputRef = useRef(null);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef = useRef(null);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const compEditorRef = useRef(null);
  const compFileInputRef = useRef(null);
  const compVideoInputRef = useRef(null);

  // Derive next comment number from highest existing num
  const nextCommentNum = useCallback(() => {
    let max = 0;
    Object.values(comments).forEach(arr => arr.forEach(c => { if (c.num > max) max = c.num; }));
    return max + 1;
  }, [comments]);

  const nextIntelNum = useCallback(() => {
    let max = 0;
    competitorData.forEach(e => { if (e.num > max) max = e.num; });
    return max + 1;
  }, [competitorData]);

  useEffect(() => {
    apiGet().then(raw => {
      // Deep clone so React sees a new object
      const c = JSON.parse(JSON.stringify(raw));
      // Backfill: assign stable numbers to old comments that lack them
      let max = 0;
      Object.values(c).forEach(arr => arr.forEach(cm => { if (cm.num > max) max = cm.num; }));
      let needsSave = false;
      const all = [];
      Object.entries(c).forEach(([key, arr]) => arr.forEach((cm, i) => { if (!cm.num) all.push({ key, i, time: cm.time || '' }); }));
      all.sort((a, b) => a.time.localeCompare(b.time));
      all.forEach(item => { c[item.key][item.i].num = ++max; needsSave = true; });
      setComments(c);
      setLoaded(true);
      if (needsSave) apiSave(c);
    });
    compApiGet().then(data => setCompetitorData(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    if (showCompetitors) { window.location.hash = 'competitors'; return; }
    contentRef.current?.scrollTo(0, 0);
    window.location.hash = S[activeSection][0];
  }, [activeSection, showCompetitors]);

  const commentKey = (secIdx, itemIdx) => `${S[secIdx][0]}-${itemIdx}`;
  const getComments = (secIdx, itemIdx) => comments[commentKey(secIdx, itemIdx)] || [];
  const totalComments = Object.values(comments).reduce((s, arr) => s + arr.length, 0);
  const sectionCommentCount = (secIdx) => {
    const prefix = S[secIdx][0];
    return Object.entries(comments).filter(([k, v]) => k.startsWith(prefix) && v.length > 0).reduce((s, [, v]) => s + v.length, 0);
  };

  const addComment = useCallback(async () => {
    const html = editorRef.current ? editorRef.current.innerHTML : '';
    const hasText = html.replace(/<[^>]*>/g, '').trim().length > 0;
    if ((!hasText && !audioData && attachments.length === 0) || !commentingOn) return;
    const key = commentKey(commentingOn[0], commentingOn[1]);
    const author = commentAuthor.trim() || "Reviewer";
    try { localStorage.setItem("spec-author", author); } catch {}
    const entry = { text: hasText ? html : '', author, time: new Date().toISOString(), id: Date.now(), num: nextCommentNum() };
    if (audioData) entry.audio = audioData;
    if (attachments.length > 0) {
      const images = attachments.filter(a => a.isImage).map(a => a.data);
      const files = attachments.filter(a => !a.isImage).map(a => ({ data: a.data, name: a.name, type: a.fileType }));
      if (images.length === 1) entry.image = images[0];
      else if (images.length > 1) entry.images = images;
      if (files.length === 1) { entry.file = files[0].data; entry.fileName = files[0].name; entry.fileType = files[0].type; }
      else if (files.length > 1) entry.files = files;
    }
    const newComments = {
      ...comments,
      [key]: [...(comments[key] || []), entry]
    };
    setComments(newComments);
    if (editorRef.current) editorRef.current.innerHTML = '';
    setAudioData(null);
    setAttachments([]);
    setTranscript('');
    setCommentingOn(null);
    setSaving(true);
    await apiSave(newComments);
    setSaving(false);
  }, [commentAuthor, commentingOn, comments, audioData, attachments]);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    const bufLen = analyser.frequencyBinCount;
    const data = new Uint8Array(bufLen);
    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(data);
      const w = canvas.width, h = canvas.height;
      ctx.fillStyle = '#faf8f5';
      ctx.fillRect(0, 0, w, h);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#e53935';
      ctx.beginPath();
      const sliceW = w / bufLen;
      let x = 0;
      for (let i = 0; i < bufLen; i++) {
        const y = (data[i] / 255) * h;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        x += sliceW;
      }
      ctx.lineTo(w, h / 2);
      ctx.stroke();
    };
    draw();
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4' });
      audioChunksRef.current = [];
      setTranscript('');
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mr.mimeType });
        const reader = new FileReader();
        reader.onloadend = () => setAudioData(reader.result);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
        if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
        cancelAnimationFrame(animFrameRef.current);
        clearInterval(timerRef.current);
        analyserRef.current = null;
      };
      // Set up audio analyser for waveform
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      mediaRecorderRef.current = mr;
      mr.start();
      // Start speech recognition in parallel
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        const rec = new SR();
        rec.continuous = true;
        rec.interimResults = false;
        rec.lang = 'en-US';
        let fullText = '';
        rec.onresult = (e) => {
          for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) fullText += e.results[i][0].transcript + ' ';
          }
          setTranscript(fullText.trim());
        };
        rec.onerror = () => {};
        rec.start();
        recognitionRef.current = rec;
      }
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
      setIsRecording(true);
      requestAnimationFrame(() => drawWaveform());
    } catch { /* mic permission denied */ }
  }, [drawWaveform]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
      setIsRecording(false);
      setRecordingTime(0);
    }
  }, [isRecording]);

  const processFile = useCallback((file) => {
    if (!file) return;
    const id = Date.now() + Math.random();
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const max = 800;
          let w = img.width, h = img.height;
          if (w > max || h > max) { const r = Math.min(max / w, max / h); w *= r; h *= r; }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          setAttachments(prev => [...prev, { id, data: canvas.toDataURL('image/jpeg', 0.7), name: file.name, isImage: true }]);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments(prev => [...prev, { id, data: reader.result, name: file.name, fileType: file.type, isImage: false }]);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleFileUpload = useCallback((e) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(f => processFile(f));
    if (e.target) e.target.value = '';
  }, [processFile]);

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    let handled = false;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        processFile(item.getAsFile());
        handled = true;
      }
    }
    if (handled) e.preventDefault();
  }, [processFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer?.files;
    if (files) Array.from(files).forEach(f => processFile(f));
  }, [processFile]);

  const deleteComment = useCallback(async (secIdx, itemIdx, commentId) => {
    const key = commentKey(secIdx, itemIdx);
    const newComments = { ...comments, [key]: (comments[key] || []).filter(c => c.id !== commentId) };
    if (newComments[key].length === 0) delete newComments[key];
    setComments(newComments);
    setSaving(true);
    await apiSave(newComments);
    setSaving(false);
  }, [comments]);

  const addIntel = useCallback(async () => {
    const html = compEditorRef.current ? compEditorRef.current.innerHTML : '';
    const hasText = html.replace(/<[^>]*>/g, '').trim().length > 0;
    if (!intelForm.competitor && !intelForm.title && !hasText && !audioData && attachments.length === 0) return;
    const entry = {
      id: Date.now(), num: nextIntelNum(),
      competitor: intelForm.competitor || 'Other',
      features: intelForm.features.length > 0 ? intelForm.features : ['General'],
      title: intelForm.title,
      text: hasText ? html : '',
      links: intelForm.links.filter(l => l.trim()),
      images: attachments.filter(a => a.isImage).map(a => a.data),
      files: attachments.filter(a => !a.isImage).map(a => ({ data: a.data, name: a.name, type: a.fileType })),
      audio: audioData || null,
      video: compVideo || null,
      author: commentAuthor.trim() || 'Reviewer',
      time: new Date().toISOString(),
      version: '3.1'
    };
    const newData = [...competitorData, entry];
    setCompetitorData(newData);
    setAddingIntel(false);
    setIntelForm({ competitor: '', features: [], title: '', links: [] });
    setNewLink('');
    if (compEditorRef.current) compEditorRef.current.innerHTML = '';
    setAudioData(null);
    setAttachments([]);
    setCompVideo(null);
    setTranscript('');
    setSaving(true);
    await compApiSave(newData);
    setSaving(false);
  }, [intelForm, competitorData, attachments, audioData, compVideo, commentAuthor, nextIntelNum]);

  const deleteIntel = useCallback(async (id) => {
    const newData = competitorData.filter(e => e.id !== id);
    setCompetitorData(newData);
    setSaving(true);
    await compApiSave(newData);
    setSaving(false);
  }, [competitorData]);

  useEffect(() => {
    if (commentingOn && inputRef.current) inputRef.current.focus();
  }, [commentingOn]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight' && !commentingOn) { setShowSummary(false); setShowCompetitors(false); setActiveSection(s => Math.min(S.length - 1, s + 1)); }
      if (e.key === 'ArrowLeft' && !commentingOn) { setShowSummary(false); setShowCompetitors(false); setActiveSection(s => Math.max(0, s - 1)); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); document.querySelector('#search-input')?.focus(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [commentingOn]);

  const section = S[activeSection];
  const filteredSections = search
    ? S.map((s, i) => [s, i]).filter(([s]) => s[1].toLowerCase().includes(search.toLowerCase()) || s[3].some(it => it[2]?.toLowerCase().includes(search.toLowerCase())))
    : S.map((s, i) => [s, i]);

  const renderAttachments = (c, maxImgW = 200, maxImgH = 120) => {
    const imgs = c.images ? c.images : c.image ? [c.image] : [];
    const docs = c.files ? c.files : c.file ? [{ data: c.file, name: c.fileName }] : [];
    return (
      <>
        {imgs.length > 0 && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>{imgs.map((src, i) => <img key={i} src={src} alt="screenshot" onClick={() => setModalImage(src)} style={{ maxWidth: maxImgW, maxHeight: maxImgH, borderRadius: 4, border: '1px solid #e0e0e0', cursor: 'pointer' }} />)}</div>}
        {docs.length > 0 && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>{docs.map((d, i) => <a key={i} href={d.data} download={d.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: '#f5f0e8', borderRadius: 4, fontSize: 11, color: '#8b6914', textDecoration: 'none', border: '1px solid #e0d8c8' }}>📄 {d.name}</a>)}</div>}
      </>
    );
  };

  const renderItem = (item) => {
    const [itemIdx, type, text, flag] = item;
    const isV31 = flag === 1;
    const isInnovation = flag === 2;
    const key = commentKey(activeSection, itemIdx);
    const itemComments = comments[key] || [];
    const isCommenting = commentingOn && commentingOn[0] === activeSection && commentingOn[1] === itemIdx;

    if (filterV31 && !isV31 && type !== 'h') return null;
    if (!showChanges && type === 'x') return null;

    let content;
    if (type === 'h') {
      const level = text.match(/^\d+\.\d+\.\d+/) ? 3 : text.match(/^\d+\.\d+/) ? 2 : text.match(/^\d+\./) ? 1 : 3;
      const sizes = { 1: 22, 2: 18, 3: 15 };
      content = (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, fontSize: sizes[level], fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400, color: '#1a1a1a', letterSpacing: 0.3 }}>{text}</h3>
          {isV31 && showChanges && <span className="badge-v31">NEW v3.1</span>}
        </div>
      );
    } else if (type === 't') {
      const rows = text;
      const header = rows[0];
      const body = rows.slice(1);
      content = (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, lineHeight: 1.5 }}>
            <thead>
              <tr>
                {header.map((cell, i) => (
                  <th key={i} style={{ textAlign: 'left', padding: '8px 12px', background: '#f5f0e8', color: '#1a1a1a', fontWeight: 600, borderBottom: '2px solid #d4a85366', fontSize: 12, whiteSpace: 'nowrap' }}>{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ padding: '7px 12px', borderBottom: '1px solid #e8e8e8', color: ci === 0 ? '#1a1a1a' : ci === row.length - 1 ? '#8b6914' : '#555', fontWeight: ci === 0 ? 600 : 400, fontSize: 12.5 }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else if (type === 'x') {
      const icon = isInnovation ? '⭐' : '⚡';
      const bg = isInnovation ? 'rgba(76,175,80,0.08)' : 'rgba(180,130,40,0.08)';
      const border = isInnovation ? '#4caf5044' : '#b4822844';
      const color = isInnovation ? '#2e7d32' : '#8b6914';
      content = (
        <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 6, padding: '10px 14px', fontSize: 13.5, lineHeight: 1.55, color }}>
          {icon} {text}
          {isV31 && showChanges && <span className="badge-v31" style={{ marginLeft: 8 }}>v3.1</span>}
        </div>
      );
    } else {
      content = (
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: '#444' }}>
          {text}
          {isV31 && showChanges && <span className="badge-v31" style={{ marginLeft: 6 }}>v3.1</span>}
        </p>
      );
    }

    return (
      <div key={itemIdx} className="spec-item" style={{ position: 'relative', marginBottom: type === 'h' ? 8 : 4, padding: '6px 10px', borderRadius: 5, background: isCommenting ? 'rgba(180,130,40,0.06)' : itemComments.length > 0 ? 'rgba(100,149,237,0.06)' : 'transparent', borderLeft: itemComments.length > 0 ? '3px solid #6495ed66' : '3px solid transparent', transition: 'all 0.15s' }}>
        {content}
        <button className="cmt-btn" onClick={() => setCommentingOn(isCommenting ? null : [activeSection, itemIdx])}
          style={{ position: 'absolute', right: 4, top: 4, opacity: isCommenting || itemComments.length > 0 ? 1 : 0, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: itemComments.length > 0 ? '#4a7cc9' : '#999', padding: '2px 6px', transition: 'opacity 0.15s' }}>
          {itemComments.length > 0 ? `💬 ${itemComments.length}` : '💬'}
        </button>
        {itemComments.length > 0 && !isCommenting && (
          <div style={{ marginTop: 6, paddingLeft: 12, borderLeft: '2px solid #4a7cc944' }}>
            {itemComments.map(c => (
              <div key={c.id} style={{ fontSize: 12, marginBottom: 4 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: '#8b6914', background: '#f5f0e8', padding: '1px 5px', borderRadius: 3, whiteSpace: 'nowrap', lineHeight: '18px', flexShrink: 0 }}>C-{String(c.num || 0).padStart(3,'0')}</span>
                  <span style={{ fontWeight: 600, color: '#4a7cc9', whiteSpace: 'nowrap' }}>{c.author}</span>
                  <span className="comment-html" style={{ flex: 1, color: '#555' }} dangerouslySetInnerHTML={{ __html: c.text }} />
                  <span style={{ fontSize: 10, color: '#999', whiteSpace: 'nowrap' }}>{new Date(c.time).toLocaleDateString()}</span>
                  <button onClick={() => deleteComment(activeSection, itemIdx, c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 10 }}>✕</button>
                </div>
                {c.audio && <audio controls src={c.audio} style={{ height: 28, marginTop: 4, maxWidth: '100%' }} />}
                {renderAttachments(c)}
              </div>
            ))}
          </div>
        )}
        {isCommenting && (
          <div style={{ marginTop: 8 }} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 6 }}>
              <input ref={inputRef} value={commentAuthor} onChange={e => setCommentAuthor(e.target.value)} placeholder="Your name" style={{ width: 100, padding: '6px 8px', background: '#fff', border: '1px solid #d0d0d0', borderRadius: 4, color: '#1a1a1a', fontSize: 12 }} />
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={isRecording ? stopRecording : startRecording} title={isRecording ? 'Stop recording' : 'Record audio'} style={{ padding: '6px 8px', background: isRecording ? '#e53935' : 'transparent', color: isRecording ? '#fff' : '#888', border: `1px solid ${isRecording ? '#e53935' : '#d0d0d0'}`, borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>{isRecording ? '⏹' : '🎤'}</button>
                <button onClick={() => fileInputRef.current?.click()} title="Attach image or document" style={{ padding: '6px 8px', background: 'transparent', color: '#888', border: '1px solid #d0d0d0', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>📎</button>
                <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" onChange={handleFileUpload} style={{ display: 'none' }} />
              </div>
            </div>
            <div style={{ border: `1.5px ${dragOver ? 'dashed #4a7cc9' : 'solid #d0d0d0'}`, borderRadius: 4, background: dragOver ? 'rgba(74,124,201,0.06)' : '#fff', transition: 'border 0.15s, background 0.15s' }}>
              <div style={{ display: 'flex', gap: 2, padding: '4px 6px', borderBottom: '1px solid #e8e8e8', background: '#fafafa', borderRadius: '4px 4px 0 0', flexWrap: 'wrap' }}>
                {[['bold','B','bold'],['italic','I','italic'],['underline','U','underline'],['strikeThrough','S̶','strikethrough']].map(([cmd, label, title]) => (
                  <button key={cmd} title={title} onMouseDown={e => { e.preventDefault(); document.execCommand(cmd); }} style={{ padding: '2px 7px', background: 'transparent', border: '1px solid transparent', borderRadius: 3, cursor: 'pointer', fontSize: 12, fontWeight: cmd === 'bold' ? 700 : 400, fontStyle: cmd === 'italic' ? 'italic' : 'normal', textDecoration: cmd === 'underline' ? 'underline' : cmd === 'strikeThrough' ? 'line-through' : 'none', color: '#555', lineHeight: 1.3 }}>{label}</button>
                ))}
                <span style={{ width: 1, background: '#e0e0e0', margin: '2px 4px' }} />
                <button title="Bullet list" onMouseDown={e => { e.preventDefault(); document.execCommand('insertUnorderedList'); }} style={{ padding: '2px 7px', background: 'transparent', border: '1px solid transparent', borderRadius: 3, cursor: 'pointer', fontSize: 12, color: '#555' }}>• List</button>
                <button title="Numbered list" onMouseDown={e => { e.preventDefault(); document.execCommand('insertOrderedList'); }} style={{ padding: '2px 7px', background: 'transparent', border: '1px solid transparent', borderRadius: 3, cursor: 'pointer', fontSize: 12, color: '#555' }}>1. List</button>
                <span style={{ width: 1, background: '#e0e0e0', margin: '2px 4px' }} />
                <button title="Highlight" onMouseDown={e => { e.preventDefault(); document.execCommand('hiliteColor', false, '#fff3cd'); }} style={{ padding: '2px 7px', background: 'transparent', border: '1px solid transparent', borderRadius: 3, cursor: 'pointer', fontSize: 12, color: '#555' }}>🖍</button>
                <button title="Clear formatting" onMouseDown={e => { e.preventDefault(); document.execCommand('removeFormat'); }} style={{ padding: '2px 7px', background: 'transparent', border: '1px solid transparent', borderRadius: 3, cursor: 'pointer', fontSize: 11, color: '#999' }}>T̸</button>
              </div>
              <div ref={editorRef} contentEditable suppressContentEditableWarning onPaste={handlePaste} onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); addComment(); } }} data-placeholder="Add comment or feedback… (Cmd+Enter to submit)" className="rtf-editor" style={{ minHeight: 180, maxHeight: 400, overflowY: 'auto', padding: '8px 10px', color: '#1a1a1a', fontSize: 12.5, fontFamily: 'inherit', lineHeight: 1.6, outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
              <button onClick={addComment} style={{ padding: '6px 14px', background: '#8b6914', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Add</button>
              <button onClick={() => { setCommentingOn(null); setAudioData(null); setAttachments([]); setTranscript(''); setDragOver(false); if (isRecording) stopRecording(); }} style={{ padding: '6px 10px', background: 'none', color: '#888', border: '1px solid #d0d0d0', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 10, color: '#bbb' }}>Paste, drag & drop, or 📎 to attach</span>
            </div>
            {isRecording && (
              <div style={{ width: '100%', marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #e5393522', borderRadius: 6, padding: '6px 10px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e53935', animation: 'pulse 1s infinite' }} />
                <canvas ref={canvasRef} width={240} height={32} style={{ flex: 1, maxWidth: 240, height: 32, borderRadius: 3 }} />
                <span style={{ fontSize: 11, color: '#e53935', fontFamily: "'JetBrains Mono', monospace", minWidth: 32 }}>{Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}</span>
              </div>
            )}
            {(audioData || attachments.length > 0) && (
              <div style={{ width: '100%', marginTop: 6, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {audioData && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><audio controls src={audioData} style={{ height: 28 }} /><button onClick={() => { if (editorRef.current && transcript) editorRef.current.innerText = transcript; }} title="Transcribe audio to text" style={{ padding: '3px 8px', background: transcript ? '#4a7cc9' : '#d0d0d0', color: '#fff', border: 'none', borderRadius: 3, fontSize: 10, fontWeight: 600, cursor: transcript ? 'pointer' : 'default', opacity: transcript ? 1 : 0.5 }}>Transcribe</button><button onClick={() => setAudioData(null)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 10 }}>✕</button></div>}
                {attachments.map(a => a.isImage ? (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><img src={a.data} alt="preview" style={{ maxWidth: 80, maxHeight: 50, borderRadius: 4, border: '1px solid #e0e0e0' }} /><button onClick={() => setAttachments(prev => prev.filter(x => x.id !== a.id))} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 10 }}>✕</button></div>
                ) : (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ fontSize: 11, color: '#8b6914', background: '#f5f0e8', padding: '3px 8px', borderRadius: 3, border: '1px solid #e0d8c8' }}>📄 {a.name}</span><button onClick={() => setAttachments(prev => prev.filter(x => x.id !== a.id))} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 10 }}>✕</button></div>
                ))}
              </div>
            )}
            {itemComments.length > 0 && (
              <div style={{ width: '100%', marginTop: 6, paddingLeft: 12, borderLeft: '2px solid #4a7cc944' }}>
                {itemComments.map(c => (
                  <div key={c.id} style={{ fontSize: 12, marginBottom: 3 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: '#8b6914', background: '#f5f0e8', padding: '1px 5px', borderRadius: 3, whiteSpace: 'nowrap', lineHeight: '18px', flexShrink: 0 }}>C-{String(c.num || 0).padStart(3,'0')}</span>
                      <span style={{ fontWeight: 600, color: '#4a7cc9' }}>{c.author}</span>
                      <span className="comment-html" style={{ flex: 1, color: '#555' }} dangerouslySetInnerHTML={{ __html: c.text }} />
                      <button onClick={() => deleteComment(activeSection, itemIdx, c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 10 }}>✕</button>
                    </div>
                    {c.audio && <audio controls src={c.audio} style={{ height: 24, marginTop: 2, maxWidth: '100%' }} />}
                    {renderAttachments(c, 120, 60)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSummaryView = () => {
    // Collect all comments enriched with section/item context
    const allComments = [];
    S.forEach((sec, secIdx) => {
      sec[3].forEach(item => {
        const [itemIdx, , text] = item;
        const key = commentKey(secIdx, itemIdx);
        const itemComments = comments[key] || [];
        itemComments.forEach(c => {
          allComments.push({ ...c, secIdx, itemIdx, sectionName: sec[1], itemText: typeof text === 'string' ? text : '(table)' });
        });
      });
    });

    if (allComments.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
          <div style={{ fontSize: 16, fontFamily: "'Instrument Serif', Georgia, serif" }}>No comments yet</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Click on any spec item to add feedback</div>
        </div>
      );
    }

    // Group by section in document order
    const grouped = {};
    S.forEach((sec, secIdx) => {
      const sectionComments = allComments.filter(c => c.secIdx === secIdx);
      if (sectionComments.length > 0) {
        grouped[secIdx] = sectionComments.sort((a, b) => new Date(b.time) - new Date(a.time));
      }
    });

    return (
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {Object.entries(grouped).map(([secIdx, cmts]) => (
          <div key={secIdx} style={{ marginBottom: 24 }}>
            <button onClick={() => { setShowSummary(false); setActiveSection(Number(secIdx)); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 16, color: '#4a7cc9', textAlign: 'left', width: '100%', borderBottom: '1px solid #e0e0e0', paddingBottom: 8, marginBottom: 10 }}>
              {cmts[0].sectionName} →
            </button>
            {cmts.map(c => (
              <div key={c.id} style={{ padding: '10px 14px', marginBottom: 6, background: 'rgba(100,149,237,0.05)', borderLeft: '3px solid #6495ed66', borderRadius: 4 }}>
                <div style={{ fontSize: 12, fontStyle: 'italic', color: '#888', marginBottom: 6 }}>
                  {c.itemText.length > 150 ? c.itemText.slice(0, 150) + '…' : c.itemText}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#8b6914', background: '#f5f0e8', padding: '2px 6px', borderRadius: 3, whiteSpace: 'nowrap', lineHeight: '18px', flexShrink: 0 }}>C-{String(c.num || 0).padStart(3,'0')}</span>
                  <span style={{ fontWeight: 600, color: '#4a7cc9', fontSize: 13, whiteSpace: 'nowrap' }}>{c.author}</span>
                  <span className="comment-html" style={{ flex: 1, color: '#333', fontSize: 13 }} dangerouslySetInnerHTML={{ __html: c.text }} />
                  <span style={{ fontSize: 10, color: '#999', whiteSpace: 'nowrap' }}>{new Date(c.time).toLocaleDateString()}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteComment(c.secIdx, c.itemIdx, c.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 10, padding: '0 2px' }}>✕</button>
                </div>
                {c.audio && <audio controls src={c.audio} style={{ height: 28, marginTop: 4, maxWidth: '100%' }} />}
                {renderAttachments(c, 300, 150)}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderCompetitorsView = () => {
    const entryFeatures = (e) => e.features || (e.feature ? [e.feature] : []);
    let entries = [...competitorData];
    if (compFilter) entries = entries.filter(e => e.competitor === compFilter);
    if (featureFilter) entries = entries.filter(e => entryFeatures(e).includes(featureFilter));
    if (compSearch) {
      const q = compSearch.toLowerCase();
      entries = entries.filter(e =>
        (e.title || '').toLowerCase().includes(q) ||
        (e.text || '').replace(/<[^>]*>/g, '').toLowerCase().includes(q) ||
        (e.competitor || '').toLowerCase().includes(q) ||
        entryFeatures(e).some(f => f.toLowerCase().includes(q)) ||
        (e.links || []).some(l => l.toLowerCase().includes(q))
      );
    }
    const grouped = {};
    entries.forEach(e => { const c = e.competitor || 'Other'; if (!grouped[c]) grouped[c] = []; grouped[c].push(e); });
    Object.values(grouped).forEach(arr => arr.sort((a, b) => new Date(b.time) - new Date(a.time)));
    const sortedKeys = Object.keys(grouped).sort();

    const getVideoEmbed = (url) => {
      const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
      if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
      const vm = url.match(/vimeo\.com\/(\d+)/);
      if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
      return null;
    };

    const toolbarBtn = (cmd, label, extra = {}) => (
      <button key={cmd} title={cmd} onMouseDown={e => { e.preventDefault(); document.execCommand(cmd, false, extra.value); }}
        style={{ padding: '2px 7px', background: 'transparent', border: '1px solid transparent', borderRadius: 3, cursor: 'pointer', fontSize: 12, fontWeight: cmd === 'bold' ? 700 : 400, fontStyle: cmd === 'italic' ? 'italic' : 'normal', textDecoration: cmd === 'underline' ? 'underline' : cmd === 'strikeThrough' ? 'line-through' : 'none', color: '#555', lineHeight: 1.3 }}>{label}</button>
    );

    return (
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          <button onClick={() => { setAddingIntel(true); setAudioData(null); setAttachments([]); setTranscript(''); setCompVideo(null); setIntelForm({ competitor: '', features: [], title: '', links: [] }); setNewLink(''); }}
            style={{ padding: '7px 14px', background: '#8b6914', color: '#fff', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Add Intel</button>
          <select value={compFilter} onChange={e => setCompFilter(e.target.value)}
            style={{ padding: '6px 8px', fontSize: 12, background: '#fff', color: '#1a1a1a', border: '1px solid #d0d0d0', borderRadius: 4, fontFamily: 'inherit' }}>
            <option value="">All Competitors</option>
            {[...new Set([...COMPETITORS_LIST, ...competitorData.map(e => e.competitor)])].filter(Boolean).sort((a, b) => a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b)).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={featureFilter} onChange={e => setFeatureFilter(e.target.value)}
            style={{ padding: '6px 8px', fontSize: 12, background: '#fff', color: '#1a1a1a', border: '1px solid #d0d0d0', borderRadius: 4, fontFamily: 'inherit' }}>
            <option value="">All Features</option>
            {[...new Set([...FEATURES_LIST, ...competitorData.flatMap(e => e.features || (e.feature ? [e.feature] : []))])].filter(Boolean).sort((a, b) => a === 'General' ? 1 : b === 'General' ? -1 : a.localeCompare(b)).map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <input value={compSearch} onChange={e => setCompSearch(e.target.value)} placeholder="Search intel…"
            style={{ flex: 1, minWidth: 120, padding: '6px 10px', background: '#fff', border: '1px solid #d0d0d0', borderRadius: 4, fontSize: 12, fontFamily: 'inherit' }} />
        </div>

        {addingIntel && (
          <div style={{ marginBottom: 20, padding: 16, background: '#fafaf8', border: '1px solid #e0e0e0', borderRadius: 8 }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <select value={intelForm.competitor} onChange={e => setIntelForm(f => ({ ...f, competitor: e.target.value }))}
                style={{ padding: '6px 8px', fontSize: 12, background: '#fff', border: '1px solid #d0d0d0', borderRadius: 4, fontFamily: 'inherit', minWidth: 140 }}>
                <option value="">Select Competitor…</option>
                {[...new Set([...COMPETITORS_LIST, ...competitorData.map(e => e.competitor)])].filter(Boolean).sort((a, b) => a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b)).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input placeholder="Or type custom…" style={{ padding: '6px 8px', fontSize: 12, border: '1px solid #d0d0d0', borderRadius: 4, width: 120, fontFamily: 'inherit' }}
                onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { setIntelForm(f => ({ ...f, competitor: e.target.value.trim() })); e.target.value = ''; } }}
                onBlur={e => { if (e.target.value.trim()) { setIntelForm(f => ({ ...f, competitor: e.target.value.trim() })); e.target.value = ''; } }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Features (select multiple)</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                {[...new Set([...FEATURES_LIST, ...competitorData.flatMap(e => e.features || (e.feature ? [e.feature] : []))])].filter(Boolean).sort((a, b) => a === 'General' ? 1 : b === 'General' ? -1 : a.localeCompare(b)).map(f => {
                  const sel = intelForm.features.includes(f);
                  return <button key={f} onClick={() => setIntelForm(fm => ({ ...fm, features: sel ? fm.features.filter(x => x !== f) : [...fm.features, f] }))}
                    style={{ padding: '3px 10px', fontSize: 11, borderRadius: 12, border: sel ? '1px solid #2e7d32' : '1px solid #d0d0d0', background: sel ? '#e8f5e9' : '#fff', color: sel ? '#2e7d32' : '#666', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.1s' }}>{f}</button>;
                })}
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input placeholder="Add custom feature…" style={{ padding: '5px 8px', fontSize: 12, border: '1px solid #d0d0d0', borderRadius: 4, width: 160, fontFamily: 'inherit' }}
                  onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { const v = e.target.value.trim(); setIntelForm(f => ({ ...f, features: f.features.includes(v) ? f.features : [...f.features, v] })); e.target.value = ''; } }} />
                <span style={{ fontSize: 10, color: '#bbb' }}>Enter to add</span>
              </div>
            </div>
            <input value={intelForm.title} onChange={e => setIntelForm(f => ({ ...f, title: e.target.value }))} placeholder="Title"
              style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #d0d0d0', borderRadius: 4, marginBottom: 8, fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }} />
            <div style={{ border: `1.5px ${dragOver ? 'dashed #4a7cc9' : 'solid #d0d0d0'}`, borderRadius: 4, background: dragOver ? 'rgba(74,124,201,0.06)' : '#fff', marginBottom: 8, transition: 'border 0.15s, background 0.15s' }}>
              <div style={{ display: 'flex', gap: 2, padding: '4px 6px', borderBottom: '1px solid #e8e8e8', background: '#fafafa', borderRadius: '4px 4px 0 0', flexWrap: 'wrap' }}>
                {toolbarBtn('bold', 'B')}
                {toolbarBtn('italic', 'I')}
                {toolbarBtn('underline', 'U')}
                {toolbarBtn('strikeThrough', 'S̶')}
                <span style={{ width: 1, background: '#e0e0e0', margin: '2px 4px' }} />
                <button title="Bullet list" onMouseDown={e => { e.preventDefault(); document.execCommand('insertUnorderedList'); }} style={{ padding: '2px 7px', background: 'transparent', border: '1px solid transparent', borderRadius: 3, cursor: 'pointer', fontSize: 12, color: '#555' }}>• List</button>
                <button title="Numbered list" onMouseDown={e => { e.preventDefault(); document.execCommand('insertOrderedList'); }} style={{ padding: '2px 7px', background: 'transparent', border: '1px solid transparent', borderRadius: 3, cursor: 'pointer', fontSize: 12, color: '#555' }}>1. List</button>
                <span style={{ width: 1, background: '#e0e0e0', margin: '2px 4px' }} />
                <button title="Highlight" onMouseDown={e => { e.preventDefault(); document.execCommand('hiliteColor', false, '#fff3cd'); }} style={{ padding: '2px 7px', background: 'transparent', border: '1px solid transparent', borderRadius: 3, cursor: 'pointer', fontSize: 12, color: '#555' }}>🖍</button>
                <button title="Clear formatting" onMouseDown={e => { e.preventDefault(); document.execCommand('removeFormat'); }} style={{ padding: '2px 7px', background: 'transparent', border: '1px solid transparent', borderRadius: 3, cursor: 'pointer', fontSize: 11, color: '#999' }}>T̸</button>
              </div>
              <div ref={compEditorRef} contentEditable suppressContentEditableWarning onPaste={handlePaste}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); addIntel(); } }}
                data-placeholder="Add notes or analysis…"
                className="rtf-editor"
                style={{ minHeight: 120, maxHeight: 300, overflowY: 'auto', padding: '8px 10px', color: '#1a1a1a', fontSize: 12.5, fontFamily: 'inherit', lineHeight: 1.6, outline: 'none' }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                <input value={newLink} onChange={e => setNewLink(e.target.value)} placeholder="Add URL link…"
                  onKeyDown={e => { if (e.key === 'Enter' && newLink.trim()) { setIntelForm(f => ({ ...f, links: [...f.links, newLink.trim()] })); setNewLink(''); } }}
                  style={{ flex: 1, padding: '6px 8px', fontSize: 12, border: '1px solid #d0d0d0', borderRadius: 4, fontFamily: 'inherit' }} />
                <button onClick={() => { if (newLink.trim()) { setIntelForm(f => ({ ...f, links: [...f.links, newLink.trim()] })); setNewLink(''); } }}
                  style={{ padding: '6px 10px', background: '#fff', border: '1px solid #d0d0d0', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>+</button>
              </div>
              {intelForm.links.map((l, i) => (
                <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 11, marginBottom: 2 }}>
                  <span style={{ flex: 1, color: '#4a7cc9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🔗 {l}</span>
                  <button onClick={() => setIntelForm(f => ({ ...f, links: f.links.filter((_, j) => j !== i) }))}
                    style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 10 }}>✕</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              <button onClick={isRecording ? stopRecording : startRecording} title={isRecording ? 'Stop recording' : 'Record audio'}
                style={{ padding: '6px 8px', background: isRecording ? '#e53935' : 'transparent', color: isRecording ? '#fff' : '#888', border: `1px solid ${isRecording ? '#e53935' : '#d0d0d0'}`, borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>{isRecording ? '⏹' : '🎤'}</button>
              <button onClick={() => compFileInputRef.current?.click()} title="Attach files/images"
                style={{ padding: '6px 8px', background: 'transparent', color: '#888', border: '1px solid #d0d0d0', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>📎</button>
              <input ref={compFileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" onChange={handleFileUpload} style={{ display: 'none' }} />
              <button onClick={() => compVideoInputRef.current?.click()} title="Upload video"
                style={{ padding: '6px 8px', background: 'transparent', color: '#888', border: '1px solid #d0d0d0', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>🎬</button>
              <input ref={compVideoInputRef} type="file" accept="video/*" onChange={e => {
                const f = e.target.files?.[0];
                if (f) { const reader = new FileReader(); reader.onloadend = () => setCompVideo(reader.result); reader.readAsDataURL(f); }
                e.target.value = '';
              }} style={{ display: 'none' }} />
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 10, color: '#bbb', alignSelf: 'center' }}>Paste, drag & drop, or 📎 to attach</span>
            </div>
            {isRecording && (
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #e5393522', borderRadius: 6, padding: '6px 10px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e53935', animation: 'pulse 1s infinite' }} />
                <canvas ref={canvasRef} width={240} height={32} style={{ flex: 1, maxWidth: 240, height: 32, borderRadius: 3 }} />
                <span style={{ fontSize: 11, color: '#e53935', fontFamily: "'JetBrains Mono', monospace", minWidth: 32 }}>{Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}</span>
              </div>
            )}
            {(audioData || attachments.length > 0 || compVideo) && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
                {audioData && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><audio controls src={audioData} style={{ height: 28 }} /><button onClick={() => { if (compEditorRef.current && transcript) compEditorRef.current.innerText = transcript; }} title="Transcribe" style={{ padding: '3px 8px', background: transcript ? '#4a7cc9' : '#d0d0d0', color: '#fff', border: 'none', borderRadius: 3, fontSize: 10, fontWeight: 600, cursor: transcript ? 'pointer' : 'default', opacity: transcript ? 1 : 0.5 }}>Transcribe</button><button onClick={() => setAudioData(null)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 10 }}>✕</button></div>}
                {attachments.map(a => a.isImage ? (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><img src={a.data} alt="preview" style={{ maxWidth: 80, maxHeight: 50, borderRadius: 4, border: '1px solid #e0e0e0' }} /><button onClick={() => setAttachments(prev => prev.filter(x => x.id !== a.id))} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 10 }}>✕</button></div>
                ) : (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ fontSize: 11, color: '#8b6914', background: '#f5f0e8', padding: '3px 8px', borderRadius: 3, border: '1px solid #e0d8c8' }}>📄 {a.name}</span><button onClick={() => setAttachments(prev => prev.filter(x => x.id !== a.id))} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 10 }}>✕</button></div>
                ))}
                {compVideo && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><video src={compVideo} style={{ maxWidth: 120, maxHeight: 70, borderRadius: 4 }} /><button onClick={() => setCompVideo(null)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 10 }}>✕</button></div>}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={addIntel} style={{ padding: '6px 14px', background: '#8b6914', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Add Intel</button>
              <button onClick={() => { setAddingIntel(false); setAudioData(null); setAttachments([]); setCompVideo(null); setTranscript(''); setDragOver(false); if (isRecording) stopRecording(); }}
                style={{ padding: '6px 10px', background: 'none', color: '#888', border: '1px solid #d0d0d0', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {entries.length === 0 && !addingIntel && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
            <div style={{ fontSize: 16, fontFamily: "'Instrument Serif', Georgia, serif" }}>No competitor intel yet</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Click "+ Add Intel" to start collecting competitive intelligence</div>
          </div>
        )}

        {sortedKeys.map(comp => (
          <div key={comp} style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 16, color: '#1a1a1a', borderBottom: '1px solid #e0e0e0', paddingBottom: 8, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              {comp}
              <span style={{ fontSize: 11, color: '#888', fontFamily: 'inherit', fontWeight: 400 }}>({grouped[comp].length})</span>
            </div>
            {grouped[comp].map(e => (
              <div key={e.id} style={{ padding: '12px 14px', marginBottom: 8, background: 'rgba(139,105,20,0.03)', borderLeft: '3px solid #8b691444', borderRadius: 4 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#8b6914', background: '#f5f0e8', padding: '2px 6px', borderRadius: 3, whiteSpace: 'nowrap' }}>I-{String(e.num || 0).padStart(3, '0')}</span>
                  <span style={{ fontSize: 10, background: '#fce4ec', color: '#c62828', padding: '2px 6px', borderRadius: 3 }}>{e.competitor}</span>
                  {(e.features || (e.feature ? [e.feature] : [])).map((f, fi) => <span key={fi} style={{ fontSize: 10, background: '#e8f5e9', color: '#2e7d32', padding: '2px 6px', borderRadius: 3 }}>{f}</span>)}
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#4a7cc9' }}>{e.author}</span>
                  <span style={{ fontSize: 10, color: '#999' }}>{new Date(e.time).toLocaleDateString()}</span>
                  <button onClick={() => deleteIntel(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 10, padding: '0 2px' }}>✕</button>
                </div>
                {e.title && <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a1a', marginBottom: 4 }}>{e.title}</div>}
                {e.text && <div className="comment-html" style={{ fontSize: 13, color: '#444', marginBottom: 6 }} dangerouslySetInnerHTML={{ __html: e.text }} />}
                {e.links?.length > 0 && (
                  <div style={{ marginBottom: 6 }}>
                    {e.links.map((l, i) => {
                      const embed = getVideoEmbed(l);
                      return embed ? (
                        <div key={i} style={{ marginBottom: 6 }}>
                          <a href={l} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#4a7cc9', display: 'block', marginBottom: 4 }}>🔗 {l}</a>
                          <iframe src={embed} width="400" height="225" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ borderRadius: 4, maxWidth: '100%', border: '1px solid #e0e0e0' }} />
                        </div>
                      ) : (
                        <a key={i} href={l} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: 12, color: '#4a7cc9', marginBottom: 2 }}>🔗 {l}</a>
                      );
                    })}
                  </div>
                )}
                {e.images?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                    {e.images.map((src, i) => <img key={i} src={src} alt="screenshot" onClick={() => setModalImage(src)} style={{ maxWidth: 300, maxHeight: 180, borderRadius: 4, border: '1px solid #e0e0e0', cursor: 'pointer' }} />)}
                  </div>
                )}
                {e.audio && <audio controls src={e.audio} style={{ height: 28, marginBottom: 6, maxWidth: '100%', display: 'block' }} />}
                {e.video && <video controls src={e.video} style={{ maxWidth: 400, maxHeight: 225, borderRadius: 4, marginBottom: 6, display: 'block' }} />}
                {e.files?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {e.files.map((d, i) => <a key={i} href={d.data} download={d.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: '#f5f0e8', borderRadius: 4, fontSize: 11, color: '#8b6914', textDecoration: 'none', border: '1px solid #e0d8c8' }}>📄 {d.name}</a>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  if (!loaded) return <div style={{ background: '#fff', color: '#888', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', fontSize: 18 }}>Loading Coryphaeus Spec…</div>;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <style>{`
        .spec-item:hover .cmt-btn { opacity: 1 !important; }
        .badge-v31 { font-size: 10px; background: #f5e6c8; color: #8b6914; padding: 2px 8px; border-radius: 3px; font-family: 'JetBrains Mono', monospace; font-weight: 600; }
        .sidebar-btn { display: flex; align-items: center; gap: 8px; width: 100%; padding: 9px 16px; background: transparent; border: none; border-left: 3px solid transparent; cursor: pointer; text-align: left; color: #666; font-size: 12.5px; transition: all 0.1s; font-family: inherit; }
        .sidebar-btn:hover { background: rgba(0,0,0,0.03); color: #333; }
        .sidebar-btn.active { background: rgba(139,105,20,0.06); border-left-color: #8b6914; color: #1a1a1a; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .rtf-editor:empty:before { content: attr(data-placeholder); color: #bbb; pointer-events: none; }
        .rtf-editor ul, .rtf-editor ol { margin: 4px 0; padding-left: 20px; }
        .rtf-editor li { margin-bottom: 2px; }
        .rtf-editor b, .rtf-editor strong { font-weight: 700; }
        .comment-html ul, .comment-html ol { margin: 2px 0; padding-left: 16px; }
        .comment-html li { margin-bottom: 1px; }
        .comment-html b, .comment-html strong { font-weight: 700; }
        .comment-html p { margin: 0 0 4px; }
      `}</style>

      {sidebarOpen && (
        <div style={{ width: 280, minWidth: 280, background: '#f8f8f6', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #e0e0e0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 20, letterSpacing: 1.5, color: '#1a1a1a' }}>CORYPHAEUS</span>
                <span className="badge-v31" style={{ marginLeft: 8 }}>v3.1</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 16 }}>◀</button>
            </div>
            <input id="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sections… (⌘K)" style={{ width: '100%', padding: '7px 10px', background: '#fff', border: '1px solid #d0d0d0', borderRadius: 5, color: '#1a1a1a', fontSize: 12, fontFamily: 'inherit' }} />
          </div>
          <div style={{ padding: '8px 16px', borderBottom: '1px solid #e0e0e0', display: 'flex', gap: 12, fontSize: 11, color: '#888' }}>
            <span>{S.length} sections</span>
            <span style={{ color: '#4a7cc9' }}>💬 {totalComments}</span>
            {showChanges && <span style={{ color: '#8b6914' }}>97 v3.1 changes</span>}
            {saving && <span style={{ color: '#4caf50' }}>saving…</span>}
          </div>
          <div style={{ padding: '8px 16px', borderBottom: '1px solid #e0e0e0', display: 'flex', gap: 6, alignItems: 'center' }}>
            <select value={selectedVersion} onChange={e => setSelectedVersion(e.target.value)} style={{ padding: '4px 6px', fontSize: 11, background: '#fff', color: '#1a1a1a', border: '1px solid #d0d0d0', borderRadius: 4, fontFamily: 'inherit', cursor: 'pointer' }}>
              {VERSIONS.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
            <span style={{ fontSize: 11, color: '#888', marginLeft: 2 }}>Changes</span>
            <label style={{ fontSize: 11, color: showChanges ? '#8b6914' : '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
              <input type="radio" name="showChanges" checked={showChanges} onChange={() => setShowChanges(true)} style={{ margin: 0, accentColor: '#8b6914' }} /> Yes
            </label>
            <label style={{ fontSize: 11, color: !showChanges ? '#8b6914' : '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
              <input type="radio" name="showChanges" checked={!showChanges} onChange={() => setShowChanges(false)} style={{ margin: 0, accentColor: '#8b6914' }} /> No
            </label>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
            <button className={`sidebar-btn ${showSummary && !showCompetitors ? 'active' : ''}`} onClick={() => { setShowCompetitors(false); setShowSummary(true); }} style={{ borderBottom: '1px solid #e0e0e0', marginBottom: 2 }}>
              <span style={{ flex: 1 }}>💬 Comments Summary</span>
              {totalComments > 0 && <span style={{ fontSize: 10, background: '#e8f0fc', color: '#4a7cc9', padding: '1px 5px', borderRadius: 3 }}>{totalComments}</span>}
            </button>
            <button className={`sidebar-btn ${showCompetitors ? 'active' : ''}`} onClick={() => { setShowSummary(false); setShowCompetitors(true); }} style={{ borderBottom: '1px solid #e0e0e0', marginBottom: 2 }}>
              <span style={{ flex: 1 }}>🎯 Competitors</span>
              {competitorData.length > 0 && <span style={{ fontSize: 10, background: '#fce4ec', color: '#c62828', padding: '1px 5px', borderRadius: 3 }}>{competitorData.length}</span>}
            </button>
            {filteredSections.map(([s, realIdx]) => {
              const cmtCount = sectionCommentCount(realIdx);
              return (
                <button key={s[0]} className={`sidebar-btn ${realIdx === activeSection && !showSummary && !showCompetitors ? 'active' : ''}`} onClick={() => { setShowSummary(false); setShowCompetitors(false); setActiveSection(realIdx); }}>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s[1]}</span>
                  <span style={{ display: 'flex', gap: 4 }}>
                    {s[2] > 0 && showChanges && <span style={{ fontSize: 10, background: '#f5e6c8', color: '#8b6914', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace' }}>{s[2]}</span>}
                    {cmtCount > 0 && <span style={{ fontSize: 10, background: '#e8f0fc', color: '#4a7cc9', padding: '1px 5px', borderRadius: 3 }}>💬{cmtCount}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '10px 20px', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 12, background: '#f8f8f6', minHeight: 44 }}>
          {!sidebarOpen && <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 16 }}>▶</button>}
          <div style={{ flex: 1 }}>
            <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 18, color: '#1a1a1a' }}>{showCompetitors ? '🎯 Competitors Intel' : showSummary ? 'Comments Summary' : section[1]}</span>
            <span style={{ fontSize: 11, color: '#999', marginLeft: 10 }}>{showCompetitors ? 'All competitors' : showSummary ? 'All sections' : `${section[0]}.md`}</span>
          </div>
          {showCompetitors && <span style={{ fontSize: 11, color: '#999' }}>{competitorData.length} entries</span>}
          {!showSummary && !showCompetitors && <span style={{ fontSize: 11, color: '#999' }}>{section[3].length} items</span>}
          {!showSummary && !showCompetitors && section[2] > 0 && showChanges && <span className="badge-v31">{section[2]} v3.1</span>}
        </div>
        <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 80px' }}>
          {showCompetitors ? (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>{renderCompetitorsView()}</div>
          ) : showSummary ? (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>{renderSummaryView()}</div>
          ) : (
            <div style={{ maxWidth: 800, margin: '0 auto', animation: 'fadeIn 0.2s ease' }}>
              {section[3].map(item => renderItem(item))}
            </div>
          )}
        </div>
        <div style={{ padding: '8px 20px', borderTop: '1px solid #e0e0e0', background: '#f8f8f6', display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, color: '#888' }}>
          {showCompetitors ? (
            <>
              <span style={{ color: '#c62828' }}>🎯 {competitorData.length} intel entries</span>
              <span>•</span>
              <span>{new Set(competitorData.map(e => e.competitor)).size} competitors tracked</span>
              <span>•</span>
              <span>v3.1 — Feb 2026</span>
              {saving && <span style={{ color: '#4caf50' }}>● Saving…</span>}
            </>
          ) : showSummary ? (
            <>
              <span style={{ color: '#4a7cc9' }}>💬 {totalComments} comments across {Object.keys(Object.entries(comments).reduce((acc, [k, v]) => { if (v.length > 0) { const sec = k.split('-')[0]; acc[sec] = true; } return acc; }, {})).length} sections</span>
              <span>•</span>
              <span>v3.1 — Feb 2026</span>
              {saving && <span style={{ color: '#4caf50' }}>● Saving…</span>}
            </>
          ) : (
            <>
              <span>Section {activeSection + 1}/{S.length}</span>
              <span>•</span>
              <span style={{ color: '#4a7cc9' }}>💬 {totalComments} comments</span>
              <span>•</span>
              <span>v3.1 — Feb 2026</span>
              {saving && <span style={{ color: '#4caf50' }}>● Saving…</span>}
              <div style={{ flex: 1 }} />
              <button onClick={() => setActiveSection(Math.max(0, activeSection - 1))} disabled={activeSection === 0} style={{ padding: '4px 12px', background: '#fff', color: activeSection === 0 ? '#ccc' : '#555', border: '1px solid #d0d0d0', borderRadius: 4, cursor: activeSection === 0 ? 'default' : 'pointer', fontSize: 11, fontFamily: 'inherit' }}>← Prev</button>
              <button onClick={() => setActiveSection(Math.min(S.length - 1, activeSection + 1))} disabled={activeSection === S.length - 1} style={{ padding: '4px 12px', background: '#fff', color: activeSection === S.length - 1 ? '#ccc' : '#555', border: '1px solid #d0d0d0', borderRadius: 4, cursor: activeSection === S.length - 1 ? 'default' : 'pointer', fontSize: 11, fontFamily: 'inherit' }}>Next →</button>
            </>
          )}
        </div>
      </div>

      {modalImage && (
        <div onClick={() => setModalImage(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <img src={modalImage} alt="Full size" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()} />
          <button onClick={() => setModalImage(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 24, width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      )}
    </div>
  );
}
