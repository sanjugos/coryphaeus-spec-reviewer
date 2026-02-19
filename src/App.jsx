import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ReactFlow, Background, Controls, MiniMap, Handle, Position, useNodesState, useEdgesState, addEdge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import testSummaryData from './test-summary.json';

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

const DEFAULT_CATEGORIES = ['Sales', 'Service', 'Marketing'];

const COMPETITORS_LIST = ["Close", "Copper", "Dynamics 365", "Freshsales", "HubSpot", "Monday CRM", "Pipedrive", "Salesforce", "Zoho", "Other"];
const FEATURES_LIST = ["Account Planning", "AI Agents", "AI Safety", "Contact Center", "Data Model", "General", "Integrations", "Marketing", "MCP Apps", "Mobile", "Pricing", "Reporting", "Security", "Workflow"];

// Entity catalog: [name, sectionIndex, itemIndex, version, category]
const ENTITIES = [
  // Core entities with dedicated headings in section 5 (05-data-model-core)
  ["Account",5,8,"2.0","Core"],["Lead",5,10,"2.0","Core"],["Contact",5,13,"2.0","Core"],
  ["Opportunity",5,16,"2.0","Core"],
  // Core entities listed in section 5 item 3 (no dedicated heading)
  ["Prospect",5,3,"2.0","Core"],["Activity",5,3,"2.0","Core"],["Task",5,3,"2.0","Core"],["Product",5,3,"2.0","Core"],
  ["Price Book",5,3,"2.0","Core"],["Quote",5,3,"2.0","Core"],["Sales Order",5,3,"2.0","Core"],
  ["Purchase Order",5,3,"2.0","Core"],["Case",5,3,"2.0","Core"],["Knowledge Article",5,3,"2.0","Core"],
  ["Subscription",5,3,"2.0","Core"],["Campaign",5,3,"2.0","Core"],
  ["Website",5,3,"2.0","Core"],["Landing Page",5,3,"2.0","Core"],["Blog",5,3,"2.0","Core"],["Workflow",5,3,"2.0","Core"],
  ["Rules",5,3,"2.0","Core"],["Integration",5,3,"2.0","Core"],["Report",5,3,"2.0","Core"],["Dashboard",5,3,"2.0","Core"],
  ["Event",5,3,"2.0","Core"],
  // Revised core entities with headings/mentions in section 6 (06-data-model-new)
  ["Invoice",6,5,"2.0","Core"],["Contract",6,16,"2.0","Core"],["Competitor",6,16,"2.0","Core"],["Insights Card",6,16,"2.0","Core"],
  // v3.0 new entities with dedicated headings in section 6
  ["Offering",6,0,"3.0","New v3.0"],["Account Plan",6,2,"3.0","New v3.0"],["Payment",6,6,"3.0","New v3.0"],
  ["Case Study",6,9,"3.0","New v3.0"],
  // v3.0 entities listed in section 6 item 14 (3.13-3.17 Other New Entities)
  ["SLA",6,14,"3.0","New v3.0"],["Risk Register",6,14,"3.0","New v3.0"],
  ["Qualification Scoring",6,14,"3.0","New v3.0"],["Employee",6,14,"3.0","New v3.0"],["ICP",6,14,"3.0","New v3.0"],
  ["Forms",6,14,"3.0","New v3.0"],["Loyalty Points",6,14,"3.0","New v3.0"],
  // v3.0 entities listed in section 5 item 5 (no dedicated heading)
  ["Email/WhatsApp/SMS Templates",5,5,"3.0","New v3.0"],["Report Template",5,5,"3.0","New v3.0"],
  // v3.1 revised/new entities in section 6
  ["Complaint (merged into Case)",6,7,"3.1","Revised v3.1"],
  ["Qualification Sheet",6,11,"3.1","New v3.1"],["Goal (OKR)",6,17,"3.1","New v3.1"],
  ["Fiscal Year Configuration",6,20,"3.1","New v3.1"],["Sales Target",6,22,"3.1","New v3.1"],
  // v3.1 entities in section 5 (sub-sections of Opportunity)
  ["Monthly Revenue Projection",5,19,"3.1","New v3.1"],["Partner Contribution",5,22,"3.1","New v3.1"],
];

// ── Org Chart Constants ──
const SENTIMENT_COLORS = {
  champion: { color: '#2e7d32', bg: '#e8f5e9', label: 'Champion' },
  supporter: { color: '#1565c0', bg: '#e3f2fd', label: 'Supporter' },
  neutral: { color: '#616161', bg: '#f5f5f5', label: 'Neutral' },
  detractor: { color: '#e65100', bg: '#fff3e0', label: 'Detractor' },
  blocker: { color: '#c62828', bg: '#fce4ec', label: 'Blocker' },
};

const EDGE_RELATIONS = {
  reportsTo: { label: 'Reports To', style: { stroke: '#666' } },
  influences: { label: 'Influences', style: { stroke: '#1565c0', strokeDasharray: '5,5' } },
  blocks: { label: 'Blocks', style: { stroke: '#c62828', strokeDasharray: '3,3' } },
  champions: { label: 'Champions', style: { stroke: '#2e7d32', strokeDasharray: '5,5' } },
};

const ORGCHART_API = "/api/orgchart";

// ── PersonNode (React Flow custom node) ──
function PersonNode({ data, selected }) {
  const s = SENTIMENT_COLORS[data.sentiment] || SENTIMENT_COLORS.neutral;
  return (
    <div style={{
      padding: '10px 14px', background: '#fff', border: `2px solid ${selected ? '#8b6914' : s.color}`,
      borderRadius: 8, minWidth: 140, boxShadow: selected ? '0 0 0 2px #8b691444' : '0 2px 8px rgba(0,0,0,0.08)',
      fontFamily: 'inherit', position: 'relative',
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#999', width: 8, height: 8 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
        <span style={{ fontWeight: 600, fontSize: 13, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.name || 'New Person'}</span>
      </div>
      {data.title && <div style={{ fontSize: 11, color: '#666', marginLeft: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.title}</div>}
      {data.department && <div style={{ fontSize: 10, color: '#999', marginLeft: 16, marginTop: 2 }}>{data.department}</div>}
      <Handle type="source" position={Position.Bottom} style={{ background: '#999', width: 8, height: 8 }} />
    </div>
  );
}

const NODE_TYPES = { person: PersonNode };

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
    const data = await r.json();
    if (Array.isArray(data) && data.length > 0) return data;
    // API returned empty — check localStorage for data saved locally
    try { const local = JSON.parse(localStorage.getItem("coryphaeus-competitors") || "[]"); if (local.length > 0) return local; } catch {}
    return data;
  } catch {
    try { return JSON.parse(localStorage.getItem("coryphaeus-competitors") || "[]"); } catch { return []; }
  }
}

async function compApiSave(data) {
  // Always save to localStorage as belt-and-suspenders
  try { localStorage.setItem("coryphaeus-competitors", JSON.stringify(data)); } catch {}
  try {
    const r = await fetch(COMP_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!r.ok) throw new Error(r.statusText);
  } catch {}
}

const ORGCHART_EMPTY = { nodes: [], edges: [], views: [{ id: 'all', name: 'All', filter: null }] };

async function orgchartApiGet() {
  try {
    const r = await fetch(ORGCHART_API);
    if (!r.ok) throw new Error(r.statusText);
    const data = await r.json();
    if (data && (data.nodes?.length > 0 || data.edges?.length > 0)) return data;
    try { const local = JSON.parse(localStorage.getItem("coryphaeus-orgchart") || "null"); if (local?.nodes?.length > 0) return local; } catch {}
    return data;
  } catch {
    try { return JSON.parse(localStorage.getItem("coryphaeus-orgchart") || "null") || ORGCHART_EMPTY; } catch { return ORGCHART_EMPTY; }
  }
}

async function orgchartApiSave(data) {
  try { localStorage.setItem("coryphaeus-orgchart", JSON.stringify(data)); } catch {}
  try {
    const r = await fetch(ORGCHART_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!r.ok) throw new Error(r.statusText);
  } catch {}
}

const PRIO_API = "/api/priorities";

async function prioritiesApiGet() {
  try {
    const r = await fetch(PRIO_API);
    if (!r.ok) throw new Error(r.statusText);
    const data = await r.json();
    if (Array.isArray(data) && data.length > 0) return data;
    try { const local = JSON.parse(localStorage.getItem("coryphaeus-priorities") || "[]"); if (local.length > 0) return local; } catch {}
    return data;
  } catch {
    try { return JSON.parse(localStorage.getItem("coryphaeus-priorities") || "[]"); } catch { return []; }
  }
}

async function prioritiesApiSave(data) {
  try { localStorage.setItem("coryphaeus-priorities", JSON.stringify(data)); } catch {}
  try {
    const r = await fetch(PRIO_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!r.ok) throw new Error(r.statusText);
  } catch {}
}

// ── Voice Agent Utilities ──

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function fuzzyMatch(input, candidates, threshold = 0.4) {
  if (!input || !candidates?.length) return null;
  const lower = input.toLowerCase().trim();
  // Exact match first
  const exact = candidates.find(c => c.toLowerCase() === lower);
  if (exact) return exact;
  // Starts-with match
  const starts = candidates.find(c => c.toLowerCase().startsWith(lower));
  if (starts) return starts;
  // Contains match
  const contains = candidates.find(c => c.toLowerCase().includes(lower));
  if (contains) return contains;
  // Levenshtein distance
  let best = null, bestDist = Infinity;
  for (const c of candidates) {
    const dist = levenshtein(lower, c.toLowerCase());
    const maxLen = Math.max(lower.length, c.length);
    if (dist / maxLen <= threshold && dist < bestDist) {
      best = c;
      bestDist = dist;
    }
  }
  return best;
}

const VOICE_WS_URL = "wss://crm-voice.agreeablebush-d2b406c6.centralus.azurecontainerapps.io/ws";

const PCM_PROCESSOR_CODE = `
class PCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      const f32 = input[0];
      const i16 = new Int16Array(f32.length);
      for (let i = 0; i < f32.length; i++) {
        const s = Math.max(-1, Math.min(1, f32[i]));
        i16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      this.port.postMessage(i16.buffer, [i16.buffer]);
    }
    return true;
  }
}
registerProcessor('pcm-processor', PCMProcessor);
`;

class VoiceWebSocket {
  constructor(onTranscript, onStatus) {
    this.onTranscript = onTranscript;
    this.onStatus = onStatus;
    this.ws = null;
    this.audioCtx = null;
    this.stream = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.running = false;
  }

  async start() {
    this.running = true;
    this.retryCount = 0;
    await this._connect();
  }

  async _connect() {
    if (!this.running) return;
    try {
      this.onStatus?.('Connecting to voice service…', 'info');
      this.ws = new WebSocket(VOICE_WS_URL);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = async () => {
        this.retryCount = 0;
        this.onStatus?.('Voice service connected', 'success');
        try {
          this.stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
          this.audioCtx = new AudioContext({ sampleRate: 16000 });
          const blob = new Blob([PCM_PROCESSOR_CODE], { type: 'application/javascript' });
          const url = URL.createObjectURL(blob);
          await this.audioCtx.audioWorklet.addModule(url);
          URL.revokeObjectURL(url);
          const source = this.audioCtx.createMediaStreamSource(this.stream);
          const processor = new AudioWorkletNode(this.audioCtx, 'pcm-processor');
          processor.port.onmessage = (e) => {
            if (this.ws?.readyState === WebSocket.OPEN) {
              this.ws.send(e.data);
            }
          };
          source.connect(processor);
          processor.connect(this.audioCtx.destination);
        } catch (err) {
          this.onStatus?.('Microphone access denied', 'error');
        }
      };

      this.ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'transcription' && msg.text) {
            this.onTranscript?.(msg.text);
          }
        } catch {}
      };

      this.ws.onclose = () => {
        if (this.running && this.retryCount < this.maxRetries) {
          this.retryCount++;
          const delay = Math.min(1000 * Math.pow(2, this.retryCount), 8000);
          this.onStatus?.(`Reconnecting (${this.retryCount})…`, 'info');
          setTimeout(() => this._connect(), delay);
        }
      };

      this.ws.onerror = () => {};
    } catch (err) {
      this.onStatus?.('WebSocket connection failed', 'error');
    }
  }

  stop() {
    this.running = false;
    if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; }
    if (this.audioCtx) { this.audioCtx.close().catch(() => {}); this.audioCtx = null; }
    if (this.ws) { this.ws.close(); this.ws = null; }
  }
}

const VOICE_CMD_API = "/api/voice-commands";

async function voiceCmdApiGet() {
  try {
    const r = await fetch(VOICE_CMD_API);
    if (!r.ok) throw new Error(r.statusText);
    const data = await r.json();
    if (Array.isArray(data) && data.length > 0) return data;
    try { const local = JSON.parse(localStorage.getItem("coryphaeus-voice-commands") || "[]"); if (local.length > 0) return local; } catch {}
    return data;
  } catch {
    try { return JSON.parse(localStorage.getItem("coryphaeus-voice-commands") || "[]"); } catch { return []; }
  }
}

async function voiceCmdApiSave(data) {
  try { localStorage.setItem("coryphaeus-voice-commands", JSON.stringify(data)); } catch {}
  try {
    const r = await fetch(VOICE_CMD_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!r.ok) throw new Error(r.statusText);
  } catch {}
}

const VOICE_CMD_PATTERNS = [
  { id: 'navigate', match: /^(?:open|go to|show|navigate to|switch to|view)\s+(.+)/i, desc: 'Navigate to a view' },
  { id: 'search', match: /^(?:search|find|look for|search for)\s+(.+)/i, desc: 'Search for text' },
  { id: 'count', match: /^(?:how many|count)\s+(.+)/i, desc: 'Count items' },
  { id: 'stats', match: /^(?:stats|statistics|status|summary)\s*$/i, desc: 'Show statistics' },
  { id: 'help', match: /^(?:help|what can you do|commands)\s*$/i, desc: 'Show help' },
  { id: 'back', match: /^(?:back|go back|previous)\s*$/i, desc: 'Go back' },
  { id: 'refresh', match: /^(?:refresh|reload)\s*$/i, desc: 'Refresh data' },
  { id: 'filter', match: /^(?:filter|filter by)\s+(.+)/i, desc: 'Filter items' },
  { id: 'kanban', match: /^(?:kanban|board|board view)\s*$/i, desc: 'Switch to kanban' },
  { id: 'create', match: /^(?:create|add|new)\s+(.+)/i, desc: 'Create new item' },
  { id: 'delete', match: /^(?:delete|remove)\s+(.+)/i, desc: 'Delete item' },
  { id: 'list', match: /^(?:list|show all)\s+(.+)/i, desc: 'List items' },
  { id: 'learn', match: /^(?:learn|teach|remember)\s+(?:when i say\s+)?(.+?)(?:\s*,\s*|\s+then\s+)(.+)/i, desc: 'Teach a command' },
  { id: 'module_info', match: /^(?:what is|tell me about|describe|info on|explain)\s+(.+)/i, desc: 'Describe a module' },
  { id: 'sort', match: /^(?:sort|sort by|order by)\s+(.+)/i, desc: 'Sort items' },
  { id: 'next_prev', match: /^(?:next|previous|prev|next section|previous section)\s*$/i, desc: 'Next/prev section' },
];

const VOICE_CMD_EXAMPLES = {
  'Navigation': ['open priorities', 'show entities', 'go to org chart', 'open comments', 'show competitors', 'go to section 3', 'next section', 'go back'],
  'Create': ['create priority', 'create new priority'],
  'Views': ['kanban', 'sort by category', 'sort by rank', 'filter pending', 'filter completed', 'filter ongoing', 'show all', 'refresh'],
  'Search & Data': ['how many entities', 'search account', 'stats', 'count priorities', 'count comments', 'what is Account', 'describe Opportunity', 'tell me about Lead'],
  'Teaching': ['learn when I say morning, open priorities then open summary', 'learn when I say review, show comments then show priorities'],
};

