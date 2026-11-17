import { test, expect } from '@playwright/test';
import { SITES } from '@config/env';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('iFrames', () => {
    test('read text inside an iframe @regression', async ({ page }) => {
        await page.goto(`${SITES.theInternet}/iframe`);
        //frameLocator = "look inside this iframe"; normal locators can't see into it
        const editorBody = page.frameLocator('#mce_0_ifr').locator('#tinymce');
        await expect(editorBody).toContainText('Your content goes here.');
    });

    test('nested frames: top --> middle, and bottom @regression', async ({ page }) => {
        await page.goto(`${SITES.theInternet}/nested_frames`);
        //chain frameLocator for a frame inside a frame
        const middle = page.frameLocator('frame[name="frame-top"]').frameLocator('frame[name="frame-middle"]');
        await expect(middle.locator('#content')).toHaveText('MIDDLE');

        //the frame-object way: find a frame by its name
        const bottom = page.frame({ name: 'frame-bottom' });
        expect(bottom).not.toBeNull();
        await expect(bottom!.locator('body')).toContainText('BOTTOM');
    });
});

test.describe('multiple windows and tabs', () => {
    test('new tab: switch, verify, close, come back @regression', async ({ page, context }) => {
        await page.goto(`${SITES.theInternet}/windows`);

        //start waiting for the new page BEFORE the click (otherwise you can miss the event)
        const newPagePromise = context.waitForEvent('page');
        await page.getByRole('link', { name: 'Click Here'}).click();
        const newTab = await newPagePromise;
        await newTab.waitForLoadState();

        await expect(newTab.getByRole('heading', { name: 'New Window' })).toBeVisible();
        expect(context.pages()).toHaveLength(2);

        await newTab.close();
        await page.bringToFront();
        await expect(page.getByRole('heading', {name: 'Opening a new window'})).toBeVisible();
        expect(context.pages()).toHaveLength(1);
    });

    test('two separate users at once: two contexts @regression', async ({ browser }) => {
        //each context = separate incognito window with its own cookies
        const userA = await browser.newContext();
        const userB = await browser.newContext();
        const pageA = await userA.newPage();
        const pageB = await userB.newPage();

        await pageA.goto(`${SITES.theInternet}/checkboxes`);
        await pageB.goto(`${SITES.theInternet}/dropdown`);
        await expect(pageA.getByRole('heading', { name: 'Checkboxes' })).toBeVisible();
        await expect(pageB.getByRole('heading', { name: 'Dropdown List'})).toBeVisible();

        await userA.close();
        await userB.close();
    });
});