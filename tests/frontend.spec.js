import { test, expect } from '@playwright/test';

const APP_URL = 'http://app.localhost:3000';

// ─── Shared helpers ──────────────────────────────────────────────────────────

async function login(page) {
  await page.goto(`${APP_URL}/api/auth/dev-login`);
  await page.waitForURL(APP_URL);
  await page.waitForLoadState('networkidle');
  // Dismiss the consent banner so it never intercepts clicks during tests
  await page.evaluate(() => localStorage.setItem('faultend.consent', 'rejected'));
  // Remove the banner if it rendered before the localStorage write took effect
  await page.evaluate(() => document.getElementById('consent-banner')?.remove());
  // Wait for SPA auth state to settle and main content to appear
  await expect(page.locator('#mainContent')).toBeVisible({ timeout: 5000 });
}

/**
 * Open the create-server drawer, fill in the ID, click Create,
 * wait for the drawer to close and the router to navigate.
 */
async function createServer(page, serverId) {
  await page.click('#createServerBtn');
  await expect(page.locator('#drawer.active')).toBeVisible({ timeout: 3000 });
  await page.fill('#server-id', serverId);
  // The "Create server" button — NOT a submit input; it's type="button" with id="serverCreateBtn"
  await page.click('#serverCreateBtn');
  await expect(page.locator('#drawer.active')).not.toBeVisible({ timeout: 8000 });
}

/**
 * Go to the server list and click the row for the given serverId,
 * then wait for the server management view to be visible.
 */
async function navigateToServer(page, serverId) {
  await page.goto(APP_URL);
  await page.waitForLoadState('networkidle');
  const row = page.locator('.server-table tbody tr', { hasText: serverId });
  await expect(row).toBeVisible({ timeout: 5000 });
  await row.click();
  await expect(page.locator('#serverManagementView')).toBeVisible({ timeout: 5000 });
}

/**
 * Open the create-rule drawer and fill it in for a proxy rule.
 * Proxy is the default action, but we click the seg-option explicitly to exercise the UI.
 */
