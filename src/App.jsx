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
[2,"h","Layer 1: Presentation",0],
[3,"p","React SPA (TypeScript/Redux), React Native mobile (offline-first), Next.js admin portal, WebSocket real-time.",0],
[4,"h","Layer 2: API Gateway",0],
[5,"p","Azure APIM, OAuth 2.0 + OIDC via Entra ID, tier-based rate limiting (100/1K/10K per min), API versioning v1/v2/v3.",0],
[6,"h","Layer 3: Application (11 Microservices on AKS)",0],
[7,"p","Account, Sales, Marketing, Service, Contact Center, AI, Workflow (Zeebe + ADR-007), Integration, Analytics, User, Billing services.",0],
[8,"h","Layer 4: Data",0],
[9,"p","PostgreSQL 15+ (Flexible Server), pgvector embeddings, Redis cache, Blob Storage, Azure AI Search, Synapse Analytics.",0],
[10,"h","Layer 5: Integration",0],
[11,"p","Azure Service Bus (Topics+Subscriptions), Azure Functions, webhook engine with retry, polling scheduler.",0],
[12,"h","2.2 Multi-Tenancy (RLS)",0],
[13,"p","Shared Database, Shared Schema, Tenant Column + RLS. Simpler migrations, efficient resources, transparent isolation.",0],
[14,"h","2.3 Database Architecture",0],
[15,"p","Multi-AZ, 35-day PITR, PgBouncer pooling. Partitioning by tenant_id+time. B-tree, GIN, partial, FTS, BRIN indexes.",0],
[16,"x","EAV Pattern for Custom Fields — users click '+' on any screen to add fields. ~20 custom fields per entity per tenant.",1],
[17,"x","Centralized Code Tables — all picklists managed through code table system. Tenant-configurable with system defaults.",1],
[18,"h","2.3.6 Multi-Currency",0],
[19,"p","System default per tenant, per-record override (ISO 4217), ISO currency symbol display, exchange rate table.",0],
[20,"h","2.3.8 Soft Delete",0],
[21,"x","Soft Delete with deleted_at TIMESTAMP — NULL = active, non-NULL = deleted. Hard delete only via admin action.",1],
]],
["03-security-encryption","2. Security & Encryption (2.4-2.5)",0,[
[0,"h","2.4 Field-Level Encryption & Tokenization",0],
[1,"p","Envelope encryption (DEK+KEK via Azure Key Vault) with AES-256-GCM. Tokenization for PII. Blind indexes for search.",0],
[2,"x","Three-Tier PII Classification: Safe (company name), Sensitive (email—click-to-reveal), Restricted (SSN—never leaves web UI).",2],
[3,"h","2.4.2 Encryptable Fields",0],
[4,"p","Contact: email, phone, DOB, national_id. Account: phone, annual_revenue. Lead: email/phone. Employee: national_id. Payment: card/cvv.",0],
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
[1,"p","Account Planning: SF=Add-on($$$), HubSpot=None, D365=Limited, Coryphaeus=Built-in with rollup.",0],
[2,"p","AI Agents: SF=Einstein(3-4), HubSpot=2, D365=Copilot(generic), Coryphaeus=12 domain-specific+custom.",0],
[3,"p","MCP Apps: SF=Raw CRUD, HubSpot=None, D365=None, Coryphaeus=Interactive dashboards.",0],
[4,"p","AI Safety (PPAE): SF=None, HubSpot=None, D365=None, Coryphaeus=Full PPAE.",0],
[5,"p","Token Pricing: SF/HubSpot/D365=Bundled/hidden, Coryphaeus=Real-time dashboard + BYOK.",0],
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
[1,"p","Starter: $12-25/user/month (Zoho $14, Pipedrive $15). Professional: $25-75 (HubSpot $45, SF $75). Enterprise: $75-300+ (SF $150+, D365 $95-150).",0],
[2,"x","Coryphaeus Pricing: Phase 1 $10/user/month (add-on). Phase 2 $30/user/month + AI tokens. Enterprise ~50% of SF.",1],
]],
["16-roadmap","9. Product Vision & Roadmap",0,[
[0,"h","9. Product Vision & Roadmap",0],
[1,"h","9.1 Technical Differentiation",0],
[2,"p","10 innovations: Native Account Planning, PPAE, PII Classes, MCP Apps, LazyGraphRAG, Two-Loop Orchestration, Single Retrieval API, Token Pricing, MCP Security, SimpleMem Memory.",0],
[3,"h","9.2 Implementation Roadmap",0],
[4,"p","Phase 1 (M1-6): Accounts, Contacts, Opportunities, Cases, basic Account Plans.",0],
[5,"p","Phase 2 (M7-12): Full Account Planning, 12 AI agents, BPMN, Contact Center.",0],
[6,"p","Phase 3 (M13-18): Marketing, MCP Apps, Integration marketplace.",0],
[7,"p","Phase 4 (M19-24): Advanced analytics, LazyGraphRAG, compliance certs.",0],
[8,"x","Priority Rollout: (1) Accounts+Contacts, (2) Opportunities+Account Plans, (3) Cases+Contact Center.",1],
]],
["17-innovations","10. Innovation Roadmap (Rounds 1-7)",8,[
[0,"h","10. Innovation Roadmap — Critical Analysis Rounds 1-7",0],
[1,"p","All innovations achieved terminal convergence with zero repudiations across 7 rounds of independent advisory analysis.",1],
[2,"h","10.1 Convergence Scorecard",0],
[3,"p","15 decisions tracked across 7 rounds. Key: RAG(Rd1), PPAE(Rd1), MCP Apps(Rd3), LazyGraphRAG(Rd4), Memory Provider(Rd4), Three-Layer(Rd6), Embedding/Chunking/PDP-PEP/OTel(Rd7).",0],
[4,"h","10.2 Priority Matrix (v3.1)",1],
[5,"p","P0: ADR-001 Retrieval, ADR-002 Orchestration, ADR-003 MCP Security, ADR-007 Workflow DSL (CLOSED), AI Eval, PPAE. Embedding+Chunking+PDP/PEP APPLIED v3.1.",1],
[6,"p","P1: ADR-004 Memory, ADR-005 Agent Portfolio, ADR-006 LazyGraphRAG, OTel+Governance APPLIED v3.1.",1],
[7,"p","P2: Stage Transition Simulation, MCP Apps build. P3: A2UI mobile pilot (deferred Q4 2026).",0],
[8,"h","10.3 Salesforce MCP Gap Analysis",0],
[9,"x","SF MCP (GA Feb 2026): Raw CRUD only. No deal reasoning, no MCP Apps, no PPAE, no AI Trust Center.",2],
[10,"h","10.4 MCP Tool Poisoning",0],
[11,"x","MCPTox Benchmark: 72.8% attack success. CVEs documented. 43% public MCP servers have command injection.",2],
[12,"h","10.5 Memory Architecture",0],
[13,"x","SimpleMem: 43.24% F1, 26.4% improvement over Mem0. MIT licensed. Memory Provider Interface ensures pluggability.",2],
[14,"h","10.6 ADR Readiness",1],
[15,"p","ADR-001: Retrieval (this week). ADR-002: Orchestration (90 days). ADR-003: MCP Security (this week). ADR-004-006: Phase 1. ADR-007: CLOSED.",0],
]],
["18-appendix","11. Appendix",4,[
[0,"h","11. Appendix",0],
[1,"h","11.1 Change Log",0],
[2,"p","v2.0: Original 27 entities, 6 differentiators. v3.0: Review 3 (88 items), 43 entities, 8 differentiators, Rounds 1-5.",0],
[3,"p","v3.1: Stephen Review 1 (39 changes, 8 comments), Rounds 6-7, 48 entities, Complaint merged, 6 new entities, P0 fixes.",1],
[4,"h","11.3 Naming Changes",0],
[5,"p","zip→postal_code, ssn→national_id, title→designation, added building_number/unit_number/currency_code/deleted_at, gross_amount→sales_tcv_amount(v3.1).",0],
[6,"h","11.4 Decision Register (D1-D16)",0],
[7,"p","16 closed decisions spanning 7 rounds. D1:RAG, D2:BPMN+LangGraph, D3:MCP Apps, D4:PPAE, D5:Web canonical, D6:Memory, D7:LazyGraphRAG, D8-D16:Rounds 6-7.",0],
[8,"h","11.5 Open Questions (OQ1-OQ8)",0],
[9,"p","OQ1:Agent nesting, OQ2:Employee entity, OQ3:Search vs pgvector, OQ4:Loyalty reqs, OQ5:DSL compiler, OQ6:Redaction scope, OQ7:SF MCP, OQ8:Cold-start cost.",0],
[10,"h","11.6 Glossary",0],
[11,"p","PPAE, MCP, BPMN, DMN, RLS, EAV, RAG, LazyGraphRAG, LangGraph, ADR, TCV, ICP, PII, PDP/PEP, OTel, OKR, SPIN, BYOK, NL, WFM, NIST AI RMF, ISO 42001.",0],
]],
];

