import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'MANIFEST_SHA256.txt');

const excludedTopDirs = new Set([
  '.git', '.sites-runtime', '.wrangler', 'node_modules', '.cache', '.npm', '.pnpm-store', '.yarn', 'coverage', 'tmp', 'temp', 'dist', 'docs',
  '.local-data', '.local-backups', '.server-data', 'server-data', '.vntech_backups', '.vntech_update_state'
]);
const excludedNames = new Set(['MANIFEST_SHA256.txt', 'SHA256_MANIFEST.txt', '.env', 'deploy/.active-profile.json']);
const volatileFile = (name) => /(?:^|[-_.])(debug|error)?\.log$/i.test(name) || /^(npm|yarn|pnpm)-debug\.log/i.test(name) || /\.tmp$/i.test(name) || /\.(?:zip|sqlite|db|log)$/i.test(name);

function walk(dir) {
  const outFiles = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, ent.name);
    const rel = relative(root, abs).split(sep).join('/');
    const top = rel.split('/')[0];
    if (excludedTopDirs.has(top)) continue;
    if (ent.isDirectory()) outFiles.push(...walk(abs));
    else if (ent.isFile()) {
      if (excludedNames.has(rel) || volatileFile(ent.name)) continue;
      outFiles.push(rel);
    }
  }
  return outFiles;
}

const files = walk(root).sort((a,b)=>a.localeCompare(b,'en'));
const lines = files.map((rel) => {
  const hash = createHash('sha256').update(readFileSync(join(root, rel))).digest('hex');
  return `${hash}  ./${rel}`;
});
writeFileSync(out, `${lines.join('\n')}\n`, 'utf8');
console.log(`VNTECH release manifest generated: ${files.length} files · volatile cache/log/update-backup state excluded.`);
