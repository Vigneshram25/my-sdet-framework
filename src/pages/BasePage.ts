
import { Page, expect } from  '@playwright/test';

//Parent of every page object: shared helpers live here once
export abstract class  BasePage {
    constructor (protected readonly page: Page) {}
    
    // goes to base URL + path (baseURL comes from playwright.config.ts)
    async open(path = '/'): Promise<void> {
        await this.page.goto(path);
    }
    async expectUrlContains(part: string): Promise<void> {
        await expect(this.page).toHaveURL(new RegExp(part));
    }
} 