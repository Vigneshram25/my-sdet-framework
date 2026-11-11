import { test, expect } from '@playwright/test';
import { retry } from '@utils/retry';
import { APIError } from '@utils/errors';
import { throws } from 'node:assert';
import { appendFile } from 'node:fs';


//Data types + Data Structures / Collections

test ('arrays, objects, Map, Set, Tuple', () => {
    // Array (Ordered List)
    const browsers: string[] = ['chromium', 'firefox'];
    browsers.push('webkit');
    expect(browsers).toHaveLength(3);
    expect(browsers.includes('firefox')).toBe(true);
    console.log('browsers:', browsers);

    //Object (Key -> value)
    const user: {name: string, role: string} = {name: 'Vignesh', role: 'SDET'};
    expect(user.role).toBe('SDET');
    console.log('user:', user);

    //Map (key -> value, any key type, keeps order)
    const statusText = new Map<number, string>([[200, 'OK'], [404, 'Not Found']]);
    statusText.set(500, 'Server Error');
    expect(statusText.get(404)).toBe('Not Found');
    expect(statusText.size).toBe(3);
    console.log('statusText:', statusText);

    //Set(Unique values)
    const tags = new Set(['@smoke', '@regression', '@smoke']);
    expect(tags.size).toBe(2);
    console.log('tags:', tags);

    //Tuples (Fixed length + types)
    const login : [string, string] = ['standard_user', 'secret_sauce'];
    expect(login[0]).toBe('standard_user');
    console.log('login:', login);

    //Useful array methods
    const prices = [29.99, 9.99, 15.99];
    expect(prices.filter((p) => p > 10)).toEqual([29.99, 15.99]);
    expect(prices.map((p) => Math.round(p))).toEqual([30, 10, 16]);
    expect([...prices].sort((a, b) => a - b)).toEqual([9.99, 15.99, 29.99]);
    expect(prices.reduce((sum,p) => sum + p, 0)).toBeCloseTo(55.97);

    console.log('filtered:', prices.filter((p) => p > 10));
    console.log('total:', prices.reduce((sum, p) => sum + p, 0));

});


//-----------2. Loops-------------------------

test('for, for...of, for...in, forEach, while', () => {
    const out: string[] = [];

    //classic for: when you need the index/ a counter
    for (let i = 1; i <= 3; i++) out.push(`for:${i}`);

    //for...of: gives values of an array (most used in tests, works with await) 
    for (const b of ['chromium', 'firefox']) out.push(`of:${b}`);

    //for...in: gives KEYS of an object
    const headers = {accept: 'json', auth: 'token'};
    for (const key in headers) out.push(`in:${key}`);

    //forEach: runs a function per item (cannot break, doesn't wait for await)
    [10, 20].forEach((n, index) => out.push(`each:${index}=${n}`));

    //while: repeat until a condition changes
    let tries = 0;
    while (tries < 2) tries++;
    out.push(`while:${tries}`);

    console.log(out);
    expect(out).toEqual(['for:1', 'for:2', 'for:3', 'of:chromium', 'of:firefox', 'in:accept', 'in:auth', 'each:0=10', 'each:1=20', 'while:2']);
          
});

//--------------------3. For + If, Break, Continue, Switch ----------------------------

test ('for loop with if, break, continue and switch', () => {
    const results = ['pass', 'skip', 'pass', 'fail', 'pass'];
    let passed = 0;
    for (const r of results) {
        if (r === 'skip') {
            console.log('skip --> continue (jumo to next item)');
            continue;
        }
        if (r === 'fail') {
            console.log('fail --> break (stop the loop)');
            break;
        }
        passed++;
        console.log(`pass --> passed is now ${passed}`);
    }
    expect(passed).toBe(2); //the last 'pass' never runs because of break

    const baseUrl = (env: string): string => {
        switch(env) {
            case 'qa':
                return 'https://qa.example.com';
            case 'stage':
            case 'staging':
                return 'https://staging.example.com';
            default:
                return 'https://www.saucedemo.com';
        }
    };
    console.log('stage-->', baseUrl('stage'));
    console.log('dev-->', baseUrl('dev'));
    expect(baseUrl('stage')).toBe('https://staging.example.com');
    expect(baseUrl('dev')).toBe('https://www.saucedemo.com');
});

//-----------4. Functions: normal, arrow, default, rest, closure

function add(a: number, b: number): number {return a + b;}              //normal function
const multiply = (a: number, b: number): number => a * b;               //arrow function
const greet = (name: string, title = 'Mr.') => `${title} ${name}`;      //default parameter
const total = (...nums: number[]) => nums.reduce((s, n) => s + n, 0)    //rest parameter

test ('function types', () => {
    expect(add(2, 3)).toBe(5);
    expect(multiply(2, 3)).toBe(6);
    expect(greet('Vignesh')).toBe('Mr. Vignesh');
    expect(total(1, 2, 3)).toBe(6);

    //Closure: inner function remembers 'n' even after makecounter finished
    const makeCounter = () => { let n = 0; return () => ++n; };
    const next = makeCounter();
    next();
    expect(next()).toBe(2);
    console.log('add:', add(2, 3), '| greet:', greet('Vignesh'), ' | total:', total(1, 2, 3));
});

//-----------------5. Async: Promise, async/await, Promise.all, allSettled----------------------------

//fakeApi waits 'ms' milliseconds, then succeeds or fails, like a real API call

const fakeApi = (value: string, ms: number, fail = false) =>
    new Promise<string>((resolve, reject) =>
        setTimeout(() => (fail ? reject(new Error(`${value} failed`)) : resolve(value)), ms));

test ('Promise, async/await, promise.all', async () => {
    const token = await  fakeApi('token-123', 50);
    expect(token).toBe('token-123');

    const [a, b] = await Promise.all([fakeApi('users', 50), fakeApi('orders', 50)]);    //run in parallel
    expect([a, b]).toEqual(['users', 'orders']);

    const results = await Promise.allSettled([fakeApi('ok', 10), fakeApi('bad', 10, true)]);  //never throws
    expect(results.map(r => r.status)).toEqual(['fulfilled', 'rejected']);
    console.log('token:', token, '| parallel:', [a, b], '| settled:', results.map(r => r.status));
});


//--------------6. Exceptions: try/catch/finally, custom error, retry --------------------------------------

test('try / catch / finally and custom errors', async () => {
    const steps: string[] = [];
    try {
        throw new APIError('Get / booking returned 500', 500);
    } catch (err) {
        if (err instanceof APIError) steps.push(`caught ${err.status}`);
    } finally {
        steps.push('cleanup');
    }
    expect(steps).toEqual(['caught 500', 'cleanup']);

    await expect(fakeApi('payment', 10, true)).rejects.toThrow('payment failed');   //assert a failure

    let calls = 0;
    const value = await retry (async () => {
        calls++;
        if (calls < 3) throw new Error('not yet');
        return 'done';
    }, 3, 10);
    expect(value).toBe('done');
    console.log('steps:', steps, '| retry calls:', calls, '| value:', value);
});