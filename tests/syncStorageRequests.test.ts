import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import { supabase, type Session } from '../src/auth/core/Supabase';
import { syncStorage } from '../src/auth/storage/syncStorage';

afterEach(() => mock.restoreAll());

test('concurrent reads share a request, stay isolated by user, and do not cache stale data', async () => {
  let userId = 'alice';
  mock.method(supabase.auth, 'getSession', async () => ({
    data: { session: { user: { id: userId } } as Session },
    error: null
  }));
  const requests: {
    user: string;
    key: string;
    resolve: (data: { data: { value: string }; error: null }) => void;
  }[] = [];
  mock.method(supabase, 'from', () => {
    let user = '',
      key = '';
    const query = {
      select: () => query,
      eq: (field: string, value: string) => {
        if (field === 'user_id') user = value;
        else key = value;
        return query;
      },
      returns: () => query,
      maybeSingle: () =>
        new Promise((resolve) => {
          requests.push({ user, key, resolve });
        })
    };
    return query;
  });
  const first = syncStorage.get('theme');
  const duplicate = syncStorage.get('theme');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(requests.length, 1);
  userId = 'bob';
  const otherUser = syncStorage.get('theme');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(requests.length, 2);
  requests[0]!.resolve({ data: { value: 'alice-theme' }, error: null });
  requests[1]!.resolve({ data: { value: 'bob-theme' }, error: null });
  assert.deepEqual(await first, { value: 'alice-theme' });
  assert.deepEqual(await duplicate, { value: 'alice-theme' });
  assert.deepEqual(await otherUser, { value: 'bob-theme' });
  const fresh = syncStorage.get('theme');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(requests.length, 3);
  requests[2]!.resolve({ data: { value: 'updated-theme' }, error: null });
  assert.deepEqual(await fresh, { value: 'updated-theme' });
});
