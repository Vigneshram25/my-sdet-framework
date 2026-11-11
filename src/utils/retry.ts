import { resolve } from "node:dns";
import { logger } from "./logger";

export const sleep = (ms: number) => new Promise<void> ((resolve) => setTimeout(resolve, ms));

/** Retry an async action (for flaky EXTERNAL thingslike an inbox or a slow API) */

export async function retry<T>(action: () => Promise<T>, attempts = 3, delayMs = 1000): Promise<T> {
    let lastError: unknown;
    for(let i = 1; i <= attempts; i++) {
        try {
            return await action();
        }   catch(err) {
            lastError = err;
            logger.warn(`Attemps ${i}/${attempts} failed: ${String(err)}`);
            if (i < attempts) await sleep(delayMs * i);
        }
    }
    throw lastError;
}