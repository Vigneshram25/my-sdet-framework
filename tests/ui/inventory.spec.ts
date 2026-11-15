import { test, expect } from '@fixtures';
import { InventoryPage } from '@pages/InventoryPage';


// for now we log in before every test, (Lesson 3.4 replace this with auth.setup = faster)

//test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Inventory', () => {
    test.beforeEach(async ({ inventoryPage }) => {
        await inventoryPage.open();
        await expect(inventoryPage.title).toHaveText('Products');
    });

test('shows 6 products @smoke', async ({ inventoryPage }) => {
    await expect(inventoryPage.items).toHaveCount(6);
});

test ('add one product updates cart badge @smoke', async ({ inventoryPage}) => {
    await inventoryPage.addToCart('Sauce Labs Backpack');
    await inventoryPage.expectCartCount(1);
});

test('add two, remove one leaves 1 in cart @regression', async ({ inventoryPage }) => {
    await inventoryPage.addToCart('Sauce Labs Backpack');
    await inventoryPage.addToCart('Sauce Labs Bike Light');
    await inventoryPage.expectCartCount(2);
    await inventoryPage.removeFromCart('Sauce Labs Backpack');
    await inventoryPage.expectCartCount(1);
});

test('sort price low to high @regression', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('lohi');
    const prices = await inventoryPage.getPrices();
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
});

test('sort name Z to A @regression', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('za');
    const names = await inventoryPage.getNames();
    expect(names).toEqual([...names].sort().reverse());
});

test('Sort price high to low', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('hilo');
    const prices = await inventoryPage.getPrices();
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
})

test('add all products shows badge 6 @regression', async ({ inventoryPage }) => {
    const names = await inventoryPage.getNames();
    for (const name of names) {
        await inventoryPage.addToCart(name);
    }
    await inventoryPage.expectCartCount(6);
});

test('all prices are greater than zero @regression', async ({ inventoryPage }) => {
    const prices = await inventoryPage.getPrices();
    expect(prices).toHaveLength(6);
    for (const p of prices) {
        expect(p).toBeGreaterThan(0);
    }
});

test('default sort is name A to Z @regression', async ({ inventoryPage }) => {
    const names = await inventoryPage.getNames();
    expect(names).toEqual([...names].sort());
});

test('logout returns to login page @regression', async ({ inventoryPage, loginPage}) => {
    await inventoryPage.logout();
    await expect(loginPage.loginButton).toBeVisible();
});

});

