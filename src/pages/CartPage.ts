import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

//https://www.saucedemo.com/cart.html
export class CartPage extends BasePage {
    readonly title: Locator;
    readonly items: Locator;
    readonly itemNames: Locator;
    readonly checkoutButton: Locator;
    readonly continueShoppingButton: Locator;

    constructor (page: Page) {
        super(page);
        this.title = page.getByTestId('title');                                 //"your cart"
        this.items = page.getByTestId('inventory-item');                        //one row per product
        this.itemNames = page.getByTestId('inventory-item-name');
        this.checkoutButton = page.getByTestId('checkout');
        this.continueShoppingButton = page.getByTestId('continue-shopping');
    }

    async getNames(): Promise<string[]> {
        return this.itemNames.allTextContents();
    } 

    async remove(productName: string): Promise<void> {
        await this.items.filter({ hasText: productName })
            .getByRole('button', { name: 'Remove'}).click();
    }

    async checkout(): Promise<void> {
        await this.checkoutButton.click();
    }

}

