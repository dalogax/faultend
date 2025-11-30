// @ts-check
import { test, expect } from '@playwright/test';

const APP_URL = 'http://app.localhost:3000';

test.describe('Fault-end Frontend Tests', () => {
  
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
    
    // Should have no console errors
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
});
