import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

//Allowed values of the sort dropdown on sauceDemo (value attribute of <option>)
export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

export class InventoryPage extends BasePage {
    readonly title: Locator;
    readonly items: Locator;
    readonly itemNames: Locator;
    readonly itemPrices: Locator;
    readonly sortDropdown: Locator;
    readonly cartBadge: Locator;
    readonly cartLink: Locator;
    readonly menuButton: Locator;
    readonly logoutLink: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.getByTestId('title');
        this.items = page.getByTestId('inventory-item');                        //6 product cards
        this.itemNames = page.getByTestId('inventory-item-name');
        this.itemPrices = page.getByTestId('inventory-item-price');
        this.sortDropdown = page.getByTestId('product-sort-container');
        this.cartBadge = page.getByTestId('shopping-cart-badge');               //the red number
        this.cartLink = page.getByTestId('shopping-cart-link');
        this.menuButton = page.getByRole('button', { name: 'Open Menu' });
        this.logoutLink = page.getByTestId('logout-sidebar-link');
    }

    //Open the products page directly (works because we are already logged in)
    async open(path ='/inventory.html'): Promise<void> {
        await super.open(path);
    }

    //Find the card that contains the product name, then click ITS button
    async addToCart(productName: string): Promise<void> {
        await this.items.filter({ hasText: productName })
        .getByRole('button', { name: 'Add to cart'}).click();
    }

    async removeFromCart(productName: string): Promise<void> {
        await this.items.filter({ hasText: productName})
        .getByRole('button', { name: 'Remove' }).click();
    }

    async sortBy(option: SortOption): Promise<void> {
        await this.sortDropdown.selectOption(option);
    }

    async getNames(): Promise<string[]> {
        return this.itemNames.allTextContents();
    }

    //$29.99 --> 29.99 (text from UI is always a string)
    async getPrices(): Promise<number[]> {
        const texts = await this.itemPrices.allTextContents();
        return texts.map((t) => Number(t.replace('$', '')));
    }

    //price of ONE Product --> find its card, then the price inside it
    async getPriceOf(productName: string): Promise<number> {
        const text = await this.items.filter({ hasText: productName })
            .getByTestId('inventory-item-price').textContent();
        return Number((text ?? '').replace('$', ''));
    }

    async expectCartCount(count: number): Promise<void> {
        if (count === 0) await expect(this.cartBadge).toBeHidden();     //badge disapperas at 0
        else await expect(this.cartBadge).toHaveText(String(count));
    }

    async openCart(): Promise<void> {
        await this.cartLink.click();
    }

    async logout(): Promise<void> {
        await this.menuButton.click();
        await this.logoutLink.click();
    }

}