import { test, expect, APIRequestContext, APIResponse } from '@playwright/test';
import { env } from '@config/env';


//--------------TYPES: describes the data once
interface BookingDates { checkin: string; checkout: string; }
interface Booking {
    firstname: string;
    lastname: string;
    totalprice: number;
    depositpaid: boolean;
    bookingdates: BookingDates;
    additionalneeds?: string;                               // ? = optional field
}

//-----------------Test Data Builder: valid data by default, override what a test cares about -------------------
function buildBooking(overrides:Partial<Booking> = {}): Booking {
    return {
        firstname: 'Vignesh',
        lastname: `QA-${Date.now()}`,                       //unique value, so we can recognise our booking
        totalprice: 1500,
        depositpaid: true,
        bookingdates: { checkin: '2026-12-01', checkout: '2026-12-05' },
        additionalneeds: 'Breakfast',
        ...overrides,                                       //spread: the test value replace the defaults
    };
}

// ---------- LOG HELPER: print method, URL, status and body of ANY response ----------
async function logResponse(label: string, response: APIResponse): Promise<void> {
    const text = await response.text();                     // raw body (works for JSON and plain text)
    let body: unknown = text;
    try { body = JSON.parse(text); } catch { /* not JSON, e.g. "Created" from DELETE */ }
    console.log(`\n===== ${label} =====`);
    console.log(`URL    : ${response.url()}`);
    console.log(`STATUS : ${response.status()} ${response.statusText()}`);
    console.log('BODY   :', body);
}

//--------------------HELPER: get an auth token (full auth lesson = 4.3)------------------------------
async function getToken(request: APIRequestContext): Promise<string> {
    const response = await request.post('/auth', {
        data: { username: env.bookerUser, password: env.bookerPassword },           //data = JSON body
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.token).toBeTruthy();                                                  //this API returns 200 even for bad credentials, so check the token
    return body.token;
}

test.describe('Restful Booker - CRUD', () => {
    let createdId: number | undefined;                                  //remember what we created, so afterEach can delete it
    
    test.afterEach(async ({ request }, testinfo) => {
        //Cleanup runs after every test, pass or fail: leave no junk data behind
        if (createdId) {
            const token = await getToken(request);
            const response = await request.delete(`/booking/${createdId}`, { headers: { Cookie: `token=${token}` } });
            console.log(`CLEANUP after "${testinfo.title}": deleted booking ${createdId} -> status ${response.status()}`);
            createdId = undefined;
        } else {
            console.log(`CLEANUP after "${testinfo.title}": nothing to delete`);
        }
    });

    test('POST creates a booking and return it @smoke @api', async ({ request }) => {
        const newBooking = buildBooking();
        console.log('REQUEST BODY:', newBooking);

        const response = await request.post('/booking', { data: newBooking });
        await logResponse('POST /booking', response);
        expect(response.status()).toBe(200);

        const body = await response.json();
        createdId = body.bookingid;
        
        expect(typeof body.bookingid).toBe('number');
        expect(body.booking).toEqual(newBooking);               //the API returns exactly what we sent
    });

    test ('full CRUD lifecycle @regression @api', async ({ request}) => {
        const token = await getToken(request);
        const auth = { Cookie: `token=${token}` };              //header object reused by PUT, PATCH, DELETE
        let id = 0;

        await test.step('CREATE: POST /booking', async () => {
            const response =await request.post('/booking', { data: buildBooking() });
            await logResponse('1. CREATE  POST /booking', response);
            expect (response.status()).toBe(200);
            id = (await response.json()).bookingid;
            createdId = id;                                     //safety net: afterEach Deletes it if a later step fails.
        });

        await test.step('READ: GET /booking/:id', async () => {
            const response = await request.get(`/booking/${id}`);
            await logResponse(`2. READ    GET /booking/${id}`, response);
            expect(response.status()).toBe(200);
            expect((await response.json()).firstname).toBe('Vignesh');
        });

        await test.step('UPDATE (full): PUT replaces the whole booking', async () => {
            const updated = buildBooking({ firstname: 'Ram', totalprice: 2000, depositpaid: false });
            const response = await request.put(`/booking/${id}`, { data: updated, headers: auth });
            await logResponse(`3. UPDATE  PUT /booking/${id}`, response);
            expect (response.status()).toBe(200);
            const body = await response.json();
            expect(body.firstname).toBe('Ram');
            expect(body.totalprice).toBe(2000);
            expect(body.depositpaid).toBe(false);
        });

        await test.step('UPDATE (Partial): PATCH Changes only the fields sent', async () => {
            const response = await request.patch(`/booking/${id}`, {
                data: { additionalneeds: 'Late checkout' },
                headers: auth,
            });
            await logResponse(`4. PATCH   PATCH /booking/${id}`, response);
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body.additionalneeds).toBe('Late checkout');         //changed
            expect(body.firstname).toBe('Ram');                         //untouched: still the PUT value
        });

        await test.step('DELETE: DELETE /booking/:id', async () => {
            const response = await request.delete(`/booking/${id}`, { headers: auth });
            await logResponse(`5. DELETE  DELETE /booking/${id}`, response);
            expect(response.status()).toBe(201);                        //Restful booker quirk: 201 for delete
            createdId = undefined;                                      //Already deleted, nothing for afterEach to do
        });

        await test.step('VERIFY: GET after delete returns 404', async () => {
            const response = await request.get(`/booking/${id}`);
            await logResponse(`6. VERIFY  GET /booking/${id} after delete`, response);
            expect(response.status()).toBe(404);
        });
    });

    //-------------------NEGATIVE Tests----------------------------------------------
    test('PUT without a token is forbidden (403) @regression @api', async ({ request }) => {
        const createResponse = await request.post('/booking', { data: buildBooking() });
        await logResponse('NEG-1 setup: POST /booking', createResponse);
        createdId = (await createResponse.json()).bookingid;

        const response = await request.put(`/booking/${createdId}`, { data: buildBooking({ firstname: 'Hacker' }) });
        await logResponse(`NEG-1 PUT /booking/${createdId} WITHOUT token`, response);
        expect(response.status()).toBe(403);                        // No cookie header = not allowed
    });

    test('Wrong Credentials return no token @regression @api', async ({ request }) => {
        const response = await request.post('/auth', {data: {username: 'admin', password: 'wrong' } });
        await logResponse('NEG-2 POST /auth with wrong password', response);
        expect(response.status()).toBe(200);                        //quirk: still 200
        const body =await response.json();
        expect(body.token).toBeUndefined();                         //...but NO Token
        expect(body.reason).toBe('Bad credentials');                //and a reason instead
    });

    test('POST with missing required fields is rejected @regression @api', async ({ request }) => {
        const response =await request.post('/booking', { data: {firstname: 'OnlyName' } });
        await logResponse('NEG-3 POST /booking with missing fields', response);
        expect(response.ok()).toBeFalsy();
    });

});