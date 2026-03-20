/**
 * Count .js files under api/ (Vercel Hobby: keep ≤ 12). Shared code must live outside api/, e.g. server-lib/.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = path.join(root, 'api');

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (name.endsWith('.js')) acc.push(path.relative(root, p).replace(/\\/g, '/'));
  }
  return acc;
}

const files = walk(apiDir).sort();
const n = files.length;
const limit = 12;
console.log(`api/**/*.js count: ${n} (Hobby limit ${limit})`);
if (n) console.log(files.join('\n'));
process.exit(n > limit ? 1 : 0);
