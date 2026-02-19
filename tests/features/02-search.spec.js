import { test, expect } from '@playwright/test';
import { setupApp, navigateToView } from '../helpers/app-helpers.js';

test.describe('Search', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
  });

  test('search input is visible in sidebar', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    await expect(searchInput).toBeVisible();
  });

  test('global search filters sections', async ({ page }) => {
    await page.locator('#search-input').fill('Executive');
    await page.waitForTimeout(300);
    // The 5 view buttons are always visible; section buttons get filtered
    // Use filter to exclude the 5 view buttons and count only section buttons
    const sectionButtons = page.locator('.sidebar-btn').filter({ hasNotText: /💬 Comments Summary|🎯 Competitors|🗃️ Entities|🏢 Org Chart|📋 Priorities|🧪 Test Suite/ });
    const count = await sectionButtons.count();
    expect(count).toBeLessThan(19); // Fewer than all 19 sections
    expect(count).toBeGreaterThan(0); // At least one match
    // The matching section should still be visible
    await expect(page.locator('.sidebar-btn:has-text("Executive Summary")')).toBeVisible();
  });

  test('search clears properly', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    await searchInput.fill('Executive');
    await page.waitForTimeout(200);
    await searchInput.fill('');
    await page.waitForTimeout(200);
    // All sections should be visible again
    const sectionButtons = page.locator('.sidebar-btn').filter({ hasNotText: /💬 Comments Summary|🎯 Competitors|🗃️ Entities|🏢 Org Chart|📋 Priorities|🧪 Test Suite/ });
    const count = await sectionButtons.count();
    expect(count).toBe(19);
  });

  test('search with no results shows empty sidebar', async ({ page }) => {
    await page.locator('#search-input').fill('xyznonexistent');
    await page.waitForTimeout(200);
    const sectionButtons = page.locator('.sidebar-btn').filter({ hasNotText: /💬 Comments Summary|🎯 Competitors|🗃️ Entities|🏢 Org Chart|📋 Priorities|🧪 Test Suite/ });
    const count = await sectionButtons.count();
    expect(count).toBe(0);
  });

  test('entity search filters entities list', async ({ page }) => {
    await navigateToView(page, 'entities');
    const searchInput = page.locator('input[placeholder="Search entities…"]');
    await searchInput.fill('Account');
    await page.waitForTimeout(200);
    // Should show entities containing "Account"
    const entityButtons = page.locator('button:has-text("Account")');
    const count = await entityButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('entity search with no results shows message', async ({ page }) => {
    await navigateToView(page, 'entities');
    await page.locator('input[placeholder="Search entities…"]').fill('zzzznonexistent');
    await page.waitForTimeout(200);
    await expect(page.locator('text=No entities matching').first()).toBeVisible();
  });

  test('priority search filters priorities', async ({ page }) => {
    await navigateToView(page, 'priorities');
    const searchInput = page.locator('input[placeholder="Search priorities…"]');
    await searchInput.fill('Account Planning');
    await page.waitForTimeout(200);
    await expect(page.locator('text=Implement Account Planning Module')).toBeVisible();
  });

  test('priority search hides non-matching items', async ({ page }) => {
    await navigateToView(page, 'priorities');
    await page.locator('input[placeholder="Search priorities…"]').fill('Account Planning');
    await page.waitForTimeout(200);
    await expect(page.locator('text=Build AI Command Center')).not.toBeVisible();
  });

  test('competitor search filters intel entries', async ({ page }) => {
    await navigateToView(page, 'competitors');
    const searchInput = page.locator('input[placeholder="Search intel…"]');
    await searchInput.fill('Salesforce');
    await page.waitForTimeout(200);
    await expect(page.locator('text=SF Account Planning Analysis')).toBeVisible();
  });

  test('competitor search with no results shows empty view', async ({ page }) => {
    await navigateToView(page, 'competitors');
    await page.locator('input[placeholder="Search intel…"]').fill('zzzznonexistent');
    await page.waitForTimeout(200);
    await expect(page.locator('text=SF Account Planning Analysis')).not.toBeVisible();
  });
});