async function createProxyRule(page, { priority = '100', pathRegex = '.*', target }) {
  await expect(page.locator('#createRuleBtn')).toBeVisible({ timeout: 5000 });
  await page.click('#createRuleBtn');
  await expect(page.locator('#drawer.active')).toBeVisible({ timeout: 3000 });

  await page.fill('#rulePriority', priority);
  await page.fill('#rulePathRegex', pathRegex);

  // Action is a segmented control — click the Proxy option
  await page.locator('.seg-option[data-action="proxy"]').click();
  await expect(page.locator('#proxyFields')).toBeVisible();

  await page.fill('#proxyTarget', target);
  await page.click('#saveRuleBtn');

  // Drawer closes after save
  await expect(page.locator('#drawer.active')).not.toBeVisible({ timeout: 8000 });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' });

test.describe('Faultend E2E', () => {

  // ── Authentication ────────────────────────────────────────────────────────

  test('login via dev-login', async ({ page }) => {
    await page.goto(`${APP_URL}/api/auth/dev-login`);
    await page.waitForURL(APP_URL);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle('Faultend');

    // Allow a brief moment for the SPA auth state to settle
    await page.waitForTimeout(500);

    await expect(page.locator('#loginOverlay')).not.toBeVisible();
    await expect(page.locator('#mainContent')).toBeVisible();
    // The profile button appears once the user is authenticated
    await expect(page.locator('#profileBtn')).toBeVisible();
  });

  // ── Server management ─────────────────────────────────────────────────────

  test('create server and navigate to it', async ({ page }) => {
    await login(page);

    await createServer(page, 'e2e-test-server');

    // After creation the router navigates to the new server
    await expect(page).toHaveURL(/#server\/e2e-test-server/);
    await expect(page.locator('#serverManagementView')).toBeVisible();
  });

  test('created server appears in the server list', async ({ page }) => {
    await login(page);

    await createServer(page, 'e2e-list-server');

    // Return to the server list and verify the row is there
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.server-table tbody tr', { hasText: 'e2e-list-server' }))
      .toBeVisible({ timeout: 5000 });
  });

  // ── Rules ─────────────────────────────────────────────────────────────────

  test('add a proxy rule and verify it appears in the rules table', async ({ page }) => {
    await login(page);

    // Create a dedicated server for rule tests
    await createServer(page, 'e2e-rule-server');

    // The router already navigated to the server; create a rule in one step
    await createProxyRule(page, { target: 'https://jsonplaceholder.typicode.com' });

    // One rule row should now be listed
    await expect(page.locator('.rules-table tbody tr')).toHaveCount(1, { timeout: 5000 });
    // The path-cell inside the rules table should show the regex pattern
    await expect(page.locator('.rules-table .path-cell').first()).toContainText('.*');
  });

  test('toggle a rule off then back on', async ({ page }) => {
    await login(page);

    await navigateToServer(page, 'e2e-rule-server');

    // Wait for the rule row to appear
    await expect(page.locator('.rules-table tbody tr').first()).toBeVisible({ timeout: 5000 });

    // The native checkbox inside a custom toggle switch is visually hidden (CSS pattern).
    // We read state from the input but click the label (.toggle-switch) so the browser
    // fires the change event properly — same as a real user interaction.
    const firstRow = page.locator('.rules-table tbody tr').first();
    const toggleLabel = firstRow.locator('.toggle-switch');
    const toggleInput = firstRow.locator('.toggle-switch input[type="checkbox"]');

    // New rules are enabled by default
    await expect(toggleInput).toBeChecked();

    // Toggle off — click the label, wait for API round-trip + re-render
    await toggleLabel.click();
    await expect(
      page.locator('.rules-table tbody tr').first()
        .locator('.toggle-switch input[type="checkbox"]'),
    ).toBeChecked({ checked: false, timeout: 5000 });

    // Toggle back on
    await page.locator('.rules-table tbody tr').first().locator('.toggle-switch').click();
    await expect(
      page.locator('.rules-table tbody tr').first()
        .locator('.toggle-switch input[type="checkbox"]'),
    ).toBeChecked({ timeout: 5000 });
  });

  // ── Traffic ───────────────────────────────────────────────────────────────

  test('proxy request generates a traffic log entry', async ({ page }) => {
    await login(page);

    await createServer(page, 'e2e-traffic-server');

    // Create a proxy rule pointing at a real upstream
    await createProxyRule(page, { target: 'https://jsonplaceholder.typicode.com' });

    // Hit the server subdomain to generate traffic
    await page.goto('http://e2e-traffic-server.localhost:3000/posts/1');
    await page.waitForTimeout(2000);

    // Return to the server and check the traffic view
    await navigateToServer(page, 'e2e-traffic-server');

    // At least one traffic row for /posts/1 should appear
    const trafficRows = page.locator('.traffic-table tbody tr');
    await expect(trafficRows).toHaveCount(1, { timeout: 10000 });
    await expect(trafficRows.first().locator('.path-cell')).toContainText('/posts/1');
  });

  // ── Config export ─────────────────────────────────────────────────────────

  test('config export downloads a JSON file', async ({ page }) => {
    await login(page);

    await navigateToServer(page, 'e2e-rule-server');

    // On desktop the Settings button is in the top-bar (shown once in server view)
    await expect(page.locator('#settingsBtn')).toBeVisible({ timeout: 3000 });
    await page.click('#settingsBtn');
    await expect(page.locator('#drawer.active')).toBeVisible({ timeout: 3000 });

    // Export button is in the drawer footer
    const exportBtn = page.locator('#exportConfigBtn');
    await expect(exportBtn).toBeVisible({ timeout: 3000 });

    // Intercept the download event triggered by the blob URL
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 5000 }),
      exportBtn.click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/faultend-e2e-rule-server.*\.json/);
  });

});

// ─── Admin panel ──────────────────────────────────────────────────────────────

/**
 * Log in as the permanent non-admin test user (dev-nonadmin@faultend.local).
 * This user is never promoted to admin, making it safe for redirect/guard tests.
 */
