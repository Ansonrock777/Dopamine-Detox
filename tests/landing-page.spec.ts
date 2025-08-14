import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('homepage has correct title and loads properly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Dopamine Detox/);
    
    // Check page loads completely
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('header displays correctly with logo and navigation', async ({ page }) => {
    // Check header is visible
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Check logo and brand name
    await expect(page.locator('[data-testid="logo"], .lucide-brain')).toBeVisible();
    await expect(page.getByText('Dopamine Detox')).toBeVisible();
    
    // Check auth buttons are visible (when not signed in)
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
  });

  test('hero section displays correctly', async ({ page }) => {
    // Check main headline
    await expect(page.getByText(/take back control of your attention/i)).toBeVisible();
    
    // Check description text
    await expect(page.getByText(/break free from the relentless cycle/i)).toBeVisible();
    
    // Check CTA buttons
    await expect(page.getByRole('button', { name: /start your detox journey/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /watch demo/i })).toBeVisible();
  });

  test('features section displays all key features', async ({ page }) => {
    // Scroll to features section
    await page.locator('text=Science-Backed Digital Wellness').scrollIntoViewIfNeeded();
    
    // Check section title
    await expect(page.getByText('Science-Backed Digital Wellness')).toBeVisible();
    
    // Check all three main features
    await expect(page.getByText('Website Blocking')).toBeVisible();
    await expect(page.getByText('Grayscale Mode')).toBeVisible(); 
    await expect(page.getByText('Focus Timers')).toBeVisible();
    
    // Check feature descriptions
    await expect(page.getByText(/block the sites and apps that most distract you/i)).toBeVisible();
    await expect(page.getByText(/turn temptations into grayscale/i)).toBeVisible();
    await expect(page.getByText(/set independent timers for blocking/i)).toBeVisible();
  });

  test('how it works section displays process steps', async ({ page }) => {
    // Scroll to section
    await page.locator('text=How Dopamine Detox Works').scrollIntoViewIfNeeded();
    
    // Check section title
    await expect(page.getByText('How Dopamine Detox Works')).toBeVisible();
    
    // Check all three steps are present
    await expect(page.getByText('Identify Your Triggers')).toBeVisible();
    await expect(page.getByText('Configure Your Defenses')).toBeVisible();
    await expect(page.getByText('Train Your Brain')).toBeVisible();
    
    // Check step numbers are visible
    await expect(page.locator('text=1')).toBeVisible();
    await expect(page.locator('text=2')).toBeVisible();
    await expect(page.locator('text=3')).toBeVisible();
  });

  test('CTA section appears with correct content', async ({ page }) => {
    // Scroll to CTA section
    await page.locator('text=Start Training Your Brain for Real Discipline').scrollIntoViewIfNeeded();
    
    // Check CTA title
    await expect(page.getByText('Start Training Your Brain for Real Discipline')).toBeVisible();
    
    // Check CTA description
    await expect(page.getByText(/sign up in seconds with your email/i)).toBeVisible();
    
    // Check CTA button
    await expect(page.getByRole('button', { name: /get started now/i })).toBeVisible();
  });

  test('footer displays correctly', async ({ page }) => {
    // Scroll to footer
    await page.locator('footer').scrollIntoViewIfNeeded();
    
    // Check copyright text
    await expect(page.getByText(/© 2024 Dopamine Detox/)).toBeVisible();
  });

  test('sign up modal opens and displays correctly', async ({ page }) => {
    // Click sign up button
    await page.getByRole('button', { name: /sign up/i }).first().click();
    
    // Wait for modal to appear
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    
    // Check modal is visible
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // Modal should contain Clerk sign up component
    // Note: Clerk components may take time to load
    await page.waitForTimeout(2000);
    
    // Take screenshot of modal for manual verification
    await page.screenshot({ path: 'screenshots/signup-modal.png' });
  });

  test('sign in modal opens and displays correctly', async ({ page }) => {
    // Click sign in button
    await page.getByRole('button', { name: /sign in/i }).first().click();
    
    // Wait for modal to appear
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    
    // Check modal is visible
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // Modal should contain Clerk sign in component
    await page.waitForTimeout(2000);
    
    // Take screenshot of modal for manual verification
    await page.screenshot({ path: 'screenshots/signin-modal.png' });
  });

  test('responsive design works on mobile', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that elements are still visible and accessible
    await expect(page.getByText('Dopamine Detox')).toBeVisible();
    await expect(page.getByText(/take back control of your attention/i)).toBeVisible();
    
    // Check mobile navigation works
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
    
    // Take screenshot for mobile verification
    await page.screenshot({ path: 'screenshots/mobile-landing.png', fullPage: true });
  });

  test('all external links and buttons are interactive', async ({ page }) => {
    // Test that buttons respond to hover
    const signUpButton = page.getByRole('button', { name: /sign up/i }).first();
    await signUpButton.hover();
    
    // Verify button styling changes on hover (check for hover class or style)
    const buttonClasses = await signUpButton.getAttribute('class');
    expect(buttonClasses).toContain('hover:');
    
    // Test CTA buttons in hero
    const heroButton = page.getByRole('button', { name: /start your detox journey/i });
    await heroButton.hover();
    
    // Verify it's clickable
    await expect(heroButton).toBeEnabled();
  });
});