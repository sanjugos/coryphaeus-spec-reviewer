import { getPool } from "./database";

// Seeded random matching the CRM app's data generation
let seed = 42;
function seededRandom() {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
}
function randomFrom<T>(arr: T[]): T { return arr[Math.floor(seededRandom() * arr.length)]; }
function randomInt(min: number, max: number) { return Math.floor(seededRandom() * (max - min + 1)) + min; }

const ACCOUNTS = [
  'GovTech Singapore', 'Central Provident Fund Board', 'Housing Development Board', 'Inland Revenue Authority of Singapore',
  'Ministry of Health', 'Land Transport Authority', 'Monetary Authority of Singapore', 'IMDA Singapore',
  'National Environment Agency', 'PUB Singapore', 'JTC Corporation', 'Singapore Land Authority',
  'Enterprise Singapore', 'Ministry of Defence', 'Ministry of Education', 'Ministry of Manpower',
  'Immigration & Checkpoints Authority', 'Urban Redevelopment Authority', 'Health Sciences Authority', 'Cyber Security Agency',
  'DBS Bank', 'OCBC Bank', 'United Overseas Bank', 'Standard Chartered Singapore', 'HSBC Singapore',
  'Great Eastern Life', 'Prudential Singapore', 'AIA Singapore', 'Manulife Singapore', 'Citibank Singapore',
  'Singtel', 'StarHub', 'M1 Limited',
  'SingHealth', 'National Healthcare Group', 'NUHS', 'Parkway Pantai', 'Raffles Medical Group',
  'SBS Transit', 'SMRT Corporation', 'Changi Airport Group', 'PSA International',
  'CapitaLand Group', 'Keppel Corporation', 'Mapletree Investments', 'Sembcorp Industries',
  'ST Engineering', 'Singapore Airlines', 'ComfortDelGro', 'Grab Holdings',
  'Axiata Group', 'Petronas', 'Telkom Indonesia', 'Sea Group', 'Lazada Group',
  'Bangkok Bank', 'Bank Mandiri', 'BDO Unibank', 'Ayala Corporation', 'FPT Corporation',
  'Telstra', 'Commonwealth Bank Australia', 'Westpac Banking', 'ANZ Bank',
  'Woolworths Group', 'BHP Group', 'Spark New Zealand', 'Air New Zealand',
];

const INDUSTRIES = ['Government', 'Financial Services', 'Telecommunications', 'Healthcare', 'Transport & Logistics', 'Real Estate', 'Technology', 'Energy & Utilities', 'Defence', 'Education', 'Retail', 'Manufacturing'];
const COUNTRIES = ['Singapore', 'Singapore', 'Singapore', 'Malaysia', 'Indonesia', 'Thailand', 'Philippines', 'Vietnam', 'Australia', 'New Zealand'];
const CITIES: Record<string, string[]> = {
  Singapore: ['Singapore'], Malaysia: ['Kuala Lumpur', 'Penang'], Indonesia: ['Jakarta', 'Surabaya'],
  Thailand: ['Bangkok'], Philippines: ['Manila', 'Makati'], Vietnam: ['Ho Chi Minh City', 'Hanoi'],
  Australia: ['Sydney', 'Melbourne', 'Brisbane'], 'New Zealand': ['Auckland', 'Wellington'],
};

const OWNERS = [
  'David Lim', 'Priya Krishnan', 'James Mitchell', 'Rachel Tan', 'Ahmad Razak',
  'Sanjay Pillai', 'Sarah Thompson', 'Wei Lin Ng', 'Michelle Santos', 'Rajesh Nair',
  'Kenneth Goh', 'Lisa Chen', 'Nurul Hafizah', 'Michael Roberts', 'Arun Kumar',
];

