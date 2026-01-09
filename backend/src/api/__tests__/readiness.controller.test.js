import { jest } from "@jest/globals";
import { checkReadiness, resetReadinessCooldown } from "../readiness.controller.js";

function createRes() {
    let payload = null;
    return {
        json(body) {
            payload = body;
            return body;
        },
        get body() {
            return payload;
        }
    };
}

describe("checkReadiness", () => {
    const originalEnv = {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY
    };

    afterEach(() => {
        resetReadinessCooldown();
        jest.restoreAllMocks();
        Object.entries(originalEnv).forEach(([key, value]) => {
            if (value === undefined) {
                delete process.env[key];
            } else {
                process.env[key] = value;
            }
        });
    });

    test("returns ready when model env is configured", () => {
        process.env.DEEPSEEK_API_KEY = "test-key";
        const res = createRes();

        checkReadiness({ body: { model: "deepseek" } }, res);

        expect(res.body).toEqual({ status: "ready" });
    });

    test("returns unavailable when model env is missing", () => {
        delete process.env.OPENAI_API_KEY;
        const res = createRes();

        checkReadiness({ body: { model: "openai" } }, res);

        expect(res.body).toEqual({
            status: "unavailable",
            reason: "model not configured"
        });
    });

    test("returns unavailable for unknown model", () => {
        const res = createRes();

        checkReadiness({ body: { model: "unknown-model" } }, res);

        expect(res.body).toEqual({
            status: "unavailable",
            reason: "model not available"
        });
    });

    test("returns busy if called within cooldown window", () => {
        process.env.OPENAI_API_KEY = "test-key";
        const res = createRes();
        const nowSpy = jest.spyOn(Date, "now");
        nowSpy.mockReturnValueOnce(1_000_000); // first call
        nowSpy.mockReturnValueOnce(1_000_005); // within 10s cooldown

        checkReadiness({ body: { model: "openai" } }, res);
        const res2 = createRes();
        checkReadiness({ body: { model: "openai" } }, res2);

        expect(res2.body).toEqual({
            status: "busy",
            reason: "temporary cooldown"
        });
    });
});
