//simple logger: every line has time + level, so CI logs are easy to read

import { warn } from "console";

export const logger = {
    info: (msg: string) => console.log(`[${new Date().toISOString()}] INFO  ${msg}`),
    warn: (msg: string) => console.warn(`[${new Date().toISOString()}] WARN ${msg}`),
    error: (msg: string) => console.error(`[${new Date().toISOString()}] ERROR ${msg}`),
};
