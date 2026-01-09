import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Self-Reading Module for AI Kernel
 * Implements self-code reading with protection against infinite modification loops
 */
class SelfReader {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '../../../');
        this.selfModules = [
            'backend/src',
            'frontend',
            'docs'
        ];
        this.activeSessions = new Map();
        this.chunkSize = 1000; // tokens approximately
    }

    /**
     * Start a new self-reading session with snapshot protection
     */
    startSession(sessionId, options = {}) {
        if (this.activeSessions.has(sessionId)) {
            throw new Error(`Session ${sessionId} already active`);
        }

        const session = {
            id: sessionId,
            startTime: new Date().toISOString(),
            snapshot: this.createSelfSnapshot(),
            options: {
                includeTests: options.includeTests || false,
                includeDocs: options.includeDocs || true,
                maxDepth: options.maxDepth || 10
            },
            readFiles: new Set(),
            modifiedFiles: new Set()
        };

        this.activeSessions.set(sessionId, session);
        console.log(`[SelfReader] Started session ${sessionId} with snapshot: ${session.snapshot.hash}`);
        
        return {
            sessionId,
            snapshotHash: session.snapshot.hash,
            availableModules: this.selfModules
        };
    }

    /**
     * Create immutable snapshot of self-files for session
     */
    createSelfSnapshot() {
        const files = this.getAllSelfFiles();
        const fileHashes = {};
        
        for (const filePath of files) {
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                fileHashes[filePath] = crypto.createHash('sha256').update(content).digest('hex');
            } catch (error) {
                console.warn(`[SelfReader] Could not hash file ${filePath}:`, error.message);
            }
        }

        const combinedHash = crypto.createHash('sha256')
            .update(JSON.stringify(fileHashes))
            .digest('hex');

        return {
            hash: combinedHash,
            files: fileHashes,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Read self-files for a session with chunking
     */
    readSelfFiles(sessionId, targetPath = null) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        const files = targetPath 
            ? this.getFilesInPath(targetPath)
            : this.getAllSelfFiles();

        const results = [];

        for (const filePath of files) {
            // Self-Modification Protection: Only read original snapshot version
            if (!this.isSelfFileAllowed(filePath, session)) {
                console.log(`[SelfReader] Skipping modified file: ${filePath}`);
                continue;
            }

            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const chunks = this.chunkCode(filePath, content);
                
                results.push({
                    file: path.relative(this.projectRoot, filePath),
                    fullPath: filePath,
                    size: content.length,
                    chunks: chunks.length,
                    data: chunks
                });

                session.readFiles.add(filePath);
                
            } catch (error) {
                console.error(`[SelfReader] Error reading ${filePath}:`, error.message);
            }
        }

        return {
            sessionId,
            snapshot: session.snapshot.hash,
            readCount: results.length,
            files: results
        };
    }

    /**
     * Smart chunking for code files
     */
    chunkCode(filePath, content) {
        const lines = content.split('\n');
        const chunks = [];
        const fileExt = path.extname(filePath);
        
        let buffer = [];
        let currentSize = 0;
        let inFunction = false;
        let braceLevel = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            buffer.push(line);
            currentSize += line.length + 1; // +1 for newline

            // Track code structure for smarter chunking
            if (fileExt === '.js' || fileExt === '.ts') {
                if (line.trim().includes('function') || line.trim().includes('class')) {
                    inFunction = true;
                }
                braceLevel += (line.match(/\{/g) || []).length;
                braceLevel -= (line.match(/\}/g) || []).length;
                
                if (inFunction && braceLevel === 0) {
                    inFunction = false;
                }
            }

            // Chunk when size limit reached and we're at a good breaking point
            if (currentSize >= this.chunkSize && (!inFunction || braceLevel === 0)) {
                chunks.push(this.createChunk(filePath, buffer, chunks.length));
                buffer = [];
                currentSize = 0;
            }
        }

        // Add remaining content
        if (buffer.length > 0) {
            chunks.push(this.createChunk(filePath, buffer, chunks.length));
        }

        // Update total count for all chunks
        return chunks.map((chunk, index) => ({
            ...chunk,
            total: chunks.length
        }));
    }

    /**
     * Create a code chunk with metadata
     */
    createChunk(filePath, lines, index) {
        return {
            file: path.relative(this.projectRoot, filePath),
            index: index,
            total: 0, // Will be updated later
            content: lines.join('\n'),
            lines: lines.length,
            size: lines.join('\n').length,
            metadata: {
                language: this.getLanguageFromPath(filePath),
                type: this.getFileType(filePath)
            }
        };
    }

    /**
     * Check if self-file is allowed to be read (not modified in current session)
     */
    isSelfFileAllowed(filePath, session) {
        // Always allow reading if file wasn't modified in this session
        if (!session.modifiedFiles.has(filePath)) {
            return true;
        }

        // Block reading modified files within same session (Self-Modification Protection)
        return false;
    }

    /**
     * Get all self-files in the project
     */
    getAllSelfFiles() {
        const files = [];
        
        for (const moduleDir of this.selfModules) {
            const modulePath = path.join(this.projectRoot, moduleDir);
            if (fs.existsSync(modulePath)) {
                files.push(...this.walkDirectory(modulePath));
            }
        }

        return files.filter(file => this.shouldIncludeFile(file));
    }

    /**
     * Get files in specific path
     */
    getFilesInPath(targetPath) {
        const fullPath = path.resolve(this.projectRoot, targetPath);
        
        if (!fs.existsSync(fullPath)) {
            throw new Error(`Path not found: ${targetPath}`);
        }

        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
            return [fullPath];
        }
        
        return this.walkDirectory(fullPath).filter(file => this.shouldIncludeFile(file));
    }

    /**
     * Recursively walk directory
     */
    walkDirectory(dir, maxDepth = 10) {
        if (maxDepth <= 0) return [];
        
        const files = [];
        
        try {
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                const itemPath = path.join(dir, item);
                const stat = fs.statSync(itemPath);
                
                if (stat.isDirectory() && !this.shouldSkipDirectory(item)) {
                    files.push(...this.walkDirectory(itemPath, maxDepth - 1));
                } else if (stat.isFile()) {
                    files.push(itemPath);
                }
            }
        } catch (error) {
            console.warn(`[SelfReader] Cannot read directory ${dir}:`, error.message);
        }

        return files;
    }

    /**
     * Check if file should be included in self-reading
     */
    shouldIncludeFile(filePath) {
        const fileName = path.basename(filePath);
        const ext = path.extname(filePath).toLowerCase();
        
        // Skip hidden files and common build artifacts
        if (fileName.startsWith('.') || fileName.startsWith('~')) {
            return false;
        }

        // Include code files, configs, docs
        const includedExtensions = [
            '.js', '.ts', '.jsx', '.tsx',
            '.json', '.md', '.html', '.css',
            '.py', '.txt', '.yml', '.yaml'
        ];

        return includedExtensions.includes(ext);
    }

    /**
     * Check if directory should be skipped
     */
    shouldSkipDirectory(dirName) {
        const skipDirs = [
            'node_modules', '.git', '.vscode', 'dist', 'build', 
            '.next', 'coverage', '__pycache__', '.pytest_cache',
            'data', 'logs', 'tmp'
        ];
        
        return skipDirs.includes(dirName);
    }

    /**
     * Get programming language from file path
     */
    getLanguageFromPath(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const langMap = {
            '.js': 'javascript',
            '.ts': 'typescript',
            '.jsx': 'javascript',
            '.tsx': 'typescript',
            '.py': 'python',
            '.md': 'markdown',
            '.html': 'html',
            '.css': 'css',
            '.json': 'json',
            '.yml': 'yaml',
            '.yaml': 'yaml'
        };
        
        return langMap[ext] || 'text';
    }

    /**
     * Get file type category
     */
    getFileType(filePath) {
        const fileName = path.basename(filePath);
        
        if (fileName.includes('test') || fileName.includes('spec')) {
            return 'test';
        }
        
        if (fileName.includes('config') || fileName.includes('package')) {
            return 'config';
        }
        
        if (path.extname(filePath) === '.md') {
            return 'documentation';
        }
        
        return 'source';
    }

    /**
     * Mark file as modified to prevent re-reading in same session
     */
    markFileModified(sessionId, filePath) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            session.modifiedFiles.add(filePath);
            console.log(`[SelfReader] File marked as modified: ${filePath}`);
        }
    }

    /**
     * End session and cleanup
     */
    endSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            console.log(`[SelfReader] Ending session ${sessionId}. Files read: ${session.readFiles.size}, Modified: ${session.modifiedFiles.size}`);
            this.activeSessions.delete(sessionId);
            return {
                duration: Date.now() - new Date(session.startTime).getTime(),
                filesRead: session.readFiles.size,
                filesModified: session.modifiedFiles.size
            };
        }
        return null;
    }

    /**
     * Get session info
     */
    getSession(sessionId) {
        return this.activeSessions.get(sessionId);
    }

    /**
     * List active sessions
     */
    listActiveSessions() {
        return Array.from(this.activeSessions.values()).map(session => ({
            id: session.id,
            startTime: session.startTime,
            snapshotHash: session.snapshot.hash,
            filesRead: session.readFiles.size,
            filesModified: session.modifiedFiles.size
        }));
    }
}

const selfReader = new SelfReader();
export default selfReader;