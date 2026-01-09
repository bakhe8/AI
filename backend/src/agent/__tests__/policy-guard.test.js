// Policy Guard: raw-measurements must not contain guidance/summaries

import fs from 'fs';
import path from 'path';

const RAW_DIR = path.join(process.cwd(), 'src', 'agent', 'outputs', 'raw-measurements');
const BANNED = ['recommend', 'should', 'deploy', 'critical', 'rating'];

function readAllFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir);
    return files
        .filter(f => fs.statSync(path.join(dir, f)).isFile())
        .map(f => ({
            name: f,
            content: fs.readFileSync(path.join(dir, f), 'utf8')
        }));
}

describe('Policy Guard - raw-measurements are raw only', () => {
    test('no banned guidance words in raw-measurements', () => {
        const files = readAllFiles(RAW_DIR);
        for (const file of files) {
            const lower = file.content.toLowerCase();
            for (const banned of BANNED) {
                expect(lower).not.toContain(banned);
            }
        }
    });
});
