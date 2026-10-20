// Read-only smoke check. Never fills forms, signs in or invokes a submission.
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const target = new URL(process.argv[2] || 'https://katlog-kappa.vercel.app');
if (target.protocol !== 'https:' || target.username || target.password) throw new Error('Use a public HTTPS site URL');
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined) });
const results = [];
await mkdir('artifacts/stage7/deployed', { recursive: true });
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    for (const path of ['/', '/catalog', '/contact', '/admin/login', '/admin/orders', '/admin/leads']) {
      const result = { path, width };
      try {
        const response = await page.goto(new URL(path, target).href, { waitUntil: 'networkidle', timeout: 30000 });
        result.status = response?.status();
        result.finalPath = new URL(page.url()).pathname;
        result.headings = await page.locator('h1').allTextContents();
        result.rtl = await page.locator('html').getAttribute('dir');
        result.horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
        result.failedImages = await page.locator('img').evaluateAll(images => images.filter(img => img.complete && img.naturalWidth === 0).map(img => new URL(img.src).pathname));
        result.unconfiguredNotice = await page.getByText(/חיבור Firebase טרם הוגדר|יש להשלים את חיבור|שליחת הודעות דרך הטופס עדיין אינה זמינה/).count();
        const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        result.accessibility = audit.violations.map(item => ({ id: item.id, impact: item.impact, targets: item.nodes.map(node => node.target) }));
        result.securityHeaders = Object.fromEntries(['strict-transport-security', 'content-security-policy', 'x-content-type-options', 'referrer-policy', 'permissions-policy'].map(name => [name, Boolean(response?.headers()[name])]));
        await page.screenshot({ path: `artifacts/stage7/deployed/${path.replaceAll('/', '_') || 'home'}-${width}.png`, fullPage: true });
      } catch (error) { result.error = error.name; }
      results.push(result);
    }
    await context.close();
  }
} finally { await browser.close(); }
await writeFile('artifacts/stage7/deployed/results.json', JSON.stringify({ origin: target.origin, checkedAt: new Date().toISOString(), results }, null, 2));
console.log(JSON.stringify(results, null, 2));
if (results.some(item => item.error || item.status !== 200 || item.horizontalOverflow || item.accessibility?.length || item.failedImages?.length)) process.exitCode = 1;
