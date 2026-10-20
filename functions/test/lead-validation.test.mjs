import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import express from 'express';
import { LeadValidationError, validateLeadRequest } from '../lib/lead-validation.js';

const draft = { idempotencyKey: randomUUID(), name: ' לקוחה לבדיקה ', phone: '050-1234567', email: 'TEST@EXAMPLE.TEST', message: 'שאלה כללית\nשורה נוספת' };
test('validates and normalizes a guest contact request without adding order fields', () => {
  const input = validateLeadRequest(draft);
  assert.equal(input.name, 'לקוחה לבדיקה'); assert.equal(input.phone, '+972501234567'); assert.equal(input.email, 'test@example.test');
  assert.equal(input.message, draft.message); assert.deepEqual(Object.keys(input), Object.keys(draft));
});
test('rejects missing, oversized, non-string and control-character contact fields', () => {
  for (const patch of [{ name: '' }, { name: 'א' }, { name: 'x'.repeat(121) }, { phone: 501234567 }, { phone: 'x' }, { phone: 'x'.repeat(41) }, { email: '' }, { email: 'invalid' }, { email: 'x'.repeat(255) }, { message: '' }, { message: 'x'.repeat(4001) }, { message: 'abc\u0000' }, { idempotencyKey: 'bad' }]) {
    assert.throws(() => validateLeadRequest({ ...draft, ...patch }), LeadValidationError);
  }
  for (const raw of [null, [], 'text']) assert.throws(() => validateLeadRequest(raw), LeadValidationError);
});
test('rejects arbitrary status, timestamp, order and internal fields in direct API requests', () => {
  for (const key of ['status', 'createdAt', 'updatedAt', 'productId', 'internalNotes', 'quotedPrice', 'leadNumber', 'schemaVersion', 'toString']) assert.throws(() => validateLeadRequest({ ...draft, [key]: 'untrusted' }), LeadValidationError);
});
test('equivalent phone formats have the same normalized value for rate limiting and retries', () => {
  for (const phone of ['0501234567', '+972 50 1234567', '00972 50 1234567', '972501234567']) assert.equal(validateLeadRequest({ ...draft, phone }).phone, '+972501234567');
});
test('production contact callable enforces App Check before accepting a public request', async () => {
  delete process.env.FUNCTIONS_EMULATOR;
  process.env.GCLOUD_PROJECT = 'demo-royal-icing';
  const { submitLead } = await import('../lib/index.js');
  assert.ok(submitLead.__endpoint.secretEnvironmentVariables.some(item => item.key === 'ORDER_HASH_KEY'));
  const app = express(); app.use(express.json({ limit: '16kb' })); app.post('/submit', submitLead);
  const server = createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: draft }) });
    assert.equal(response.status, 401); assert.equal((await response.json()).error.status, 'UNAUTHENTICATED');
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
