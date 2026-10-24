import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pageModule } from '../src/routes/pageModule';

test('a page imports once and renders synchronously after preloading', async () => {
  let calls = 0;
  const Page = () => null;
  const page = pageModule(async () => {
    calls++;
    return { default: Page };
  });
  const first = page.load();
  assert.equal(page.load(), first);
  await first;
  assert.equal(page.Component().type, Page);
  await page.load();
  assert.equal(calls, 1);
});

test('unvisited history destinations suspend on their shared import', async () => {
  const page = pageModule(async () => ({ default: () => null }));
  const pending = page.load();
  assert.throws(
    () => page.Component(),
    (error) => error === pending
  );
  await pending;
  assert.doesNotThrow(() => page.Component());
});

test('failed imports reach the error boundary instead of suspending forever', async () => {
  const failure = new Error('Chunk unavailable');
  const page = pageModule(async () => {
    throw failure;
  });
  await assert.rejects(page.load(), failure);
  assert.throws(() => page.Component(), failure);
});

test('resetting the error boundary retries a failed page import', async () => {
  const failure = new Error('Temporary network failure');
  let calls = 0;
  const page = pageModule(async () => {
    if (++calls === 1) throw failure;
    return { default: () => null };
  });
  await assert.rejects(page.load(), failure);
  assert.throws(() => page.Component(), failure);
  const retry = page.load();
  assert.throws(
    () => page.Component(),
    (error) => error === retry
  );
  await retry;
  assert.doesNotThrow(() => page.Component());
  assert.equal(calls, 2);
});
