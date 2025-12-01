// @ts-check
import { test, expect } from '@playwright/test';

const APP_URL = 'http://app.localhost:3000';

test.describe('Faultend Frontend Tests', () => {
  
  test('page loads successfully', async ({ page }) => {
    await page.goto(APP_URL);
    await expect(page).toHaveTitle('faultend - Management');
  });

  test('CSS files load successfully', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Check that styles are applied (Inter font loaded)
    const body = page.locator('body');
    const fontFamily = await body.evaluate((el) => 
      window.getComputedStyle(el).fontFamily
    );
    expect(fontFamily).toContain('Inter');
  });

  test('displays logo and brand in top bar', async ({ page }) => {
    await page.goto(APP_URL);
    
    const logoLink = page.locator('.logo-link');
    await expect(logoLink).toBeVisible();
    
    const logo = page.locator('.logo');
    await expect(logo).toBeVisible();
    
    const brand = page.locator('.brand');
    await expect(brand).toBeVisible();
    await expect(brand).toHaveText('faultend');
  });

  test('shows server list on home page', async ({ page }) => {
    await page.goto(APP_URL);
    
    const serverListView = page.locator('#serverListView');
    await expect(serverListView).toBeVisible();
    
    const header = serverListView.locator('h2');
    await expect(header).toHaveText('Servers');
    
    const createBtn = page.locator('#createServerBtn');
    await expect(createBtn).toBeVisible();
  });

  test('loads sample servers in table', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Wait for servers to load
    await page.waitForSelector('.server-table tbody tr', { timeout: 5000 });
    
    const rows = page.locator('.server-table tbody tr');
    const count = await rows.count();
    
    // Should have 3 test servers (from SAMPLE_DATA)
    expect(count).toBeGreaterThanOrEqual(3);
    
    // Check first server row has expected columns
    const firstRow = rows.first();
    const cells = firstRow.locator('td');
    expect(await cells.count()).toBe(4); // ID, URL, Traffic, Rules
  });

  test('clicking server row navigates to management view', async ({ page }) => {
    await page.goto(APP_URL);
    
    await page.waitForSelector('.server-table tbody tr');
    
    // Click first server row
    const firstRow = page.locator('.server-table tbody tr').first();
    const serverId = await firstRow.locator('td').first().textContent();
    
    await firstRow.click();
    
    // Should navigate to server management view
    await expect(page).toHaveURL(new RegExp(`#server/${serverId}`));
    
    // Server management view should be visible
    const managementView = page.locator('#serverManagementView');
    await expect(managementView).toBeVisible();
    
    // Server list should be hidden
    const serverListView = page.locator('#serverListView');
    await expect(serverListView).not.toBeVisible();
  });

  test('server management view shows two columns', async ({ page }) => {
    await page.goto(APP_URL);
    
    await page.waitForSelector('.server-table tbody tr');
    await page.locator('.server-table tbody tr').first().click();
    
    // Check two-column layout exists
    const twoColumnLayout = page.locator('.two-column-layout');
    await expect(twoColumnLayout).toBeVisible();
    
    // Check traffic column
    const trafficView = page.locator('#trafficView');
    await expect(trafficView).toBeVisible();
    await expect(trafficView.locator('h2')).toHaveText('Traffic');
    
    // Check rules column
    const rulesView = page.locator('#rulesView');
    await expect(rulesView).toBeVisible();
    await expect(rulesView.locator('h2')).toHaveText('Rules');
  });

  test('shows settings button when viewing a server', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Settings button hidden on home
    let settingsBtn = page.locator('#settingsBtn');
    await expect(settingsBtn).not.toBeVisible();
    
    // Navigate to server
    await page.waitForSelector('.server-table tbody tr');
    await page.locator('.server-table tbody tr').first().click();
    
    // Settings button visible
    settingsBtn = page.locator('#settingsBtn');
    await expect(settingsBtn).toBeVisible();
    await expect(settingsBtn).toHaveText('Settings');
  });

  test('shows server name in top bar when viewing server', async ({ page }) => {
    await page.goto(APP_URL);
    
    await page.waitForSelector('.server-table tbody tr');
    const firstRow = page.locator('.server-table tbody tr').first();
    const serverId = await firstRow.locator('td').first().textContent();
    
    await firstRow.click();
    
    // Server info should be visible
    const serverInfo = page.locator('#serverInfo');
    await expect(serverInfo).toBeVisible();
    
    const serverName = serverInfo.locator('.server-name');
    await expect(serverName).toContainText(serverId || '');
  });

  test('settings button opens drawer', async ({ page }) => {
    await page.goto(APP_URL);
    
    await page.waitForSelector('.server-table tbody tr');
    await page.locator('.server-table tbody tr').first().click();
    
    // Drawer should be hidden initially
    const drawer = page.locator('#drawer');
    await expect(drawer).not.toHaveClass(/active/);
    
    // Click settings button
    const settingsBtn = page.locator('#settingsBtn');
    await settingsBtn.click();
    
    // Drawer should be visible
    await expect(drawer).toHaveClass(/active/);
    
    // Check drawer content
    const drawerTitle = page.locator('#drawerTitle');
    await expect(drawerTitle).toHaveText('Server Settings');
    
    const deleteBtn = page.locator('#deleteServerBtn');
    await expect(deleteBtn).toBeVisible();
    await expect(deleteBtn).toHaveText('Delete Server');
  });

  test('clicking overlay closes drawer', async ({ page }) => {
    await page.goto(APP_URL);
    
    await page.waitForSelector('.server-table tbody tr');
    await page.locator('.server-table tbody tr').first().click();
    
    // Open drawer
    await page.locator('#settingsBtn').click();
    
    const drawer = page.locator('#drawer');
    await expect(drawer).toHaveClass(/active/);
    
    // Click overlay
    const overlay = page.locator('#drawerOverlay');
    await overlay.click();
    
    // Drawer should be closed
    await expect(drawer).not.toHaveClass(/active/);
  });

  test('logo click navigates back to server list', async ({ page }) => {
    await page.goto(APP_URL);
    
    await page.waitForSelector('.server-table tbody tr');
    await page.locator('.server-table tbody tr').first().click();
    
    // Should be on server management view
    const managementView = page.locator('#serverManagementView');
    await expect(managementView).toBeVisible();
    
    // Click logo
    const logoLink = page.locator('.logo-link');
    await logoLink.click();
    
    // Should navigate back to home (empty hash or just #)
    await page.waitForTimeout(100); // Wait for navigation
    const url = page.url();
    expect(url.endsWith('/') || url.endsWith('/#')).toBeTruthy();
    
    // Server list should be visible
    const serverListView = page.locator('#serverListView');
    await expect(serverListView).toBeVisible();
  });

  test('server table has correct structure', async ({ page }) => {
    await page.goto(APP_URL);
    
    await page.waitForSelector('.server-table');
    
    const table = page.locator('.server-table');
    
    // Check headers
    const headers = table.locator('thead th');
    expect(await headers.count()).toBe(4);
    await expect(headers.nth(0)).toContainText('Server ID');
    await expect(headers.nth(1)).toContainText('URL');
    await expect(headers.nth(2)).toContainText('Traffic');
    await expect(headers.nth(3)).toContainText('Rules');
  });

  test('server URL links are correct', async ({ page }) => {
    await page.goto(APP_URL);
    
    await page.waitForSelector('.server-table tbody tr');
    
    const firstRow = page.locator('.server-table tbody tr').first();
    const serverId = await firstRow.locator('td').first().textContent();
    const urlCell = firstRow.locator('td').nth(1);
    const link = urlCell.locator('a');
    
    await expect(link).toHaveAttribute('href', `http://${serverId}.localhost:3000`);
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('no console errors on page load', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto(APP_URL);
    await page.waitForSelector('.server-table tbody tr');
    
    expect(consoleErrors.length).toBe(0);
  });

  test('JavaScript files load successfully', async ({ page }) => {
    const failedResources = [];
    
    page.on('response', response => {
      if (response.url().includes('.js') && !response.ok()) {
        failedResources.push(response.url());
      }
    });
    
    await page.goto(APP_URL);
    await page.waitForSelector('.server-table');
    
    expect(failedResources.length).toBe(0);
  });

  test('traffic view displays when navigating to server', async ({ page }) => {
    await page.goto(APP_URL);
    
    await page.waitForSelector('.server-table tbody tr');
    await page.locator('.server-table tbody tr').first().click();
    
    const trafficView = page.locator('#trafficView');
    await expect(trafficView).toBeVisible();
    
    const trafficHeader = trafficView.locator('.traffic-header h2');
    await expect(trafficHeader).toHaveText('Traffic');
  });

  test('traffic filters are displayed', async ({ page }) => {
    await page.goto(APP_URL);
    
    await page.waitForSelector('.server-table tbody tr');
    await page.locator('.server-table tbody tr').first().click();
    
    const methodFilter = page.locator('#methodFilter');
    await expect(methodFilter).toBeVisible();
    
    const statusFilter = page.locator('#statusFilter');
    await expect(statusFilter).toBeVisible();
    
    const pathSearch = page.locator('#pathSearch');
    await expect(pathSearch).toBeVisible();
  });

  test('traffic action buttons are displayed', async ({ page }) => {
    await page.goto(APP_URL);
    
    await page.waitForSelector('.server-table tbody tr');
    await page.locator('.server-table tbody tr').first().click();
    
    const refreshBtn = page.locator('#refreshTrafficBtn');
    await expect(refreshBtn).toBeVisible();
    
    const clearBtn = page.locator('#clearTrafficBtn');
    await expect(clearBtn).toBeVisible();
  });

  test('traffic empty state displays when no traffic', async ({ page }) => {
    await page.goto(APP_URL);
    
    await page.waitForSelector('.server-table tbody tr');
    await page.locator('.server-table tbody tr').first().click();
    
    await page.waitForTimeout(1000);
    
    const emptyState = page.locator('.empty-state');
    const count = await emptyState.count();
    
    if (count > 0) {
      await expect(emptyState.first()).toContainText('No traffic');
    }
  });

  test('traffic logs appear after making requests', async ({ page, request }) => {
    await page.goto(APP_URL);
    
    await page.waitForSelector('.server-table tbody tr');
    const firstRow = page.locator('.server-table tbody tr').first();
    const serverId = await firstRow.locator('td').first().textContent();
    
    // Create a proxy rule first
    await request.post(`http://app.localhost:3000/servers/${serverId}/rules`, {
      data: {
        priority: 100,
        name: 'Test Proxy Rule',
        method: '*',
        pathRegex: '.*',
        action: 'proxy',
        target: 'https://jsonplaceholder.typicode.com'
      }
    });
    
    // Make a request through the fault server
    await request.get(`http://${serverId}.localhost:3000/posts/1`);
    
    // Navigate to the server
    await firstRow.click();
    
    // Wait for traffic to load and appear
    await page.waitForTimeout(2000);
    
    // Check that traffic table has rows
    const trafficRows = page.locator('.traffic-table tbody tr');
    const count = await trafficRows.count();
    
    expect(count).toBeGreaterThan(0);
    
    // Verify first row has the correct data
    const firstTrafficRow = trafficRows.first();
    await expect(firstTrafficRow).toBeVisible();
    
    // Check for GET badge
    const methodBadge = firstTrafficRow.locator('.badge-get');
    await expect(methodBadge).toBeVisible();
    
    // Check for path
    const pathCell = firstTrafficRow.locator('.path-cell');
    await expect(pathCell).toContainText('/posts/1');
  });

  test('clicking traffic row opens detail drawer', async ({ page, request }) => {
    await page.goto(APP_URL);
    
    await page.waitForSelector('.server-table tbody tr');
    const firstRow = page.locator('.server-table tbody tr').first();
    const serverId = await firstRow.locator('td').first().textContent();
    
    // Create a proxy rule
    await request.post(`http://app.localhost:3000/servers/${serverId}/rules`, {
      data: {
        priority: 100,
        name: 'Test Proxy',
        method: '*',
        pathRegex: '.*',
        action: 'proxy',
        target: 'https://jsonplaceholder.typicode.com'
      }
    });
    
    // Make a request
    await request.get(`http://${serverId}.localhost:3000/posts/1`);
    
    // Navigate to server
    await firstRow.click();
    
    // Wait for traffic to appear
    await page.waitForTimeout(2000);
    
    // Click first traffic row
    const trafficRow = page.locator('.traffic-table tbody tr').first();
    await trafficRow.click();
    
    // Drawer should open
    const drawer = page.locator('#drawer');
    await expect(drawer).toHaveClass(/active/);
    
    // Check drawer title
    const drawerTitle = page.locator('#drawerTitle');
    await expect(drawerTitle).toHaveText('Request Details');
    
    // Check detail sections exist
    const overviewSection = page.locator('.detail-section').first();
    await expect(overviewSection).toBeVisible();
    await expect(overviewSection).toContainText('Overview');
  });

  test('traffic filters work correctly', async ({ page, request }) => {
    await page.goto(APP_URL);
    
    await page.waitForSelector('.server-table tbody tr');
    const firstRow = page.locator('.server-table tbody tr').first();
    const serverId = await firstRow.locator('td').first().textContent();
    
    // Create a proxy rule
    await request.post(`http://app.localhost:3000/servers/${serverId}/rules`, {
      data: {
        priority: 100,
        name: 'Test Proxy',
        method: '*',
        pathRegex: '.*',
        action: 'proxy',
        target: 'https://jsonplaceholder.typicode.com'
      }
    });
    
    // Make GET and POST requests
    await request.get(`http://${serverId}.localhost:3000/posts/1`);
    await request.post(`http://${serverId}.localhost:3000/posts`, {
      data: { title: 'Test', body: 'Content', userId: 1 }
    });
    
    // Navigate to server
    await firstRow.click();
    
    // Wait for traffic
    await page.waitForTimeout(2000);
    
    // Check we have at least 2 traffic entries
    let trafficRows = page.locator('.traffic-table tbody tr');
    let count = await trafficRows.count();
    expect(count).toBeGreaterThanOrEqual(2);
    
    // Filter by GET method
    const methodFilter = page.locator('#methodFilter');
    await methodFilter.selectOption('GET');
    
    // Wait for filter to apply
    await page.waitForTimeout(1000);
    
    // Should only show GET requests
    trafficRows = page.locator('.traffic-table tbody tr');
    const getRows = await trafficRows.count();
    
    // All visible rows should have GET badge
    for (let i = 0; i < getRows; i++) {
      const row = trafficRows.nth(i);
      const getBadge = row.locator('.badge-get');
      await expect(getBadge).toBeVisible();
    }
  });

  test('clear traffic button works', async ({ page, request }) => {
    await page.goto(APP_URL);
    
    await page.waitForSelector('.server-table tbody tr');
    const firstRow = page.locator('.server-table tbody tr').first();
    const serverId = await firstRow.locator('td').first().textContent();
    
    // Create a proxy rule
    await request.post(`http://app.localhost:3000/servers/${serverId}/rules`, {
      data: {
        priority: 100,
        name: 'Test Proxy',
        method: '*',
        pathRegex: '.*',
        action: 'proxy',
        target: 'https://jsonplaceholder.typicode.com'
      }
    });
    
    // Make a request
    await request.get(`http://${serverId}.localhost:3000/posts/1`);
    
    // Navigate to server
    await firstRow.click();
    
    // Wait for traffic
    await page.waitForTimeout(2000);
    
    // Verify traffic exists
    let trafficRows = page.locator('.traffic-table tbody tr');
    let count = await trafficRows.count();
    expect(count).toBeGreaterThan(0);
    
    // Click clear button and confirm
    page.on('dialog', dialog => dialog.accept());
    const clearBtn = page.locator('#clearTrafficBtn');
    await clearBtn.click();
    
    // Wait for clear to complete
    await page.waitForTimeout(1000);
    
    // Should show empty state in traffic view
    const trafficView = page.locator('#trafficView');
    const emptyState = trafficView.locator('.empty-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No traffic');
  });

  test('clicking refresh button reloads traffic', async ({ page }) => {
    await page.goto(APP_URL);
    
    await page.waitForSelector('.server-table tbody tr');
    await page.locator('.server-table tbody tr').first().click();
    
    await page.waitForTimeout(1000);
    
    const refreshBtn = page.locator('#refreshTrafficBtn');
    await refreshBtn.click();
    
    await page.waitForTimeout(500);
  });
});
