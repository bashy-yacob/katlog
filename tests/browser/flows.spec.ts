import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

const requireServer = createRequire(new URL('../../functions/package.json', import.meta.url));
const { initializeApp, deleteApp } = requireServer('firebase-admin/app');
const { getFirestore, FieldValue } = requireServer('firebase-admin/firestore');
const password = 'emulator-browser-password';
let email: string;
let productId: string;
let productName: string;

test.beforeAll(async ({}, testInfo) => {
  expect(process.env.FIRESTORE_EMULATOR_HOST).toBe('127.0.0.1:8080');
  const id = `${testInfo.project.name}-${randomUUID()}`;
  email = `${id}@example.test`; productId = `browser-${id}`; productName = `מוצר בדיקת דפדפן ${testInfo.project.name}`;
  const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
  const user = await response.json(); expect(response.ok).toBe(true);
  const grant = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-api-key', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' }, body: JSON.stringify({ localId: user.localId, customAttributes: JSON.stringify({ admin: true }) }) });
  expect(grant.ok).toBe(true);
  const app = initializeApp({ projectId: 'demo-royal-icing' }, id);
  const db = getFirestore(app);
  try { await db.doc(`products/${productId}`).set({ name: productName, description: 'מוצר לבדיקות מקומיות בלבד', category: 'cookies', image: '/images/home/floral-set.webp', price: 120, isActive: true, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }); }
  finally { await db.terminate(); await deleteApp(app); }
});
async function login(page: Page, destination: string) {
  await page.goto(destination);
  await expect(page.getByRole('heading', { name: 'כניסת מנהלת' })).toBeVisible();
  await page.getByLabel('אימייל', { exact: true }).fill(email);
  await page.getByLabel('סיסמה').fill(password);
  await page.getByRole('button', { name: 'כניסה לניהול', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${destination}$`));
}
async function accessible(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {})));
  });
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations.map(item => ({ id: item.id, impact: item.impact, targets: item.nodes.map(node => node.target) }))).toEqual([]);
}

test('public pages support RTL, keyboard navigation, narrow screens and basic accessibility', async ({ page }) => {
  for (const path of ['/', '/catalog', `/catalog/${productId}`, `/catalog/${productId}/order`, '/contact', '/admin/login']) {
    await page.goto(path); await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByText(/טוענת את פרטי|טוענת את העוגיות/)).toHaveCount(0);
    await accessible(page);
  }
  await page.goto('/contact'); await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: /דילוג/ })).toBeFocused();
  await page.screenshot({ path: `test-results/contact-${test.info().project.name}.png`, fullPage: true });
});

test('guest submits an order; manager updates price and status; independent browser reads saved values', async ({ page, browser }) => {
  await page.goto(`/catalog/${productId}/order`);
  await page.getByLabel('שם מלא *').fill('לקוחת בדיקת דפדפן');
  const phone = test.info().project.name === 'desktop' ? '0507777777' : '0508888888';
  await page.getByLabel('טלפון *').fill(phone);
  const future = new Date(); future.setUTCDate(future.getUTCDate() + 3);
  await page.getByLabel('תאריך איסוף מבוקש *').fill(future.toISOString().slice(0, 10));
  await page.getByRole('button', { name: 'שליחת בקשת הזמנה' }).click();
  await expect(page.getByRole('heading', { name: 'בקשתך התקבלה לבדיקה' })).toBeVisible();
  const number = (await page.locator('.order-receipt strong').textContent())!;
  const manager = await browser.newContext({ viewport: page.viewportSize()! });
  const admin = await manager.newPage();
  try {
    await login(admin, '/admin/orders');
    await admin.getByRole('button', { name: `פרטי בקשה ${number}` }).click();
    await expect(admin.getByRole('dialog')).toBeVisible(); await accessible(admin);
    await admin.getByLabel('סטטוס', { exact: true }).selectOption('in_progress');
    await admin.getByLabel('הצעת מחיר כוללת (₪)').fill('250');
    await admin.getByLabel('אישור מחיר', { exact: true }).selectOption('confirm');
    await admin.getByLabel('מחיר כולל מאושר (₪)').fill('230');
    await admin.getByLabel('הערות פנימיות').fill('תיאום לבדיקה מקומית');
    await admin.getByRole('button', { name: 'שמירת שינויים' }).click();
    await expect(admin.getByText('השינויים נשמרו בהצלחה.')).toBeVisible();
    await admin.reload();
    await admin.getByRole('button', { name: `פרטי בקשה ${number}` }).click();
    await expect(admin.getByLabel('הצעת מחיר כוללת (₪)')).toHaveValue('250');
    await expect(admin.getByLabel('סטטוס', { exact: true })).toHaveValue('in_progress');
    await expect(admin.getByLabel('הערות פנימיות')).toHaveValue('תיאום לבדיקה מקומית');
  } finally { await manager.close(); }
});

test('guest contact becomes a real lead and status survives a browser reload', async ({ page }) => {
  await page.goto('/contact');
  await page.getByLabel('שם מלא *').fill('פניית בדיקת דפדפן');
  await page.getByLabel('טלפון *').fill(test.info().project.name === 'desktop' ? '0507777777' : '0508888888');
  await page.getByLabel('אימייל *').fill(`contact-${randomUUID()}@example.test`);
  await page.getByLabel('הודעה *').fill('בדיקה מקומית של טופס פנייה');
  await page.getByRole('button', { name: 'שלח הודעה' }).click();
  await expect(page.getByRole('heading', { name: 'הפנייה התקבלה' })).toBeVisible();
  await login(page, '/admin/leads');
  await page.getByRole('button', { name: 'פרטי הפנייה של פניית בדיקת דפדפן' }).last().click();
  await accessible(page);
  await page.getByRole('button', { name: 'נוצר קשר', exact: true }).click();
  await expect(page.getByText('סטטוס הפנייה נשמר בהצלחה.')).toBeVisible();
  await page.reload();
  await expect(page.locator('tr', { hasText: 'פניית בדיקת דפדפן' }).filter({ hasText: 'נוצר קשר' }).first()).toBeVisible();
});

test('a lost order acknowledgement keeps input and recovers the same saved request', async ({ page }) => {
  await page.goto(`/catalog/${productId}/order`);
  await page.getByLabel('שם מלא *').fill('בדיקת רשת מקומית');
  await page.getByLabel('טלפון *').fill('0509999999');
  const future = new Date(); future.setUTCDate(future.getUTCDate() + 3);
  await page.getByLabel('תאריך איסוף מבוקש *').fill(future.toISOString().slice(0, 10));
  let savedNumber: string | undefined;
  await page.route('**/submitOrder', async route => {
    if (route.request().method() !== 'POST') { await route.continue(); return; }
    const response = await route.fetch();
    savedNumber = (await response.json()).result?.orderNumber;
    await route.abort('failed');
  });
  await page.getByRole('button', { name: 'שליחת בקשת הזמנה' }).click();
  await expect(page.getByRole('alert')).toContainText('ייתכן שהיא נשמרה');
  await expect(page.getByLabel('שם מלא *')).toHaveValue('בדיקת רשת מקומית');
  expect(savedNumber).toMatch(/^RI-[A-F0-9]{20}$/);
  await page.unroute('**/submitOrder');
  await page.getByRole('button', { name: 'בדיקת קליטת הבקשה וניסיון חוזר' }).click();
  await expect(page.locator('.order-receipt strong')).toHaveText(savedNumber!);
});

test('manager creates, edits and deletes a product visible to a separate guest browser', async ({ page, browser }) => {
  await login(page, '/admin/products');
  const name = `עוגיות לבדיקת CRUD ${randomUUID().slice(0, 8)}`;
  await page.getByRole('button', { name: '+ הוסף מוצר חדש', exact: true }).click();
  await page.getByLabel('שם המוצר *').fill(name);
  await page.getByLabel('מחיר התחלתי (₪) *').fill('140');
  await page.getByRole('button', { name: 'העלאה מהמחשב' }).click();
  await page.getByLabel('בחר תמונה מהמחשב:').setInputFiles('public/images/home/floral-set.webp');
  await accessible(page);
  await page.getByRole('button', { name: 'הוסף למוצרים' }).click();
  await expect(page.getByText('המוצר נוסף לקטלוג.')).toBeVisible();
  const visitor = await browser.newContext(); const catalog = await visitor.newPage();
  try {
    await catalog.goto('http://127.0.0.1:4173/catalog'); await expect(catalog.getByRole('heading', { name, exact: true })).toBeVisible();
    await page.getByRole('button', { name: `עריכת ${name}`, exact: true }).click();
    await page.getByLabel('שם המוצר *').fill(name + ' מעודכן');
    await page.getByRole('button', { name: 'עדכן', exact: true }).click();
    await expect(page.getByText('פרטי המוצר עודכנו.')).toBeVisible();
    await catalog.reload(); await expect(catalog.getByRole('heading', { name: name + ' מעודכן', exact: true })).toBeVisible();
    await page.getByRole('button', { name: `מחיקת ${name} מעודכן`, exact: true }).click();
    await page.getByRole('button', { name: 'כן, למחוק מוצר' }).click();
    await expect(page.getByText('המוצר הוסר מהקטלוג.')).toBeVisible();
    await catalog.reload(); await expect(catalog.getByRole('heading', { name: name + ' מעודכן', exact: true })).toHaveCount(0);
  } finally { await visitor.close(); }
});
