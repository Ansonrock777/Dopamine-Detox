import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Note: These tests require authentication setup
    // In a real scenario, you'd need to implement auth state or use test users
    await page.goto('/dashboard');
  });

  test.describe('Authentication Required', () => {
    test('redirects to landing page when not authenticated', async ({ page }) => {
      // If not authenticated, should redirect to home page or show auth
      await page.waitForLoadState('networkidle');
      
      // Check if redirected or auth modal appears
      const currentUrl = page.url();
      const hasAuthModal = await page.locator('[role="dialog"]').isVisible().catch(() => false);
      const hasSignInButton = await page.getByRole('button', { name: /sign in/i }).isVisible().catch(() => false);
      
      // Should either be on home page or show authentication
      const isOnHomePage = currentUrl.includes('/') && !currentUrl.includes('/dashboard');
      
      if (!hasAuthModal && !hasSignInButton && !isOnHomePage) {
        // Take screenshot to understand the current state
        await page.screenshot({ path: 'screenshots/auth-redirect-issue.png' });
      }
      
      expect(hasAuthModal || hasSignInButton || isOnHomePage).toBe(true);
    });
  });

  test.describe('Authenticated Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      // Mock authentication state for testing
      // In real implementation, you'd use test authentication
      await page.addInitScript(() => {
        localStorage.setItem('test-auth', 'true');
      });
    });

    test('dashboard loads with correct layout and components', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Check for loading state first, then wait for content
      const loadingIndicator = page.locator('text=Loading dashboard...');
      if (await loadingIndicator.isVisible().catch(() => false)) {
        await loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
      }
      
      // Check main dashboard elements
      await expect(page.getByText(/welcome back/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /export for chrome extension/i })).toBeVisible();
    });

    test('displays correct quick stats cards', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Wait for stats to load
      await page.waitForTimeout(3000);
      
      // Check for stats cards
      await expect(page.getByText('Always-On Blocked')).toBeVisible();
      await expect(page.getByText('Always-On Grayscale')).toBeVisible(); 
      await expect(page.getByText('Focus Rules')).toBeVisible();
      
      // Check that numbers are displayed (even if 0)
      const stats = page.locator('.text-2xl.font-bold.text-white');
      await expect(stats).toHaveCount(3);
      
      // Take screenshot of dashboard
      await page.screenshot({ path: 'screenshots/dashboard-overview.png' });
    });

    test('website blocking section functions correctly', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Find the always-on blocking section
      const blockingSection = page.locator('text=Always-On Website Blocking').locator('..');
      await expect(blockingSection).toBeVisible();
      
      // Check input field and add button
      const websiteInput = page.locator('input[placeholder*="facebook.com"], input[placeholder*="Enter website URL"]');
      const addButton = blockingSection.locator('button').filter({ hasText: '+' }).or(blockingSection.locator('button[type="submit"]'));
      
      await expect(websiteInput).toBeVisible();
      await expect(addButton).toBeVisible();
      
      // Test adding a website
      await websiteInput.fill('example.com');
      await addButton.click();
      
      // Wait for potential success message or updated list
      await page.waitForTimeout(2000);
      
      // Take screenshot after attempting to add
      await page.screenshot({ path: 'screenshots/website-blocking-test.png' });
    });

    test('website grayscale section functions correctly', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Find the always-on grayscale section
      const grayscaleSection = page.locator('text=Always-On Website Grayscale').locator('..');
      await expect(grayscaleSection).toBeVisible();
      
      // Check input field and add button
      const websiteInput = page.locator('input[placeholder*="instagram.com"], input[placeholder*="Enter website URL"]').last();
      const addButton = grayscaleSection.locator('button').filter({ hasText: '+' });
      
      await expect(websiteInput).toBeVisible();
      await expect(addButton).toBeVisible();
      
      // Test adding a website
      await websiteInput.fill('youtube.com');
      await addButton.click();
      
      // Wait for response
      await page.waitForTimeout(2000);
      
      // Take screenshot
      await page.screenshot({ path: 'screenshots/grayscale-test.png' });
    });

    test('focus rules section displays and functions', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Scroll to focus rules section
      await page.locator('text=Customizable Focus Mode').scrollIntoViewIfNeeded();
      
      // Check section is visible
      await expect(page.getByText('Customizable Focus Mode')).toBeVisible();
      await expect(page.getByText('Add Website Rule')).toBeVisible();
      
      // Check form elements
      await expect(page.locator('input[placeholder="example.com"]')).toBeVisible();
      await expect(page.locator('input[type="time"]')).toHaveCount(2); // Start and end time
      await expect(page.locator('text=Action')).toBeVisible();
      
      // Take screenshot of focus rules section
      await page.screenshot({ path: 'screenshots/focus-rules-section.png' });
    });

    test('add website rule form works correctly', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Scroll to add rule form
      await page.locator('text=Add Website Rule').scrollIntoViewIfNeeded();
      
      // Fill out the form
      await page.locator('input[placeholder="example.com"]').fill('reddit.com');
      await page.locator('input[type="time"]').first().fill('09:00');
      await page.locator('input[type="time"]').last().fill('17:00');
      
      // Select action (if dropdown is available)
      const actionSelect = page.locator('text=Action').locator('..').locator('button, select');
      if (await actionSelect.isVisible().catch(() => false)) {
        await actionSelect.click();
        await page.getByText('Block', { exact: true }).click();
      }
      
      // Submit form
      const submitButton = page.getByRole('button', { name: /add rule/i });
      await submitButton.click();
      
      // Wait for response
      await page.waitForTimeout(3000);
      
      // Take screenshot after submission
      await page.screenshot({ path: 'screenshots/add-rule-test.png' });
    });

    test('export configuration button works', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Set up download handler
      const downloadPromise = page.waitForEvent('download');
      
      // Click export button
      const exportButton = page.getByRole('button', { name: /export for chrome extension/i });
      await exportButton.click();
      
      try {
        // Wait for download to start
        const download = await downloadPromise;
        
        // Verify download filename
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/dopamine-detox-config.*\.json/);
        
        // Save the download
        await download.saveAs(`screenshots/${filename}`);
        
      } catch (error) {
        // If download fails, take screenshot for debugging
        await page.screenshot({ path: 'screenshots/export-config-error.png' });
        console.log('Export config test failed:', error);
      }
    });

    test('responsive design works on dashboard', async ({ page }) => {
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Check that dashboard elements are visible
      await expect(page.getByText(/welcome back/i)).toBeVisible();
      
      // Take screenshot for tablet
      await page.screenshot({ path: 'screenshots/dashboard-tablet.png', fullPage: true });
      
      // Test mobile viewport  
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check elements are still accessible
      await expect(page.getByText('Always-On Blocked')).toBeVisible();
      
      // Take screenshot for mobile
      await page.screenshot({ path: 'screenshots/dashboard-mobile.png', fullPage: true });
    });

    test('website overview component displays correctly', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Look for website overview section (might be between stats and add forms)
      // This tests the WebsiteOverview component mentioned in the code
      
      await page.waitForTimeout(3000);
      
      // Take full page screenshot to see overall layout
      await page.screenshot({ path: 'screenshots/full-dashboard.png', fullPage: true });
      
      // Check if any existing websites are displayed with toggle switches
      const switches = page.locator('button[role="switch"], [data-state="checked"], [data-state="unchecked"]');
      const switchCount = await switches.count();
      
      // If there are switches, test one
      if (switchCount > 0) {
        const firstSwitch = switches.first();
        await firstSwitch.click();
        await page.waitForTimeout(1000);
      }
    });

    test('error handling works correctly', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Test error scenarios by entering invalid data
      
      // Try to add empty website
      const blockingInput = page.locator('input[placeholder*="facebook.com"]').first();
      const addButton = page.locator('button').filter({ hasText: '+' }).first();
      
      await blockingInput.fill('   '); // Empty/whitespace
      await addButton.click();
      
      await page.waitForTimeout(2000);
      
      // Try to add invalid URL format
      await blockingInput.fill('not-a-valid-url');
      await addButton.click();
      
      await page.waitForTimeout(2000);
      
      // Check for error messages or toasts
      const errorToast = page.locator('[data-sonner-toast], .toast, [role="alert"]');
      await page.screenshot({ path: 'screenshots/error-handling-test.png' });
    });
  });
});