const FIRST_NAMES = ['Wei Ming', 'Mei Ling', 'Priya', 'Rajesh', 'James', 'Sarah', 'Ahmad', 'Nurul', 'Maria', 'Jose', 'Budi', 'Dewi', 'Somchai', 'Nattaya', 'Thanh', 'Minh', 'Jun Wei', 'Shu Ting', 'Deepa', 'Arun', 'David', 'Emma', 'Hafiz', 'Aisyah', 'Patricia', 'Miguel'];
const LAST_NAMES = ['Tan', 'Lim', 'Ng', 'Wong', 'Chen', 'Krishnan', 'Nair', 'Sharma', 'Mitchell', 'Thompson', 'Razak', 'Ibrahim', 'Santos', 'Reyes', 'Santoso', 'Wijaya', 'Chaisuwan', 'Nguyen', 'Tran', 'Goh', 'Lee', 'Patel', 'Kumar', 'Roberts'];
const TITLES = ['CEO', 'CTO', 'CIO', 'CFO', 'VP Engineering', 'VP Operations', 'Director IT', 'Director Digital', 'Head of Procurement', 'Head of Technology', 'IT Manager', 'Program Director', 'Chief Digital Officer', 'SVP Infrastructure', 'Managing Director'];
const DEPARTMENTS = ['Executive', 'Technology', 'Operations', 'Finance', 'Digital', 'Procurement', 'Engineering', 'Infrastructure'];
const ROLES = ['decision_maker', 'influencer', 'champion', 'end_user', 'blocker'];
const SENTIMENTS = ['positive', 'positive', 'positive', 'neutral', 'neutral', 'negative'];

const STAGES = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
const STAGE_PROB: Record<string, number> = { Prospecting: 10, Qualification: 25, Proposal: 50, Negotiation: 75, 'Closed Won': 100, 'Closed Lost': 0 };

const PRODUCTS = [
  'Digital Government Platform', 'Cloud Migration Services', 'Cybersecurity Operations Centre',
  'Application Modernisation', 'Data & Analytics Platform', 'Infrastructure Managed Services',
  'AI & Machine Learning Solutions', 'Enterprise Resource Planning', 'IT Service Management',
  'Identity & Access Management', 'DevSecOps Platform', 'Healthcare IT Systems',
  'Financial Crime Analytics', 'Contact Centre as a Service', 'SAP Implementation Services',
];

const COMPETITORS = [
  { name: 'Accenture', strength: 'Global brand, massive talent pool', weakness: 'Expensive, less local expertise' },
  { name: 'TCS', strength: 'Cost-competitive, large delivery centres', weakness: 'Less local SG presence' },
  { name: 'Infosys', strength: 'Strong automation, competitive pricing', weakness: 'Government credibility gap in ASEAN' },
  { name: 'IBM Consulting', strength: 'Enterprise AI, hybrid cloud', weakness: 'Premium pricing' },
  { name: 'Deloitte Digital', strength: 'Strategy + implementation, C-suite access', weakness: 'Very expensive' },
  { name: 'Capgemini', strength: 'European enterprise, Salesforce/SAP', weakness: 'Smaller ASEAN presence' },
  { name: 'DXC Technology', strength: 'Infrastructure managed services', weakness: 'Talent retention issues' },
  { name: 'Wipro', strength: 'Cloud transformation, cybersecurity', weakness: 'Limited SE Asia footprint' },
];

const ACTIVITY_TYPES = ['Call', 'Email', 'Meeting', 'Task', 'Note'];
const ACTIVITY_SUBJECTS = [
  'Quarterly Business Review', 'Technical deep-dive session', 'Contract renewal discussion',
  'Follow-up on proposal', 'Demo of new platform capabilities', 'Budget alignment call',
  'Security assessment review', 'Stakeholder introduction meeting', 'RFP response preparation',
  'Pricing negotiation', 'Sent architecture overview', 'Implementation planning session',
  'Executive briefing', 'Competitive positioning update', 'Compliance review meeting',
  'Partnership discussion', 'Digital transformation roadmap', 'Cloud readiness assessment',
  'Project status update', 'Vendor evaluation meeting',
];

