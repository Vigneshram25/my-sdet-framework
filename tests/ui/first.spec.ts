import { test, expect } from '@playwright/test';

test('Sauce Demo home page opens', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Swag Labs');
    await expect(page.getByPlaceholder('Username')).toBeVisible();
});