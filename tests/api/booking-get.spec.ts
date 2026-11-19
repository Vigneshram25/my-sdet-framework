import { test, expect } from '@playwright/test';
import { request } from 'node:http';
import { array } from 'node:stream/iter';

//the "request" fixture = an HTTP client. No browser opens for these tests

test.describe('Restful Booker - GET basics', () => {

    test('health check: GET /ping returns 201 @smoke @api', async ({ request }) => {
        const response = await request.get('/ping');                        //baseURL + '/ping'
        expect(response.status()).toBe(201);                                //this API returns 201 for ping(its own quirk)
    });

    test('GET /booking returns a list of booking ids @api', async ({ request }) => {
        const response = await request.get('/booking');

        expect(response.ok()).toBeTruthy();                                 //ok() = any status from 200 to 299
        expect(response.headers()['content-type']).toContain('application/json');
        
        const body: { bookingid: number }[] = await response.json();
        console.log('total bookings: ', body.length, '| first:', body[0]);

        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThan(0);
        expect(typeof body[0].bookingid).toBe('number');
    });

    test('GET /booking/:id returns full boking details @api', async ({ request }) => {
        //1) get any existing id from the list
        const list: { bookingid: number }[] = await (await request.get('/booking')).json();
        const id = list[0].bookingid;

        //2) get that one booking
        const response = await request.get(`/booking/${id}`);
        expect(response.status()).toBe(200);

        const booking = await response.json();
        console.log(`booking ${id}:`, booking);

        //3) check the SHAPE and TYPES of the data
        expect(booking).toHaveProperty('firstname');
        expect(booking).toHaveProperty('lastname');
        expect(booking).toHaveProperty('bookingdates.checkin');                 //dot path = nested property
        expect(typeof booking.totalprice).toBe('number');
        expect(typeof booking.depositpaid).toBe('boolean');
    });

    test('GET /booking with query params filter results @api', async ({ request }) => {
        //params become ?firstname=Jim (playwright encodes them for you)
        const response = await request.get('/booking', { params: { firstname: 'Jim' }});
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);                                  //may be empty: shared public data changes
    });

    test('GET a booking that does not exist returns 404 @api', async ({ request }) => {
        const response = await request.get('/booking/999999999');
        expect(response.status()).toBe(404);                                     //NEGATIVE Test: the API says 'not found'

    });

    test('response time is under 3 seconds @api', async ({ request }) => {
        const start = Date.now();
        const response = await request.get('/booking');
        const ms = Date.now() - start;
        console.log(`GET /booking took ${ms} ms`);

        expect(response.ok()).toBeTruthy();
        expect(ms).toBeLessThan(3000);                                            //a simple performance guard, not a load test
    });

});