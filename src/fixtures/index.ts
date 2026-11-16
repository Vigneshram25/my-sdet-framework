import { test as base, expect } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { InventoryPage } from '@pages/InventoryPage';
import { CartPage } from '@pages/CartPage';
import { CheckoutPage } from '@pages/CheckoutPage';

// 1) Describe what each fixture gives a test
type PageFixtures = {
    loginPage: LoginPage;
    inventoryPage: InventoryPage;
    cartPage: CartPage;
    checkoutPage: CheckoutPage;
};

// 2) Teach Playwright how to build each one
//      code BEFORE use() = setup, code after use() = teardown
//      A fixture is only created if the tests ask for it by name

export const test = base.extend<PageFixtures> ({
    loginPage: async ({ page }, use ) => {await use (new LoginPage(page)); },
    inventoryPage: async ({ page }, use) => {await use (new InventoryPage(page)); },
    cartPage: async ({ page }, use) => {await use (new CartPage(page)); },
    checkoutPage: async({ page }, use) => {await use (new CheckoutPage(page)); },
});

// 3) Re-export expect so specs import BOTH from '@Fixtures'
export {expect};