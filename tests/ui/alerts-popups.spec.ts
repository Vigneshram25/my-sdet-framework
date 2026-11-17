import { test, expect } from '@playwright/test';
import { SITES } from '@config/env';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('JavaScript dialogs (alert, confirm, prompt)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`${SITES.theInternet}/javascript_alerts`);
    });

    test('alert: read message and accept @regression', async ({ page }) => {
        // 1) register the handler first, 2) tehn click the button that opens the dialog
        page.once('dialog', async (dialog) => {
            expect(dialog.type()).toBe('alert');
            expect(dialog.message()).toBe('I am a JS Alert');
            await dialog.accept();
        });
        await page.getByRole('button', { name: 'Click for JS Alert '}).click();
        await expect(page.locator('#result')).toHaveText('You successfully clicked an alert');
    });

    test('confirm: accept (OK) @regression', async ({ page }) => {
        page.once('dialog', (dialog) => dialog.accept());
        await page.getByRole('button', { name: 'Click for JS Confirm'}).click();
        await expect(page.locator('#result')).toHaveText('You clicked: Ok');
    });

    test('confirm: dismiss (Cancel) @regression', async ({ page }) => {
        page.once('dialog', (dialog) => dialog.dismiss());
        await page.getByRole('button', { name: 'Click for JS Confirm '}).click();
        await expect (page.locator('#result')).toHaveText('You clicked: Cancel');
    });

    test('prompt: type text and accept @regression', async ({ page }) => {
        page.once('dialog', (dialog) => dialog.accept('Playwright'));
        await page.getByRole('button', { name: 'Click for JS Prompt' }).click();
        await expect(page.locator('#result')).toHaveText('You entered: Playwright');
    });

    test('modal popup inside the page (HTML, not a browser dialog) @regression', async ({ page }) => {
        await page.goto(`${SITES.theInternet}/entry_ad`);
        const modal = page.locator('#modal');
        await expect(modal).toBeVisible();
        await expect(modal).toContainText('This is a modal window');
        await modal.getByText('Close', { exact: true }).click();
        await expect(modal).toBeHidden();
    });
});