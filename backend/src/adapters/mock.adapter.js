export const mockAdapter = {
    async send(messages) {
        return {
            role: "assistant",
            content: "Mock adapter response"
        };
    }
};