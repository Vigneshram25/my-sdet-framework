import { test, expect } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { InventoryPage } from '@pages/InventoryPage';
import { env } from '@config/env';

// for now we log in before every test, (Lesson 3.4 replace this with auth.setup = faster)

//test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Inventory', () => {
    let inventory: InventoryPage;

    test.beforeEach(async ({ page }) => {
        
        inventory = new InventoryPage(page);
        await inventory.open();
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
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
});

test('sort name Z to A @regression', async () => {
    await inventory.sortBy('za');
    const names = await inventory.getNames();
    expect(names).toEqual([...names].sort().reverse());
});

test('Sort price high to low', async () => {
    await inventory.sortBy('hilo');
    const prices = await inventory.getPrices();
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
})

test('add all products shows badge 6 @regression', async () => {
    const names = await inventory.getNames();
    for (const name of names) {
        await inventory.addToCart(name);
    }
    await inventory.expectCartCount(6);
});

test('all prices are greater than zero @regression', async () => {
    const prices = await inventory.getPrices();
    expect(prices).toHaveLength(6);
    for (const p of prices) {
        expect(p).toBeGreaterThan(0);
    }
});

test('default sort is name A to Z @regression', async () => {
    const names = await inventory.getNames();
    expect(names).toEqual([...names].sort());
})

});