async function loginNonadmin(page) {
  await page.goto(`${APP_URL}/api/auth/dev-login-nonadmin`);
  await page.waitForURL(APP_URL, { timeout: 5000 }).catch(() => {});
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => localStorage.setItem('faultend.consent', 'rejected'));
  await page.evaluate(() => document.getElementById('consent-banner')?.remove());
}

test.describe('Admin panel', () => {

  // Non-admin user (dev-nonadmin@faultend.local) is never promoted — always redirected.
  test('non-admin is redirected away from /admin', async ({ page }) => {
    await loginNonadmin(page);
    await page.goto(`${APP_URL}/admin`);
    // admin.js detects !isAdmin and calls window.location.href = '/'
    await page.waitForURL(/app\.localhost:3000\/?$/, { timeout: 8000 });
  });

  // All remaining tests use dev@faultend.local, promoted by test-with-docker.js before
  // Playwright runs via: UPDATE users SET is_admin = true WHERE email = 'dev@faultend.local'

  test('admin user list loads and shows users', async ({ page }) => {
    await login(page);
    await page.goto(`${APP_URL}/admin`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('#userTableBody tr[data-user-id]')).not.toHaveCount(0, { timeout: 5000 });
    await expect(page.locator('#userTableBody')).toContainText('dev@faultend.local');
  });

  test('filter narrows rows as you type and resets on clear', async ({ page }) => {
    await login(page);
    await page.goto(`${APP_URL}/admin`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#userTableBody tr[data-user-id]').first()).toBeVisible({ timeout: 5000 });

    const totalRows = await page.locator('#userTableBody tr[data-user-id]').count();

    // Partial match on known email — at least one row visible
    await page.fill('#searchInput', 'dev@faultend');
    await expect(page.locator('#userTableBody tr[data-user-id]')).not.toHaveCount(0);

    // No match — all rows hidden, empty message shown
    await page.fill('#searchInput', 'zzznomatchxyz');
    await expect(page.locator('#userTableBody tr[data-user-id]')).toHaveCount(0);
    await expect(page.locator('#userTableBody')).toContainText('No users found.');

    // Clear — all rows restored
    await page.fill('#searchInput', '');
    await expect(page.locator('#userTableBody tr[data-user-id]')).toHaveCount(totalRows);
  });

  test('clicking a user row opens the detail view', async ({ page }) => {
    await login(page);
    await page.goto(`${APP_URL}/admin`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#userTableBody tr[data-user-id]').first()).toBeVisible({ timeout: 5000 });

    await page.locator('#userTableBody tr[data-user-id]').first().click();

    await expect(page.locator('#userDetailView')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#userListView')).not.toBeVisible();
    await expect(page.locator('#detailEmail')).not.toBeEmpty();
  });

  test('admin can change user plan and badge updates', async ({ page }) => {
    await login(page);
    await page.goto(`${APP_URL}/admin`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#userTableBody tr[data-user-id]').first()).toBeVisible({ timeout: 5000 });

    await page.locator('#userTableBody tr[data-user-id]').first().click();
    await expect(page.locator('#userDetailView')).toBeVisible({ timeout: 5000 });

    // Set to pro — badge changes in the detail panel, Set Pro button becomes disabled
    await page.locator('#setPro').click();
    await expect(page.locator('#userDetailView .plan-current .badge-plan-pro')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#setPro')).toBeDisabled();

    // Restore to free — badge changes in the detail panel, Set Free button becomes disabled
    await page.locator('#setFree').click();
    await expect(page.locator('#userDetailView .plan-current .badge-plan-free')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#setFree')).toBeDisabled();
  });

  test('back button returns to the user list', async ({ page }) => {
    await login(page);
    await page.goto(`${APP_URL}/admin`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#userTableBody tr[data-user-id]').first()).toBeVisible({ timeout: 5000 });

    await page.locator('#userTableBody tr[data-user-id]').first().click();
    await expect(page.locator('#userDetailView')).toBeVisible({ timeout: 5000 });

    await page.click('#backBtn');

    await expect(page.locator('#userListView')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('#userDetailView')).not.toBeVisible();
  });

});
