import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

// One class for the 3 checkout screens:
// step-one (your info) --> step-two (overview + totals) --> complete
export class CheckoutPage extends BasePage {
    //step-one
    readonly firstName: Locator;
    readonly lastName: Locator;
    readonly postalCode: Locator;
    readonly continueButton: Locator;
    readonly error: Locator;
    //step-two
    readonly subtotalLabel: Locator;
    readonly taxLabel: Locator;
    readonly totalLabel: Locator;
    readonly finishButton: Locator;
    //complete
    readonly completeHeader: Locator;
    readonly backHomeButton: Locator;

    constructor (page: Page) {
        super(page);
        this.firstName = page.getByTestId('firstName');
        this.lastName = page.getByTestId('lastName');
        this.postalCode = page.getByTestId('postalCode');
        this.continueButton = page.getByTestId('continue');
        this.error = page.getByTestId('error');
        this.subtotalLabel =page.getByTestId('subtotal-label');
        this.taxLabel = page.getByTestId('tax-label');
        this.totalLabel = page.getByTestId('total-label');
        this.finishButton = page.getByTestId('finish');
        this.completeHeader = page.getByTestId('complete-header');
        this.backHomeButton = page.getByTestId('back-to-products');
    }

    async fillDetails(first: string, last: string, zip: string): Promise<void> {
        await this.firstName.fill(first);
        await this.lastName.fill(last);
        await this.postalCode.fill(zip);
        await this.continueButton.click();
    }

    private async moneyFrom(label: Locator): Promise<number> {
        const text = (await label.textContent()) ?? '';
        const match = text.match(/\$([\d.]+)/);
        return match ? Number(match[1]): NaN;
    }

    async getItemTotal(): Promise<number> {return this.moneyFrom(this.subtotalLabel); }
    async getTax(): Promise<number> {return this.moneyFrom(this.taxLabel); }
    async getTotal(): Promise<number> {return this.moneyFrom(this.totalLabel); }

    async finish(): Promise<void> {
        await this.finishButton.click();
    }
}
