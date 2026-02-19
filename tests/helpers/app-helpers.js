/**
 * App navigation and interaction helpers for Coryphaeus tests.
 */

import { expect } from '@playwright/test';
import { mockAllApis, createMockData } from './api-mock.js';

/**
 * Set up the page with API mocks and navigate to the app.
 * Waits for the app to fully load (loading screen to disappear).
 * @param {import('@playwright/test').Page} page
 * @param {object} [options]
 * @param {object} [options.mockData] - Override mock data
 * @param {string} [options.hash] - Initial hash (e.g. '#competitors')
 */
export async function setupApp(page, options = {}) {
  const mockData = options.mockData || createMockData();
  await mockAllApis(page, mockData);

  const url = options.hash ? `/${options.hash}` : '/';
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // Wait for the loading screen to disappear and app to render
  await page.waitForFunction(() => {
    const body = document.body.textContent;
    return !body.includes('Loading Coryphaeus Spec') && body.includes('CORYPHAEUS');
  }, { timeout: 10000 });

  // Small stabilization wait
  await page.waitForTimeout(300);
}

/**
 * Navigate to a sidebar view (Comments Summary, Competitors, Entities, Org Chart, Priorities).
 */
export async function navigateToView(page, viewName) {
  const viewMap = {
    'comments': '💬 Comments Summary',
    'competitors': '🎯 Competitors',
    'entities': '🗃️ Entities',
    'orgchart': '🏢 Org Chart',
    'priorities': '📋 Priorities',
    'testsuite': '🧪 Test Suite',
  };

  const buttonText = viewMap[viewName] || viewName;
  const btn = page.locator(`.sidebar-btn:has-text("${buttonText}")`);
  await btn.click();
  await page.waitForTimeout(300);
}

/**
 * Navigate to a specific spec section by clicking its sidebar button.
 * @param {import('@playwright/test').Page} page
 * @param {string} sectionTitle - The section title text to click
 */
export async function navigateToSection(page, sectionTitle) {
  const btn = page.locator(`.sidebar-btn:has-text("${sectionTitle}")`);
  await btn.click();
  await page.waitForTimeout(300);
}

/**
 * Get the currently active sidebar button text.
 */
export async function getActiveSection(page) {
  const active = page.locator('.sidebar-btn.active');
  return await active.textContent();
}

/**
 * Clear localStorage to reset app state.
 */
export async function clearLocalStorage(page) {
  await page.evaluate(() => localStorage.clear());
}

/**
 * Get the current URL hash.
 */
export async function getHash(page) {
  return await page.evaluate(() => window.location.hash);
}

/**
 * Wait for any save operation to complete (the "saving…" indicator to disappear).
 */
export async function waitForSave(page) {
  // Wait for saving indicator to appear and then disappear, or not appear at all
  try {
    await page.waitForFunction(() => {
      return !document.body.textContent.includes('saving…');
    }, { timeout: 5000 });
  } catch {
    // Save may have already completed
  }
}

/**
 * Count visible spec items in the content area.
 */
export async function countSpecItems(page) {
  return await page.locator('.spec-item').count();
}
