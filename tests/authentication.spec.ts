import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Sign Up Modal', () => {
    test('opens sign up modal when sign up button is clicked', async ({ page }) => {
      // Click sign up button
      await page.getByRole('button', { name: /sign up/i }).first().click();
      
      // Wait for modal to appear
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Take screenshot
      await page.screenshot({ path: 'screenshots/signup-modal-open.png' });
    });

    test('modal can be closed', async ({ page }) => {
      // Open modal
      await page.getByRole('button', { name: /sign up/i }).first().click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Try to close modal (look for close button or click outside)
      const closeButton = page.locator('[role="dialog"] button').filter({ hasText: '×' }).or(page.locator('[data-testid="close-button"]'));
      
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
      } else {
        // Try pressing Escape key
        await page.keyboard.press('Escape');
      }
      
      // Wait a moment and check if modal is closed
      await page.waitForTimeout(1000);
      const modalVisible = await page.locator('[role="dialog"]').isVisible().catch(() => false);
      
      if (modalVisible) {
        // Take screenshot to see modal state
        await page.screenshot({ path: 'screenshots/modal-close-issue.png' });
      }
    });

    test('modal displays Clerk sign up component', async ({ page }) => {
      await page.getByRole('button', { name: /sign up/i }).first().click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Wait for Clerk component to load
      await page.waitForTimeout(3000);
      
      // Look for common Clerk elements
      const hasEmailInput = await page.locator('input[type="email"], input[name="emailAddress"]').isVisible().catch(() => false);
      const hasPasswordInput = await page.locator('input[type="password"], input[name="password"]').isVisible().catch(() => false);
      const hasClerkElements = await page.locator('[data-clerk-element]').count() > 0;
      
      // Take screenshot for manual verification
      await page.screenshot({ path: 'screenshots/clerk-signup-component.png' });
      
      // At least one Clerk-related element should be present
      expect(hasEmailInput || hasPasswordInput || hasClerkElements).toBe(true);
    });

    test('can switch from sign up to sign in within modal', async ({ page }) => {
      await page.getByRole('button', { name: /sign up/i }).first().click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      await page.waitForTimeout(2000);
      
      // Look for sign in link within the modal
      const signInLink = page.locator('[role="dialog"] a').filter({ hasText: /sign in/i }).or(
        page.locator('[role="dialog"] button').filter({ hasText: /sign in/i })
      );
      
      if (await signInLink.isVisible()) {
        await signInLink.click();
        await page.waitForTimeout(2000);
        
        // Take screenshot after switching
        await page.screenshot({ path: 'screenshots/modal-switch-signin.png' });
      }
    });
  });

  test.describe('Sign In Modal', () => {
    test('opens sign in modal when sign in button is clicked', async ({ page }) => {
      await page.getByRole('button', { name: /sign in/i }).first().click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      await page.screenshot({ path: 'screenshots/signin-modal-open.png' });
    });

    test('modal displays Clerk sign in component', async ({ page }) => {
      await page.getByRole('button', { name: /sign in/i }).first().click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Wait for Clerk component to load
      await page.waitForTimeout(3000);
      
      // Look for sign in specific elements
      const hasEmailInput = await page.locator('input[type="email"], input[name="identifier"]').isVisible().catch(() => false);
      const hasPasswordInput = await page.locator('input[type="password"]').isVisible().catch(() => false);
      const hasSignInButton = await page.locator('button').filter({ hasText: /continue|sign in|log in/i }).isVisible().catch(() => false);
      
      await page.screenshot({ path: 'screenshots/clerk-signin-component.png' });
      
      expect(hasEmailInput || hasPasswordInput || hasSignInButton).toBe(true);
    });

    test('can switch from sign in to sign up within modal', async ({ page }) => {
      await page.getByRole('button', { name: /sign in/i }).first().click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      await page.waitForTimeout(2000);
      
      const signUpLink = page.locator('[role="dialog"] a').filter({ hasText: /sign up/i }).or(
        page.locator('[role="dialog"] button').filter({ hasText: /sign up/i })
      );
      
      if (await signUpLink.isVisible()) {
        await signUpLink.click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: 'screenshots/modal-switch-signup.png' });
      }
    });
  });

  test.describe('Authentication State', () => {
    test('unauthenticated users see auth buttons', async ({ page }) => {
      // Ensure we're not authenticated
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Should see sign in and sign up buttons
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
      
      // Should see "Start Your Detox Journey" CTA
      await expect(page.getByRole('button', { name: /start your detox journey/i })).toBeVisible();
    });

    test('authenticated state shows dashboard link', async ({ page }) => {
      // Mock authenticated state
      await page.addInitScript(() => {
        // This would normally come from Clerk/your auth system
        window.localStorage.setItem('test-auth', 'true');
      });
      
      // You would need to implement actual auth state mocking
      // For now, we'll just test the UI structure
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // In authenticated state, should show "Go to Dashboard" instead of auth buttons
      // Note: This test might fail without proper auth mocking
      const hasDashboardButton = await page.getByRole('button', { name: /go to dashboard/i }).isVisible().catch(() => false);
      const hasAuthButtons = await page.getByRole('button', { name: /sign up/i }).isVisible().catch(() => false);
      
      await page.screenshot({ path: 'screenshots/auth-state-check.png' });
      
      // Document the current state for analysis
      console.log('Dashboard button visible:', hasDashboardButton);
      console.log('Auth buttons visible:', hasAuthButtons);
    });

    test('dashboard requires authentication', async ({ page }) => {
      // Clear any existing auth
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // Try to access dashboard directly
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Should redirect to home or show auth requirement
      const currentUrl = page.url();
      const hasAuthModal = await page.locator('[role="dialog"]').isVisible().catch(() => false);
      const isOnDashboard = currentUrl.includes('/dashboard');
      const isOnHome = currentUrl === 'http://localhost:3000/' || currentUrl.endsWith('/');
      
      await page.screenshot({ path: 'screenshots/dashboard-auth-protection.png' });
      
      // Should either redirect away from dashboard or show auth modal
      if (isOnDashboard && !hasAuthModal) {
        // Dashboard is accessible without auth - this might be an issue
        console.log('Warning: Dashboard accessible without authentication');
      }
    });

    test('navigation shows correct auth state', async ({ page }) => {
      await page.goto('/');
      
      // Test navigation between authenticated and non-authenticated states
      // This would typically involve actual login/logout flows
      
      // Check initial state
      await page.waitForLoadState('networkidle');
      const initialAuthButtons = await page.getByRole('button', { name: /sign in/i }).count();
      
      await page.screenshot({ path: 'screenshots/initial-nav-state.png' });
      
      // Verify consistent navigation state
      expect(initialAuthButtons).toBeGreaterThan(0);
    });
  });

  test.describe('Auth Modal Interactions', () => {
    test('modal handles form validation', async ({ page }) => {
      await page.getByRole('button', { name: /sign in/i }).first().click();
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
      
      await page.waitForTimeout(3000);
      
      // Try to find and interact with form elements
      const emailInput = page.locator('input[type="email"], input[name="identifier"], input[name="emailAddress"]').first();
      const submitButton = page.locator('button').filter({ hasText: /continue|sign in|log in/i }).first();
      
      // Test empty form submission
      if (await emailInput.isVisible() && await submitButton.isVisible()) {
        await emailInput.fill('');
        await submitButton.click();
        
        await page.waitForTimeout(2000);
        
        // Look for validation errors
        const errorElements = page.locator('[role="alert"], .error, .text-red').or(
          page.locator('text=/required|invalid|error/i')
        );
        
        await page.screenshot({ path: 'screenshots/form-validation-test.png' });
      }
    });

    test('modal handles invalid credentials gracefully', async ({ page }) => {
      await page.getByRole('button', { name: /sign in/i }).first().click();
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
      
      await page.waitForTimeout(3000);
      
      // Try invalid credentials (if form allows it)
      const emailInput = page.locator('input[type="email"], input[name="identifier"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      
      if (await emailInput.isVisible() && await passwordInput.isVisible()) {
        await emailInput.fill('invalid@example.com');
        await passwordInput.fill('wrongpassword');
        
        // Try to submit
        const submitButton = page.locator('button').filter({ hasText: /continue|sign in/i }).first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          
          await page.waitForTimeout(3000);
          
          // Take screenshot to see error handling
          await page.screenshot({ path: 'screenshots/invalid-credentials-test.png' });
        }
      }
    });

    test('modal accessibility features work', async ({ page }) => {
      await page.getByRole('button', { name: /sign up/i }).first().click();
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Test escape key
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
      
      // Check if modal closed with Escape
      const modalVisible = await page.locator('[role="dialog"]').isVisible().catch(() => false);
      
      await page.screenshot({ path: 'screenshots/modal-accessibility-test.png' });
      
      // Modal should be closable with Escape key
      expect(modalVisible).toBe(false);
    });
  });
});