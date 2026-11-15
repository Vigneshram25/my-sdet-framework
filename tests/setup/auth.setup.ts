import { test as setup, expect } from '@fixtures';
import { env } from '@config/env';

//Must match StorageState in playwright.config.ts
const AUTH_FILE = 'playwright/.auth/user.json';

//Runs once before the browser project (they list 'setup' in dependencies)
//Logs in through the UI and saves cookies + local storage to a file
setup('login to saucedemo and save session', async ({ page, loginPage, inventoryPage }) => {
    

    await loginPage.open();
    await loginPage.login(env.sauceUser, env.saucePassword);
    await expect(inventoryPage.title).toHaveText('Products');       // Prove login really worked
    await page.context().storageState({ path: AUTH_FILE});          // Saves the session
});