const VERSIONS = [
  { id: "3.1", date: "Feb 2026", label: "v3.1 — Current", changes: 97, desc: "Stephen Review 1, Rounds 6-7, 48 entities, 6 new entities, P0 fixes" },
  { id: "3.0", date: "Feb 2026", label: "v3.0", changes: 88, desc: "Review 3 feedback, 43 entities, 8 differentiators, Rounds 1-5" },
  { id: "2.0", date: "Feb 2026", label: "v2.0 — Original", changes: 0, desc: "Original spec with 27 entities, 6 differentiators" },
];

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

// ── Main App ──
export default function App() {
  const [activeSection, setActiveSection] = useState(0);
  const [comments, setComments] = useState({});
  const [commentingOn, setCommentingOn] = useState(null);
  const [commentText, setCommentText] = useState("");
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
  const [showVersions, setShowVersions] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [filterV31, setFilterV31] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const contentRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    apiGet().then(c => { setComments(c); setLoaded(true); });
  }, []);

  useEffect(() => { contentRef.current?.scrollTo(0, 0); }, [activeSection]);

  const commentKey = (secIdx, itemIdx) => `${S[secIdx][0]}-${itemIdx}`;
  const getComments = (secIdx, itemIdx) => comments[commentKey(secIdx, itemIdx)] || [];
  const totalComments = Object.values(comments).reduce((s, arr) => s + arr.length, 0);
  const sectionCommentCount = (secIdx) => {
    const prefix = S[secIdx][0];
    return Object.entries(comments).filter(([k, v]) => k.startsWith(prefix) && v.length > 0).reduce((s, [, v]) => s + v.length, 0);
  };

  const addComment = useCallback(async () => {
    if (!commentText.trim() || !commentingOn) return;
    const key = commentKey(commentingOn[0], commentingOn[1]);
    const author = commentAuthor.trim() || "Reviewer";
    try { localStorage.setItem("spec-author", author); } catch {}
    const newComments = {
      ...comments,
      [key]: [...(comments[key] || []), { text: commentText.trim(), author, time: new Date().toISOString(), id: Date.now() }]
    };
    setComments(newComments);
    setCommentText("");
    setCommentingOn(null);
    setSaving(true);
    await apiSave(newComments);
    setSaving(false);
  }, [commentText, commentAuthor, commentingOn, comments]);

  const deleteComment = useCallback(async (secIdx, itemIdx, commentId) => {
    const key = commentKey(secIdx, itemIdx);
    const newComments = { ...comments, [key]: (comments[key] || []).filter(c => c.id !== commentId) };
    if (newComments[key].length === 0) delete newComments[key];
    setComments(newComments);
    setSaving(true);
    await apiSave(newComments);
    setSaving(false);
  }, [comments]);

  useEffect(() => {
    if (commentingOn && inputRef.current) inputRef.current.focus();
  }, [commentingOn]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight' && !commentingOn) { setShowSummary(false); setActiveSection(s => Math.min(S.length - 1, s + 1)); }
      if (e.key === 'ArrowLeft' && !commentingOn) { setShowSummary(false); setActiveSection(s => Math.max(0, s - 1)); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); document.querySelector('#search-input')?.focus(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [commentingOn]);

  const section = S[activeSection];
  const filteredSections = search
    ? S.map((s, i) => [s, i]).filter(([s]) => s[1].toLowerCase().includes(search.toLowerCase()) || s[3].some(it => it[2]?.toLowerCase().includes(search.toLowerCase())))
    : S.map((s, i) => [s, i]);

  const renderItem = (item) => {
    const [itemIdx, type, text, flag] = item;
    const isV31 = flag === 1;
    const isInnovation = flag === 2;
    const key = commentKey(activeSection, itemIdx);
    const itemComments = comments[key] || [];
    const isCommenting = commentingOn && commentingOn[0] === activeSection && commentingOn[1] === itemIdx;

    if (filterV31 && !isV31 && type !== 'h') return null;

    let content;
    if (type === 'h') {
      const level = text.match(/^\d+\.\d+\.\d+/) ? 3 : text.match(/^\d+\.\d+/) ? 2 : text.match(/^\d+\./) ? 1 : 3;
      const sizes = { 1: 22, 2: 18, 3: 15 };
      content = (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, fontSize: sizes[level], fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400, color: '#1a1a1a', letterSpacing: 0.3 }}>{text}</h3>
          {isV31 && <span className="badge-v31">NEW v3.1</span>}
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
          {isV31 && <span className="badge-v31" style={{ marginLeft: 8 }}>v3.1</span>}
        </div>
      );
    } else {
      content = (
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: '#444' }}>
          {text}
          {isV31 && <span className="badge-v31" style={{ marginLeft: 6 }}>v3.1</span>}
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
              <div key={c.id} style={{ fontSize: 12, marginBottom: 4, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 600, color: '#4a7cc9', whiteSpace: 'nowrap' }}>{c.author}</span>
                <span style={{ flex: 1, color: '#555' }}>{c.text}</span>
                <span style={{ fontSize: 10, color: '#999', whiteSpace: 'nowrap' }}>{new Date(c.time).toLocaleDateString()}</span>
                <button onClick={() => deleteComment(activeSection, itemIdx, c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 10 }}>✕</button>
              </div>
            ))}
          </div>
        )}
        {isCommenting && (
          <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <input ref={inputRef} value={commentAuthor} onChange={e => setCommentAuthor(e.target.value)} placeholder="Your name" style={{ width: 100, padding: '6px 8px', background: '#fff', border: '1px solid #d0d0d0', borderRadius: 4, color: '#1a1a1a', fontSize: 12 }} />
            <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()} placeholder="Add comment or feedback…" style={{ flex: 1, minWidth: 200, padding: '6px 8px', background: '#fff', border: '1px solid #d0d0d0', borderRadius: 4, color: '#1a1a1a', fontSize: 12 }} />
            <button onClick={addComment} style={{ padding: '6px 14px', background: '#8b6914', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Add</button>
            <button onClick={() => setCommentingOn(null)} style={{ padding: '6px 10px', background: 'none', color: '#888', border: '1px solid #d0d0d0', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
            {itemComments.length > 0 && (
              <div style={{ width: '100%', marginTop: 4, paddingLeft: 12, borderLeft: '2px solid #4a7cc944' }}>
                {itemComments.map(c => (
                  <div key={c.id} style={{ fontSize: 12, marginBottom: 3, display: 'flex', gap: 8 }}>
                    <span style={{ fontWeight: 600, color: '#4a7cc9' }}>{c.author}</span>
                    <span style={{ flex: 1, color: '#555' }}>{c.text}</span>
                    <button onClick={() => deleteComment(activeSection, itemIdx, c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 10 }}>✕</button>
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
          allComments.push({ ...c, secIdx, itemIdx, sectionName: sec[1], itemText: text });
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
                  <span style={{ fontWeight: 600, color: '#4a7cc9', fontSize: 13, whiteSpace: 'nowrap' }}>{c.author}</span>
                  <span style={{ flex: 1, color: '#333', fontSize: 13 }}>{c.text}</span>
                  <span style={{ fontSize: 10, color: '#999', whiteSpace: 'nowrap' }}>{new Date(c.time).toLocaleDateString()}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteComment(c.secIdx, c.itemIdx, c.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 10, padding: '0 2px' }}>✕</button>
                </div>
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
            <span style={{ color: '#8b6914' }}>97 v3.1 changes</span>
            {saving && <span style={{ color: '#4caf50' }}>saving…</span>}
          </div>
          <div style={{ padding: '8px 16px', borderBottom: '1px solid #e0e0e0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => setFilterV31(!filterV31)} style={{ padding: '4px 8px', fontSize: 11, background: filterV31 ? '#f5e6c8' : 'transparent', color: filterV31 ? '#8b6914' : '#888', border: `1px solid ${filterV31 ? '#d4a85366' : '#d0d0d0'}`, borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}>
              {filterV31 ? '⚡ v3.1 Only' : 'v3.1 Filter'}
            </button>
            <button onClick={() => setShowVersions(!showVersions)} style={{ padding: '4px 8px', fontSize: 11, background: showVersions ? '#e8f0fc' : 'transparent', color: showVersions ? '#4a7cc9' : '#888', border: `1px solid ${showVersions ? '#4a7cc944' : '#d0d0d0'}`, borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}>
              Versions
            </button>
            <button onClick={() => setShowSummary(!showSummary)} style={{ padding: '4px 8px', fontSize: 11, background: showSummary ? '#e8f0fc' : 'transparent', color: showSummary ? '#4a7cc9' : '#888', border: `1px solid ${showSummary ? '#4a7cc944' : '#d0d0d0'}`, borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}>
              💬 Summary
            </button>
          </div>
          {showVersions && (
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #e0e0e0', background: '#f0f0ee' }}>
              {VERSIONS.map(v => (
                <div key={v.id} style={{ padding: '8px 0', borderBottom: '1px solid #e0e0e0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: v.id === '3.1' ? '#8b6914' : '#888' }}>{v.label}</span>
                    <span style={{ fontSize: 10, color: '#999' }}>{v.date}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#777', marginTop: 2 }}>{v.desc}</div>
                  {v.changes > 0 && <div style={{ fontSize: 10, color: '#8b6914', marginTop: 2 }}>{v.changes} changes</div>}
                </div>
              ))}
            </div>
          )}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
            {filteredSections.map(([s, realIdx]) => {
              const cmtCount = sectionCommentCount(realIdx);
              return (
                <button key={s[0]} className={`sidebar-btn ${realIdx === activeSection && !showSummary ? 'active' : ''}`} onClick={() => { setShowSummary(false); setActiveSection(realIdx); }}>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s[1]}</span>
                  <span style={{ display: 'flex', gap: 4 }}>
                    {s[2] > 0 && <span style={{ fontSize: 10, background: '#f5e6c8', color: '#8b6914', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace' }}>{s[2]}</span>}
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
            <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 18, color: '#1a1a1a' }}>{showSummary ? 'Comments Summary' : section[1]}</span>
            <span style={{ fontSize: 11, color: '#999', marginLeft: 10 }}>{showSummary ? 'All sections' : `${section[0]}.md`}</span>
          </div>
          {!showSummary && <span style={{ fontSize: 11, color: '#999' }}>{section[3].length} items</span>}
          {!showSummary && section[2] > 0 && <span className="badge-v31">{section[2]} v3.1</span>}
        </div>
        <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 80px' }}>
          {showSummary ? (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>{renderSummaryView()}</div>
          ) : (
            <div style={{ maxWidth: 800, margin: '0 auto', animation: 'fadeIn 0.2s ease' }}>
              {section[3].map(item => renderItem(item))}
            </div>
          )}
        </div>
        <div style={{ padding: '8px 20px', borderTop: '1px solid #e0e0e0', background: '#f8f8f6', display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, color: '#888' }}>
          {showSummary ? (
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
    </div>
  );
}
