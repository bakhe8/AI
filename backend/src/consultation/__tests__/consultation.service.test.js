import { jest } from "@jest/globals";
import consultationService, { __setAdapterResolver } from "../service.js";
import consultationStore from "../store.js";

const mockSend = jest.fn(async (messages) => ({
    role: "assistant",
    content: `analysis of ${messages?.[1]?.content || ""}`
}));

describe("consultationService", () => {
    beforeEach(() => {
        __setAdapterResolver(() => ({ send: mockSend }));
        mockSend.mockClear();
        consultationStore.reset();
    });

    afterEach(() => {
        __setAdapterResolver(null);
    });

    test("starts consultation with mock models and returns consensus", async () => {
        const { consultId, status, models } = consultationService.start({
            question: "Is the code secure?",
            snapshot: "module.exports = {}",
            models: ["mock"]
        });
        expect(status).toBe("running");
        expect(models).toEqual(["mock"]);
        expect(consultId).toMatch(/consult-/);

        // Wait for async completion
        await new Promise(resolve => setTimeout(resolve, 10));

        const transcript = consultationService.transcript(consultId);
        expect(transcript.transcripts.length).toBe(1);
        expect(transcript.transcripts[0].response).toContain("analysis of");

        const consensus = consultationService.consensus(consultId);
        expect(consensus?.consensus).toBeDefined();
        expect(consensus.consensus.warnings.length).toBe(0);
    });

    test("rejects missing question or snapshot", () => {
        expect(() => consultationService.start({ question: "", snapshot: "x" })).toThrow("question is required");
        expect(() => consultationService.start({ question: "q", snapshot: "" })).toThrow("snapshot is required");
    });
});
