
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
    readonly username: Locator;
    readonly password: Locator;
    readonly loginButton:Locator;
    readonly error: Locator;

    constructor(page: Page) {
        super(page);
        // getByTestId uses data-test="..." (we set testIdAttribute in playwright.config.ts)
        this.username = page.getByTestId('username');
        this.password = page.getByTestId('password');
        this.loginButton = page.getByTestId('login-button');
        this.error = page.getByTestId('error');
    }

    async login(user: string, pass: string): Promise<void> {
        await this.username.fill(user);
        await this.password.fill(pass);
        await this.loginButton.click();
    }

    async expectError(text: string): Promise<void> {
        await expect(this.error).toContainText(text);
    }

}