import { test, expect, APIRequestContext, APIResponse } from '@playwright/test';
import { env, SITES } from '@config/env';


//------------------small log helper (same idea as 4.2)--------------------------
async function logResponse(label: string, response: APIResponse): Promise<void> {
    const text = await response.text();
    let body: unknown = text;
    try { body = JSON.parse(text); } catch { /* plain text body */}
    console.log(`\n===== ${label} =====\nSTATUS : ${response.status()} ${response.statusText()}\nBODY   :`, body);
} 

//================================================================
// PART A: Restful Booker - 3 ways to authenticate the SAME update
//================================================================

test.describe('Auth on Restful Booker (cookie token, basic auth, none)', () => {
    let bookingId: number;

    //create one booking for this test to update (and delete it afterwards)
    test.beforeEach(async ({ request }) => {
        const res = await request.post('/booking', {
            data: {
                firstname: 'Auth', lastname: `QA-${Date.now()}`, totalprice: 100, depositpaid: true,
                bookingdates: { checkin: '2026-12-01', checkout: '2026-12-02' },
                additionalneeds: 'None',                       // Restful Booker REQUIRES this field (else 500)
            },
        });
        // FAIL FAST with a clear message, instead of a confusing JSON parse error later
        expect(res.status(), `setup POST /booking failed: ${ await res.text()}`).toBe(200);
        bookingId = (await res.json()).bookingid;
    });

    test.afterEach(async ({ request }) => {
        //Basic Auth Header: "Basic " + base64("username:password")
        const basic = Buffer.from(`${env.bookerUser}:${env.bookerPassword}`).toString('base64');
        await request.delete(`/booking/${bookingId}`, { headers: { Authorization: `Basic ${basic}`} });
    });

    test('1) token in a cookie header @api @regression', async ({ request}) => {
        const auth = await request.post('/auth', { data: {username: env.bookerUser, password: env.bookerPassword } });
        const { token } = await auth.json();                    //destructuring: pull token out of the body
        console.log('cookie token: ', token);

        const res = await request.patch(`/booking/${bookingId}`, {
            data: {firstname: 'ViaCookie' },
            headers:{ Cookie: `token=${token}` ,}
        });
        await logResponse('PATCH with Cookie token', res);
        expect(res.status()).toBe(200);
        expect((await res.json()).firstname).toBe('ViaCookie');
    });

    test('2) Basic Auth header (username:password in base64) @api @regression', async ({ request }) => {
        const basic = Buffer.from(`${env.bookerUser}:${env.bookerPassword}`).toString('base64');
        console.log('Basic Value: ', basic);                        //"admin:password123" -> YWRtaW46cGFzc3dvcmQxMjM=

        const res = await request.patch(`/booking/${bookingId}`, {
            data: { firstname: 'ViaBasic' },
            headers: { Authorization: `Basic ${basic}` },
        });
        await logResponse('PATCH with basic auth', res);
        expect(res.status()).toBe(200);
        expect((await res.json()).firstname).toBe('ViaBasic');
    });

    //SECURITY MATRIX: every protected method must reject a missing or wrong credential
    const  unauthorisedCases = [
        { name: 'no auth at all', headers: {} as Record<string, string> },
        { name: 'invalid cookie token', headers: { Cookie: 'token=not-a-real-token'} },
        { name: 'wrong Basic password', headers: { Authorization: `Basic ${Buffer.from('admin:wrong').toString('base64')}` } },
    ];

    for (const tc of unauthorisedCases) {
        for (const method of ['put', 'patch', 'delete'] as const) {                     //as const : exactly these 3 strings
            test(`${method.toUpperCase()} with ${tc.name} is rejected (403) @api @security`, async({ request }) => {
                const res = await request[method](`/booking/${bookingId}`, { // request['put'] = request.put
                    data: { firstname: 'Hacker' },
                    headers: tc.headers,
                });
                console.log(`${method.toUpperCase()} + ${ tc.name } -> ${ res.status()}`);
                expect(res.status()).toBe(403);
            });
        }
    }
});

// =====================================================================
// PART B: DummyJSON - Bearer token (JWT), /me, refresh, negative cases
// =====================================================================