function daysAgo(d: number): string {
  const date = new Date('2026-02-19');
  date.setDate(date.getDate() - d);
  return date.toISOString();
}

function futureDays(d: number): string {
  const date = new Date('2026-02-19');
  date.setDate(date.getDate() + d);
  return date.toISOString().split('T')[0];
}

export async function seedDatabase(): Promise<void> {
  const db = getPool();
  console.log("[DB] Seeding CRM data...");

  // Seed accounts
  for (let i = 0; i < ACCOUNTS.length; i++) {
    const name = ACCOUNTS[i];
    const country = randomFrom(COUNTRIES);
    const cityList = CITIES[country] || ['Singapore'];
    await db.query(
      `INSERT INTO accounts (id, name, industry, type, city, country, annual_revenue, currency, employees, owner, health_score, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO NOTHING`,
      [
        `acc-${String(i + 1).padStart(3, '0')}`,
        name,
        randomFrom(INDUSTRIES),
        i < 20 ? 'Customer' : randomFrom(['Customer', 'Customer', 'Prospect', 'Partner']),
        randomFrom(cityList),
        country,
        randomInt(50, 5000) * 1000000,
        i < 33 ? 'SGD' : randomFrom(['SGD', 'USD', 'AUD', 'MYR']),
        randomInt(500, 50000),
        randomFrom(OWNERS),
        randomInt(45, 98),
        daysAgo(randomInt(30, 400)),
      ]
    );
  }

  // Seed contacts (3-5 per account for first 30 accounts, 1-2 for rest)
  let contactIdx = 0;
  for (let i = 0; i < ACCOUNTS.length; i++) {
    const contactCount = i < 30 ? randomInt(3, 5) : randomInt(1, 2);
    for (let j = 0; j < contactCount; j++) {
      contactIdx++;
      const firstName = randomFrom(FIRST_NAMES);
      const lastName = randomFrom(LAST_NAMES);
      await db.query(
        `INSERT INTO contacts (id, full_name, email, phone, account_id, account_name, title, department, lifecycle_stage, role, sentiment, owner, last_contacted, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO NOTHING`,
        [
          `con-${String(contactIdx).padStart(3, '0')}`,
          `${firstName} ${lastName}`,
          `${firstName.toLowerCase().replace(/ /g, '.')}.${lastName.toLowerCase()}@${ACCOUNTS[i].toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          `+65-${randomInt(8000, 9999)}-${randomInt(1000, 9999)}`,
          `acc-${String(i + 1).padStart(3, '0')}`,
          ACCOUNTS[i],
          randomFrom(TITLES),
          randomFrom(DEPARTMENTS),
          randomFrom(['Customer', 'Customer', 'Customer', 'SQL', 'MQL']),
          randomFrom(ROLES),
          randomFrom(SENTIMENTS),
          randomFrom(OWNERS),
          daysAgo(randomInt(0, 30)),
          daysAgo(randomInt(30, 300)),
        ]
      );
    }
  }

  // Seed opportunities (1-3 per account for first 40 accounts)
  let oppIdx = 0;
  for (let i = 0; i < 40; i++) {
    const oppCount = randomInt(1, 3);
    for (let j = 0; j < oppCount; j++) {
      oppIdx++;
      const stage = randomFrom(STAGES);
      const prods = Array.from({ length: randomInt(1, 3) }, () => randomFrom(PRODUCTS));
      await db.query(
        `INSERT INTO opportunities (id, name, account_id, account_name, amount, currency, stage, probability, close_date, type, owner, products, competitor, next_step, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         ON CONFLICT (id) DO NOTHING`,
        [
          `opp-${String(oppIdx).padStart(3, '0')}`,
          `${ACCOUNTS[i]} - ${randomFrom(PRODUCTS)}`,
          `acc-${String(i + 1).padStart(3, '0')}`,
          ACCOUNTS[i],
          randomInt(100, 5000) * 1000,
          i < 20 ? 'SGD' : randomFrom(['SGD', 'USD', 'AUD']),
          stage,
          STAGE_PROB[stage],
          stage === 'Closed Won' || stage === 'Closed Lost' ? daysAgo(randomInt(1, 60)).split('T')[0] : futureDays(randomInt(15, 180)),
          randomFrom(['New Business', 'Existing Business', 'Renewal']),
          randomFrom(OWNERS),
          prods,
          randomFrom([null, null, ...COMPETITORS.map(c => c.name)]),
          randomFrom(['Send proposal', 'Schedule demo', 'Negotiate pricing', 'Technical evaluation', 'Final approval pending', 'Contract review', 'POC in progress']),
          daysAgo(randomInt(30, 200)),
          daysAgo(randomInt(0, 14)),
        ]
      );
    }
  }

  // Seed activities (200 activities across accounts)
  for (let i = 0; i < 200; i++) {
    const accIdx = randomInt(0, Math.min(39, ACCOUNTS.length - 1));
    const type = randomFrom(ACTIVITY_TYPES);
    await db.query(
      `INSERT INTO activities (id, subject, type, status, related_entity, related_id, related_name, due_date, duration_minutes, description, owner, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO NOTHING`,
      [
        `act-${String(i + 1).padStart(3, '0')}`,
        randomFrom(ACTIVITY_SUBJECTS),
        type,
        randomFrom(['Completed', 'Completed', 'Completed', 'Planned', 'In Progress', 'Cancelled']),
        'account',
        `acc-${String(accIdx + 1).padStart(3, '0')}`,
        ACCOUNTS[accIdx],
        daysAgo(randomInt(-10, 30)).split('T')[0],
        type === 'Call' ? randomInt(15, 60) : type === 'Meeting' ? randomInt(30, 120) : undefined,
        `${randomFrom(ACTIVITY_SUBJECTS)} with ${ACCOUNTS[accIdx]} team.`,
        randomFrom(OWNERS),
        daysAgo(randomInt(0, 60)),
      ]
    );
  }

  // Seed account plans (first 15 accounts)
  for (let i = 0; i < 15; i++) {
    await db.query(
      `INSERT INTO account_plans (id, name, account_id, account_name, fiscal_year, target_revenue, current_revenue, currency, status, objectives, risks, whitespace, owner, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (id) DO NOTHING`,
      [
        `plan-${String(i + 1).padStart(3, '0')}`,
        `${ACCOUNTS[i]} FY2026 Account Plan`,
        `acc-${String(i + 1).padStart(3, '0')}`,
        ACCOUNTS[i],
        'FY2026',
        randomInt(1000, 10000) * 1000,
        randomInt(200, 5000) * 1000,
        'SGD',
        randomFrom(['Active', 'Active', 'Active', 'Draft']),
        [
          `Expand ${randomFrom(PRODUCTS)} deployment`,
          `Achieve ${randomInt(85, 99)}% platform adoption`,
          `Upsell ${randomFrom(PRODUCTS)} by Q3`,
        ],
        [
          `Competitor ${randomFrom(COMPETITORS).name} actively pursuing`,
          `Budget constraints due to ${randomFrom(['fiscal tightening', 'reorganization', 'competing priorities'])}`,
        ],
        [
          `${randomFrom(PRODUCTS)} — no current solution`,
          `${randomFrom(PRODUCTS)} — using legacy system`,
        ],
        randomFrom(OWNERS),
        daysAgo(randomInt(30, 120)),
      ]
    );
  }

  // Seed competitors
  for (let i = 0; i < COMPETITORS.length; i++) {
    const c = COMPETITORS[i];
    await db.query(
      `INSERT INTO competitors (id, name, strength, weakness) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
      [`comp-${String(i + 1).padStart(3, '0')}`, c.name, c.strength, c.weakness]
    );
  }

  console.log(`[DB] Seeded: ${ACCOUNTS.length} accounts, ${contactIdx} contacts, ${oppIdx} opportunities, 200 activities, 15 account plans, ${COMPETITORS.length} competitors`);
}
