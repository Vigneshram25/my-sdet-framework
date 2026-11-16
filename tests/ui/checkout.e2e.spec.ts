import { test, expect } from '@fixtures';

//Already logged in (session from auth.setup.ts). Each test = fresh browser context = empty cart.

test.describe('Checkout', () => {
    test.beforeEach(async ({ inventoryPage }) => {
        await inventoryPage.open();
    });

    test('E2E: add to cart --> checkout --> order complete @e2e @smoke', async ({ page, inventoryPage, cartPage, checkoutPage}) => {
        await test.step('Add backpack to cart', async () => {
            await inventoryPage.addToCart('Sauce Labs Backpack');
            await inventoryPage.expectCartCount(1);
        });

        await test.step('Cart shows the backpack', async () => {
            await inventoryPage.openCart();
            await expect(cartPage.title).toHaveText('Your Cart');
            await expect(cartPage.itemNames).toHaveText(['Sauce Labs Backpack']);
        });

        await test.step('Fill customer details', async () => {
            await cartPage.checkout();
            await checkoutPage.fillDetails('Vignesh', 'Ram', '600001');
        });

        await test.step('Finish and verify order complete', async () => {
            await checkoutPage.finish();
            await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
            await expect(page).toHaveURL(/checkout-complete/);
            await expect(inventoryPage.cartBadge).toBeHidden();                    // Cart emptied after order
        });
    });

    test('total = item total + tax, item total = sum of prices @regression', async ({ inventoryPage, cartPage, checkoutPage}) => {
        const products = ['Sauce Labs Backpack', 'Sauce Labs Bike Light'];
        let expectedItemTotal = 0;

        for (const name of products) {
            expectedItemTotal += await inventoryPage.getPriceOf(name);      // read price from the UI
            await inventoryPage.addToCart(name);
        }

        await inventoryPage.openCart();
        await cartPage.checkout();
        await checkoutPage.fillDetails('Vignesh', 'Ram', '600001');

        const itemTotal = await checkoutPage.getItemTotal();
        const tax = await checkoutPage.getTax();
        const total = await checkoutPage.getTotal();
        console.log({ expectedItemTotal, itemTotal, tax, total});

        expect(itemTotal).toBeCloseTo(expectedItemTotal, 2);    //toBeCloseTo: money has decimals
        expect(total).toBeCloseTo(itemTotal + tax, 2);
    });

    //data-driven negative cases for the "Your Information" form
    const missingFieldCases = [
        { name: 'first name',   first: '',          last: 'Ram',    zip: '600001',  error: 'Error: First Name is required'},
        { name: 'last name',    first: 'Vignesh',   last: '',       zip: '600001',  error: 'Error: Last Name is required' },
        { name: 'postal code',  first: 'Vignesh',   last: 'Ram',    zip: '',  error: 'Error: Postal Code is required' },
    ];

    for (const tc of missingFieldCases) {
        test(`checkout blocked when ${tc.name} is missing @regression`, async ({ inventoryPage, cartPage, checkoutPage}) => {
            await inventoryPage.addToCart('Sauce Labs Backpack');
            await inventoryPage.openCart();
            await cartPage.checkout();
            await checkoutPage.fillDetails(tc.first, tc.last, tc.zip);
            await expect(checkoutPage.error).toHaveText(tc.error);
        });
    }

    test('remove item in cart leaves cart empty @regression', async ({ inventoryPage, cartPage}) => {
        await inventoryPage.addToCart('Sauce Labs Backpack');
        await inventoryPage.openCart();
        await cartPage.remove('Sauce Labs Backpack');
        await expect(cartPage.items).toHaveCount(0);
        await expect(inventoryPage.cartBadge).toBeHidden();
    });

});