const NAV_ALIASES = {
  'priorities': 'priorities', 'priority': 'priorities', 'priority list': 'priorities',
  'org chart': 'orgchart', 'orgchart': 'orgchart', 'org': 'orgchart', 'organization': 'orgchart', 'people': 'orgchart',
  'entities': 'entities', 'entity': 'entities', 'data model': 'entities', 'data': 'entities',
  'competitors': 'competitors', 'competitor': 'competitors', 'intel': 'competitors', 'competition': 'competitors',
  'comments': 'summary', 'summary': 'summary', 'comment summary': 'summary', 'review': 'summary',
  'home': 'home', 'spec': 'home', 'specification': 'home', 'front': 'home',
  'workbench': 'workbench', 'ai': 'workbench', 'ai workbench': 'workbench',
};

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
  const [editingIntelId, setEditingIntelId] = useState(null);
  const [mediaModal, setMediaModal] = useState(null); // { items: [{type,src,name}], index: 0 }
  const [showOrgChart, setShowOrgChart] = useState(() => window.location.hash === '#orgchart');
  const [orgNodes, setOrgNodes, onOrgNodesChange] = useNodesState([]);
  const [orgEdges, setOrgEdges, onOrgEdgesChange] = useEdgesState([]);
  const [orgchartViews, setOrgchartViews] = useState([{ id: 'all', name: 'All', filter: null }]);
  const [selectedOrgView, setSelectedOrgView] = useState('all');
  const [editingPerson, setEditingPerson] = useState(null);
  const [newEdgeType, setNewEdgeType] = useState('reportsTo');
  const orgSaveTimerRef = useRef(null);
  const [showEntities, setShowEntities] = useState(() => window.location.hash === '#entities');
  const [entitySearch, setEntitySearch] = useState('');
  const [selectedEntity, setSelectedEntity] = useState(null); // entity tuple or null
  const [cameFromEntities, setCameFromEntities] = useState(null); // entity tuple to return to, or null
  const [showPriorities, setShowPriorities] = useState(() => window.location.hash === '#priorities');
  const [showTestSuite, setShowTestSuite] = useState(() => window.location.hash === '#testsuite');
  const [expandedSuites, setExpandedSuites] = useState({});
  const [prioritiesData, setPrioritiesData] = useState([]);
  const [prioritySearch, setPrioritySearch] = useState('');
  const [priorityStatusFilter, setPriorityStatusFilter] = useState('');
  const [priorityViewMode, setPriorityViewMode] = useState('rank');
  const [addingPriority, setAddingPriority] = useState(false);
  const [editingPriorityId, setEditingPriorityId] = useState(null);
  const [priorityForm, setPriorityForm] = useState({ title: '', description: '', status: 'pending', category: '', links: [] });
  const [priorityNewLink, setPriorityNewLink] = useState('');
  const [showWorkbench, setShowWorkbench] = useState(false);
  const [workbenchText, setWorkbenchText] = useState('');
  const [workbenchUrl, setWorkbenchUrl] = useState('');
  const [workbenchSuggestions, setWorkbenchSuggestions] = useState([]);
  const [workbenchProcessing, setWorkbenchProcessing] = useState(false);
  const [workbenchError, setWorkbenchError] = useState('');
  const [editingSuggestionIdx, setEditingSuggestionIdx] = useState(null);
  const [editingSuggestionForm, setEditingSuggestionForm] = useState({ title: '', description: '', category: '' });
  const [dragPriorityId, setDragPriorityId] = useState(null);
  const [dragOverPriorityId, setDragOverPriorityId] = useState(null);
  const [modalRect, setModalRect] = useState({ x: 80, y: 40, w: 0, h: 0 }); // 0 = auto
  // Voice Agent state
  const [voicePanelOpen, setVoicePanelOpen] = useState(true);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceInterimText, setVoiceInterimText] = useState('');
  const [voiceFinalText, setVoiceFinalText] = useState('');
  const [voiceStatus, setVoiceStatusState] = useState({ msg: '', type: 'idle' }); // idle/listening/processing/speaking/error
  const [voiceAlwaysOn, setVoiceAlwaysOn] = useState(true);
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [voiceFlashExec, setVoiceFlashExec] = useState(false);
  const [voiceCommandLog, setVoiceCommandLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem("coryphaeus-voice-log") || "[]"); } catch { return []; }
  });
  const [voiceLearnedCommands, setVoiceLearnedCommands] = useState([]);
  const [voiceExpandedCategory, setVoiceExpandedCategory] = useState(null);
  const [voiceShowRecent, setVoiceShowRecent] = useState(true);
  const [voiceLogFilter, setVoiceLogFilter] = useState('all'); // all | success | error
  const voiceConfidenceRef = useRef(null);
  const dragRef = useRef(null); // { startX, startY, startRectX, startRectY, type: 'move'|'resize-*' }
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
  const priorityEditorRef = useRef(null);
  // Voice Agent refs
  const voiceRecRef = useRef(null);
  const voiceSynthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const voiceIsSpeakingRef = useRef(false);
  const voiceAlwaysOnRef = useRef(true);
  const voiceRestartTimerRef = useRef(null);
  const voicePipecatRef = useRef(null);

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
    prioritiesApiGet().then(data => setPrioritiesData(Array.isArray(data) ? data : []));
    orgchartApiGet().then(data => {
      if (data?.nodes) setOrgNodes(data.nodes.map(n => ({ ...n, type: 'person' })));
      if (data?.edges) setOrgEdges(data.edges);
      if (data?.views?.length > 0) setOrgchartViews(data.views);
    });
  }, []);

  useEffect(() => {
    if (showTestSuite) { window.location.hash = 'testsuite'; return; }
    if (showPriorities) { window.location.hash = 'priorities'; return; }
    if (showOrgChart) { window.location.hash = 'orgchart'; return; }
    if (showEntities) { window.location.hash = 'entities'; return; }
    if (showCompetitors) { window.location.hash = 'competitors'; return; }
    contentRef.current?.scrollTo(0, 0);
    window.location.hash = S[activeSection][0];
  }, [activeSection, showCompetitors, showEntities, showOrgChart, showPriorities, showTestSuite]);

  const navigateToEntity = useCallback((secIdx, itemIdx, entity) => {
    setCameFromEntities(entity || true);
    setShowEntities(false); setShowSummary(false); setShowCompetitors(false); setShowOrgChart(false); setShowPriorities(false); setShowTestSuite(false);
    setActiveSection(secIdx);
    setTimeout(() => {
      const el = document.getElementById(`spec-item-${itemIdx}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, []);

  // Voice: centralized navigation helper
  const navigateTo = useCallback((target, opts = {}) => {
    setCameFromEntities(null);
    if (target === 'priorities') {
      setShowPriorities(true); setShowOrgChart(false); setShowEntities(false); setShowCompetitors(false); setShowSummary(false);
    } else if (target === 'orgchart') {
      setShowOrgChart(true); setShowPriorities(false); setShowEntities(false); setShowCompetitors(false); setShowSummary(false);
    } else if (target === 'entities') {
      setShowEntities(true); setShowPriorities(false); setShowOrgChart(false); setShowCompetitors(false); setShowSummary(false);
    } else if (target === 'competitors') {
      setShowCompetitors(true); setShowPriorities(false); setShowOrgChart(false); setShowEntities(false); setShowSummary(false);
    } else if (target === 'summary') {
      setShowSummary(true); setShowPriorities(false); setShowOrgChart(false); setShowEntities(false); setShowCompetitors(false);
    } else if (target === 'workbench') {
      setShowWorkbench(true);
    } else if (target === 'section' && opts.index !== undefined) {
      setShowPriorities(false); setShowOrgChart(false); setShowEntities(false); setShowCompetitors(false); setShowSummary(false);
      setActiveSection(opts.index);
    } else if (target === 'home') {
      setShowPriorities(false); setShowOrgChart(false); setShowEntities(false); setShowCompetitors(false); setShowSummary(false);
      setActiveSection(0);
    }
  }, []);

  // Voice: load learned commands on mount
  useEffect(() => {
    voiceCmdApiGet().then(data => {
      if (Array.isArray(data)) setVoiceLearnedCommands(data);
    });
  }, []);

  // Voice: TTS speak helper
  const speak = useCallback((text) => {
    if (!voiceSynthRef.current || !text) return;
    try {
      voiceSynthRef.current.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 1.1;
      utt.onstart = () => { voiceIsSpeakingRef.current = true; };
      utt.onend = () => { voiceIsSpeakingRef.current = false; };
      utt.onerror = () => { voiceIsSpeakingRef.current = false; };
      voiceSynthRef.current.speak(utt);
    } catch {}
  }, []);

  // Voice: status message helper
  const voiceSetStatus = useCallback((msg, type = 'info') => {
    setVoiceStatusState({ msg, type });
  }, []);

  // Voice: fuzzy nav resolution
  const resolveNav = useCallback((text) => {
    const lower = text.toLowerCase().trim();
    // Check nav aliases first
    for (const [alias, target] of Object.entries(NAV_ALIASES)) {
      if (lower === alias || lower.includes(alias)) return target;
    }
    // Try matching section labels
    const sectionLabels = S.map((s, i) => ({ label: s[1], index: i }));
    const match = fuzzyMatch(lower, sectionLabels.map(s => s.label));
    if (match) {
      const found = sectionLabels.find(s => s.label === match);
      if (found) return { type: 'section', index: found.index, label: found.label };
    }
    return null;
  }, []);

  // Voice: fuzzy entity resolution
  const resolveEntity = useCallback((text) => {
    const names = ENTITIES.map(e => e[0]);
    return fuzzyMatch(text, names);
  }, []);

  // Voice: core command processor
  const processVoiceCommand = useCallback((text, depth = 0, groupId = null) => {
    if (!text?.trim()) return;
    const trimmed = text.trim();
    const lower = trimmed.toLowerCase();

    // Helper to log command + response pair with rich metadata
    const logCmd = (response, status, patternId = null) => {
      const entry = {
        id: Date.now() + Math.random(),
        text: trimmed,
        response,
        status: status || 'success', // success | error | info
        patternId,
        confidence: voiceConfidenceRef.current,
        groupId,
        depth,
        time: new Date().toISOString(),
      };
      voiceConfidenceRef.current = null;
      setVoiceCommandLog(prev => {
        const next = [entry, ...prev].slice(0, 100);
        try { localStorage.setItem("coryphaeus-voice-log", JSON.stringify(next)); } catch {}
        return next;
      });
    };

    // Flash execution indicator
    setVoiceFlashExec(true);
    setTimeout(() => setVoiceFlashExec(false), 600);

    // Check learned commands first (only at depth 0 to prevent infinite recursion)
    if (depth === 0) {
      const learned = voiceLearnedCommands.find(c => {
        const trigger = c.trigger.toLowerCase();
        return lower === trigger || lower.includes(trigger);
      });
      if (learned) {
        const resp = `Running ${learned.trigger}`;
        speak(resp);
        voiceSetStatus(`Executing: ${learned.trigger}`, 'success');
        const gid = Date.now(); // group ID links parent to sub-steps
        logCmd(resp, 'success', 'learned');
        // Increment usage
        const updated = voiceLearnedCommands.map(c => c.trigger === learned.trigger ? { ...c, usageCount: (c.usageCount || 0) + 1, lastUsed: new Date().toISOString() } : c);
        setVoiceLearnedCommands(updated);
        voiceCmdApiSave(updated);
        // Execute steps sequentially with delays, linked by groupId
        const steps = learned.steps || [];
        steps.forEach((step, i) => {
          setTimeout(() => processVoiceCommand(step, depth + 1, gid), i * 800);
        });
        return;
      }
    }

    // Match against command patterns
    for (const pat of VOICE_CMD_PATTERNS) {
      const m = trimmed.match(pat.match);
      if (!m) continue;

      switch (pat.id) {
        case 'navigate': {
          const target = m[1];
          const resolved = resolveNav(target);
          if (resolved && typeof resolved === 'string') {
            navigateTo(resolved);
            const resp = `Opening ${target}`;
            speak(resp);
            voiceSetStatus(`Navigated to ${target}`, 'success');
            logCmd(resp, 'success', 'navigate');
          } else if (resolved?.type === 'section') {
            navigateTo('section', { index: resolved.index });
            const resp = `Opening section ${resolved.label}`;
            speak(resp);
            voiceSetStatus(`Navigated to ${resolved.label}`, 'success');
            logCmd(resp, 'success', 'navigate');
          } else {
            const resp = `I couldn't find ${target}`;
            speak(resp);
            voiceSetStatus(`Unknown view: ${target}`, 'error');
            logCmd(resp, 'error', 'navigate');
          }
          return;
        }
        case 'search': {
          const term = m[1];
          setSearch(term);
          setShowPriorities(false); setShowOrgChart(false); setShowEntities(false); setShowCompetitors(false); setShowSummary(false);
          const resp = `Searching for ${term}`;
          speak(resp);
          voiceSetStatus(`Searching: ${term}`, 'success');
          logCmd(resp, 'success', 'search');
          return;
        }
        case 'count': {
          const what = m[1].toLowerCase();
          let count = 0, label = what;
          if (what.includes('entit')) { count = ENTITIES.length; label = 'entities'; }
          else if (what.includes('comment')) { count = Object.values(comments).reduce((s, a) => s + a.length, 0); label = 'comments'; }
          else if (what.includes('section')) { count = S.length; label = 'sections'; }
          else if (what.includes('priorit')) { count = prioritiesData.length; label = 'priorities'; }
          else if (what.includes('competitor')) { count = competitorData.length; label = 'competitor entries'; }
          else if (what.includes('people') || what.includes('person') || what.includes('org')) { count = orgNodes.length; label = 'people in org chart'; }
          else { const resp = `I'm not sure what to count for ${what}`; speak(resp); voiceSetStatus(`Unknown count target: ${what}`, 'error'); logCmd(resp, 'error', 'count'); return; }
          const resp = `There are ${count} ${label}`;
          speak(resp);
          voiceSetStatus(`${count} ${label}`, 'data');
          logCmd(resp, 'success', 'count');
          return;
        }
        case 'stats': {
          const resp = `${S.length} sections, ${Object.values(comments).reduce((s, a) => s + a.length, 0)} comments, ${ENTITIES.length} entities, ${prioritiesData.length} priorities, ${competitorData.length} competitors, ${orgNodes.length} people`;
          speak(resp);
          voiceSetStatus(resp, 'data');
          logCmd(resp, 'success', 'stats');
          return;
        }
        case 'help': {
          const resp = 'I can navigate, search, count items, show stats, create priorities, and learn new commands. Say help for more.';
          speak(resp);
          voiceSetStatus('Voice commands: navigate, search, count, stats, create, learn, sort, filter', 'info');
          logCmd(resp, 'info', 'help');
          return;
        }
        case 'back': {
          let resp;
          if (showPriorities || showOrgChart || showEntities || showCompetitors || showSummary) {
            navigateTo('home');
            resp = 'Going back';
            speak(resp);
            voiceSetStatus('Back to spec', 'success');
          } else {
            const prev = Math.max(0, activeSection - 1);
            setActiveSection(prev);
            resp = `Section ${S[prev][1]}`;
            speak(resp);
            voiceSetStatus(`Back to ${S[prev][1]}`, 'success');
          }
          logCmd(resp, 'success', 'back');
          return;
        }
        case 'refresh': {
          logCmd('Refreshing page', 'success', 'refresh');
          window.location.reload();
          return;
        }
        case 'filter': {
          const filterVal = m[1].toLowerCase();
          let resp, st = 'success';
          if (showPriorities) {
            const statuses = ['pending', 'ongoing', 'completed', 'blocked'];
            const matched = fuzzyMatch(filterVal, statuses);
            if (matched) { setPriorityStatusFilter(matched); resp = `Filtering priorities by ${matched}`; speak(resp); voiceSetStatus(`Filter: ${matched}`, 'success'); }
            else { resp = `Unknown filter: ${filterVal}`; st = 'error'; speak(resp); voiceSetStatus(resp, 'error'); }
          } else {
            setFilterV31(!filterV31);
            resp = filterV31 ? 'Showing all items' : 'Showing v3.1 changes only';
            speak(resp);
            voiceSetStatus(filterV31 ? 'All items' : 'v3.1 only', 'success');
          }
          logCmd(resp, st, 'filter');
          return;
        }
        case 'kanban': {
          navigateTo('priorities');
          setPriorityViewMode('category');
          const resp = 'Switched to category view';
          speak(resp);
          voiceSetStatus('Category view', 'success');
          logCmd(resp, 'success', 'kanban');
          return;
        }
        case 'create': {
          const what2 = m[1].toLowerCase();
          let resp, st = 'success';
          if (what2.includes('priorit')) {
            navigateTo('priorities');
            setAddingPriority(true);
            resp = 'Creating new priority';
            speak(resp);
            voiceSetStatus('New priority form opened', 'success');
          } else {
            resp = 'I can create priorities. Say create priority.';
            st = 'info';
            speak(resp);
            voiceSetStatus('Try: create priority', 'info');
          }
          logCmd(resp, st, 'create');
          return;
        }
        case 'list': {
          const what3 = m[1].toLowerCase();
          let resp;
          if (what3.includes('entit')) { navigateTo('entities'); resp = 'Showing entities'; }
          else if (what3.includes('priorit')) { navigateTo('priorities'); resp = 'Showing priorities'; }
          else if (what3.includes('comment')) { navigateTo('summary'); resp = 'Showing comments'; }
          else if (what3.includes('competitor')) { navigateTo('competitors'); resp = 'Showing competitors'; }
          else { resp = `Showing ${what3}`; }
          speak(resp);
          voiceSetStatus(`Listing ${what3}`, 'success');
          logCmd(resp, 'success', 'list');
          return;
        }
        case 'learn': {
          const trigger = m[1].trim();
          const stepsStr = m[2].trim();
          const steps = stepsStr.split(/\s+then\s+/i).map(s => s.trim()).filter(Boolean);
          if (!trigger || steps.length === 0) {
            const resp = 'Please say: learn when I say trigger, then action one then action two';
            speak(resp);
            voiceSetStatus('Invalid learn syntax', 'error');
            logCmd(resp, 'error', 'learn');
            return;
          }
          const newCmd = { trigger, steps, usageCount: 0, created: new Date().toISOString(), lastUsed: null };
          const exists = voiceLearnedCommands.findIndex(c => c.trigger.toLowerCase() === trigger.toLowerCase());
          let updated;
          if (exists >= 0) {
            updated = [...voiceLearnedCommands];
            updated[exists] = { ...updated[exists], steps };
          } else {
            updated = [...voiceLearnedCommands, newCmd];
          }
          setVoiceLearnedCommands(updated);
          voiceCmdApiSave(updated);
          const resp = `Learned command: ${trigger}`;
          speak(resp);
          voiceSetStatus(`Learned: "${trigger}" → ${steps.length} steps`, 'success');
          logCmd(resp, 'success', 'learn');
          return;
        }
        case 'module_info': {
          let resp, st = 'success';
          const entityName = resolveEntity(m[1]);
          if (entityName) {
            const entity = ENTITIES.find(e => e[0] === entityName);
            if (entity) {
              resp = `${entityName} is a ${entity[4]} entity from version ${entity[3]}, defined in section ${S[entity[1]]?.[1] || entity[1]}`;
              speak(resp);
              voiceSetStatus(`${entityName}: ${entity[4]}, v${entity[3]}`, 'data');
            }
          } else {
            // Try section match
            const nav = resolveNav(m[1]);
            if (nav?.type === 'section') {
              resp = `Section: ${nav.label}`;
              speak(resp);
              voiceSetStatus(nav.label, 'data');
            } else {
              resp = `I don't have info on ${m[1]}`;
              st = 'error';
              speak(resp);
              voiceSetStatus(`Unknown: ${m[1]}`, 'error');
            }
          }
          logCmd(resp, st, 'module_info');
          return;
        }
        case 'sort': {
          const sortBy = m[1].toLowerCase();
          let resp, st = 'success';
          if (showPriorities) {
            if (sortBy.includes('categor')) { setPriorityViewMode('category'); resp = 'Sorted by category'; }
            else { setPriorityViewMode('rank'); resp = 'Sorted by rank'; }
            speak(resp);
            voiceSetStatus(`Sorted: ${sortBy}`, 'success');
          } else {
            resp = 'Sorting is available in priorities view';
            st = 'info';
            speak(resp);
            voiceSetStatus('Navigate to priorities first', 'info');
          }
          logCmd(resp, st, 'sort');
          return;
        }
        case 'next_prev': {
          const isNext = lower.includes('next');
          const newIdx = isNext ? Math.min(S.length - 1, activeSection + 1) : Math.max(0, activeSection - 1);
          setShowPriorities(false); setShowOrgChart(false); setShowEntities(false); setShowCompetitors(false); setShowSummary(false);
          setActiveSection(newIdx);
          const resp = S[newIdx][1];
          speak(resp);
          voiceSetStatus(resp, 'success');
          logCmd(resp, 'success', 'next_prev');
          return;
        }
        default: break;
      }
    }

    // No pattern matched
    const resp = `I didn't understand: ${trimmed}. Say help for commands.`;
    speak(resp);
    voiceSetStatus(`Unknown: ${trimmed}`, 'error');
    logCmd(resp, 'error', null);
  }, [voiceLearnedCommands, comments, prioritiesData, competitorData, orgNodes, activeSection, showPriorities, showOrgChart, showEntities, showCompetitors, showSummary, filterV31, navigateTo, resolveNav, resolveEntity, speak, voiceSetStatus]);

  // Voice: always-on toggle
  const toggleAlwaysOn = useCallback(() => {
    const newVal = !voiceAlwaysOnRef.current;
    voiceAlwaysOnRef.current = newVal;
    setVoiceAlwaysOn(newVal);

    if (newVal) {
      // Start continuous recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';
        rec.onresult = (e) => {
          let interim = '', final = '', bestConfidence = 0;
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const t = e.results[i][0].transcript;
            const c = e.results[i][0].confidence;
            if (c > bestConfidence) bestConfidence = c;
            if (e.results[i].isFinal) final += t;
            else interim += t;
          }
          setVoiceInterimText(interim);
          if (final) {
            setVoiceFinalText(final);
            voiceConfidenceRef.current = bestConfidence > 0 ? Math.round(bestConfidence * 100) : null;
            // Check for "now" trigger word
            const trimmed = final.trim().toLowerCase();
            if (trimmed.endsWith(' now') || trimmed.endsWith(' now.')) {
              const cmd = trimmed.replace(/\s+now\.?$/, '').trim();
              if (cmd) processVoiceCommand(cmd);
            }
          }
        };
        rec.onerror = (e) => {
          if (e.error !== 'no-speech' && e.error !== 'aborted') {
            voiceSetStatus(`Recognition error: ${e.error}`, 'error');
          }
        };
        rec.onend = () => {
          if (voiceAlwaysOnRef.current) {
            voiceRestartTimerRef.current = setTimeout(() => {
              try { rec.start(); } catch {}
            }, 300);
          }
        };
        voiceRecRef.current = rec;
        try { rec.start(); } catch {}
        voiceSetStatus('Always-on: say command + "now"', 'info');
        speak('Always on mode activated. Say a command followed by now to execute.');
      } else {
        // Fallback to WebSocket
        const pipecat = new VoiceWebSocket(
          (text) => {
            setVoiceFinalText(text);
            const trimmed = text.trim().toLowerCase();
            if (trimmed.endsWith(' now') || trimmed.endsWith(' now.')) {
              const cmd = trimmed.replace(/\s+now\.?$/, '').trim();
              if (cmd) processVoiceCommand(cmd);
            }
          },
          (msg, type) => voiceSetStatus(msg, type)
        );
        pipecat.start();
        voicePipecatRef.current = pipecat;
      }
    } else {
      // Stop continuous recognition
      if (voiceRecRef.current) {
        try { voiceRecRef.current.abort(); } catch {}
        voiceRecRef.current = null;
      }
      if (voiceRestartTimerRef.current) {
        clearTimeout(voiceRestartTimerRef.current);
        voiceRestartTimerRef.current = null;
      }
      if (voicePipecatRef.current) {
        voicePipecatRef.current.stop();
        voicePipecatRef.current = null;
      }
      setVoiceInterimText('');
      voiceSetStatus('Always-on disabled', 'info');
      speak('Always on mode deactivated');
    }
  }, [processVoiceCommand, speak, voiceSetStatus]);

  // Voice: auto-start always-on recognition on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';
      rec.onresult = (e) => {
        let interim = '', final = '', bestConfidence = 0;
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          const c = e.results[i][0].confidence;
          if (c > bestConfidence) bestConfidence = c;
          if (e.results[i].isFinal) final += t;
          else interim += t;
        }
        setVoiceInterimText(interim);
        if (final) {
          setVoiceFinalText(final);
          voiceConfidenceRef.current = bestConfidence > 0 ? Math.round(bestConfidence * 100) : null;
          const trimmed = final.trim().toLowerCase();
          if (trimmed.endsWith(' now') || trimmed.endsWith(' now.')) {
            const cmd = trimmed.replace(/\s+now\.?$/, '').trim();
            if (cmd) processVoiceCommand(cmd);
          }
        }
      };
      rec.onerror = () => {};
      rec.onend = () => {
        if (voiceAlwaysOnRef.current) {
          voiceRestartTimerRef.current = setTimeout(() => {
            try { rec.start(); } catch {}
          }, 300);
        }
      };
      voiceRecRef.current = rec;
      try { rec.start(); } catch {}
    }, 500);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Voice: cleanup on unmount
  useEffect(() => {
    return () => {
      if (voiceRecRef.current) { try { voiceRecRef.current.abort(); } catch {} }
      if (voiceRestartTimerRef.current) clearTimeout(voiceRestartTimerRef.current);
      if (voicePipecatRef.current) voicePipecatRef.current.stop();
      if (voiceSynthRef.current) voiceSynthRef.current.cancel();
    };
  }, []);

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
    if (!intelForm.competitor && !intelForm.title && !hasText && !audioData && !compVideo && attachments.length === 0) return;
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

  const startEditIntel = useCallback((entry) => {
    setEditingIntelId(entry.id);
    setAddingIntel(true);
    setIntelForm({
      competitor: entry.competitor || '',
      features: entry.features || (entry.feature ? [entry.feature] : []),
      title: entry.title || '',
      links: entry.links || []
    });
    setNewLink('');
    setAudioData(entry.audio || null);
    setCompVideo(entry.video || null);
    setAttachments([
      ...(entry.images || []).map((d, i) => ({ id: Date.now() + i, data: d, name: `image-${i + 1}`, isImage: true })),
      ...(entry.files || []).map((f, i) => ({ id: Date.now() + 1000 + i, data: f.data, name: f.name, fileType: f.type, isImage: false }))
    ]);
    setTranscript('');
    setTimeout(() => { if (compEditorRef.current) compEditorRef.current.innerHTML = entry.text || ''; }, 50);
  }, []);

  const saveEditIntel = useCallback(async () => {
    const html = compEditorRef.current ? compEditorRef.current.innerHTML : '';
    const hasText = html.replace(/<[^>]*>/g, '').trim().length > 0;
    const newData = competitorData.map(e => {
      if (e.id !== editingIntelId) return e;
      return {
        ...e,
        competitor: intelForm.competitor || e.competitor || 'Other',
        features: intelForm.features.length > 0 ? intelForm.features : e.features || ['General'],
        title: intelForm.title,
        text: hasText ? html : '',
        links: intelForm.links.filter(l => l.trim()),
        images: attachments.filter(a => a.isImage).map(a => a.data),
        files: attachments.filter(a => !a.isImage).map(a => ({ data: a.data, name: a.name, type: a.fileType })),
        audio: audioData || null,
        video: compVideo || null,
      };
    });
    setCompetitorData(newData);
    setEditingIntelId(null);
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
  }, [editingIntelId, intelForm, competitorData, attachments, audioData, compVideo]);

  // ── Priorities CRUD + DnD ──
  const availableCategories = useMemo(() => {
    const fromData = prioritiesData.map(e => e.category).filter(Boolean);
    const merged = new Set([...DEFAULT_CATEGORIES, ...fromData]);
    return [...merged].sort();
  }, [prioritiesData]);

  const nextPriorityNum = useCallback(() => {
    let max = 0;
    prioritiesData.forEach(e => { const n = parseInt((e.num || '').replace('P-', ''), 10); if (n > max) max = n; });
    return `P-${String(max + 1).padStart(3, '0')}`;
  }, [prioritiesData]);

  const addPriority = useCallback(async () => {
    const html = priorityEditorRef.current ? priorityEditorRef.current.innerHTML : '';
    if (!priorityForm.title.trim()) return;
    const entry = {
      id: Date.now(), num: nextPriorityNum(),
      title: priorityForm.title.trim(),
      description: html,
      status: priorityForm.status || 'pending',
      category: priorityForm.category || '',
      links: priorityForm.links.filter(l => l.trim()),
      rank: prioritiesData.length + 1,
      author: commentAuthor.trim() || 'Reviewer',
      time: new Date().toISOString()
    };
    const newData = [...prioritiesData, entry];
    setPrioritiesData(newData);
    setAddingPriority(false);
    setPriorityForm({ title: '', description: '', status: 'pending', category: '', links: [] });
    setPriorityNewLink('');
    if (priorityEditorRef.current) priorityEditorRef.current.innerHTML = '';
    setSaving(true);
    await prioritiesApiSave(newData);
    setSaving(false);
  }, [priorityForm, prioritiesData, commentAuthor, nextPriorityNum]);

  const deletePriority = useCallback(async (id) => {
    const newData = prioritiesData.filter(e => e.id !== id).map((e, i) => ({ ...e, rank: i + 1 }));
    setPrioritiesData(newData);
    setSaving(true);
    await prioritiesApiSave(newData);
    setSaving(false);
  }, [prioritiesData]);

  const togglePriorityStatus = useCallback(async (id) => {
    const cycle = { pending: 'ongoing', ongoing: 'completed', completed: 'pending' };
    const newData = prioritiesData.map(e => e.id === id ? { ...e, status: cycle[e.status] || 'pending' } : e);
    setPrioritiesData(newData);
    setSaving(true);
    await prioritiesApiSave(newData);
    setSaving(false);
  }, [prioritiesData]);

  const startEditPriority = useCallback((entry) => {
    setEditingPriorityId(entry.id);
    setAddingPriority(true);
    setPriorityForm({
      title: entry.title || '',
      description: entry.description || '',
      status: entry.status || 'pending',
      category: entry.category || '',
      links: entry.links || []
    });
    setPriorityNewLink('');
    setTimeout(() => { if (priorityEditorRef.current) priorityEditorRef.current.innerHTML = entry.description || ''; }, 50);
  }, []);

  const saveEditPriority = useCallback(async () => {
    const html = priorityEditorRef.current ? priorityEditorRef.current.innerHTML : '';
    const newData = prioritiesData.map(e => {
      if (e.id !== editingPriorityId) return e;
      return { ...e, title: priorityForm.title.trim(), description: html, status: priorityForm.status, category: priorityForm.category || '', links: priorityForm.links.filter(l => l.trim()) };
    });
    setPrioritiesData(newData);
    setEditingPriorityId(null);
    setAddingPriority(false);
    setPriorityForm({ title: '', description: '', status: 'pending', category: '', links: [] });
    setPriorityNewLink('');
    if (priorityEditorRef.current) priorityEditorRef.current.innerHTML = '';
    setSaving(true);
    await prioritiesApiSave(newData);
    setSaving(false);
  }, [editingPriorityId, priorityForm, prioritiesData]);

  const handlePriorityDragStart = useCallback((e, id) => {
    setDragPriorityId(id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);
  const handlePriorityDragOver = useCallback((e, id) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverPriorityId(id);
  }, []);
  const handlePriorityDrop = useCallback(async (e, targetId) => {
    e.preventDefault();
    if (!dragPriorityId || dragPriorityId === targetId) { setDragPriorityId(null); setDragOverPriorityId(null); return; }
    const items = [...prioritiesData];
    const fromIdx = items.findIndex(p => p.id === dragPriorityId);
    const toIdx = items.findIndex(p => p.id === targetId);
    if (fromIdx < 0 || toIdx < 0) { setDragPriorityId(null); setDragOverPriorityId(null); return; }
    const [moved] = items.splice(fromIdx, 1);
    items.splice(toIdx, 0, moved);
    const reranked = items.map((p, i) => ({ ...p, rank: i + 1 }));
    setPrioritiesData(reranked);
    setDragPriorityId(null);
    setDragOverPriorityId(null);
    setSaving(true);
    await prioritiesApiSave(reranked);
    setSaving(false);
  }, [dragPriorityId, prioritiesData]);
  const handlePriorityDragEnd = useCallback(() => {
    setDragPriorityId(null);
    setDragOverPriorityId(null);
  }, []);

  // ── Workbench ──
  const processWorkbenchTranscript = useCallback(async () => {
    if (!workbenchText.trim()) return;
    setWorkbenchProcessing(true);
    setWorkbenchError('');
    try {
      const r = await fetch('/api/workbench', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'transcript', content: workbenchText, categories: availableCategories })
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      setWorkbenchSuggestions(data.suggestions || []);
    } catch (e) {
      // Client-side regex fallback
      const lines = workbenchText.split(/\n/);
      const suggestions = [];
      for (const line of lines) {
        const t = line.trim();
        const actionMatch = t.match(/^(?:action\s*(?:item)?|todo|task|priority|follow[- ]?up)\s*[:—-]\s*(.+)/i);
        if (actionMatch) { suggestions.push({ title: actionMatch[1].trim().slice(0, 120), description: '', confidence: 0.7 }); continue; }
        const numMatch = t.match(/^\d+[.)]\s+(.+)/);
        if (numMatch && numMatch[1].length > 10 && /^(implement|build|create|add|fix|update|review|set up|establish|develop|integrate|design|prepare|schedule|plan|analyze|evaluate|migrate|deploy|test|launch|research|investigate|define|document|configure|ensure|enable|improve|optimize|resolve|address|complete|finalize|prioritize|assess)/i.test(numMatch[1])) {
          suggestions.push({ title: numMatch[1].trim().slice(0, 120), description: '', confidence: 0.5 });
        }
        const bulletMatch = t.match(/^[-•*]\s+(.+)/);
        if (bulletMatch && bulletMatch[1].length > 10 && /^(implement|build|create|add|fix|update|review|set up|establish|develop|integrate|design|prepare|schedule|plan|analyze|evaluate|migrate|deploy|test|launch|research|investigate|define|document|configure|ensure|enable|improve|optimize|resolve|address|complete|finalize|prioritize|assess|need to|should|must|will|we'll|let's|going to)/i.test(bulletMatch[1])) {
          suggestions.push({ title: bulletMatch[1].trim().slice(0, 120), description: '', confidence: 0.4 });
        }
      }
      setWorkbenchSuggestions(suggestions.slice(0, 15));
      if (suggestions.length === 0) setWorkbenchError('No actionable priorities found. Try pasting text with action items, bullet points, or numbered lists.');
    }
    setWorkbenchProcessing(false);
  }, [workbenchText, availableCategories]);

  const processWorkbenchUrl = useCallback(async () => {
    if (!workbenchUrl.trim()) return;
    setWorkbenchProcessing(true);
    setWorkbenchError('');
    try {
      const r = await fetch('/api/workbench', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'url', content: workbenchUrl, categories: availableCategories })
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      setWorkbenchSuggestions(data.suggestions || []);
      if ((data.suggestions || []).length === 0) setWorkbenchError('No actionable priorities found from this URL.');
    } catch (e) {
      setWorkbenchError(`Failed to analyze URL: ${e.message}`);
    }
    setWorkbenchProcessing(false);
  }, [workbenchUrl, availableCategories]);

  const addSuggestionAsPriority = useCallback(async (suggestion) => {
    const entry = {
      id: Date.now(), num: nextPriorityNum(),
      title: suggestion.title,
      description: suggestion.description || '',
      status: 'pending',
      category: suggestion.category || '',
      links: [],
      rank: prioritiesData.length + 1,
      author: commentAuthor.trim() || 'Reviewer',
      time: new Date().toISOString()
    };
    const newData = [...prioritiesData, entry];
    setPrioritiesData(newData);
    setWorkbenchSuggestions(prev => prev.filter(s => s !== suggestion));
    setSaving(true);
    await prioritiesApiSave(newData);
    setSaving(false);
  }, [prioritiesData, commentAuthor, nextPriorityNum]);

  const startEditSuggestion = useCallback((idx) => {
    setEditingSuggestionIdx(idx);
    setEditingSuggestionForm({ title: workbenchSuggestions[idx].title, description: workbenchSuggestions[idx].description || '', category: workbenchSuggestions[idx].category || '' });
  }, [workbenchSuggestions]);

  const saveAndAddEditedSuggestion = useCallback(async () => {
    if (editingSuggestionIdx === null) return;
    const edited = { ...workbenchSuggestions[editingSuggestionIdx], title: editingSuggestionForm.title, description: editingSuggestionForm.description, category: editingSuggestionForm.category };
    setEditingSuggestionIdx(null);
    await addSuggestionAsPriority(edited);
  }, [editingSuggestionIdx, editingSuggestionForm, workbenchSuggestions, addSuggestionAsPriority]);

  // ── Org Chart helpers ──
  const orgchartSave = useCallback((nodes, edges, views) => {
    clearTimeout(orgSaveTimerRef.current);
    orgSaveTimerRef.current = setTimeout(() => {
      setSaving(true);
      orgchartApiSave({ nodes, edges, views: views || orgchartViews }).then(() => setSaving(false));
    }, 500);
  }, [orgchartViews]);

  const onOrgConnect = useCallback((params) => {
    const rel = newEdgeType;
    const style = EDGE_RELATIONS[rel]?.style || {};
    const edge = {
      ...params,
      id: `e-${params.source}-${params.target}-${Date.now()}`,
      type: 'smoothstep',
      data: { relation: rel },
      style,
      label: EDGE_RELATIONS[rel]?.label || rel,
      labelStyle: { fontSize: 10, fill: '#888' },
      labelBgStyle: { fill: '#fff', fillOpacity: 0.8 },
    };
    setOrgEdges(eds => {
      const next = addEdge(edge, eds);
      orgchartSave(orgNodes, next);
      return next;
    });
  }, [newEdgeType, orgNodes, orgchartSave, setOrgEdges]);

  const onOrgNodeDragStop = useCallback((_, node) => {
    setOrgNodes(nds => {
      const next = nds.map(n => n.id === node.id ? { ...n, position: node.position } : n);
      orgchartSave(next, orgEdges);
      return next;
    });
  }, [orgEdges, orgchartSave, setOrgNodes]);

  const addOrgPerson = useCallback(() => {
    const id = `p${Date.now()}`;
    const newNode = {
      id, type: 'person',
      position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 },
      data: { name: 'New Person', title: '', sentiment: 'neutral', department: '', notes: '' },
    };
    setOrgNodes(nds => {
      const next = [...nds, newNode];
      orgchartSave(next, orgEdges);
      return next;
    });
    setEditingPerson(id);
  }, [orgEdges, orgchartSave, setOrgNodes]);

  const updateOrgPerson = useCallback((id, updates) => {
    setOrgNodes(nds => {
      const next = nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...updates } } : n);
      orgchartSave(next, orgEdges);
      return next;
    });
  }, [orgEdges, orgchartSave, setOrgNodes]);

  const deleteOrgPerson = useCallback((id) => {
    setOrgNodes(nds => {
      const next = nds.filter(n => n.id !== id);
      setOrgEdges(eds => {
        const nextEdges = eds.filter(e => e.source !== id && e.target !== id);
        orgchartSave(next, nextEdges);
        return nextEdges;
      });
      return next;
    });
    setEditingPerson(null);
  }, [orgchartSave, setOrgNodes, setOrgEdges]);

  const deleteOrgEdge = useCallback((id) => {
    setOrgEdges(eds => {
      const next = eds.filter(e => e.id !== id);
      orgchartSave(orgNodes, next);
      return next;
    });
  }, [orgNodes, orgchartSave, setOrgEdges]);

  const autoLayoutOrg = useCallback(() => {
    if (orgNodes.length === 0) return;
    // Build adjacency from reportsTo edges
    const children = {};
    const hasParent = new Set();
    orgEdges.forEach(e => {
      if (e.data?.relation === 'reportsTo') {
        if (!children[e.target]) children[e.target] = [];
        children[e.target].push(e.source);
        hasParent.add(e.source);
      }
    });
    const roots = orgNodes.filter(n => !hasParent.has(n.id)).map(n => n.id);
    if (roots.length === 0) roots.push(orgNodes[0].id);

    const positions = {};
    const XGAP = 180, YGAP = 120;
    let globalX = 0;

    const layoutTree = (nodeId, depth) => {
      const kids = children[nodeId] || [];
      if (kids.length === 0) {
        positions[nodeId] = { x: globalX, y: depth * YGAP };
        globalX += XGAP;
        return;
      }
      kids.forEach(kid => layoutTree(kid, depth + 1));
      const firstKid = positions[kids[0]];
      const lastKid = positions[kids[kids.length - 1]];
      positions[nodeId] = { x: (firstKid.x + lastKid.x) / 2, y: depth * YGAP };
    };

    roots.forEach(r => { layoutTree(r, 0); globalX += XGAP / 2; });
    // Place orphans (nodes not reached)
    orgNodes.forEach(n => {
      if (!positions[n.id]) {
        positions[n.id] = { x: globalX, y: 0 };
        globalX += XGAP;
      }
    });

    setOrgNodes(nds => {
      const next = nds.map(n => positions[n.id] ? { ...n, position: positions[n.id] } : n);
      orgchartSave(next, orgEdges);
      return next;
    });
  }, [orgNodes, orgEdges, orgchartSave, setOrgNodes]);

  const onOrgNodeClick = useCallback((_, node) => {
    setEditingPerson(node.id);
  }, []);

  const onOrgPaneClick = useCallback(() => {
    setEditingPerson(null);
  }, []);

  // Filter nodes/edges by selected view
  const filteredOrgNodes = useMemo(() => {
    const view = orgchartViews.find(v => v.id === selectedOrgView);
    if (!view?.filter?.departments?.length) return orgNodes;
    return orgNodes.filter(n => view.filter.departments.includes(n.data.department));
  }, [orgNodes, orgchartViews, selectedOrgView]);

  const filteredOrgEdges = useMemo(() => {
    const nodeIds = new Set(filteredOrgNodes.map(n => n.id));
    return orgEdges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
  }, [orgEdges, filteredOrgNodes]);

  const orgDepartments = useMemo(() => {
    const deps = new Set();
    orgNodes.forEach(n => { if (n.data.department) deps.add(n.data.department); });
    return [...deps].sort();
  }, [orgNodes]);

  useEffect(() => {
    if (commentingOn && inputRef.current) inputRef.current.focus();
  }, [commentingOn]);

  // Reset modal position/size when opened
  useEffect(() => {
    if (mediaModal) setModalRect({ x: 80, y: 40, w: 0, h: 0 });
  }, [mediaModal?.items]);

  // Drag/resize handler for media modal
  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d) return;
      e.preventDefault();
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (d.type === 'move') {
        setModalRect(r => ({ ...r, x: d.startRectX + dx, y: Math.max(0, d.startRectY + dy) }));
      } else {
        setModalRect(r => {
          let { x, y, w, h } = { ...r };
          if (d.type.includes('right')) w = Math.max(320, d.startW + dx);
          if (d.type.includes('bottom')) h = Math.max(240, d.startH + dy);
          if (d.type.includes('left')) { const nw = Math.max(320, d.startW - dx); x = d.startRectX + d.startW - nw; w = nw; }
          if (d.type.includes('top')) { const nh = Math.max(240, d.startH - dy); y = Math.max(0, d.startRectY + d.startH - nh); h = nh; }
          return { x, y, w, h };
        });
      }
    };
    const onUp = () => { dragRef.current = null; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight' && !commentingOn && !showOrgChart) { setShowSummary(false); setShowCompetitors(false); setShowEntities(false); setShowOrgChart(false); setShowPriorities(false); setShowTestSuite(false); setActiveSection(s => Math.min(S.length - 1, s + 1)); }
      if (e.key === 'ArrowLeft' && !commentingOn && !showOrgChart) { setShowSummary(false); setShowCompetitors(false); setShowEntities(false); setShowOrgChart(false); setShowPriorities(false); setShowTestSuite(false); setActiveSection(s => Math.max(0, s - 1)); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); document.querySelector('#search-input')?.focus(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [commentingOn]);

  const section = S[activeSection];
  const filteredSections = search
    ? S.map((s, i) => [s, i]).filter(([s]) => s[1].toLowerCase().includes(search.toLowerCase()) || s[3].some(it => typeof it[2] === 'string' && it[2].toLowerCase().includes(search.toLowerCase())))
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
      <div key={itemIdx} id={`spec-item-${itemIdx}`} className="spec-item" style={{ position: 'relative', marginBottom: type === 'h' ? 8 : 4, padding: '6px 10px', borderRadius: 5, background: isCommenting ? 'rgba(180,130,40,0.06)' : itemComments.length > 0 ? 'rgba(100,149,237,0.06)' : 'transparent', borderLeft: itemComments.length > 0 ? '3px solid #6495ed66' : '3px solid transparent', transition: 'all 0.15s' }}>
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
          <button onClick={() => { setEditingIntelId(null); setAddingIntel(true); setAudioData(null); setAttachments([]); setTranscript(''); setCompVideo(null); setIntelForm({ competitor: '', features: [], title: '', links: [] }); setNewLink(''); }}
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
              <button onClick={editingIntelId ? saveEditIntel : addIntel} style={{ padding: '6px 14px', background: '#8b6914', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{editingIntelId ? 'Save Changes' : 'Add Intel'}</button>
              <button onClick={() => { setAddingIntel(false); setEditingIntelId(null); setAudioData(null); setAttachments([]); setCompVideo(null); setTranscript(''); setDragOver(false); if (isRecording) stopRecording(); }}
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
                  <button onClick={() => startEditIntel(e)} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 11, padding: '0 2px' }}>✎</button>
                  <button onClick={() => deleteIntel(e.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 10, padding: '0 2px' }}>✕</button>
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
                {(() => {
                  const allMedia = [
                    ...(e.images || []).map((src, i) => ({ type: 'image', src, name: `Image ${i + 1}` })),
                    ...(e.files || []).map(d => ({ type: 'file', src: d.data, name: d.name, fileType: d.type })),
                    ...(e.video ? [{ type: 'video', src: e.video, name: 'Video' }] : []),
                  ];
                  const openMedia = (idx) => setMediaModal({ items: allMedia, index: idx });
                  let imgCount = 0;
                  return <>
                    {e.images?.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                        {e.images.map((src, i) => { const idx = i; imgCount++; return <img key={i} src={src} alt="screenshot" onClick={() => openMedia(idx)} style={{ maxWidth: 300, maxHeight: 180, borderRadius: 4, border: '1px solid #e0e0e0', cursor: 'pointer' }} />; })}
                      </div>
                    )}
                    {e.audio && <audio controls src={e.audio} style={{ height: 28, marginBottom: 6, maxWidth: '100%', display: 'block' }} />}
                    {e.video && <video controls src={e.video} onClick={() => openMedia(allMedia.findIndex(m => m.type === 'video'))} style={{ maxWidth: 400, maxHeight: 225, borderRadius: 4, marginBottom: 6, display: 'block', cursor: 'pointer' }} />}
                    {e.files?.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {e.files.map((d, i) => { const idx = (e.images?.length || 0) + i; return <button key={i} onClick={() => openMedia(idx)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: '#f5f0e8', borderRadius: 4, fontSize: 11, color: '#8b6914', border: '1px solid #e0d8c8', cursor: 'pointer', fontFamily: 'inherit' }}>📄 {d.name}</button>; })}
                      </div>
                    )}
                  </>;
                })()}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderEntitiesView = () => {
    const catColors = { 'Core': { bg: '#f5f5f5', color: '#555', badge: '#e0e0e0' }, 'New v3.0': { bg: '#e8f5e9', color: '#2e7d32', badge: '#c8e6c9' }, 'New v3.1': { bg: '#fff3e0', color: '#e65100', badge: '#ffe0b2' }, 'Revised v3.1': { bg: '#e3f2fd', color: '#1565c0', badge: '#bbdefb' } };

    // Extract spec content for an entity
    const getEntityContent = (sec, startItem) => {
      const sectionItems = S[sec][3];
      const startType = sectionItems[startItem]?.[1];
      if (startType !== 'h') {
        // Non-heading — find preceding heading and include it for context
        const result = [];
        for (let i = startItem - 1; i >= 0; i--) {
          if (sectionItems[i][1] === 'h') { result.push(sectionItems[i]); break; }
        }
        // Include items from startItem until next heading
        for (let i = startItem; i < sectionItems.length; i++) {
          if (i > startItem && sectionItems[i][1] === 'h') break;
          result.push(sectionItems[i]);
        }
        return result;
      }
      // Heading — collect heading + following items until next heading at same or higher level
      const result = [sectionItems[startItem]];
      const startText = sectionItems[startItem][2];
      const startLevel = startText.match(/^\d+\.\d+\.\d+/) ? 3 : startText.match(/^\d+\.\d+/) ? 2 : 1;
      for (let i = startItem + 1; i < sectionItems.length; i++) {
        const it = sectionItems[i];
        if (it[1] === 'h') {
          const t = it[2];
          const lvl = t.match(/^\d+\.\d+\.\d+/) ? 3 : t.match(/^\d+\.\d+/) ? 2 : 1;
          if (lvl <= startLevel) break;
        }
        result.push(it);
      }
      return result;
    };

    // Detail view for a selected entity
    if (selectedEntity) {
      const [name, sec, item, ver, cat] = selectedEntity;
      const c = catColors[cat];
      const content = getEntityContent(sec, item);
      const sectionName = S[sec][1];

      return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <button onClick={() => setSelectedEntity(null)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 5, cursor: 'pointer', fontSize: 12, color: '#555', fontFamily: 'inherit' }}>
              ← All Entities
            </button>
            <span style={{ fontSize: 10, background: c.badge, color: c.color, padding: '2px 8px', borderRadius: 3, fontWeight: 600 }}>{cat}</span>
            {ver !== '2.0' && <span className="badge-v31" style={{ background: c.badge, color: c.color }}>v{ver}</span>}
          </div>
          <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 24, color: '#1a1a1a', marginBottom: 6 }}>{name}</div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>
            Section: <button onClick={() => navigateToEntity(sec, item, selectedEntity)} style={{ background: 'none', border: 'none', color: '#4a7cc9', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, padding: 0, textDecoration: 'underline' }}>{sectionName} →</button>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8, padding: '16px 20px' }}>
            {content.map((it, i) => {
              const [, type, text, flag] = it;
              const isV31 = flag === 1;
              const isInnovation = flag === 2;
              if (type === 'h') {
                const level = text.match(/^\d+\.\d+\.\d+/) ? 3 : text.match(/^\d+\.\d+/) ? 2 : 1;
                const sizes = { 1: 20, 2: 17, 3: 14.5 };
                return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: i > 0 ? 12 : 0, flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: sizes[level], fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400, color: '#1a1a1a' }}>{text}</h3>
                  {isV31 && <span className="badge-v31">v3.1</span>}
                </div>;
              }
              if (type === 'x') {
                const icon = isInnovation ? '⭐' : '⚡';
                const bg = isInnovation ? 'rgba(76,175,80,0.08)' : 'rgba(180,130,40,0.08)';
                const border = isInnovation ? '#4caf5044' : '#b4822844';
                const color = isInnovation ? '#2e7d32' : '#8b6914';
                return <div key={i} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 6, padding: '10px 14px', fontSize: 13, lineHeight: 1.55, color, marginBottom: 6 }}>
                  {icon} {text}{isV31 && <span className="badge-v31" style={{ marginLeft: 8 }}>v3.1</span>}
                </div>;
              }
              if (type === 't') {
                const rows = text;
                return <div key={i} style={{ overflowX: 'auto', marginBottom: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, lineHeight: 1.5 }}>
                    <thead><tr>{rows[0].map((cell, ci) => <th key={ci} style={{ textAlign: 'left', padding: '8px 12px', background: '#f5f0e8', color: '#1a1a1a', fontWeight: 600, borderBottom: '2px solid #d4a85366', fontSize: 12 }}>{cell}</th>)}</tr></thead>
                    <tbody>{rows.slice(1).map((row, ri) => <tr key={ri}>{row.map((cell, ci) => <td key={ci} style={{ padding: '7px 12px', borderBottom: '1px solid #e8e8e8', color: ci === 0 ? '#1a1a1a' : '#555', fontWeight: ci === 0 ? 600 : 400, fontSize: 12.5 }}>{cell}</td>)}</tr>)}</tbody>
                  </table>
                </div>;
              }
              // paragraph
              return <p key={i} style={{ margin: '0 0 6px', fontSize: 13.5, lineHeight: 1.65, color: '#444' }}>
                {text}{isV31 && <span className="badge-v31" style={{ marginLeft: 6 }}>v3.1</span>}
              </p>;
            })}
          </div>
        </div>
      );
    }

    // List view
    const q = entitySearch.toLowerCase();
    const filtered = q ? ENTITIES.filter(e => e[0].toLowerCase().includes(q) || e[3].includes(q) || e[4].toLowerCase().includes(q)) : ENTITIES;
    const cats = ['Core', 'New v3.0', 'New v3.1', 'Revised v3.1'];

    return (
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <input value={entitySearch} onChange={e => setEntitySearch(e.target.value)} placeholder="Search entities…"
          style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1px solid #d0d0d0', borderRadius: 6, marginBottom: 20, fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }} />
        {cats.map(cat => {
          const items = filtered.filter(e => e[4] === cat);
          if (items.length === 0) return null;
          const c = catColors[cat];
          return (
            <div key={cat} style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 16, color: '#1a1a1a', borderBottom: '1px solid #e0e0e0', paddingBottom: 8, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                {cat}
                <span style={{ fontSize: 11, color: '#888', fontWeight: 400, fontFamily: 'inherit' }}>({items.length} entities)</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {items.sort((a, b) => a[0].localeCompare(b[0])).map(ent => {
                  const [name, , , ver] = ent;
                  return (
                    <button key={name} onClick={() => { setSelectedEntity(ent); contentRef.current?.scrollTo(0, 0); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: c.bg, border: `1px solid ${c.badge}`, borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: c.color, transition: 'all 0.12s', textAlign: 'left' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                      <span style={{ fontWeight: 600 }}>{name}</span>
                      {ver !== '2.0' && <span style={{ fontSize: 9, background: c.badge, color: c.color, padding: '1px 5px', borderRadius: 3, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>v{ver}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
            <div style={{ fontSize: 14 }}>No entities matching "{entitySearch}"</div>
          </div>
        )}
      </div>
    );
  };

  const renderOrgChartView = () => {
    const editNode = editingPerson ? orgNodes.find(n => n.id === editingPerson) : null;
    return (
      <div style={{ display: 'flex', height: '100%' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #e0e0e0', flexWrap: 'wrap', background: '#fafaf8' }}>
            <button onClick={addOrgPerson} style={{ padding: '6px 12px', background: '#8b6914', color: '#fff', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Add Person</button>
            <select value={selectedOrgView} onChange={e => {
              const val = e.target.value;
              setSelectedOrgView(val);
              // Auto-create view for department filter
              if (val.startsWith('dept-') && !orgchartViews.some(v => v.id === val)) {
                const dept = val.replace('dept-', '');
                setOrgchartViews(vs => [...vs, { id: val, name: `${dept} only`, filter: { departments: [dept] } }]);
              }
            }} style={{ padding: '5px 8px', fontSize: 11, background: '#fff', border: '1px solid #d0d0d0', borderRadius: 4, fontFamily: 'inherit' }}>
              {orgchartViews.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              {orgDepartments.filter(d => !orgchartViews.some(v => v.id === `dept-${d}`)).map(d => (
                <option key={`dept-${d}`} value={`dept-${d}`}>{d} only</option>
              ))}
            </select>
            <select value={newEdgeType} onChange={e => setNewEdgeType(e.target.value)} style={{ padding: '5px 8px', fontSize: 11, background: '#fff', border: '1px solid #d0d0d0', borderRadius: 4, fontFamily: 'inherit' }}>
              {Object.entries(EDGE_RELATIONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={autoLayoutOrg} style={{ padding: '5px 10px', background: '#fff', border: '1px solid #d0d0d0', borderRadius: 4, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', color: '#555' }}>Auto Layout</button>
            <span style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {Object.entries(SENTIMENT_COLORS).map(([k, v]) => (
                <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#888' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: v.color }} />
                  {v.label}
                </span>
              ))}
            </div>
          </div>
          {/* React Flow Canvas */}
          <div style={{ flex: 1 }}>
            <ReactFlow
              nodes={filteredOrgNodes}
              edges={filteredOrgEdges}
              onNodesChange={onOrgNodesChange}
              onEdgesChange={onOrgEdgesChange}
              onConnect={onOrgConnect}
              onNodeClick={onOrgNodeClick}
              onPaneClick={onOrgPaneClick}
              onNodeDragStop={onOrgNodeDragStop}
              nodeTypes={NODE_TYPES}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              deleteKeyCode="Delete"
              onEdgesDelete={(edges) => edges.forEach(e => deleteOrgEdge(e.id))}
            >
              <Background gap={20} size={1} color="#e8e8e8" />
              <Controls showInteractive={false} style={{ bottom: 40 }} />
              <MiniMap nodeColor={(n) => SENTIMENT_COLORS[n.data?.sentiment]?.color || '#999'} style={{ border: '1px solid #e0e0e0' }} />
            </ReactFlow>
          </div>
        </div>
        {/* Edit Panel */}
        {editNode && (
          <div style={{ width: 280, minWidth: 280, borderLeft: '1px solid #e0e0e0', background: '#fafaf8', padding: 16, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 16, color: '#1a1a1a' }}>Edit Person</span>
              <button onClick={() => setEditingPerson(null)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 3 }}>Name</label>
                <input value={editNode.data.name} onChange={e => updateOrgPerson(editNode.id, { name: e.target.value })} style={{ width: '100%', padding: '6px 8px', fontSize: 12, border: '1px solid #d0d0d0', borderRadius: 4, fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 3 }}>Title</label>
                <input value={editNode.data.title || ''} onChange={e => updateOrgPerson(editNode.id, { title: e.target.value })} style={{ width: '100%', padding: '6px 8px', fontSize: 12, border: '1px solid #d0d0d0', borderRadius: 4, fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 3 }}>Sentiment</label>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {Object.entries(SENTIMENT_COLORS).map(([k, v]) => (
                    <button key={k} onClick={() => updateOrgPerson(editNode.id, { sentiment: k })} style={{
                      padding: '4px 10px', fontSize: 11, borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                      border: editNode.data.sentiment === k ? `2px solid ${v.color}` : '1px solid #d0d0d0',
                      background: editNode.data.sentiment === k ? v.bg : '#fff',
                      color: editNode.data.sentiment === k ? v.color : '#666',
                      fontWeight: editNode.data.sentiment === k ? 600 : 400,
                    }}>{v.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 3 }}>Department</label>
                <input value={editNode.data.department || ''} onChange={e => updateOrgPerson(editNode.id, { department: e.target.value })} list="org-departments" style={{ width: '100%', padding: '6px 8px', fontSize: 12, border: '1px solid #d0d0d0', borderRadius: 4, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                <datalist id="org-departments">{orgDepartments.map(d => <option key={d} value={d} />)}</datalist>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 3 }}>Notes</label>
                <textarea value={editNode.data.notes || ''} onChange={e => updateOrgPerson(editNode.id, { notes: e.target.value })} rows={3} style={{ width: '100%', padding: '6px 8px', fontSize: 12, border: '1px solid #d0d0d0', borderRadius: 4, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              {/* Connections for this person */}
              <div>
                <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 3 }}>Connections</label>
                {orgEdges.filter(e => e.source === editNode.id || e.target === editNode.id).map(e => {
                  const otherId = e.source === editNode.id ? e.target : e.source;
                  const other = orgNodes.find(n => n.id === otherId);
                  const dir = e.source === editNode.id ? '→' : '←';
                  return (
                    <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, marginBottom: 4, padding: '3px 6px', background: '#fff', borderRadius: 4, border: '1px solid #e8e8e8' }}>
                      <span style={{ color: '#888' }}>{dir}</span>
                      <span style={{ flex: 1, color: '#1a1a1a' }}>{other?.data.name || otherId}</span>
                      <span style={{ fontSize: 9, color: '#888' }}>{EDGE_RELATIONS[e.data?.relation]?.label || e.data?.relation}</span>
                      <button onClick={() => deleteOrgEdge(e.id)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 10, padding: '0 2px' }}>✕</button>
                    </div>
                  );
                })}
                {orgEdges.filter(e => e.source === editNode.id || e.target === editNode.id).length === 0 && (
                  <div style={{ fontSize: 11, color: '#bbb', fontStyle: 'italic' }}>No connections. Drag from handle to connect.</div>
                )}
              </div>
              <button onClick={() => deleteOrgPerson(editNode.id)} style={{ marginTop: 8, padding: '7px 14px', background: '#fce4ec', color: '#c62828', border: '1px solid #f8bbd0', borderRadius: 5, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Delete Person</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPrioritiesView = () => {
    const statusColors = {
      pending: { bg: '#fff3e0', color: '#e65100', label: 'Pending' },
      ongoing: { bg: '#e3f2fd', color: '#1565c0', label: 'Ongoing' },
      completed: { bg: '#e8f5e9', color: '#2e7d32', label: 'Completed' }
    };

    let entries = [...prioritiesData].sort((a, b) => (a.rank || 0) - (b.rank || 0));
    if (priorityStatusFilter) entries = entries.filter(e => e.status === priorityStatusFilter);
    if (prioritySearch) {
      const q = prioritySearch.toLowerCase();
      entries = entries.filter(e =>
        (e.title || '').toLowerCase().includes(q) ||
        (e.description || '').replace(/<[^>]*>/g, '').toLowerCase().includes(q) ||
        (e.num || '').toLowerCase().includes(q) ||
        (e.category || '').toLowerCase().includes(q) ||
        (e.links || []).some(l => l.toLowerCase().includes(q))
      );
    }
    const canDrag = !priorityStatusFilter && !prioritySearch && priorityViewMode === 'rank';

    const toolbarBtn = (cmd, label) => (
      <button key={cmd} title={cmd} onMouseDown={e => { e.preventDefault(); document.execCommand(cmd, false, null); }}
        style={{ padding: '2px 7px', background: 'transparent', border: '1px solid transparent', borderRadius: 3, cursor: 'pointer', fontSize: 12, fontWeight: cmd === 'bold' ? 700 : 400, fontStyle: cmd === 'italic' ? 'italic' : 'normal', textDecoration: cmd === 'underline' ? 'underline' : cmd === 'strikeThrough' ? 'line-through' : 'none', color: '#555', lineHeight: 1.3 }}>{label}</button>
    );

    const statusPill = (status, onClick) => {
      const s = statusColors[status] || statusColors.pending;
      return <span onClick={onClick} style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, cursor: onClick ? 'pointer' : 'default', userSelect: 'none', transition: 'all 0.15s' }}>{s.label}</span>;
    };

    return (
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          <button onClick={() => { setEditingPriorityId(null); setAddingPriority(true); setPriorityForm({ title: '', description: '', status: 'pending', category: '', links: [] }); setPriorityNewLink(''); setTimeout(() => { if (priorityEditorRef.current) priorityEditorRef.current.innerHTML = ''; }, 50); }}
            style={{ padding: '7px 14px', background: '#8b6914', color: '#fff', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Add Priority</button>
          <button onClick={() => setShowWorkbench(w => !w)}
            style={{ padding: '7px 14px', background: showWorkbench ? '#5c6bc0' : '#fff', color: showWorkbench ? '#fff' : '#5c6bc0', border: '1px solid #5c6bc0', borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {showWorkbench ? '✕ Close Workbench' : '🤖 AI Workbench'}
          </button>
          <select value={priorityStatusFilter} onChange={e => setPriorityStatusFilter(e.target.value)}
            style={{ padding: '6px 8px', fontSize: 12, background: '#fff', color: '#1a1a1a', border: '1px solid #d0d0d0', borderRadius: 4, fontFamily: 'inherit' }}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
          <div style={{ display: 'inline-flex', borderRadius: 5, overflow: 'hidden', border: '1px solid #d0d0d0' }}>
            {['rank', 'category'].map(mode => (
              <button key={mode} onClick={() => setPriorityViewMode(mode)}
                style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: priorityViewMode === mode ? '#8b6914' : '#fff', color: priorityViewMode === mode ? '#fff' : '#666', transition: 'all 0.15s' }}>
                {mode === 'rank' ? 'Rank' : 'Category'}
              </button>
            ))}
          </div>
          <input value={prioritySearch} onChange={e => setPrioritySearch(e.target.value)} placeholder="Search priorities…"
            style={{ padding: '6px 10px', fontSize: 12, background: '#fff', border: '1px solid #d0d0d0', borderRadius: 4, fontFamily: 'inherit', flex: 1, minWidth: 120 }} />
        </div>

        {/* AI Workbench Panel */}
        {showWorkbench && (
          <div style={{ background: '#f5f3ff', border: '1px solid #c5cae9', borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#3949ab', marginBottom: 12 }}>🤖 AI Workbench</div>

            {/* Transcript input */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 4, fontWeight: 600 }}>Paste call transcript or notes:</div>
              <textarea value={workbenchText} onChange={e => setWorkbenchText(e.target.value)} rows={5} placeholder="Paste meeting notes, call transcript, or any text with action items…"
                style={{ width: '100%', padding: 8, fontSize: 12, border: '1px solid #d0d0d0', borderRadius: 4, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
              <button onClick={processWorkbenchTranscript} disabled={workbenchProcessing || !workbenchText.trim()}
                style={{ marginTop: 6, padding: '6px 14px', background: workbenchProcessing ? '#999' : '#3949ab', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: workbenchProcessing ? 'wait' : 'pointer' }}>
                {workbenchProcessing ? 'Processing…' : 'Extract Priorities'}
              </button>
            </div>

            {/* URL input */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 4, fontWeight: 600 }}>Or analyze a URL:</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={workbenchUrl} onChange={e => setWorkbenchUrl(e.target.value)} placeholder="https://example.com/article"
                  style={{ flex: 1, padding: '6px 8px', fontSize: 12, border: '1px solid #d0d0d0', borderRadius: 4, fontFamily: 'inherit' }} />
                <button onClick={processWorkbenchUrl} disabled={workbenchProcessing || !workbenchUrl.trim()}
                  style={{ padding: '6px 14px', background: workbenchProcessing ? '#999' : '#3949ab', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: workbenchProcessing ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}>
                  {workbenchProcessing ? 'Processing…' : 'Analyze'}
                </button>
              </div>
            </div>

            {workbenchError && <div style={{ color: '#c62828', fontSize: 12, marginBottom: 8 }}>{workbenchError}</div>}

            {/* Suggestions */}
            {workbenchSuggestions.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 6, fontWeight: 600 }}>Suggestions ({workbenchSuggestions.length}):</div>
                {workbenchSuggestions.map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 6, marginBottom: 6 }}>
                    {editingSuggestionIdx === idx ? (
                      <div style={{ flex: 1 }}>
                        <input value={editingSuggestionForm.title} onChange={e => setEditingSuggestionForm(f => ({ ...f, title: e.target.value }))}
                          style={{ width: '100%', padding: '4px 6px', fontSize: 12, border: '1px solid #d0d0d0', borderRadius: 3, marginBottom: 4, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                        <input value={editingSuggestionForm.description} onChange={e => setEditingSuggestionForm(f => ({ ...f, description: e.target.value }))} placeholder="Description (optional)"
                          style={{ width: '100%', padding: '4px 6px', fontSize: 11, border: '1px solid #d0d0d0', borderRadius: 3, marginBottom: 4, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                        <input list="suggestion-categories" value={editingSuggestionForm.category} onChange={e => setEditingSuggestionForm(f => ({ ...f, category: e.target.value }))} placeholder="Category (optional)"
                          style={{ width: '100%', padding: '4px 6px', fontSize: 11, border: '1px solid #d0d0d0', borderRadius: 3, marginBottom: 4, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                        <datalist id="suggestion-categories">
                          {availableCategories.map(c => <option key={c} value={c} />)}
                        </datalist>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={saveAndAddEditedSuggestion}
                            style={{ padding: '3px 10px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 3, fontSize: 11, cursor: 'pointer' }}>Save & Add</button>
                          <button onClick={() => setEditingSuggestionIdx(null)}
                            style={{ padding: '3px 10px', background: '#eee', color: '#666', border: 'none', borderRadius: 3, fontSize: 11, cursor: 'pointer' }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{s.title}</div>
                          {s.description && <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{s.description}</div>}
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                            {s.category && <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 8, fontSize: 9, fontWeight: 600, background: '#ede7f6', color: '#6a1b9a' }}>{s.category}</span>}
                            {s.confidence != null && <span style={{ fontSize: 10, color: '#999' }}>{Math.round(s.confidence * 100)}% confidence</span>}
                          </div>
                        </div>
                        <button onClick={() => addSuggestionAsPriority(s)} title="Add as priority"
                          style={{ padding: '3px 10px', background: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9', borderRadius: 3, fontSize: 11, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>+ Add</button>
                        <button onClick={() => startEditSuggestion(idx)} title="Edit before adding"
                          style={{ padding: '3px 10px', background: '#fff3e0', color: '#e65100', border: '1px solid #ffe0b2', borderRadius: 3, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>Edit & Add</button>
                        <button onClick={() => setWorkbenchSuggestions(prev => prev.filter((_, i) => i !== idx))} title="Dismiss"
                          style={{ padding: '3px 8px', background: '#fafafa', color: '#999', border: '1px solid #eee', borderRadius: 3, fontSize: 11, cursor: 'pointer' }}>✕</button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Form */}
        {addingPriority && (
          <div style={{ background: '#fafaf8', border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#1a1a1a' }}>{editingPriorityId ? 'Edit Priority' : 'New Priority'}</div>
            <input value={priorityForm.title} onChange={e => setPriorityForm(f => ({ ...f, title: e.target.value }))} placeholder="Priority title…"
              style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #d0d0d0', borderRadius: 5, marginBottom: 10, fontFamily: 'inherit', boxSizing: 'border-box' }} />

            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 2, marginBottom: 4, borderBottom: '1px solid #e0e0e0', paddingBottom: 4 }}>
                {toolbarBtn('bold', 'B')}{toolbarBtn('italic', 'I')}{toolbarBtn('underline', 'U')}{toolbarBtn('strikeThrough', 'S')}
                {toolbarBtn('insertUnorderedList', '• List')}{toolbarBtn('insertOrderedList', '1. List')}
              </div>
              <div ref={priorityEditorRef} contentEditable className="rtf-editor" data-placeholder="Description (optional)…"
                style={{ minHeight: 80, maxHeight: 200, overflowY: 'auto', padding: 8, border: '1px solid #d0d0d0', borderRadius: 5, fontSize: 12, fontFamily: 'inherit', background: '#fff', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: '#666', marginRight: 8 }}>Status:</span>
              {['pending', 'ongoing', 'completed'].map(st => {
                const sc = statusColors[st];
                const active = priorityForm.status === st;
                return <button key={st} onClick={() => setPriorityForm(f => ({ ...f, status: st }))}
                  style={{ padding: '3px 12px', marginRight: 4, borderRadius: 12, fontSize: 11, fontWeight: 600, background: active ? sc.bg : '#f5f5f5', color: active ? sc.color : '#999', border: `1px solid ${active ? sc.color : '#ddd'}`, cursor: 'pointer' }}>{sc.label}</button>;
              })}
            </div>

            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: '#666', marginRight: 8 }}>Category:</span>
              <input list="priority-categories" value={priorityForm.category} onChange={e => setPriorityForm(f => ({ ...f, category: e.target.value }))} placeholder="Select or type category…"
                style={{ padding: '4px 8px', fontSize: 11, border: '1px solid #d0d0d0', borderRadius: 4, fontFamily: 'inherit', minWidth: 160 }} />
              <datalist id="priority-categories">
                {availableCategories.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Links:</div>
              {priorityForm.links.map((l, i) => (
                <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
                  <a href={l} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#1565c0', flex: 1, wordBreak: 'break-all' }}>{l}</a>
                  <button onClick={() => setPriorityForm(f => ({ ...f, links: f.links.filter((_, j) => j !== i) }))}
                    style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', fontSize: 12, padding: '0 4px' }}>✕</button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 4 }}>
                <input value={priorityNewLink} onChange={e => setPriorityNewLink(e.target.value)} placeholder="https://..." onKeyDown={e => { if (e.key === 'Enter' && priorityNewLink.trim()) { setPriorityForm(f => ({ ...f, links: [...f.links, priorityNewLink.trim()] })); setPriorityNewLink(''); } }}
                  style={{ flex: 1, padding: '4px 8px', fontSize: 11, border: '1px solid #d0d0d0', borderRadius: 3, fontFamily: 'inherit' }} />
                <button onClick={() => { if (priorityNewLink.trim()) { setPriorityForm(f => ({ ...f, links: [...f.links, priorityNewLink.trim()] })); setPriorityNewLink(''); } }}
                  style={{ padding: '4px 10px', background: '#f5f5f5', border: '1px solid #d0d0d0', borderRadius: 3, fontSize: 11, cursor: 'pointer' }}>Add</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={editingPriorityId ? saveEditPriority : addPriority}
                style={{ padding: '7px 18px', background: '#8b6914', color: '#fff', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {editingPriorityId ? 'Save Changes' : 'Add Priority'}
              </button>
              <button onClick={() => { setAddingPriority(false); setEditingPriorityId(null); setPriorityForm({ title: '', description: '', status: 'pending', category: '', links: [] }); setPriorityNewLink(''); if (priorityEditorRef.current) priorityEditorRef.current.innerHTML = ''; }}
                style={{ padding: '7px 18px', background: '#f5f5f5', color: '#666', border: '1px solid #d0d0d0', borderRadius: 5, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Priority List */}
        {entries.length === 0 && !addingPriority && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 14 }}>No priorities yet</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Click "+ Add Priority" or use the AI Workbench to get started</div>
          </div>
        )}

        {(() => {
          const renderCard = (entry) => {
            const isDragging = dragPriorityId === entry.id;
            const isDragOver = dragOverPriorityId === entry.id;
            return (
              <div key={entry.id}
                draggable={canDrag}
                onDragStart={canDrag ? (e) => handlePriorityDragStart(e, entry.id) : undefined}
                onDragOver={canDrag ? (e) => handlePriorityDragOver(e, entry.id) : undefined}
                onDrop={canDrag ? (e) => handlePriorityDrop(e, entry.id) : undefined}
                onDragEnd={canDrag ? handlePriorityDragEnd : undefined}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px',
                  background: isDragOver ? '#e3f2fd' : '#fff', border: `1px solid ${isDragOver ? '#90caf9' : '#e0e0e0'}`,
                  borderRadius: 8, marginBottom: 8, opacity: isDragging ? 0.5 : 1,
                  transition: 'all 0.15s', cursor: canDrag ? 'grab' : 'default'
                }}>
                {canDrag && <span style={{ color: '#ccc', fontSize: 16, cursor: 'grab', userSelect: 'none', lineHeight: 1.2 }} title="Drag to reorder">⠿</span>}
                <span style={{ display: 'inline-block', minWidth: 48, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", background: '#f5e6c8', color: '#8b6914', textAlign: 'center' }}>{entry.num}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    {statusPill(entry.status, () => togglePriorityStatus(entry.id))}
                    {entry.category && <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: '#ede7f6', color: '#6a1b9a' }}>{entry.category}</span>}
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{entry.title}</span>
                  </div>
                  {entry.description && entry.description.replace(/<[^>]*>/g, '').trim() && (
                    <div className="comment-html" dangerouslySetInnerHTML={{ __html: entry.description }} style={{ fontSize: 12, color: '#555', marginBottom: 4 }} />
                  )}
                  {(entry.links || []).length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                      {entry.links.map((l, i) => <a key={i} href={l} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#1565c0', wordBreak: 'break-all' }}>{l.length > 60 ? l.slice(0, 57) + '…' : l}</a>)}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>{entry.author} — {new Date(entry.time).toLocaleDateString()}</div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button onClick={() => startEditPriority(entry)} title="Edit" style={{ padding: '3px 8px', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 3, fontSize: 11, cursor: 'pointer', color: '#666' }}>✎</button>
                  <button onClick={() => { if (window.confirm('Delete this priority?')) deletePriority(entry.id); }} title="Delete" style={{ padding: '3px 8px', background: '#fff5f5', border: '1px solid #ffcdd2', borderRadius: 3, fontSize: 11, cursor: 'pointer', color: '#c62828' }}>🗑</button>
                </div>
              </div>
            );
          };

          if (priorityViewMode === 'category') {
            const groups = {};
            entries.forEach(e => {
              const cat = e.category || 'Uncategorized';
              if (!groups[cat]) groups[cat] = [];
              groups[cat].push(e);
            });
            const sortedKeys = Object.keys(groups).sort((a, b) => {
              if (a === 'Uncategorized') return 1;
              if (b === 'Uncategorized') return -1;
              return a.localeCompare(b);
            });
            return sortedKeys.map(cat => (
              <div key={cat} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #e0e0e0' }}>
                  <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: cat === 'Uncategorized' ? '#f5f5f5' : '#ede7f6', color: cat === 'Uncategorized' ? '#999' : '#6a1b9a' }}>{cat}</span>
                  <span style={{ fontSize: 11, color: '#999', background: '#f5f5f5', padding: '1px 8px', borderRadius: 10 }}>{groups[cat].length}</span>
                </div>
                {groups[cat].map(renderCard)}
              </div>
            ));
          }

          return entries.map(renderCard);
        })()}
      </div>
    );
  };

  const renderTestSuiteView = () => {
    const ts = testSummaryData;
    const allPassing = ts.failed === 0;
    const toggleSuite = (idx) => setExpandedSuites(prev => ({ ...prev, [idx]: !prev[idx] }));
    const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return iso; } };
    const fmtDur = (s) => s >= 60 ? `${Math.floor(s / 60)}m ${Math.round(s % 60)}s` : `${s.toFixed(1)}s`;
    const copyCmd = () => { navigator.clipboard?.writeText('npx playwright test'); };
    return (
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ background: allPassing ? '#e8f5e9' : '#fbe9e7', border: `1px solid ${allPassing ? '#a5d6a7' : '#ef9a9a'}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>{allPassing ? '✅' : '❌'}</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: allPassing ? '#2e7d32' : '#c62828' }}>{allPassing ? 'ALL TESTS PASSING' : `${ts.failed} FAILURE${ts.failed !== 1 ? 'S' : ''}`}</span>
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#555', flexWrap: 'wrap' }}>
            <span><strong>{ts.total}</strong> total</span>
            <span style={{ color: '#2e7d32' }}><strong>{ts.passed}</strong> passed</span>
            {ts.failed > 0 && <span style={{ color: '#c62828' }}><strong>{ts.failed}</strong> failed</span>}
            {ts.skipped > 0 && <span style={{ color: '#f57c00' }}><strong>{ts.skipped}</strong> skipped</span>}
            <span>⏱ {fmtDur(ts.duration)}</span>
            <span>📅 {fmtDate(ts.date)}</span>
          </div>
        </div>
        {ts.suites.map((suite, idx) => {
          const expanded = expandedSuites[idx] !== undefined ? expandedSuites[idx] : false;
          const suitePass = suite.failed === 0;
          return (
            <div key={idx} style={{ marginBottom: 8, border: '1px solid #e0e0e0', borderRadius: 6, overflow: 'hidden' }}>
              <button onClick={() => toggleSuite(idx)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: suitePass ? '#f1f8e9' : '#fce4ec', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', textAlign: 'left' }}>
                <span style={{ fontSize: 10, color: '#888', width: 16, textAlign: 'center' }}>{expanded ? '▼' : '▶'}</span>
                <span style={{ fontSize: 14 }}>{suitePass ? '✅' : '❌'}</span>
                <span style={{ flex: 1, fontWeight: 500, color: '#1a1a1a' }}>{suite.name}</span>
                <span style={{ fontSize: 11, color: suitePass ? '#2e7d32' : '#c62828', background: suitePass ? '#c8e6c9' : '#ffcdd2', padding: '2px 8px', borderRadius: 3 }}>{suite.passed}/{suite.passed + suite.failed}</span>
              </button>
              {expanded && (
                <div style={{ borderTop: '1px solid #e0e0e0' }}>
                  {suite.tests.map((t, ti) => (
                    <div key={ti} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px 6px 40px', fontSize: 12, borderBottom: ti < suite.tests.length - 1 ? '1px solid #f0f0f0' : 'none', background: t.status === 'passed' ? '#fff' : '#fff5f5' }}>
                      <span style={{ color: t.status === 'passed' ? '#4caf50' : '#e53935', fontSize: 13 }}>{t.status === 'passed' ? '✓' : '✗'}</span>
                      <span style={{ flex: 1, color: '#333' }}>{t.title}</span>
                      <span style={{ color: '#999', fontSize: 11 }}>{t.duration}s</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#1a1a1a' }}>Run Tests</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <code style={{ flex: 1, padding: '8px 12px', background: '#fff', border: '1px solid #d0d0d0', borderRadius: 4, fontSize: 12, color: '#333', fontFamily: 'monospace' }}>npx playwright test</code>
            <button onClick={copyCmd} style={{ padding: '8px 12px', background: '#fff', border: '1px solid #d0d0d0', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', color: '#555' }}>📋 Copy</button>
          </div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 8 }}>Run from project root. Results will be saved to test-results/results.json</div>
        </div>
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
        @keyframes voicePulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(76,175,80,0.4); } 50% { box-shadow: 0 0 0 8px rgba(76,175,80,0); } }
        @keyframes voicePulseRed { 0%, 100% { box-shadow: 0 0 0 0 rgba(244,67,54,0.4); } 50% { box-shadow: 0 0 0 8px rgba(244,67,54,0); } }
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
            <button className={`sidebar-btn ${showSummary && !showCompetitors && !showEntities && !showOrgChart && !showPriorities && !showTestSuite ? 'active' : ''}`} onClick={() => { setShowCompetitors(false); setShowEntities(false); setShowOrgChart(false); setShowPriorities(false); setShowTestSuite(false); setShowSummary(true); setCameFromEntities(null); }} style={{ borderBottom: '1px solid #e0e0e0', marginBottom: 2 }}>
              <span style={{ flex: 1 }}>💬 Comments Summary</span>
              {totalComments > 0 && <span style={{ fontSize: 10, background: '#e8f0fc', color: '#4a7cc9', padding: '1px 5px', borderRadius: 3 }}>{totalComments}</span>}
            </button>
            <button className={`sidebar-btn ${showCompetitors ? 'active' : ''}`} onClick={() => { setShowSummary(false); setShowEntities(false); setShowOrgChart(false); setShowPriorities(false); setShowTestSuite(false); setShowCompetitors(true); setCameFromEntities(null); }} style={{ borderBottom: '1px solid #e0e0e0', marginBottom: 2 }}>
              <span style={{ flex: 1 }}>🎯 Competitors</span>
              {competitorData.length > 0 && <span style={{ fontSize: 10, background: '#fce4ec', color: '#c62828', padding: '1px 5px', borderRadius: 3 }}>{competitorData.length}</span>}
            </button>
            <button className={`sidebar-btn ${showEntities && !showOrgChart && !showPriorities && !showTestSuite ? 'active' : ''}`} onClick={() => { setShowSummary(false); setShowCompetitors(false); setShowOrgChart(false); setShowPriorities(false); setShowTestSuite(false); setShowEntities(true); setCameFromEntities(null); }} style={{ borderBottom: '1px solid #e0e0e0', marginBottom: 2 }}>
              <span style={{ flex: 1 }}>🗃️ Entities</span>
              <span style={{ fontSize: 10, background: '#e8eaf6', color: '#3949ab', padding: '1px 5px', borderRadius: 3 }}>{ENTITIES.length}</span>
            </button>
            <button className={`sidebar-btn ${showOrgChart ? 'active' : ''}`} onClick={() => { setShowSummary(false); setShowCompetitors(false); setShowEntities(false); setShowPriorities(false); setShowTestSuite(false); setShowOrgChart(true); setCameFromEntities(null); setEditingPerson(null); }} style={{ borderBottom: '1px solid #e0e0e0', marginBottom: 2 }}>
              <span style={{ flex: 1 }}>🏢 Org Chart</span>
              {orgNodes.length > 0 && <span style={{ fontSize: 10, background: '#e8f5e9', color: '#2e7d32', padding: '1px 5px', borderRadius: 3 }}>{orgNodes.length}</span>}
            </button>
            <button className={`sidebar-btn ${showPriorities ? 'active' : ''}`} onClick={() => { setShowSummary(false); setShowCompetitors(false); setShowEntities(false); setShowOrgChart(false); setShowTestSuite(false); setShowPriorities(true); setCameFromEntities(null); }} style={{ borderBottom: '1px solid #e0e0e0', marginBottom: 2 }}>
              <span style={{ flex: 1 }}>📋 Priorities</span>
              {prioritiesData.length > 0 && <span style={{ fontSize: 10, background: '#fff3e0', color: '#e65100', padding: '1px 5px', borderRadius: 3 }}>{prioritiesData.length}</span>}
            </button>
            <button className={`sidebar-btn ${showTestSuite ? 'active' : ''}`} onClick={() => { setShowSummary(false); setShowCompetitors(false); setShowEntities(false); setShowOrgChart(false); setShowPriorities(false); setShowTestSuite(true); setCameFromEntities(null); }} style={{ borderBottom: '1px solid #e0e0e0', marginBottom: 2 }}>
              <span style={{ flex: 1 }}>🧪 Test Suite</span>
              <span style={{ fontSize: 10, background: testSummaryData.failed === 0 ? '#e8f5e9' : '#fce4ec', color: testSummaryData.failed === 0 ? '#2e7d32' : '#c62828', padding: '1px 5px', borderRadius: 3 }}>{testSummaryData.failed === 0 ? `${testSummaryData.passed} ✓` : `${testSummaryData.failed} ✗`}</span>
            </button>
            {filteredSections.map(([s, realIdx]) => {
              const cmtCount = sectionCommentCount(realIdx);
              return (
                <button key={s[0]} className={`sidebar-btn ${realIdx === activeSection && !showSummary && !showCompetitors && !showEntities && !showOrgChart && !showPriorities && !showTestSuite ? 'active' : ''}`} onClick={() => { setShowSummary(false); setShowCompetitors(false); setShowEntities(false); setShowOrgChart(false); setShowPriorities(false); setShowTestSuite(false); setCameFromEntities(null); setActiveSection(realIdx); }}>
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
            <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 18, color: '#1a1a1a' }}>{showTestSuite ? '🧪 Test Suite' : showPriorities ? '📋 Priorities' : showOrgChart ? '🏢 Org Chart' : showEntities ? '🗃️ Data Model Entities' : showCompetitors ? '🎯 Competitors Intel' : showSummary ? 'Comments Summary' : section[1]}</span>
            <span style={{ fontSize: 11, color: '#999', marginLeft: 10 }}>{showTestSuite ? 'Playwright test results' : showPriorities ? (priorityViewMode === 'category' ? 'Grouped by category' : 'Ranked priority list') : showOrgChart ? 'Relationship mapping' : showEntities ? '48 entities (v3.1)' : showCompetitors ? 'All competitors' : showSummary ? 'All sections' : `${section[0]}.md`}</span>
          </div>
          <button onClick={() => { if (!voicePanelOpen) setVoicePanelOpen(true); toggleAlwaysOn(); }} title={voiceAlwaysOn ? 'Voice Agent (ON) — click to disable' : 'Voice Agent — click to enable'} style={{
            background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: '4px 8px', borderRadius: 8, position: 'relative',
            animation: voiceAlwaysOn ? 'voicePulse 2s infinite' : voiceListening ? 'voicePulseRed 1s infinite' : 'none',
            outline: voiceAlwaysOn ? '2px solid #4caf50' : voicePanelOpen ? '2px solid #8b6914' : 'none',
          }}>🎤{voiceFlashExec && <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: '#4caf50' }} />}</button>
          {showTestSuite && <span style={{ fontSize: 11, color: '#999' }}>{testSummaryData.total} tests</span>}
          {showPriorities && <span style={{ fontSize: 11, color: '#999' }}>{prioritiesData.length} priorities</span>}
          {showOrgChart && <span style={{ fontSize: 11, color: '#999' }}>{orgNodes.length} people</span>}
          {showEntities && !showOrgChart && !showPriorities && !showTestSuite && <span style={{ fontSize: 11, color: '#999' }}>{ENTITIES.length} entities</span>}
          {showCompetitors && <span style={{ fontSize: 11, color: '#999' }}>{competitorData.length} entries</span>}
          {!showSummary && !showCompetitors && !showEntities && !showOrgChart && !showPriorities && !showTestSuite && <span style={{ fontSize: 11, color: '#999' }}>{section[3].length} items</span>}
          {!showSummary && !showCompetitors && !showEntities && !showOrgChart && !showPriorities && !showTestSuite && section[2] > 0 && showChanges && <span className="badge-v31">{section[2]} v3.1</span>}
        </div>
        <div ref={contentRef} style={{ flex: 1, overflowY: showOrgChart ? 'hidden' : 'auto', padding: showOrgChart ? 0 : '16px 24px 80px' }}>
          {showTestSuite ? (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>{renderTestSuiteView()}</div>
          ) : showPriorities ? (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>{renderPrioritiesView()}</div>
          ) : showOrgChart ? (
            <div style={{ height: '100%' }}>{renderOrgChartView()}</div>
          ) : showEntities ? (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>{renderEntitiesView()}</div>
          ) : showCompetitors ? (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>{renderCompetitorsView()}</div>
          ) : showSummary ? (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>{renderSummaryView()}</div>
          ) : (
            <div style={{ maxWidth: 800, margin: '0 auto', animation: 'fadeIn 0.2s ease' }}>
              {cameFromEntities && (
                <button onClick={() => {
                  setShowEntities(true); setShowSummary(false); setShowCompetitors(false); setShowOrgChart(false); setShowPriorities(false); setShowTestSuite(false);
                  if (Array.isArray(cameFromEntities)) setSelectedEntity(cameFromEntities);
                  setCameFromEntities(null);
                  setTimeout(() => contentRef.current?.scrollTo(0, 0), 50);
                }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', marginBottom: 16, background: '#e8eaf6', border: '1px solid #c5cae9', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#3949ab', fontFamily: 'inherit', fontWeight: 500 }}>
                  ← Back to Entities
                </button>
              )}
              {section[3].map(item => renderItem(item))}
            </div>
          )}
        </div>
        <div style={{ padding: '8px 20px', borderTop: '1px solid #e0e0e0', background: '#f8f8f6', display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, color: '#888' }}>
          {showTestSuite ? (
            <>
              <span style={{ color: testSummaryData.failed === 0 ? '#2e7d32' : '#c62828' }}>🧪 {testSummaryData.total} tests</span>
              <span>•</span>
              <span style={{ color: '#2e7d32' }}>{testSummaryData.passed} passed</span>
              {testSummaryData.failed > 0 && <><span>•</span><span style={{ color: '#c62828' }}>{testSummaryData.failed} failed</span></>}
              <span>•</span>
              <span>{testSummaryData.suites.length} suites</span>
              <span>•</span>
              <span>Playwright v1.58</span>
            </>
          ) : showPriorities ? (
            <>
              <span style={{ color: '#e65100' }}>📋 {prioritiesData.length} priorities</span>
              <span>•</span>
              <span>{prioritiesData.filter(e => e.status === 'completed').length} completed</span>
              <span>•</span>
              <span style={{ color: '#1565c0' }}>{prioritiesData.filter(e => e.status === 'ongoing').length} ongoing</span>
              <span>•</span>
              <span style={{ color: '#e65100' }}>{prioritiesData.filter(e => e.status === 'pending').length} pending</span>
              {saving && <span style={{ color: '#4caf50' }}>● Saving…</span>}
            </>
          ) : showOrgChart ? (
            <>
              <span style={{ color: '#2e7d32' }}>🏢 {orgNodes.length} people</span>
              <span>•</span>
              <span>{orgEdges.length} connections</span>
              <span>•</span>
              <span>{orgDepartments.length} departments</span>
              <span>•</span>
              <span>Drag handles to connect • Click to edit</span>
              {saving && <span style={{ color: '#4caf50' }}>● Saving…</span>}
            </>
          ) : showEntities ? (
            <>
              <span style={{ color: '#3949ab' }}>🗃️ {ENTITIES.length} entities</span>
              <span>•</span>
              <span>{ENTITIES.filter(e => e[3] === '2.0').length} core + {ENTITIES.filter(e => e[3] === '3.0').length} v3.0 + {ENTITIES.filter(e => e[3] === '3.1').length} v3.1</span>
              <span>•</span>
              <span>Click any entity to jump to its spec definition</span>
              {saving && <span style={{ color: '#4caf50' }}>● Saving…</span>}
            </>
          ) : showCompetitors ? (
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

      {mediaModal && (() => {
        const { items, index } = mediaModal;
        const item = items[index];
        const hasPrev = index > 0;
        const hasNext = index < items.length - 1;
        const startDrag = (type) => (e) => {
          e.preventDefault(); e.stopPropagation();
          const el = e.target.closest('[data-modal-window]');
          const rect = el ? el.getBoundingClientRect() : { left: modalRect.x, top: modalRect.y, width: modalRect.w || 700, height: modalRect.h || 500 };
          dragRef.current = { startX: e.clientX, startY: e.clientY, startRectX: modalRect.x, startRectY: modalRect.y, startW: rect.width, startH: rect.height, type };
          document.body.style.cursor = type === 'move' ? 'grabbing' : type.replace('resize-', '') + '-resize';
          document.body.style.userSelect = 'none';
        };
        const edgeW = 6;
        const resizeHandle = (pos) => {
          const cursorMap = { top: 'n-resize', bottom: 's-resize', left: 'w-resize', right: 'e-resize', 'top-left': 'nw-resize', 'top-right': 'ne-resize', 'bottom-left': 'sw-resize', 'bottom-right': 'se-resize' };
          const styles = { position: 'absolute', zIndex: 2 };
          if (pos === 'top') Object.assign(styles, { top: -edgeW/2, left: edgeW, right: edgeW, height: edgeW, cursor: cursorMap[pos] });
          else if (pos === 'bottom') Object.assign(styles, { bottom: -edgeW/2, left: edgeW, right: edgeW, height: edgeW, cursor: cursorMap[pos] });
          else if (pos === 'left') Object.assign(styles, { left: -edgeW/2, top: edgeW, bottom: edgeW, width: edgeW, cursor: cursorMap[pos] });
          else if (pos === 'right') Object.assign(styles, { right: -edgeW/2, top: edgeW, bottom: edgeW, width: edgeW, cursor: cursorMap[pos] });
          else if (pos === 'top-left') Object.assign(styles, { top: -edgeW/2, left: -edgeW/2, width: edgeW*2, height: edgeW*2, cursor: cursorMap[pos] });
          else if (pos === 'top-right') Object.assign(styles, { top: -edgeW/2, right: -edgeW/2, width: edgeW*2, height: edgeW*2, cursor: cursorMap[pos] });
          else if (pos === 'bottom-left') Object.assign(styles, { bottom: -edgeW/2, left: -edgeW/2, width: edgeW*2, height: edgeW*2, cursor: cursorMap[pos] });
          else if (pos === 'bottom-right') Object.assign(styles, { bottom: -edgeW/2, right: -edgeW/2, width: edgeW*2, height: edgeW*2, cursor: cursorMap[pos] });
          return <div key={pos} onMouseDown={startDrag('resize-' + pos)} style={styles} />;
        };
        return (
          <>
            <div onClick={() => setMediaModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1001 }} />
            <div data-modal-window="" onKeyDown={e => {
              if (e.key === 'ArrowLeft' && hasPrev) { e.stopPropagation(); setMediaModal(m => ({ ...m, index: m.index - 1 })); }
              if (e.key === 'ArrowRight' && hasNext) { e.stopPropagation(); setMediaModal(m => ({ ...m, index: m.index + 1 })); }
              if (e.key === 'Escape') setMediaModal(null);
            }} tabIndex={0} ref={el => el?.focus()}
              style={{ position: 'fixed', left: modalRect.x, top: modalRect.y, width: modalRect.w || 'calc(100vw - 160px)', height: modalRect.h || 'calc(100vh - 80px)', maxWidth: 'calc(100vw - 40px)', maxHeight: 'calc(100vh - 20px)', zIndex: 1002, background: '#1a1a1a', borderRadius: 10, boxShadow: '0 12px 48px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', outline: 'none', overflow: 'hidden' }}>
              {['top','bottom','left','right','top-left','top-right','bottom-left','bottom-right'].map(resizeHandle)}
              <div onMouseDown={startDrag('move')}
                style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: '#222', borderRadius: '10px 10px 0 0', cursor: 'grab', gap: 8, flexShrink: 0, userSelect: 'none' }}>
                <button onClick={() => hasPrev && setMediaModal(m => ({ ...m, index: m.index - 1 }))} disabled={!hasPrev}
                  style={{ background: 'none', border: 'none', color: hasPrev ? '#fff' : '#555', fontSize: 16, cursor: hasPrev ? 'pointer' : 'default', padding: '0 4px' }}>‹</button>
                <button onClick={() => hasNext && setMediaModal(m => ({ ...m, index: m.index + 1 }))} disabled={!hasNext}
                  style={{ background: 'none', border: 'none', color: hasNext ? '#fff' : '#555', fontSize: 16, cursor: hasNext ? 'pointer' : 'default', padding: '0 4px' }}>›</button>
                <span style={{ color: '#aaa', fontSize: 11 }}>{index + 1} / {items.length}</span>
                <span style={{ flex: 1, color: '#ddd', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>{item.name}</span>
                {item.type === 'file' && <a href={item.src} download={item.name} onClick={e => e.stopPropagation()} style={{ color: '#8b6914', fontSize: 11, textDecoration: 'none', padding: '2px 8px', background: 'rgba(139,105,20,0.2)', borderRadius: 4 }}>Download</a>}
                <button onClick={() => setMediaModal(null)} style={{ background: 'none', border: 'none', color: '#999', fontSize: 16, cursor: 'pointer', padding: '0 4px', marginLeft: 4 }}>✕</button>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: 8 }}>
                {item.type === 'image' && <img src={item.src} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 4 }} />}
                {item.type === 'video' && <video controls autoPlay src={item.src} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 4 }} />}
                {item.type === 'file' && (
                  item.src && item.src.startsWith('data:application/pdf') ? (
                    <iframe src={item.src} style={{ width: '100%', height: '100%', border: 'none', borderRadius: 4, background: '#fff' }} />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#aaa' }}>
                      <div style={{ fontSize: 64, marginBottom: 16 }}>📄</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#ddd', marginBottom: 8 }}>{item.name}</div>
                      <a href={item.src} download={item.name} style={{ display: 'inline-block', marginTop: 8, padding: '10px 24px', background: '#8b6914', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Download File</a>
                    </div>
                  )
                )}
              </div>
            </div>
          </>
        );
      })()}

      {/* Voice Agent Panel */}
      {voicePanelOpen && (
        <div style={{
          position: 'fixed', bottom: 16, right: 16, width: 360, maxHeight: '80vh',
          background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          border: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', zIndex: 9999,
          fontFamily: 'inherit', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 8, background: '#f8f8f6' }}>
            <span style={{ fontSize: 18 }}>🎤</span>
            <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 16 }}>Voice Agent</span>
            <span style={{ fontSize: 10, color: '#8b6914', background: '#f5e6c8', padding: '2px 6px', borderRadius: 3, flex: 1 }}>{Object.values(VOICE_CMD_EXAMPLES).reduce((s, a) => s + a.length, 0) + voiceLearnedCommands.length}+ commands</span>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: voiceAlwaysOn ? '#4caf50' : voiceListening ? '#f44336' : '#999',
              animation: (voiceAlwaysOn || voiceListening) ? 'pulse 1.5s infinite' : 'none',
            }} />
            <button onClick={() => setVoicePanelOpen(false)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
            {/* Always-on status bar */}
            <div style={{
              padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 11, display: 'flex', alignItems: 'center', gap: 6,
              background: voiceAlwaysOn ? '#e8f5e9' : '#f5f5f5', color: voiceAlwaysOn ? '#2e7d32' : '#888',
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: voiceAlwaysOn ? '#4caf50' : '#ccc',
                animation: voiceAlwaysOn ? 'pulse 1.5s infinite' : 'none',
              }} />
              {voiceAlwaysOn
                ? <span>Listening — say command + <strong>"now"</strong> to execute</span>
                : <span>Inactive — click 🎤 in header to start</span>
              }
            </div>

            {/* Interim transcript */}
            {voiceInterimText && (
              <div style={{ padding: '8px 12px', background: '#fafafa', borderRadius: 6, marginBottom: 8, fontSize: 12, color: '#999', fontStyle: 'italic' }}>
                {voiceInterimText}
              </div>
            )}

            {/* Final transcript */}
            {voiceFinalText && (
              <div style={{ padding: '8px 12px', background: '#f5f0e8', borderRadius: 6, marginBottom: 8, fontSize: 12, color: '#1a1a1a' }}>
                <span style={{ fontSize: 10, color: '#8b6914', fontWeight: 600, marginRight: 6 }}>HEARD:</span>{voiceFinalText}
              </div>
            )}

            {/* Status message */}
            {voiceStatus.msg && (
              <div style={{
                padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 12,
                background: voiceStatus.type === 'success' ? '#e8f5e9' : voiceStatus.type === 'error' ? '#fce4ec' : voiceStatus.type === 'data' ? '#e3f2fd' : '#f5f5f5',
                color: voiceStatus.type === 'success' ? '#2e7d32' : voiceStatus.type === 'error' ? '#c62828' : voiceStatus.type === 'data' ? '#1565c0' : '#666',
              }}>
                {voiceStatus.msg}
              </div>
            )}

            {/* Command log with filter tabs */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 }}>
                  Log ({voiceCommandLog.length})
                </div>
                {['all', 'success', 'error'].map(f => (
                  <button key={f} onClick={() => setVoiceLogFilter(f)} style={{
                    padding: '2px 8px', fontSize: 10, borderRadius: 3, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    background: voiceLogFilter === f ? (f === 'error' ? '#fce4ec' : f === 'success' ? '#e8f5e9' : '#e8eaf6') : '#f5f5f5',
                    color: voiceLogFilter === f ? (f === 'error' ? '#c62828' : f === 'success' ? '#2e7d32' : '#3949ab') : '#999',
                    fontWeight: voiceLogFilter === f ? 600 : 400,
                  }}>{f}</button>
                ))}
                {voiceCommandLog.length > 0 && (
                  <button onClick={() => { setVoiceCommandLog([]); try { localStorage.removeItem("coryphaeus-voice-log"); } catch {} }} style={{
                    padding: '2px 8px', fontSize: 10, borderRadius: 3, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    background: '#f5f5f5', color: '#999',
                  }}>clear</button>
                )}
              </div>

              {(() => {
                const filtered = voiceLogFilter === 'all' ? voiceCommandLog : voiceCommandLog.filter(l => l.status === voiceLogFilter);
                if (filtered.length === 0) return <div style={{ fontSize: 11, color: '#ccc', textAlign: 'center', padding: 12 }}>{voiceCommandLog.length === 0 ? 'No commands yet' : `No ${voiceLogFilter} commands`}</div>;
                return filtered.slice(0, 20).map((log, i) => (
                  <div key={log.id || i} onClick={() => processVoiceCommand(log.text)} style={{
                    padding: '8px 10px', borderRadius: 4, marginBottom: 4, cursor: 'pointer',
                    background: '#fafafa', border: '1px solid #f0f0f0', transition: 'background 0.1s',
                  }} onMouseOver={e => e.currentTarget.style.background = '#f5f0e8'} onMouseOut={e => e.currentTarget.style.background = '#fafafa'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                        background: log.status === 'success' ? '#4caf50' : log.status === 'error' ? '#f44336' : '#ff9800',
                      }} />
                      <span style={{ fontSize: 12, color: '#1a1a1a', flex: 1 }}>"{log.text}"</span>
                      <span style={{ fontSize: 9, color: '#ccc', flexShrink: 0 }}>{new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {log.response && <div style={{ fontSize: 11, color: '#4a7cc9', marginLeft: 12 }}>{log.response}</div>}
                    <div style={{ display: 'flex', gap: 6, marginTop: 3, marginLeft: 12 }}>
                      {log.patternId && <span style={{ fontSize: 9, color: '#8b6914', background: '#f5e6c8', padding: '0 5px', borderRadius: 2 }}>{log.patternId}</span>}
                      {log.confidence != null && <span style={{ fontSize: 9, color: log.confidence < 70 ? '#e65100' : '#999', background: log.confidence < 70 ? '#fff3e0' : '#f5f5f5', padding: '0 5px', borderRadius: 2 }}>{log.confidence}%</span>}
                      {log.depth > 0 && log.groupId && <span style={{ fontSize: 9, color: '#7b1fa2', background: '#f3e5f5', padding: '0 5px', borderRadius: 2 }}>sub-step</span>}
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Command categories */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Command Categories</div>
              {Object.entries(VOICE_CMD_EXAMPLES).map(([cat, examples]) => (
                <div key={cat} style={{ marginBottom: 4 }}>
                  <button onClick={() => setVoiceExpandedCategory(voiceExpandedCategory === cat ? null : cat)} style={{
                    width: '100%', padding: '6px 10px', background: voiceExpandedCategory === cat ? '#f5f0e8' : '#fafafa',
                    border: '1px solid #e0e0e0', borderRadius: 4, cursor: 'pointer', fontSize: 12, color: '#333',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'inherit',
                  }}>
                    <span>{voiceExpandedCategory === cat ? '▼' : '▸'} {cat}</span>
                    <span style={{ fontSize: 10, color: '#8b6914', background: '#f5e6c8', padding: '1px 6px', borderRadius: 3 }}>{examples.length}</span>
                  </button>
                  {voiceExpandedCategory === cat && (
                    <div style={{ padding: '6px 10px', background: '#fafafa', borderRadius: '0 0 4px 4px', borderTop: 'none' }}>
                      {examples.map((ex, i) => (
                        <div key={i} onClick={() => processVoiceCommand(ex)} style={{
                          padding: '4px 8px', fontSize: 11, color: '#4a7cc9', cursor: 'pointer', borderRadius: 3,
                        }} onMouseOver={e => e.currentTarget.style.background = '#e8f0fc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                          "{ex}"
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {/* Teach a new command */}
              <button onClick={() => {
                const trigger = prompt('Trigger phrase (e.g. "morning"):');
                if (!trigger) return;
                const steps = prompt('Steps separated by "then" (e.g. "open priorities then open summary"):');
                if (!steps) return;
                processVoiceCommand(`learn when I say ${trigger}, ${steps}`);
              }} style={{
                width: '100%', padding: '8px 10px', marginTop: 8, background: '#fff', border: '1px dashed #d0d0d0',
                borderRadius: 4, cursor: 'pointer', fontSize: 12, color: '#666', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }} onMouseOver={e => e.currentTarget.style.background = '#f5f0e8'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
                🎓 Teach a new command
              </button>
            </div>

            {/* Learned commands */}
            {voiceLearnedCommands.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Learned Commands</div>
                {[...voiceLearnedCommands].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)).map((cmd, i) => (
                  <div key={i} onClick={() => processVoiceCommand(cmd.trigger)} style={{
                    padding: '6px 10px', background: '#fafafa', border: '1px solid #e0e0e0', borderRadius: 4,
                    marginBottom: 4, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8,
                  }} onMouseOver={e => e.currentTarget.style.background = '#f5f0e8'} onMouseOut={e => e.currentTarget.style.background = '#fafafa'}>
                    <span style={{ flex: 1, color: '#1a1a1a' }}>"{cmd.trigger}"</span>
                    <span style={{ fontSize: 10, color: '#999' }}>{cmd.steps.length} steps</span>
                    {cmd.usageCount > 0 && <span style={{ fontSize: 10, color: '#8b6914', background: '#f5e6c8', padding: '1px 5px', borderRadius: 3 }}>x{cmd.usageCount}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom controls */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid #e0e0e0', background: '#f8f8f6', display: 'flex', gap: 8 }}>
            <button onClick={toggleAlwaysOn} style={{
              flex: 1, padding: '10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: voiceAlwaysOn ? '#4caf50' : '#e0e0e0', color: voiceAlwaysOn ? '#fff' : '#666',
              fontFamily: 'inherit', transition: 'all 0.2s',
            }}>
              {voiceAlwaysOn ? '🟢 Listening — Tap to Stop' : '🎤 Start Listening'}
            </button>
            <button onClick={() => setVoicePanelOpen(false)} style={{
              padding: '10px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
              background: '#f0f0f0', color: '#999', fontFamily: 'inherit',
            }}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
