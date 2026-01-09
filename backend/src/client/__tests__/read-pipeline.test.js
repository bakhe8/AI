import fs from "fs";
import os from "os";
import path from "path";
import { runReadPipeline, splitFile, buildContextFromFiles } from "../read-pipeline.js";

function makeTempProject(structure) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-kernel-"));
    Object.entries(structure).forEach(([relative, content]) => {
        const full = path.join(dir, relative);
        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.writeFileSync(full, content, "utf8");
    });
    return dir;
}

describe("read-pipeline", () => {
    test("selects code files and builds context", () => {
        const dir = makeTempProject({
            "src/app.js": "console.log('hello');",
            "README.md": "# test",
            "node_modules/skip.js": "ignored",
            ".git/config": "ignored"
        });

        const { files, context } = runReadPipeline(dir, { question: "What is this?" });
        expect(files.length).toBe(2);
        expect(context).toContain("Question:");
        expect(context).toMatch(/app\.js/);
        expect(context).toContain("README.md");
    });

    test("splits large files into chunks", () => {
        const dir = makeTempProject({ "src/long.js": "a".repeat(9000) });
        const chunks = splitFile(path.join(dir, "src/long.js"), { chunkSize: 4000 });
        expect(chunks.length).toBe(3);
        expect(chunks[0].length).toBe(4000);
    });

    test("buildContextFromFiles joins chunked content", () => {
        const ctx = buildContextFromFiles("Q", [{ file: "x.js", content: "part1\npart2" }], { chunkSize: 10 });
        expect(ctx).toContain("Question:");
        expect(ctx).toContain("x.js");
        expect(ctx).toContain("part1");
    });
});
