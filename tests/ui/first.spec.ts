import { test, expect } from '@fixtures';

test.use({ storageState: {cookies: [], origins: [] } });

test('Sauce Demo home page opens', async ({ page, loginPage }) => {
    await loginPage.open();
    await expect(page).toHaveTitle('Swag Labs');
    await expect(page.getByPlaceholder('Username')).toBeVisible();
});