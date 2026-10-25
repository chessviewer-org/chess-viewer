import assert from 'node:assert/strict';
import { after, afterEach, beforeEach, mock, test } from 'node:test';

import {
  DEFAULT_PROFILE,
  GUEST_PROFILE_KEY,
  profileService,
  readGuestProfile,
  writeGuestProfile
} from '../src/auth/profile/profile';
import { dataMigration } from '../src/auth/storage/dataMigration';

const previousStorage = Object.getOwnPropertyDescriptor(
  globalThis,
  'localStorage'
);
const values = new Map<string, string>();
const storage: Storage = {
  get length() {
    return values.size;
  },
  clear: () => values.clear(),
  getItem: (key) => values.get(key) ?? null,
  key: (index) => [...values.keys()][index] ?? null,
  removeItem: (key) => {
    values.delete(key);
  },
  setItem: (key, value) => {
    values.set(key, value);
  }
};

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: storage
});
beforeEach(() => values.clear());
afterEach(() => mock.restoreAll());
after(() => {
  if (previousStorage)
    Object.defineProperty(globalThis, 'localStorage', previousStorage);
  else Reflect.deleteProperty(globalThis, 'localStorage');
});

const oldProfile = (displayName: string) => ({
  displayName,
  supporterUntil: '2099-01-01T00:00:00.000Z',
  supporterMonthlyUsd: 500
});

test('profile storage retains the display name without donation status', () => {
  values.set(GUEST_PROFILE_KEY, JSON.stringify(oldProfile('A. Composer')));
  const profile = readGuestProfile();
  assert.deepEqual(profile, { displayName: 'A. Composer' });
  writeGuestProfile(profile);
  assert.deepEqual(JSON.parse(values.get(GUEST_PROFILE_KEY) ?? ''), profile);
});

test('a former guest supporter status alone does not migrate anything to the cloud', async () => {
  values.set(GUEST_PROFILE_KEY, JSON.stringify(oldProfile('User')));
  const get = mock.method(profileService, 'get', async () => DEFAULT_PROFILE);
  const update = mock.method(
    profileService,
    'updateDisplayName',
    async () => {}
  );
  await dataMigration.migrateToCloud('former-supporter');
  assert.equal(get.mock.callCount(), 0);
  assert.equal(update.mock.callCount(), 0);
});

test('custom display names still migrate once to a new cloud profile', async () => {
  values.set(GUEST_PROFILE_KEY, JSON.stringify(oldProfile('A. Composer')));
  mock.method(profileService, 'get', async () => DEFAULT_PROFILE);
  const update = mock.method(
    profileService,
    'updateDisplayName',
    async () => {}
  );
  await dataMigration.migrateToCloud('new-user');
  await dataMigration.migrateToCloud('new-user');
  assert.deepEqual(
    update.mock.calls.map((call) => call.arguments),
    [['new-user', 'A. Composer']]
  );
});

test('a local display name does not replace an existing cloud display name', async () => {
  values.set(GUEST_PROFILE_KEY, JSON.stringify(oldProfile('Local Composer')));
  mock.method(profileService, 'get', async () => ({
    displayName: 'Cloud Composer'
  }));
  const update = mock.method(
    profileService,
    'updateDisplayName',
    async () => {}
  );
  await dataMigration.migrateToCloud('existing-user');
  assert.equal(update.mock.callCount(), 0);
});
