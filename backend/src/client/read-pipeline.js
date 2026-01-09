import fs from "fs";
import path from "path";

const DEFAULT_IGNORE = new Set([
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    ".turbo",
    "coverage",
    "tmp",
    "temp"
]);

const DEFAULT_EXT = new Set([".js", ".ts", ".jsx", ".tsx", ".json", ".md", ".yml", ".yaml"]);

function walk(dir, ignore = DEFAULT_IGNORE, acc = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (ignore.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(full, ignore, acc);
        } else {
            acc.push(full);
        }
    }
    return acc;
}

function filterFiles(files, { exts = DEFAULT_EXT, maxFiles = 50, maxSize = 80_000 } = {}) {
    const filtered = files
        .filter(f => exts.has(path.extname(f).toLowerCase()))
        .map(f => ({ file: f, size: fs.statSync(f).size }))
        .filter(f => f.size <= maxSize)
        .sort((a, b) => b.size - a.size) // prioritize larger (likely code) first
        .slice(0, maxFiles)
        .map(f => f.file);
    return filtered;
}

function readFiles(files, { maxBytesPerFile = 60_000 } = {}) {
    return files.map(file => {
        const raw = fs.readFileSync(file, "utf8");
        const content = raw.length > maxBytesPerFile ? raw.slice(0, maxBytesPerFile) : raw;
        return { file, content };
    });
}

function chunkContent(content, { chunkSize = 4000 } = {}) {
    if (!content) return [];
    const chunks = [];
    for (let i = 0; i < content.length; i += chunkSize) {
        chunks.push(content.slice(i, i + chunkSize));
    }
    return chunks;
}

function buildContext({ question, files }) {
    const parts = [];
    if (question) {
        parts.push(`Question:\n${question}\n`);
    }
    files.forEach(({ file, content }) => {
        parts.push(`File: ${file}\n${content}\n`);
    });
    return parts.join("\n---\n");
}

export function runReadPipeline(root, { question, ignore = DEFAULT_IGNORE, exts = DEFAULT_EXT } = {}) {
    const discovered = walk(root, ignore);
    const selected = filterFiles(discovered, { exts });
    const files = readFiles(selected);
    const context = buildContext({ question, files });
    return { files, context };
}

export function buildContextFromFiles(question, files, options = {}) {
    const processed = files.map(f => ({
        file: f.file,
        content: chunkContent(f.content, { chunkSize: options.chunkSize || 4000 }).join("\n")
    }));
    return buildContext({ question, files: processed });
}

export function splitFile(filePath, options = {}) {
    const content = fs.readFileSync(filePath, "utf8");
    return chunkContent(content, options);
}
