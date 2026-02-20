import { getPool } from "./database";
import {
  PipelineSummary, ActivitySummary, CrmQueryResult
} from "./types";

export class CrmClient {
  private get db() { return getPool(); }

  async searchAccounts(query: string): Promise<CrmQueryResult> {
    const q = `%${query}%`;
    const result = await this.db.query(
      `SELECT id, name, industry, type, city, country, annual_revenue, currency, employees, owner, health_score, created_at
       FROM accounts WHERE name ILIKE $1 OR industry ILIKE $1 OR city ILIKE $1 OR country ILIKE $1
       ORDER BY annual_revenue DESC LIMIT 10`,
      [q]
    );
    return { success: true, data: result.rows, message: `Found ${result.rows.length} account(s)` };
  }

  async getAccount(accountId: string): Promise<CrmQueryResult> {
    const result = await this.db.query(
      `SELECT * FROM accounts WHERE id = $1`, [accountId]
    );
    if (result.rows.length === 0) return { success: false, data: null, message: "Account not found" };
    return { success: true, data: result.rows[0] };
  }

  async searchContacts(query: string, accountId?: string): Promise<CrmQueryResult> {
    const q = `%${query}%`;
    let sql = `SELECT id, full_name, email, phone, account_id, account_name, title, department, role, sentiment, last_contacted, owner
               FROM contacts WHERE (full_name ILIKE $1 OR email ILIKE $1 OR title ILIKE $1 OR account_name ILIKE $1)`;
    const params: string[] = [q];
    if (accountId) {
      sql += ` AND account_id = $2`;
      params.push(accountId);
    }
    sql += ` ORDER BY last_contacted DESC NULLS LAST LIMIT 15`;
    const result = await this.db.query(sql, params);
    return { success: true, data: result.rows, message: `Found ${result.rows.length} contact(s)` };
  }

  async getTopDeals(sortBy: string = "amount", limit: number = 5, ownerId?: string): Promise<CrmQueryResult> {
    let orderClause = "amount DESC";
    if (sortBy === "close_date") orderClause = "close_date ASC";
    else if (sortBy === "probability") orderClause = "probability DESC";

    let sql = `SELECT id, name, account_id, account_name, amount, currency, stage, probability, close_date, owner, products, competitor, next_step
               FROM opportunities WHERE stage NOT IN ('Closed Won', 'Closed Lost')`;
    const params: (string | number)[] = [];
    if (ownerId) {
      params.push(ownerId);
      sql += ` AND owner = $${params.length}`;
    }
    params.push(limit);
    sql += ` ORDER BY ${orderClause} LIMIT $${params.length}`;

    const result = await this.db.query(sql, params);
    return { success: true, data: result.rows, message: `Top ${limit} deals by ${sortBy}` };
  }

  async getOpportunity(opportunityId: string): Promise<CrmQueryResult> {
    const result = await this.db.query(`SELECT * FROM opportunities WHERE id = $1`, [opportunityId]);
    if (result.rows.length === 0) return { success: false, data: null, message: "Opportunity not found" };
    return { success: true, data: result.rows[0] };
  }

  async getOpportunitiesByAccount(accountId: string): Promise<CrmQueryResult> {
    const result = await this.db.query(
      `SELECT id, name, amount, currency, stage, probability, close_date, owner, competitor, next_step
       FROM opportunities WHERE account_id = $1 ORDER BY amount DESC`, [accountId]
    );
    return { success: true, data: result.rows, message: `Found ${result.rows.length} opportunity(ies)` };
  }

