import { test, expect } from '@playwright/test';

test.describe('Notifications System', () => {
  test('homepage should have notification bell', async ({ page }) => {
    await page.goto('/');

    // Check notification bell exists in header
    const bellButton = page.locator('button[aria-label="Notifications"]');
    await expect(bellButton).toBeVisible();

    // Take screenshot of homepage with notification bell
    await page.screenshot({ path: 'test-results/homepage-notification-bell.png', fullPage: false });
  });

  test('notification bell should show badge when clicked', async ({ page }) => {
    await page.goto('/');

    // Click the notification bell
    const bellButton = page.locator('button[aria-label="Notifications"]');
    await bellButton.click();

    // Dropdown should appear
    const dropdown = page.locator('[role="menu"]').or(page.locator('text=No notifications'));
    await expect(dropdown).toBeVisible({ timeout: 5000 });

    // Take screenshot
    await page.screenshot({ path: 'test-results/notification-dropdown.png', fullPage: false });
  });

  test('dashboard should have notification bell and digest widget', async ({ page }) => {
    await page.goto('/dashboard');

    // Check notification bell
    const bellButton = page.locator('button[aria-label="Notifications"]');
    await expect(bellButton).toBeVisible();

    // Check digest widget exists
    const digestWidget = page.locator('text=Latest Digest').or(page.locator('text=No digests yet'));
    await expect(digestWidget).toBeVisible({ timeout: 5000 });

    // Take screenshot of dashboard
    await page.screenshot({ path: 'test-results/dashboard-with-digest.png', fullPage: true });
  });

  test('notification settings page should load', async ({ page }) => {
    await page.goto('/settings/notifications');

    // Check page title
    const pageTitle = page.locator('h1:has-text("Notification Settings")');
    await expect(pageTitle).toBeVisible();

    // Check sections exist
    await expect(page.locator('text=Email Notifications')).toBeVisible();
    await expect(page.locator('text=In-App Notifications')).toBeVisible();
    await expect(page.locator('text=Display Preferences')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Timezone' })).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'test-results/notification-settings.png', fullPage: true });
  });

  test('notification settings should have toggles', async ({ page }) => {
    await page.goto('/settings/notifications');

    // Wait for page to load
    await page.waitForSelector('text=Notification Settings');

    // Check toggles exist (role="switch")
    const toggles = page.locator('[role="switch"]');
    const toggleCount = await toggles.count();
    expect(toggleCount).toBeGreaterThanOrEqual(3); // At least 3 toggles

    // Check timezone dropdown exists
    const timezoneSelect = page.locator('select');
    await expect(timezoneSelect).toBeVisible();
  });
});
