import { test, expect } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { InventoryPage } from '@pages/InventoryPage';
import { env } from '@config/env';

// for now we log in before every test, (Lesson 3.4 replace this with auth.setup = faster)

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Inventory', () => {
    let inventory: InventoryPage;

    test.beforeEach(async ({ page }) => {
        const login = new LoginPage(page);
        await login.open();
        await login.login(env.sauceUser, env.saucePassword);
        inventory = new InventoryPage(page);
        await expect(inventory.title).toHaveText('Products');
    });

test('shows 6 products @smoke', async () => {
    await expect(inventory.items).toHaveCount(6);
});

test ('add one product updates cart badge @smoke', async () => {
    await inventory.addToCart('Sauce Labs Backpack');
    await inventory.expectCartCount(1);
});

test('add two, remove one leaves 1 in cart @regression', async () => {
    await inventory.addToCart('Sauce Labs Backpack');
    await inventory.addToCart('Sauce Labs Bike Light');
    await inventory.expectCartCount(2);
    await inventory.removeFromCart('Sauce Labs Backpack');
    await inventory.expectCartCount(1);
});

test('sort price low to high @regression', async () => {
    await inventory.sortBy('lohi');
    const prices = await inventory.getPrices();
    const expected = [...prices].sort((a, b) => a - b);     //copy, then sort(pahse 2)
    console.log('prices', prices);
    expect(prices).toEqual(expected);
});

test('sort name Z to A @regression', async () => {
    await inventory.sortBy('za');
    const names = await inventory.getNames();
    const expected = [...names].sort().reverse();
    expect(names).toEqual(expected);
});


});

