import { test, expect } from '@playwright/test';

test.describe('Ghost Writer - Gateway Landing Page (/)', () => {
  test('should load the gateway landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Ghost Writer/i);
  });

  test('should have dark theme applied on html element', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
  });

  test('should display Ghost Writer hero heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Ghost Writer/i })).toBeVisible();
  });

  test('should display connect wallet button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /connect wallet/i })).toBeVisible({ timeout: 15000 });
  });

  test('should show chain selector with all 4 chains', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Base')).toBeVisible();
    await expect(page.getByText('Monad')).toBeVisible();
    await expect(page.getByText('Arbitrum')).toBeVisible();
    await expect(page.getByText('Ethereum')).toBeVisible();
  });

  test('should allow chain selection toggle', async ({ page }) => {
    await page.goto('/');
    const monadBtn = page.getByRole('button', { name: 'Monad' });
    await expect(monadBtn).toBeVisible();
    await monadBtn.click();
    await expect(monadBtn).toHaveClass(/bg-white\/10/);
  });

  test('should have near-black background color', async ({ page }) => {
    await page.goto('/');
    const main = page.locator('main').first();
    const bg = await main.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(bg).toMatch(/rgb\(2,\s*2,\s*3\)/);
  });

  test('should render at least one canvas for generative background', async ({ page }) => {
    await page.goto('/');
    const canvases = page.locator('canvas');
    await expect(canvases.first()).toBeVisible();
  });
});

test.describe('Ghost Writer - Functional App (/app)', () => {
  test('should load the functional app page', async ({ page }) => {
    await page.goto('/app');
    await expect(page).toHaveTitle(/Ghost Writer/i);
  });

  test('should have dark theme applied on /app', async ({ page }) => {
    await page.goto('/app');
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
  });

  test('should display Ghost Writer heading after loading', async ({ page }) => {
    await page.goto('/app');
    await expect(page.getByRole('heading', { name: /Ghost Writer/i })).toBeVisible({ timeout: 20000 });
  });
});

test.describe('Ghost Writer - Navigation & Routing', () => {
  test('should redirect non-owner from /admin back to gateway', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL(/\/$/, { timeout: 15000 }).catch(() => {});
    const url = page.url();
    expect(url).toMatch(/\/$/);
  });

  test('should have leaderboard page accessible', async ({ page }) => {
    await page.goto('/leaderboard');
    await expect(page).toHaveTitle(/Ghost Writer/i);
    await expect(page.getByText(/Leaderboard/i)).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Ghost Writer - Mobile Responsive', () => {
  test('gateway should render on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Ghost Writer' })).toBeVisible({ timeout: 15000 });
  });

  test('app should render on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/app');
    await expect(page.getByRole('heading', { name: /Ghost Writer/i })).toBeVisible({ timeout: 20000 });
  });

  test('chain selector should be clickable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const baseBtn = page.getByRole('button', { name: 'Base' });
    await expect(baseBtn).toBeVisible();
    await baseBtn.click();
  });
});
