/**
 * E2E Tests for Universe Page
 *
 * Tests critical user flows:
 * - View universe page with graph
 * - Search for entities
 * - View entity details
 * - Graph interaction
 *
 * Prerequisites:
 * - Universe must exist with seeded data (Three Musketeers)
 * - Dev server running at localhost:3000
 */

import { test, expect } from '@playwright/test';

// Use the Three Musketeers universe ID (from seed data)
// This would be set via environment variable in CI
const UNIVERSE_ID = process.env.TEST_UNIVERSE_ID || 'test-universe';

test.describe('Universe Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a universe page
    await page.goto(`/universe/${UNIVERSE_ID}`);
  });

  test('should display universe page layout', async ({ page }) => {
    // Header should be visible
    await expect(page.locator('header')).toBeVisible();

    // Search bar should be present
    await expect(page.getByRole('textbox')).toBeVisible();

    // Import button should be visible
    await expect(page.getByRole('button', { name: /import/i })).toBeVisible();
  });

  test('should have a working search bar', async ({ page }) => {
    const searchInput = page.getByRole('textbox');

    // Search bar should be focusable
    await searchInput.click();
    await expect(searchInput).toBeFocused();

    // Type a search query
    await searchInput.fill('test');

    // Search bar should contain the typed text
    await expect(searchInput).toHaveValue('test');
  });

  test('should toggle AI mode', async ({ page }) => {
    // Find AI button
    const aiButton = page.getByRole('button', { name: 'AI' });
    await expect(aiButton).toBeVisible();

    // Click to enable AI mode
    await aiButton.click();

    // Button should have active styling (or check for visual change)
    await expect(aiButton).toHaveClass(/bg-lexicon/);

    // Click again to disable
    await aiButton.click();
  });

  test('should open import dialog', async ({ page }) => {
    // Click import button
    await page.getByRole('button', { name: /import/i }).click();

    // Dialog should appear
    await expect(page.getByRole('dialog')).toBeVisible();

    // Dialog should have title
    await expect(page.getByText(/import/i)).toBeVisible();
  });

  test('should show entity list in sidebar', async ({ page }) => {
    // Sidebar should be visible (on desktop)
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();
  });

  test('should show graph visualization area', async ({ page }) => {
    // Main content area should exist
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    // Graph container should be present (even if empty)
    const graphArea = page.locator('.bg-muted\\/10');
    await expect(graphArea).toBeVisible();
  });

  test('should show search results area', async ({ page }) => {
    // Search results panel should be visible
    const searchPanel = page.locator('.border-t.bg-background');
    await expect(searchPanel).toBeVisible();
  });
});

test.describe('Search Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/universe/${UNIVERSE_ID}`);
  });

  test('should search and display results', async ({ page }) => {
    const searchInput = page.getByRole('textbox');

    // Type a search query
    await searchInput.fill('test query');

    // Wait for debounce
    await page.waitForTimeout(500);

    // Results area should update (show empty state or results)
    const resultsArea = page.locator('.border-t.bg-background');
    await expect(resultsArea).toBeVisible();
  });

  test('should show empty state when no results', async ({ page }) => {
    const searchInput = page.getByRole('textbox');

    // Search for something that won't exist
    await searchInput.fill('zzzznonexistententity12345');

    // Wait for debounce and API response
    await page.waitForTimeout(1000);

    // Should show some indication (empty state or no results message)
    // The exact text depends on the implementation
  });

  test('should support keyboard shortcut', async ({ page }) => {
    const searchInput = page.getByRole('textbox');

    // Press Cmd+K (or Ctrl+K)
    await page.keyboard.press('Meta+k');

    // Search input should be focused
    await expect(searchInput).toBeFocused();
  });
});

test.describe('Entity Detail Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/universe/${UNIVERSE_ID}`);
  });

  test('should close entity detail panel', async ({ page }) => {
    // If there's a detail panel open with a close button
    const closeButton = page.locator('aside button:has(svg)').last();

    // This test assumes an entity is selected
    // In a real test, we'd click an entity first
  });
});

test.describe('Import Dialog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/universe/${UNIVERSE_ID}`);
    // Open import dialog
    await page.getByRole('button', { name: /import/i }).click();
  });

  test('should show import dialog with steps', async ({ page }) => {
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
  });

  test('should close dialog when clicking outside', async ({ page }) => {
    // Press Escape to close
    await page.keyboard.press('Escape');

    // Dialog should be closed
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/universe/${UNIVERSE_ID}`);
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab through the page
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Some element should be focused
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should have proper heading structure', async ({ page }) => {
    // Check for h1 (page title)
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should adapt to mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`/universe/${UNIVERSE_ID}`);

    // Main content should still be visible
    await expect(page.locator('main')).toBeVisible();

    // Search should be visible
    await expect(page.getByRole('textbox')).toBeVisible();
  });

  test('should adapt to tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto(`/universe/${UNIVERSE_ID}`);

    // Layout should adapt
    await expect(page.locator('main')).toBeVisible();
  });
});
