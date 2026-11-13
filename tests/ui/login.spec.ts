import { test, expect } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { env } from '@config/env';
import { log } from 'node:console';

//login test must start logged out, so use an empty browser state

test.use({storageState: {cookies: [], origins: [] } });

test.describe('Login', () => {
    let loginPage: LoginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.open();
    });

    test('valid user can log in @smoke', async ({ page }) => {
        await loginPage.login(env.sauceUser, env.saucePassword);
        await loginPage.expectUrlContains('inventory.html');
        await expect(page.getByTestId('title')).toHaveText('Products');
    });

    //data-driven negative tests: one lopp = 3 tests (Phase 2 for...of in real use!)
    const negativeCases = [
        { name: 'locked out user', user: 'locked_out_user', pass: 'secret_sauce', error: 'Sorry, this user has been locked out'},
        { name: 'empty username', user: '', pass: 'secret_sauce', error: 'Username is required'},
        { name: 'wrong password', user: 'standard_user', pass: 'wrong123', error: 'Username and password do not match'},
    ];

    for (const tc of negativeCases) {
        test (`login fails: ${tc.name} @regression`, async () => {
            await loginPage.login(tc.user, tc.pass);
            await loginPage.expectError(tc.error);
        });
    }


});
