import { test, expect } from '@playwright/test';

const APP_URL = 'http://app.localhost:3000';

async function login(page) {
  await page.goto(`${APP_URL}/api/auth/dev-login`);
  await page.waitForURL(APP_URL);
}

test.describe.configure({ mode: 'serial' });

test.describe('Faultend E2E', () => {
  test('login via dev-login', async ({ page }) => {
    await login(page);
    await expect(page).toHaveTitle('Faultend');
    await expect(page.locator('#loginOverlay')).not.toBeVisible();
    await expect(page.locator('#mainContent')).toBeVisible();
  });

  test('create server and view it', async ({ page }) => {
    await login(page);

    await page.click('#createServerBtn');
    await page.waitForTimeout(300);

    await page.fill('#server-id', 'e2e-test-server');
    await page.click('button[type="submit"]');

    await page.waitForSelector('#drawer:not(.active)', { timeout: 5000 });
    await expect(page).toHaveURL(/#server\/e2e-test-server/);
  });

  test('add rule and verify it appears', async ({ page }) => {
    await login(page);

    await page.click('#createServerBtn');
    await page.waitForTimeout(300);
    await page.fill('#server-id', 'e2e-rule-server');
    await page.click('button[type="submit"]');
    await page.waitForSelector('#drawer:not(.active)', { timeout: 5000 });

    await page.goto(APP_URL);
    const row = page.locator('.server-table tbody tr', { hasText: 'e2e-rule-server' });
    await row.click();
    await page.waitForTimeout(300);

    await page.click('#createRuleBtn');
    await page.waitForTimeout(300);

    await page.fill('#rulePriority', '100');
    await page.fill('#rulePathRegex', '.*');
    await page.locator('input[name="action"][value="proxy"]').check();
    await page.fill('#proxyTarget', 'https://jsonplaceholder.typicode.com');

    await page.click('#saveRuleBtn');
    await page.waitForTimeout(800);

    await expect(page.locator('.rules-table tbody tr')).toHaveCount(1);
  });

  test('proxy request generates traffic log', async ({ page, request }) => {
    await login(page);

    await page.click('#createServerBtn');
    await page.waitForTimeout(300);
    await page.fill('#server-id', 'e2e-traffic-server');
    await page.click('button[type="submit"]');
    await page.waitForSelector('#drawer:not(.active)', { timeout: 5000 });

    await page.click('#createRuleBtn');
    await page.waitForTimeout(300);
    await page.fill('#rulePriority', '100');
    await page.fill('#rulePathRegex', '.*');
    await page.locator('input[name="action"][value="proxy"]').check();
    await page.fill('#proxyTarget', 'https://jsonplaceholder.typicode.com');
    await page.click('#saveRuleBtn');
    await page.waitForTimeout(800);

    await page.goto('http://e2e-traffic-server.localhost:3000/posts/1');
    await page.waitForTimeout(2000);

    await page.goto(APP_URL);
    await page.waitForSelector('.server-table tbody tr', { timeout: 5000 });
    const trafficRow = page.locator('.server-table tbody tr', { hasText: 'e2e-traffic-server' });
    await trafficRow.click();
    await page.waitForTimeout(1000);

    const trafficRows = page.locator('.traffic-table tbody tr');
    await expect(trafficRows).toHaveCount(1, { timeout: 10000 });
    await expect(trafficRows.first().locator('.path-cell')).toContainText('/posts/1');
  });
});
