import { test, expect } from '@playwright/test';

test.describe('Navigation and Routing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Basic Navigation', () => {
    test('homepage loads correctly', async ({ page }) => {
      await expect(page).toHaveURL('http://localhost:3000/');
      await expect(page).toHaveTitle(/Dopamine Detox/);
      
      // Check page loads completely
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    });

    test('all internal links work correctly', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Test "Go to Dashboard" links (when authenticated)
      const dashboardLinks = page.getByRole('link', { name: /go to dashboard/i });
      const dashboardCount = await dashboardLinks.count();
      
      if (dashboardCount > 0) {
        // Test first dashboard link
        await dashboardLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        // Should navigate to dashboard or show auth
        const currentUrl = page.url();
        const hasAuthModal = await page.locator('[role="dialog"]').isVisible().catch(() => false);
        
        expect(currentUrl.includes('/dashboard') || hasAuthModal).toBe(true);
        
        await page.screenshot({ path: 'screenshots/dashboard-navigation.png' });
        
        // Go back to test other links
        await page.goto('/');
      }
    });

    test('external links have proper attributes', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Check for external links (if any)
      const externalLinks = page.locator('a[href^="http"]:not([href*="localhost"])');
      const linkCount = await externalLinks.count();
      
      if (linkCount > 0) {
        const firstExternalLink = externalLinks.first();
        const target = await firstExternalLink.getAttribute('target');
        const rel = await firstExternalLink.getAttribute('rel');
        
        // External links should open in new tab and have security attributes
        expect(target).toBe('_blank');
        expect(rel).toContain('noopener');
      }
    });

    test('brand logo links to homepage', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Find brand/logo element
      const logo = page.locator('.lucide-brain').or(page.getByText('Dopamine Detox').first());
      
      // If logo is clickable, test it
      const logoParent = logo.locator('..');
      const isClickable = await logoParent.getAttribute('href').then(() => true).catch(() => false) ||
                         await logoParent.getAttribute('role').then(role => role === 'button').catch(() => false);
      
      if (isClickable) {
        await logoParent.click();
        await page.waitForLoadState('networkidle');
        
        // Should stay on or return to homepage
        expect(page.url()).toContain('localhost:3000');
      }
    });

    test('browser back and forward buttons work', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Navigate to dashboard (or try to)
      const dashboardButton = page.getByRole('button', { name: /go to dashboard/i }).or(
        page.getByRole('button', { name: /sign up/i })
      );
      
      if (await dashboardButton.isVisible()) {
        await dashboardButton.click();
        await page.waitForTimeout(2000);
        
        // Use browser back button
        await page.goBack();
        await page.waitForLoadState('networkidle');
        
        // Should be back on homepage
        expect(page.url()).toBe('http://localhost:3000/');
        
        // Test forward button
        await page.goForward();
        await page.waitForTimeout(1000);
        
        await page.screenshot({ path: 'screenshots/browser-navigation-test.png' });
      }
    });
  });

  test.describe('Route Protection', () => {
    test('dashboard route requires authentication', async ({ page }) => {
      // Clear any existing auth
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substr(0, eqPos) : c;
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        });
      });
      
      // Try to access dashboard directly
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      const hasAuthModal = await page.locator('[role="dialog"]').isVisible().catch(() => false);
      const hasSignInButton = await page.getByRole('button', { name: /sign in/i }).isVisible().catch(() => false);
      const isRedirected = !currentUrl.includes('/dashboard');
      
      await page.screenshot({ path: 'screenshots/dashboard-route-protection.png' });
      
      // Should either redirect, show auth modal, or show sign in button
      expect(hasAuthModal || hasSignInButton || isRedirected).toBe(true);
    });

    test('invalid routes show appropriate error handling', async ({ page }) => {
      // Test non-existent route
      await page.goto('/nonexistent-page');
      await page.waitForLoadState('networkidle');
      
      // Should show 404 or redirect to homepage
      const currentUrl = page.url();
      const hasNotFound = await page.locator('text=/404|not found|page not found/i').isVisible().catch(() => false);
      const isRedirectedHome = currentUrl === 'http://localhost:3000/';
      
      await page.screenshot({ path: 'screenshots/404-handling.png' });
      
      // Should either show 404 page or redirect to homepage
      expect(hasNotFound || isRedirectedHome).toBe(true);
    });
  });

  test.describe('URL Parameters and State', () => {
    test('page handles query parameters gracefully', async ({ page }) => {
      // Test with various query parameters
      await page.goto('/?utm_source=test&ref=playwright');
      await page.waitForLoadState('networkidle');
      
      // Page should load normally with query params
      await expect(page.getByText('Dopamine Detox')).toBeVisible();
      
      // URL should preserve query parameters
      expect(page.url()).toContain('utm_source=test');
      expect(page.url()).toContain('ref=playwright');
    });

    test('hash changes work with auth modal', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Test hash-based navigation for auth modals
      await page.goto('/#signup');
      await page.waitForTimeout(2000);
      
      // Should open signup modal based on hash
      const hasModal = await page.locator('[role="dialog"]').isVisible().catch(() => false);
      
      await page.screenshot({ path: 'screenshots/hash-signup-navigation.png' });
      
      // Test signin hash
      await page.goto('/#signin');
      await page.waitForTimeout(2000);
      
      const hasSigninModal = await page.locator('[role="dialog"]').isVisible().catch(() => false);
      
      await page.screenshot({ path: 'screenshots/hash-signin-navigation.png' });
      
      // At least one hash should trigger modal (depends on implementation)
      expect(hasModal || hasSigninModal).toBe(true);
    });

    test('page state persists across navigation', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Open a modal
      await page.getByRole('button', { name: /sign up/i }).first().click();
      await page.waitForTimeout(1000);
      
      // Navigate away and back
      await page.goto('/dashboard');
      await page.waitForTimeout(1000);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Modal should be closed after navigation
      const hasModal = await page.locator('[role="dialog"]').isVisible().catch(() => false);
      expect(hasModal).toBe(false);
    });
  });

  test.describe('Performance and Loading', () => {
    test('page loads within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 10 seconds (adjust based on your requirements)
      expect(loadTime).toBeLessThan(10000);
      
      console.log(`Page loaded in ${loadTime}ms`);
    });

    test('page handles slow network conditions', async ({ page }) => {
      // Simulate slow network
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 100); // Add 100ms delay
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Page should still load and function
      await expect(page.getByText('Dopamine Detox')).toBeVisible();
      
      await page.screenshot({ path: 'screenshots/slow-network-test.png' });
    });

    test('page handles network errors gracefully', async ({ page }) => {
      // Block some requests to simulate network issues
      await page.route('**/*.js', route => {
        if (Math.random() < 0.1) { // Block 10% of JS requests randomly
          route.abort();
        } else {
          route.continue();
        }
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Basic content should still be visible
      const hasContent = await page.getByText('Dopamine Detox').isVisible().catch(() => false);
      
      await page.screenshot({ path: 'screenshots/network-error-handling.png' });
      
      // Should have some graceful degradation
      expect(hasContent).toBe(true);
    });
  });

  test.describe('Mobile Navigation', () => {
    test('mobile navigation works correctly', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check that navigation is accessible on mobile
      await expect(page.getByText('Dopamine Detox')).toBeVisible();
      await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
      
      // Test mobile-specific navigation patterns
      const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu, .hamburger');
      const hasMobileMenu = await mobileMenu.isVisible().catch(() => false);
      
      if (hasMobileMenu) {
        await mobileMenu.click();
        await page.waitForTimeout(1000);
        
        await page.screenshot({ path: 'screenshots/mobile-menu-open.png' });
      }
      
      await page.screenshot({ path: 'screenshots/mobile-navigation.png' });
    });

    test('touch interactions work on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Test touch interactions
      const signUpButton = page.getByRole('button', { name: /sign up/i }).first();
      
      // Simulate touch
      await signUpButton.tap();
      await page.waitForTimeout(1000);
      
      // Should open modal
      const hasModal = await page.locator('[role="dialog"]').isVisible().catch(() => false);
      
      await page.screenshot({ path: 'screenshots/mobile-touch-test.png' });
      
      expect(hasModal).toBe(true);
    });
  });
});