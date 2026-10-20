import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const html = await readFile('dist/index.html', 'utf8');
assert.match(html, /lang="he"/); assert.match(html, /dir="rtl"/);
const scripts = (await readdir('dist/assets')).filter(name => name.endsWith('.js'));
assert.ok(scripts.length > 0, 'Build must contain client JavaScript');
// Firebase's Web API key is public configuration. These patterns are server
// credentials or the server-only signing key, which must never enter a bundle.
const forbidden = [/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/, /local-demo-only-order-hash-key-not-for-production/, /ORDER_HASH_KEY/, /"private_key"\s*:/];
for (const file of scripts) {
  const source = await readFile(`dist/assets/${file}`, 'utf8');
  for (const pattern of forbidden) assert.equal(pattern.test(source), false, `Server credential pattern in ${file}`);
}
const deployment = JSON.parse(await readFile('vercel.json', 'utf8'));
assert.equal(deployment.outputDirectory, 'dist');
assert.ok(deployment.rewrites.some(rule => rule.source === '/(.*)' && rule.destination === '/index.html'), 'SPA routes require a fallback on Vercel');
console.log(`Production bundle checked: ${scripts.length} JavaScript files, Hebrew/RTL and server-credential patterns; SPA fallback configured.`);
