import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import {
  AuthClient,
  FetchClient,
  type Session
} from '../src/auth/core/Supabase';

const descriptors = new Map(
  ['window', 'document', 'localStorage'].map((key) => [
    key,
    Object.getOwnPropertyDescriptor(globalThis, key)
  ])
);
afterEach(() => {
  mock.restoreAll();
  for (const [key, descriptor] of descriptors) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

function setup() {
  const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  for (const [key, value] of Object.entries({
    window: {},
    document: doc,
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    }
  })) {
    Object.defineProperty(globalThis, key, { configurable: true, value });
  }
  const client = new FetchClient('https://auth.test', 'test-key');
  const auth = new AuthClient(client);
  const expired = {
    access_token: `header.${btoa(JSON.stringify({ exp: 1 }))}.signature`,
    refresh_token: 'expired-refresh',
    token_type: 'bearer',
    expires_in: 0,
    user: { id: 'test-user' }
  } as Session;
  client.setSession(expired);
  let resolve!: (response: Response) => void;
  const response = new Promise<Response>((done) => {
    resolve = done;
  });
  const fetchMock = mock.method(globalThis, 'fetch', async (url: string) =>
    url.includes('refresh_token')
      ? response
      : new Response(null, { status: 204 })
  );
  const complete = () =>
    resolve(
      new Response(
        JSON.stringify({
          ...expired,
          access_token: `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.signature`,
          refresh_token: 'new-refresh'
        }),
        { status: 200 }
      )
    );
  return { doc, client, auth, fetchMock, complete };
}

test('parallel refresh triggers perform one token request', async () => {
  const state = setup();
  let refreshed!: () => void;
  const done = new Promise<void>((resolve) => {
    refreshed = resolve;
  });
  state.auth.onAuthStateChange((event) => {
    if (event === 'TOKEN_REFRESHED') refreshed();
  });
  state.doc.dispatchEvent(new Event('visibilitychange'));
  state.doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(state.fetchMock.mock.callCount(), 1);
  state.complete();
  await done;
  assert.equal(state.client.getSession()?.refresh_token, 'new-refresh');
  await state.auth.signOut();
});

test('a late refresh response cannot restore a signed-out session', async () => {
  const state = setup();
  state.doc.dispatchEvent(new Event('visibilitychange'));
  await state.auth.signOut();
  state.complete();
  // Allow response parsing and the shared refresh task to finish.
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(state.client.getSession(), null);
});