  async getPipelineSummary(ownerId?: string): Promise<CrmQueryResult> {
    let whereClause = "WHERE stage NOT IN ('Closed Won', 'Closed Lost')";
    const params: string[] = [];
    if (ownerId) {
      params.push(ownerId);
      whereClause += ` AND owner = $${params.length}`;
    }

    const totalResult = await this.db.query(
      `SELECT COUNT(*) as deal_count, COALESCE(SUM(amount), 0) as total_value,
              COALESCE(SUM(amount * probability / 100.0), 0) as weighted_value
       FROM opportunities ${whereClause}`, params
    );

    const stageResult = await this.db.query(
      `SELECT stage, COUNT(*) as count, COALESCE(SUM(amount), 0) as value
       FROM opportunities ${whereClause} GROUP BY stage ORDER BY value DESC`, params
    );

    const wonResult = await this.db.query(
      `SELECT COUNT(*) as won FROM opportunities WHERE stage = 'Closed Won'`
    );
    const closedResult = await this.db.query(
      `SELECT COUNT(*) as total FROM opportunities WHERE stage IN ('Closed Won', 'Closed Lost')`
    );

    const byStage: Record<string, { count: number; value: number }> = {};
    for (const row of stageResult.rows) {
      byStage[row.stage] = { count: parseInt(row.count), value: parseFloat(row.value) };
    }

    const totalRow = totalResult.rows[0];
    const summary: PipelineSummary = {
      total_value: parseFloat(totalRow.total_value),
      currency: "SGD",
      deal_count: parseInt(totalRow.deal_count),
      weighted_value: Math.round(parseFloat(totalRow.weighted_value)),
      by_stage: byStage,
      avg_deal_size: parseInt(totalRow.deal_count) > 0 ? Math.round(parseFloat(totalRow.total_value) / parseInt(totalRow.deal_count)) : 0,
      avg_close_days: 60,
      win_rate: parseInt(closedResult.rows[0].total) > 0
        ? Math.round((parseInt(wonResult.rows[0].won) / parseInt(closedResult.rows[0].total)) * 100)
        : 0,
    };

    return { success: true, data: summary };
  }

  async getActivitySummary(entityType?: string, entityId?: string, timeRange?: string): Promise<CrmQueryResult> {
    let whereClause = "WHERE 1=1";
    const params: string[] = [];

    if (entityType && entityId) {
      params.push(entityType, entityId);
      whereClause += ` AND related_entity = $${params.length - 1} AND related_id = $${params.length}`;
    }

    if (timeRange) {
      let interval = "7 days";
      if (timeRange.includes("month")) interval = "30 days";
      else if (timeRange.includes("quarter")) interval = "90 days";
      whereClause += ` AND created_at >= NOW() - INTERVAL '${interval}'`;
    }

    const result = await this.db.query(
      `SELECT type, status, related_name, COUNT(*) as count
       FROM activities ${whereClause}
       GROUP BY type, status, related_name`, params
    );

    let calls = 0, emails = 0, meetings = 0, tasksCompleted = 0, tasksOverdue = 0, notes = 0, total = 0;
    const accountCounts: Record<string, number> = {};

    for (const row of result.rows) {
      const count = parseInt(row.count);
      total += count;
      switch (row.type) {
        case 'Call': calls += count; break;
        case 'Email': emails += count; break;
        case 'Meeting': meetings += count; break;
        case 'Task': row.status === 'Completed' ? tasksCompleted += count : tasksOverdue += count; break;
        case 'Note': notes += count; break;
      }
      if (row.related_name) {
        accountCounts[row.related_name] = (accountCounts[row.related_name] || 0) + count;
      }
    }

    const summary: ActivitySummary = {
      period: timeRange || "all time",
      calls, emails, meetings, tasks_completed: tasksCompleted, tasks_overdue: tasksOverdue, notes, total,
      top_accounts: Object.entries(accountCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, activity_count: count })),
    };

    return { success: true, data: summary };
  }

  async getAccountPlan(accountId: string): Promise<CrmQueryResult> {
    const result = await this.db.query(
      `SELECT * FROM account_plans WHERE account_id = $1 ORDER BY created_at DESC LIMIT 1`, [accountId]
    );
    if (result.rows.length === 0) return { success: false, data: null, message: "No account plan found" };
    return { success: true, data: result.rows[0] };
  }

  async getRecentActivities(limit: number = 10, ownerId?: string): Promise<CrmQueryResult> {
    let sql = `SELECT id, subject, type, status, related_entity, related_id, related_name, due_date, owner, created_at
               FROM activities`;
    const params: (string | number)[] = [];
    if (ownerId) {
      params.push(ownerId);
      sql += ` WHERE owner = $${params.length}`;
    }
    params.push(limit);
    sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;

    const result = await this.db.query(sql, params);
    return { success: true, data: result.rows };
  }
}
