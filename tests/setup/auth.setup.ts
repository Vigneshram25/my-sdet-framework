import { test as setup, expect } from  '@playwright/test';
import { LoginPage  } from '@pages/LoginPage';
import { InventoryPage } from '@pages/InventoryPage';
import { env } from '@config/env';

//Must match StorageState in playwright.config.ts
const AUTH_FILE = 'playwright/.auth/user.json';

//Runs once before the browser project (they list 'setup' in dependencies)
//Logs in through the UI and saves cookies + local storage to a file
setup('login to saucedemo and save session', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.open();
    await loginPage.login(env.sauceUser, env.saucePassword);
    await expect(inventoryPage.title).toHaveText('Products');       // Prove login really worked
    await page.context().storageState({ path: AUTH_FILE});          // Saves the session
});