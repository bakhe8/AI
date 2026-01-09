// Error handler tests

import { errorMiddleware, ValidationError } from '../error-handler.js';

function createRes() {
    return {
        statusCodeSet: null,
        jsonBody: null,
        status(code) {
            this.statusCodeSet = code;
            return this;
        },
        json(body) {
            this.jsonBody = body;
            return this;
        }
    };
}

describe('errorMiddleware', () => {
    test('returns error payload with code for ValidationError', () => {
        const res = createRes();
        errorMiddleware(new ValidationError('bad input'), {}, res, () => {});
        expect(res.statusCodeSet).toBe(400);
        expect(res.jsonBody).toEqual({ error: 'bad input', code: 400 });
    });

    test('returns 500 payload with code when no status provided', () => {
        const res = createRes();
        errorMiddleware(new Error('oops'), {}, res, () => {});
        expect(res.statusCodeSet).toBe(500);
        expect(res.jsonBody).toEqual({ error: 'oops', code: 500 });
    });
});
