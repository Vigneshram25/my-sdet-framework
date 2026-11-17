import path from 'path';
import { test, expect } from '@playwright/test';
import { SITES } from '@config/env';

//These pages are on other sites, so we use full URLs (baseURL is SauceDemo)
//They don't need login, so start with an empty browser state
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Form Elements', () => {
    test('checkboxes: check, uncheck, verify @regression', async ({ page }) => {
        await page.goto(`${SITES.theInternet}/checkboxes`);
        const boxes = page.locator('#checkboxes input[type="checkbox"]');
        await expect(boxes).toHaveCount(2);
        await boxes.nth(0).check();                     // check() does nothing if already checked: safe)
        await boxes.nth(1).uncheck();
        await expect(boxes.nth(0)).toBeChecked();
        await expect(boxes.nth(1)).not.toBeChecked();
    });

    test('dropdown: select by label and by value @regression', async ({ page }) => {
        await page.goto(`${SITES.theInternet}/dropdown`);
        const dropdown = page.locator('#dropdown');
        await dropdown.selectOption({ label: 'Option 2'});  // by visible text
        await expect(dropdown).toHaveValue('2');
        await dropdown.selectOption('1');                   // by value attribute
        await expect(dropdown.locator('option:checked')).toHaveText('Option 1');
    });

    test('radio, day checkboxes, country snd multi-select @regresion', async ({ page }) => {
        await page.goto(SITES.practice);
        //radio: only one in the group can be selected
        await page.locator('#male').check();
        await expect(page.locator('#male')).toBeChecked();
        await page.locator('#female').check();
        await expect(page.locator('#male')).not.toBeChecked();

        //several checkboxes in a loop
        for (const day of ['monday', 'wednesday', 'friday']) {
            await page.locator(`#${day}`).check();
            await expect(page.locator(`#${day}`)).toBeChecked();
        }

        //single dropdown by visible text
        await page.locator('#country').selectOption({ label: 'India' });
        await expect(page.locator('#country option:checked')).toHaveText('India');

        //Multi-select: pass an array
        await page.locator('#colors').selectOption([{ label: 'Red' }, { label: 'Blue' }]);
        await expect(page.locator('#colors option:checked')).toHaveText(['Red', 'Blue']);
        //const selected = await page.locator('#colors option:checked').allTextContents();
        //expect(selected).toEqual(expect.arrayContaining(['Red', 'Blue']));
    });
});

test.describe('Mouse, Keyboard, waits, upload, auth', () => {
    test('hover shows hidden caption @regression', async ({ page }) => {
        await page.goto(`${SITES.theInternet}/hovers`);
        const firstFigure = page.locator('.figure').first();
        await expect(firstFigure.locator('.figcaption')).toBeHidden();
        await firstFigure.hover();
        await expect(firstFigure.getByRole('heading', { name: 'name: user1 '})).toBeVisible();
    });

    test('keyboard: pressa a key @regression', async ({ page }) => {
        await page.goto(`${SITES.theInternet}/key_presses`);
        await page.locator('#target').press('A');
        await expect(page.locator('#result')).toHaveText('You entered: A');
    });

    test('dynamic loading: wait for text, no sleep @regression', async ({ page }) => {
        await page.goto(`${SITES.theInternet}/dynamic_loading/1`);
        await page.getByRole('button', {name: 'Start'}).click();
        //auto-await upto 15s for this one slow element (instead of waitForTimeout)
        await expect(page.locator('#finish')).toHaveText('Hello World!', {timeout: 15_000});
    });

    test('file upload @regression', async ({ page }) => {
        await page.goto(`${SITES.theInternet}/upload`);
        await page.locator('#file-upload').setInputFiles(path.resolve('test-data/upload-sample.txt'));
        await page.locator('#file-submit').click();
        await expect(page.getByRole('heading', { name: 'File Uploaded!' })).toBeVisible();
        await expect(page.locator('#uploaded-files')).toContainText('upload-sample.txt');
    });

    test('basic auth popup with httpCredentials @regression', async ({ browser }) => {
        //the browser's own username/password popup can't be clicked: give credentials to the context
        const context = await browser.newContext({ httpCredentials: {username: 'admin', password: 'admin' } });
        const page = await context.newPage();
        await page.goto(`${SITES.theInternet}/basic_auth`);
        await expect(page.locator('p')).toContainText('Congratulations');
        await context.close();
    });
});