test.describe('Bearer token auth on DummyJSON', () => {
    let api: APIRequestContext;                                 // our OWN request context for another base URL

    // A FRESH client for EVERY test. A request context keeps cookies like a browser does, and
    // DummyJSON's login sets an accessToken COOKIE. A shared context would leak that login into
    // the "no token" tests and make them pass/fail depending on test order.
    test.beforeEach(async ({ playwright }) => {
        // a separate client with its own baseURL (the api project's baseURL is Restful Booker)
        api = await playwright.request.newContext({
            baseURL: SITES.dummyJson,
            extraHTTPHeaders: { Accept: 'application/json' },
        });
    });

    test.afterEach(async () => {
        await api.dispose();                                    // always close contexts you create yourself
    });

    // helper: log in and return both tokens
    async function login(): Promise<{ accessToken: string, refreshToken: string }> {
        const res = await api.post('/auth/login', {
            data: { username: env.dummyUser, password: env.dummyPassword, expiresInMins: 30 },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        return { accessToken: body.accessToken, refreshToken: body.refreshToken };
    }

    test('login returns access + refresh tokens @api @smoke', async () => {
        const res = await api.post('/auth/login', {
            data: { username: env.dummyUser,password: env.dummyPassword, expiresInMins: 30 },
        });
        await logResponse('POST /auth/login', res);
        expect(res.status()).toBe(200);

        const body = await res.json();
        expect(body.username).toBe(env.dummyUser);
        expect(body.accessToken).toBeTruthy();
        expect(body.refreshToken).toBeTruthy();
    });

    test('access token is a JWT: decode its payload @api', async () => {
        const { accessToken } = await login();

        // JWT = header.payload.signature  (each part base64url-encoded)
        const parts = accessToken.split('.');
        expect(parts).toHaveLength(3);

        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        console.log('JWT Payload: ', payload);

        expect(payload.username).toBe(env.dummyUser);
        expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));         // exp = expiry time, in seconds
    });

    test('Bearer token gives access to /auth/me @api @regression', async () => {
        const { accessToken } = await login();

        const res = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${accessToken}` },     // the standard header for tokens
        });
        await logResponse('GET /auth/me with Bearer token', res);
        expect(res.status()).toBe(200);
        expect((await res.json()).username).toBe(env.dummyUser);
    });

    test('refresh token gives a NEW working access token @api @regression', async () => {
        const { refreshToken } = await login();

        const res = await api.post('/auth/refresh', { data: { refreshToken, expiresInMins: 30 } });
        await logResponse('POST /auth/refresh', res);
        expect(res.status()).toBe(200);
        const { accessToken: newToken } = await res.json();
        expect(newToken).toBeTruthy();

        const me = await api.get('/auth/me', { headers: { Authorization: `Bearer ${newToken}` } });
        expect(me.status()).toBe(200);                                      // the refreshed token really works
    });

    // NEGATIVE: wrong login, missing token, fake token
    test('wrong password is rejected @api @security', async () => {
        const res = await api.post('/auth/login', { data: { username: env.dummyUser, password: 'wrong' } });
        await logResponse('POST /auth/login wrong password', res);
        expect(res.ok()).toBeFalsy();
        expect(res.status()).toBe(400);
    });

    const badTokenCases = [
        { name: 'no Authorization header', headers: {} as Record<string, string>, knownBug: '' },
        { name: 'fake Bearer token', headers: { Authorization: 'Bearer abc.def.ghi' },
          knownBug: 'DummyJSON returns 500 "invalid token" for a malformed JWT; correct is 401' },
        { name: 'token without "Bearer " prefix', headers: { Authorization: 'just-a-token' }, knownBug: '' },
    ];

    for (const tc of badTokenCases) {
        test(`/auth/me with ${tc.name} is rejected @api @security`, async () => {
            const res = await api.get('/auth/me', { headers: tc.headers });
            await logResponse(`GET /auth/me with ${tc.name}`, res);

            // SECURITY RULE (must always hold): a bad token never gets data
            expect(res.ok(), 'bad token must NOT return 2xx').toBeFalsy();

            if (tc.knownBug) {
                // record the defect in the HTML report instead of hiding it
                test.info().annotations.push({ type: 'known bug', description: tc.knownBug });
                expect(res.status()).toBe(500);                  // documents TODAY's behaviour; change to 401 when fixed
            } else {
                expect(res.status()).toBe(401);                  // 401 = not authenticated
            }
        });
    }
});
