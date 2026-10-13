import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
const rules = [/https?:\/\/(?:api|res|app)\.beatnow\.app/gi, /http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/gi, /(?:sk-proj-|AKIA)[A-Za-z0-9]{12,}/g, /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g, /mongodb(?:\+srv)?:\/\/[^\s"']+/g];
let failures = 0;
async function scan(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await scan(file);
    else if (/\.(?:js|html|css|json|map)$/.test(file)) {
      if (file.endsWith('.map')) { console.error('Unexpected source map:', file); failures++; }
      const data = await readFile(file, 'utf8');
      for (const rule of rules) { rule.lastIndex = 0; if (rule.test(data)) { console.error('Forbidden configuration/secret pattern in', file, rule.source); failures++; } }
    }
  }
}
await scan('dist');
if (failures) process.exitCode = 1; else console.log('PASS: no legacy domains, local API URLs, source maps or recognized secret patterns in production artifacts.');
