/*
 * End-to-end and unit tests for cart sync, devices, saved items,
 * account deletion, refresh tokens and push notifications.
 *
 * Boots the real AppModule against an in-memory MongoDB. All three
 * connections point at the same memory server with different DB names.
 *
 * Run: npm run test:e2e
 */
import 'reflect-metadata';

import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { after, before, beforeEach, describe, it } from 'node:test';

import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';

let mongo: MongoMemoryServer;
let app: INestApplication;
let baseUrl: string;

// Loaded after the environment is set, because env.config reads it on import.
let mods: {
  Cart: typeof import('../src/cart/schemas/cart.schema');
  Device: typeof import('../src/devices/schemas/device.schema');
  SavedStone: typeof import('../src/saved/schemas/saved-stone.schema');
  SavedSearch: typeof import('../src/saved/schemas/saved-search.schema');
  Diamond: typeof import('../src/inventory/schemas/diamond.schema');
  db: typeof import('../src/database/database.constants');
  scheduler: typeof import('../src/notifications/notifications.scheduler');
  quiet: typeof import('../src/notifications/quiet-hours');
  expo: typeof import('../src/notifications/expo-push.service');
  RefreshToken: typeof import('../src/auth/schemas/refresh-token.schema');
  User: typeof import('../src/users/schemas/user.schema');
};

const realFetch = globalThis.fetch;

interface FetchCall {
  url: string;
  headers: Record<string, string>;
  body: Array<{ to: string; title: string; body: string; data?: object }>;
}

let expoCalls: FetchCall[] = [];
let expoTicketFor: (message: { to: string }) => object = () => ({
  status: 'ok',
  id: 'ticket',
});

interface ResendCall {
  headers: Record<string, string>;
  body: {
    from: string;
    to: string[];
    subject: string;
    text: string;
    reply_to?: string;
  };
}

let resendCalls: ResendCall[] = [];
let resendStatus = 200;

// Stubs only the Expo and Resend endpoints; requests to the local app pass through.
function installFetchStub(): void {
  globalThis.fetch = (async (
    input: string | URL | Request,
    init?: RequestInit,
  ) => {
    const url = String(input);

    if (url === 'https://api.resend.com/emails') {
      resendCalls.push({
        headers: { ...(init?.headers as Record<string, string>) },
        body: JSON.parse(String(init?.body ?? '{}')),
      });

      return new Response(JSON.stringify({ id: 'email-id' }), {
        status: resendStatus,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!url.startsWith('https://exp.host/')) {
      return realFetch(input, init);
    }

    const body = JSON.parse(String(init?.body ?? '[]'));
    expoCalls.push({
      url,
      headers: { ...(init?.headers as Record<string, string>) },
      body,
    });

    return new Response(
      JSON.stringify({ data: body.map((m: { to: string }) => expoTicketFor(m)) }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }) as typeof fetch;
}

async function api(
  method: string,
  path: string,
  options: { token?: string; body?: unknown } = {},
) {
  const response = await realFetch(`${baseUrl}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await response.text();

  return {
    status: response.status,
    body: text ? JSON.parse(text) : undefined,
  };
}

let signupCounter = 0;

async function signup(): Promise<{
  token: string;
  userId: string;
  refreshToken: string;
  email: string;
}> {
  signupCounter += 1;
  const email = `user${signupCounter}-${Date.now()}@example.com`;

  const response = await api('POST', '/auth/signup', {
    body: {
      firstName: 'Test',
      lastName: 'User',
      name: 'Test User',
      email,
      password: 'password123',
      companyName: 'Bright Test',
      salesPerson: 'Sales',
      mobileNumber: '+91 98765 43210',
    },
  });

  assert.equal(response.status, 201, JSON.stringify(response.body));

  return {
    token: response.body.accessToken,
    userId: response.body.user.id,
    refreshToken: response.body.refreshToken,
    email,
  };
}

function model<T>(name: string, connection?: string): Model<T> {
  return app.get<Model<T>>(getModelToken(name, connection));
}

before(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  process.env.MONGODB_URI = uri;
  process.env.MONGO_URL = uri;
  process.env.MONGODB_CORE_DB = 'test_core';
  process.env.MONGODB_KIRA_DB = 'test_kira';
  process.env.MONGODB_EASYSOFT_DB = 'test_easysoft';
  process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
  // Inventory services need supplier credentials to construct. No
  // supplier request is made by these tests.
  process.env.KIRA_USERNAME = 'test';
  process.env.KIRA_PASSWORD = 'test';
  process.env.EASYSOFT_SYNC_ENABLED = 'false';
  delete process.env.NOTIFICATIONS_ENABLED;
  delete process.env.EXPO_ACCESS_TOKEN;

  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('../src/app.module');

  mods = {
    Cart: await import('../src/cart/schemas/cart.schema'),
    Device: await import('../src/devices/schemas/device.schema'),
    SavedStone: await import('../src/saved/schemas/saved-stone.schema'),
    SavedSearch: await import('../src/saved/schemas/saved-search.schema'),
    Diamond: await import('../src/inventory/schemas/diamond.schema'),
    db: await import('../src/database/database.constants'),
    scheduler: await import('../src/notifications/notifications.scheduler'),
    quiet: await import('../src/notifications/quiet-hours'),
    expo: await import('../src/notifications/expo-push.service'),
    RefreshToken: await import('../src/auth/schemas/refresh-token.schema'),
    User: await import('../src/users/schemas/user.schema'),
  };

  app = await NestFactory.create(AppModule, { logger: ['error'] });

  // Mirrors main.ts.
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(0, '127.0.0.1');
  baseUrl = await app.getUrl();
  baseUrl = baseUrl.replace('[::1]', '127.0.0.1');

  installFetchStub();
});

after(async () => {
  globalThis.fetch = realFetch;
  await app?.close();
  await mongo?.stop();
});

beforeEach(() => {
  // Rate limits are per IP and every request comes from 127.0.0.1, so
  // each test starts with fresh counters.
  app.get<ThrottlerStorageService>(ThrottlerStorage).storage.clear();
  expoCalls = [];
  resendCalls = [];
  resendStatus = 200;
  expoTicketFor = () => ({ status: 'ok', id: 'ticket' });
});

describe('cart', () => {
  it('requires a token', async () => {
    assert.equal((await api('GET', '/cart')).status, 401);
  });

  it('syncs, replaces, validates and clears the cart', async () => {
    const { token } = await signup();

    const empty = await api('GET', '/cart', { token });
    assert.equal(empty.status, 200);
    assert.deepEqual(empty.body, { items: [], updatedAt: null });

    const items = [
      { stockId: 'S1', productType: 'stone', addedAt: 1, totalPrice: 1000, extra: { a: 1 } },
      { stockId: 'M1', productType: 'melee', addedAt: 2, qty: 5 },
    ];

    const put = await api('PUT', '/cart', { token, body: { items } });
    assert.equal(put.status, 200, JSON.stringify(put.body));
    assert.deepEqual(put.body.items, items);
    assert.ok(put.body.updatedAt);

    const got = await api('GET', '/cart', { token });
    assert.deepEqual(got.body, put.body);

    // Re-sending identical items keeps updatedAt.
    const same = await api('PUT', '/cart', { token, body: { items } });
    assert.equal(same.body.updatedAt, put.body.updatedAt);

    const badType = await api('PUT', '/cart', {
      token,
      body: { items: [{ stockId: 'S1', productType: 'ring' }] },
    });
    assert.equal(badType.status, 400);

    const badStock = await api('PUT', '/cart', {
      token,
      body: { items: [{ stockId: 5, productType: 'stone' }] },
    });
    assert.equal(badStock.status, 400);

    const notObject = await api('PUT', '/cart', { token, body: { items: ['x'] } });
    assert.equal(notObject.status, 400);

    const extraTop = await api('PUT', '/cart', { token, body: { items: [], other: 1 } });
    assert.equal(extraTop.status, 400);

    const tooMany = await api('PUT', '/cart', {
      token,
      body: {
        items: Array.from({ length: 201 }, (_, i) => ({
          stockId: `S${i}`,
          productType: 'stone',
        })),
      },
    });
    assert.equal(tooMany.status, 400);

    const max = await api('PUT', '/cart', {
      token,
      body: {
        items: Array.from({ length: 200 }, (_, i) => ({
          stockId: `S${i}`,
          productType: 'stone',
        })),
      },
    });
    assert.equal(max.status, 200);
    assert.equal(max.body.items.length, 200);

    const cleared = await api('DELETE', '/cart', { token });
    assert.equal(cleared.status, 204);
    assert.deepEqual((await api('GET', '/cart', { token })).body.items, []);
  });
});

describe('devices', () => {
  it('registers, re-assigns and removes push tokens', async () => {
    const a = await signup();
    const b = await signup();
    const Device = model<{ token: string; userId: Types.ObjectId; appVersion?: string }>(
      mods.Device.Device.name,
    );

    assert.equal(
      (await api('POST', '/devices', { body: { token: 'ExponentPushToken[test]', platform: 'ios' } })).status,
      401,
    );

    const bad = await api('POST', '/devices', {
      token: a.token,
      body: { token: 'not-a-token', platform: 'ios' },
    });
    assert.equal(bad.status, 400);

    const badPlatform = await api('POST', '/devices', {
      token: a.token,
      body: { token: 'ExponentPushToken[test]', platform: 'web' },
    });
    assert.equal(badPlatform.status, 400);

    const created = await api('POST', '/devices', {
      token: a.token,
      body: { token: 'ExponentPushToken[test]', platform: 'ios', appVersion: '1.0.0' },
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    assert.equal(created.body.token, 'ExponentPushToken[test]');
    assert.equal(created.body.appVersion, '1.0.0');

    // Same token from another account moves the device.
    const moved = await api('POST', '/devices', {
      token: b.token,
      body: { token: 'ExponentPushToken[test]', platform: 'android' },
    });
    assert.equal(moved.status, 201);
    const rows = await Device.find({ token: 'ExponentPushToken[test]' }).lean();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].userId.toString(), b.userId);
    assert.equal(rows[0].appVersion, undefined);

    // Only the owner can remove it.
    const path = `/devices/${encodeURIComponent('ExponentPushToken[test]')}`;
    assert.equal((await api('DELETE', path, { token: a.token })).status, 204);
    assert.equal(await Device.countDocuments({ token: 'ExponentPushToken[test]' }), 1);
    assert.equal((await api('DELETE', path, { token: b.token })).status, 204);
    assert.equal(await Device.countDocuments({ token: 'ExponentPushToken[test]' }), 0);
  });
});

describe('saved', () => {
  it('saves, lists, de-duplicates and removes stones', async () => {
    const { token } = await signup();

    const saved = await api('POST', '/saved/stones', {
      token,
      body: { stockId: 'S1', snapshot: { shape: 'Round', carat: 1 } },
    });
    assert.equal(saved.status, 201, JSON.stringify(saved.body));
    assert.equal(saved.body.stockId, 'S1');

    const again = await api('POST', '/saved/stones', {
      token,
      body: { stockId: 'S1', snapshot: { shape: 'Round', carat: 1.5 } },
    });
    assert.equal(again.status, 201);
    assert.equal(again.body.createdAt, saved.body.createdAt);

    const list = await api('GET', '/saved/stones', { token });
    assert.equal(list.body.items.length, 1);
    assert.equal(list.body.items[0].snapshot.carat, 1.5);

    const invalid = await api('POST', '/saved/stones', { token, body: { stockId: 'S2' } });
    assert.equal(invalid.status, 400);

    assert.equal((await api('DELETE', '/saved/stones/S1', { token })).status, 204);
    assert.equal((await api('GET', '/saved/stones', { token })).body.items.length, 0);
  });

  it('caps saved stones at 500', async () => {
    const { token, userId } = await signup();
    const SavedStone = model(mods.SavedStone.SavedStone.name);

    await SavedStone.insertMany(
      Array.from({ length: 499 }, (_, i) => ({
        userId: new Types.ObjectId(userId),
        stockId: `X${i}`,
        snapshot: {},
      })),
    );

    const fiveHundredth = await api('POST', '/saved/stones', {
      token,
      body: { stockId: 'LAST', snapshot: {} },
    });
    assert.equal(fiveHundredth.status, 201);

    const over = await api('POST', '/saved/stones', {
      token,
      body: { stockId: 'OVER', snapshot: {} },
    });
    assert.equal(over.status, 409);

    // Re-saving an existing stone is still allowed at the cap.
    const resave = await api('POST', '/saved/stones', {
      token,
      body: { stockId: 'LAST', snapshot: { a: 1 } },
    });
    assert.equal(resave.status, 201);
  });

  it('saves searches, validates filters and caps at 50', async () => {
    const { token, userId } = await signup();
    const SavedSearch = model(mods.SavedSearch.SavedSearch.name);

    const created = await api('POST', '/saved/searches', {
      token,
      body: { name: '  Round 1ct  ', filters: { shapes: ['Round'], minCarat: 1 } },
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    assert.equal(created.body.name, 'Round 1ct');
    assert.deepEqual(created.body.filters, { shapes: ['Round'], minCarat: 1 });
    assert.equal(created.body.lastRunAt, null);

    const badFilters = await api('POST', '/saved/searches', {
      token,
      body: { name: 'x', filters: { nope: 1 } },
    });
    assert.equal(badFilters.status, 400);

    const longName = await api('POST', '/saved/searches', {
      token,
      body: { name: 'x'.repeat(61), filters: {} },
    });
    assert.equal(longName.status, 400);

    const emptyName = await api('POST', '/saved/searches', {
      token,
      body: { name: '   ', filters: {} },
    });
    assert.equal(emptyName.status, 400);

    await SavedSearch.insertMany(
      Array.from({ length: 49 }, (_, i) => ({
        userId: new Types.ObjectId(userId),
        name: `S${i}`,
        filters: {},
      })),
    );

    const over = await api('POST', '/saved/searches', {
      token,
      body: { name: 'over', filters: {} },
    });
    assert.equal(over.status, 409);

    const list = await api('GET', '/saved/searches', { token });
    assert.equal(list.body.items.length, 50);

    assert.equal(
      (await api('DELETE', `/saved/searches/${created.body.id}`, { token })).status,
      204,
    );
    assert.equal((await api('GET', '/saved/searches', { token })).body.items.length, 49);
    assert.equal((await api('DELETE', '/saved/searches/not-an-id', { token })).status, 204);
  });
});

describe('DELETE /auth/me', () => {
  it('deletes the user and all their data', async () => {
    const { token, userId } = await signup();
    const owner = new Types.ObjectId(userId);

    await api('PUT', '/cart', { token, body: { items: [{ stockId: 'S1', productType: 'stone' }] } });
    await api('POST', '/devices', {
      token,
      body: { token: 'ExpoPushToken[delete-me]', platform: 'android' },
    });
    await api('POST', '/saved/stones', { token, body: { stockId: 'S1', snapshot: {} } });
    await api('POST', '/saved/searches', { token, body: { name: 'n', filters: {} } });

    assert.equal((await api('DELETE', '/auth/me')).status, 401);

    const deleted = await api('DELETE', '/auth/me', { token });
    assert.equal(deleted.status, 204);

    for (const name of [
      mods.Cart.Cart.name,
      mods.Device.Device.name,
      mods.SavedStone.SavedStone.name,
      mods.SavedSearch.SavedSearch.name,
      mods.RefreshToken.RefreshToken.name,
    ]) {
      assert.equal(await model(name).countDocuments({ userId: owner }), 0, name);
    }

    assert.equal((await api('DELETE', '/auth/me', { token })).status, 404);
    assert.equal((await api('GET', '/cart', { token })).status, 401);
    assert.equal(
      (await api('PUT', '/cart', { token, body: { items: [] } })).status,
      401,
    );
    assert.equal((await api('GET', '/auth/me', { token })).status, 401);
  });
});

describe('refresh tokens', () => {
  const SESSION_EXPIRED = 'Session expired. Please log in again.';

  function tokens() {
    return model<{
      userId: Types.ObjectId;
      tokenHash: string;
      familyId: string;
      expiresAt: Date;
      revokedAt?: Date | null;
      replacedByHash?: string | null;
      userAgent?: string;
      platform?: string;
    }>(mods.RefreshToken.RefreshToken.name);
  }

  function refresh(refreshToken: unknown) {
    return api('POST', '/auth/refresh', { body: { refreshToken } });
  }

  it('adds a refresh token to login and signup without changing the rest', async () => {
    const created = await signup();
    assert.match(created.refreshToken, /^[A-Za-z0-9_-]{43}$/);

    const login = await api('POST', '/auth/login', {
      body: { email: created.email, password: 'password123' },
    });

    assert.equal(login.status, 200);
    assert.deepEqual(Object.keys(login.body).sort(), [
      'accessToken',
      'expiresIn',
      'message',
      'refreshToken',
      'refreshTokenExpiresAt',
      'tokenType',
      'user',
    ]);
    assert.equal(login.body.message, 'Authentication successful.');
    assert.equal(login.body.tokenType, 'Bearer');
    assert.equal(login.body.expiresIn, '1h');

    const days =
      (Date.parse(login.body.refreshTokenExpiresAt) - Date.now()) /
      (24 * 60 * 60 * 1000);
    assert.ok(days > 59.9 && days <= 60, String(days));

    // Only the hash is stored, and login starts a new family.
    const docs = await tokens()
      .find({ userId: new Types.ObjectId(created.userId) })
      .lean();
    assert.equal(docs.length, 2);
    assert.notEqual(docs[0].familyId, docs[1].familyId);
    for (const doc of docs) {
      assert.match(doc.tokenHash, /^[a-f0-9]{64}$/);
      assert.notEqual(doc.tokenHash, login.body.refreshToken);
    }
  });

  it('rotates, allows a duplicate within the grace window and detects reuse after it', async () => {
    const { refreshToken: first, userId } = await signup();

    const rotated = await api('POST', '/auth/refresh', {
      body: { refreshToken: first },
    });
    assert.equal(rotated.status, 200, JSON.stringify(rotated.body));
    assert.deepEqual(Object.keys(rotated.body).sort(), [
      'accessToken',
      'refreshToken',
      'refreshTokenExpiresAt',
      'tokenType',
      'user',
    ]);
    assert.equal(rotated.body.tokenType, 'Bearer');
    assert.equal(rotated.body.user.id, userId);
    assert.notEqual(rotated.body.refreshToken, first);

    const me = await api('GET', '/auth/me', { token: rotated.body.accessToken });
    assert.equal(me.status, 200);
    assert.equal(me.body.user.id, userId);

    // A second app process presenting the old token at the same time.
    const duplicate = await refresh(first);
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.message, 'Refresh already in progress.');

    const second = await refresh(rotated.body.refreshToken);
    assert.equal(second.status, 200);

    // Past the grace window the old token is a replay: the family dies.
    await tokens().updateOne(
      { tokenHash: createHash('sha256').update(first).digest('hex') },
      { $set: { revokedAt: new Date(Date.now() - 31_000) } },
    );

    const replay = await refresh(first);
    assert.equal(replay.status, 401);
    assert.equal(replay.body.message, SESSION_EXPIRED);

    assert.equal((await refresh(second.body.refreshToken)).status, 401);
    assert.equal(
      await tokens().countDocuments({
        userId: new Types.ObjectId(userId),
        revokedAt: null,
      }),
      0,
    );
  });

  it('lets exactly one of two concurrent refreshes win', async () => {
    const { refreshToken } = await signup();

    const statuses = (
      await Promise.all([refresh(refreshToken), refresh(refreshToken)])
    )
      .map((response) => response.status)
      .sort();

    assert.deepEqual(statuses, [200, 409]);
  });

  it('revokes the session on logout and always answers 204', async () => {
    const { refreshToken } = await signup();
    const rotated = await refresh(refreshToken);

    const logout = await api('POST', '/auth/logout', {
      body: { refreshToken: rotated.body.refreshToken },
    });
    assert.equal(logout.status, 204);

    const after = await refresh(rotated.body.refreshToken);
    assert.equal(after.status, 401);
    assert.equal(after.body.message, SESSION_EXPIRED);
    assert.equal((await refresh(refreshToken)).status, 401);

    assert.equal(
      (await api('POST', '/auth/logout', { body: { refreshToken: 'unknown' } })).status,
      204,
    );
    assert.equal((await api('POST', '/auth/logout', { body: {} })).status, 204);
    assert.equal(
      (await api('POST', '/auth/logout', { body: { refreshToken: 42 } })).status,
      204,
    );
  });

  it('rejects unknown, malformed and expired tokens', async () => {
    const unknown = await refresh('not-a-real-token');
    assert.equal(unknown.status, 401);
    assert.equal(unknown.body.message, SESSION_EXPIRED);

    assert.equal((await refresh(undefined)).status, 400);

    const { refreshToken, userId } = await signup();
    await tokens().updateMany(
      { userId: new Types.ObjectId(userId) },
      { $set: { expiresAt: new Date(Date.now() - 1000) } },
    );

    const expired = await refresh(refreshToken);
    assert.equal(expired.status, 401);
    assert.equal(expired.body.message, SESSION_EXPIRED);
  });

  it('answers User no longer exists. when the account is gone', async () => {
    const { refreshToken, userId } = await signup();
    await model(mods.User.User.name).deleteOne({ _id: new Types.ObjectId(userId) });

    const response = await refresh(refreshToken);
    assert.equal(response.status, 401);
    assert.equal(response.body.message, 'User no longer exists.');
    assert.equal(
      await tokens().countDocuments({ userId: new Types.ObjectId(userId) }),
      0,
    );
  });

  it('revokes every session when the password is reset', async () => {
    const { refreshToken, email } = await signup();
    const login = await api('POST', '/auth/login', {
      body: { email, password: 'password123' },
    });

    // Skips the emailed OTP step by planting a reset token directly.
    const resetToken = 'a'.repeat(64);
    const resetTokenHash = createHmac('sha256', process.env.JWT_SECRET!)
      .update(`password-reset:token:${resetToken}`)
      .digest('hex');
    await model(mods.User.User.name).updateOne(
      { email },
      {
        $set: {
          resetTokenHash,
          resetTokenExpiresAt: new Date(Date.now() + 60_000),
        },
      },
    );

    const reset = await api('POST', '/auth/reset-password', {
      body: {
        resetToken,
        newPassword: 'newpassword456',
        confirmPassword: 'newpassword456',
      },
    });
    assert.equal(reset.status, 200, JSON.stringify(reset.body));

    assert.equal((await refresh(refreshToken)).status, 401);
    assert.equal((await refresh(login.body.refreshToken)).status, 401);
  });

  it('records the user agent and app platform', async () => {
    const { email, userId } = await signup();

    const response = await realFetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `BrightTrading/1.0 ${'x'.repeat(300)}`,
        'X-App-Platform': 'iOS',
      },
      body: JSON.stringify({ email, password: 'password123' }),
    });
    assert.equal(response.status, 200);

    const doc = await tokens()
      .findOne({ userId: new Types.ObjectId(userId), platform: 'ios' })
      .lean();
    assert.ok(doc);
    assert.equal(doc.userAgent?.length, 200);
  });

  it('limits POST /auth/refresh to 30 per minute', async () => {
    const statuses: number[] = [];

    for (let i = 0; i < 32; i += 1) {
      statuses.push((await refresh(`unknown-${i}`)).status);
    }

    assert.ok(statuses.includes(429), statuses.join(','));
  });
});

describe('quiet hours', () => {
  it('allows 09:00 to 20:59 Asia/Kolkata only', () => {
    const { isWithinSendingHours, hourInKolkata } = mods.quiet;

    // IST is UTC+05:30.
    assert.equal(hourInKolkata(new Date('2026-10-23T18:30:00Z')), 0);
    assert.equal(isWithinSendingHours(new Date('2026-10-23T03:29:00Z')), false); // 08:59
    assert.equal(isWithinSendingHours(new Date('2026-10-23T03:30:00Z')), true); // 09:00
    assert.equal(isWithinSendingHours(new Date('2026-10-23T15:29:00Z')), true); // 20:59
    assert.equal(isWithinSendingHours(new Date('2026-10-23T15:30:00Z')), false); // 21:00
    assert.equal(isWithinSendingHours(new Date('2026-10-23T20:00:00Z')), false); // 01:30
  });
});

describe('notifications scheduler', () => {
  const DAY = 24 * 60 * 60 * 1000;
  // 12:00 IST.
  const NOON_IST = new Date('2026-10-23T06:30:00Z');

  async function userWithDevice(tokenSuffix: string) {
    const user = await signup();
    const pushToken = `ExponentPushToken[${tokenSuffix}]`;
    const response = await api('POST', '/devices', {
      token: user.token,
      body: { token: pushToken, platform: 'ios' },
    });
    assert.equal(response.status, 201);
    return { ...user, pushToken };
  }

  function scheduler() {
    return app.get(mods.scheduler.NotificationsScheduler);
  }

  beforeEach(async () => {
    await model(mods.Cart.Cart.name).deleteMany({});
  });

  it('builds message bodies', () => {
    const { cartReminderBody, soldStoneBody } = mods.scheduler;

    assert.equal(
      cartReminderBody([
        { stockId: 'a', productType: 'stone', totalPrice: 1200.4 },
        { stockId: 'b', productType: 'stone', totalPrice: 800 },
      ]),
      '2 stones · total $2,000',
    );
    assert.equal(cartReminderBody([{ stockId: 'a', productType: 'stone' }]), '1 stone');
    assert.equal(
      soldStoneBody({ stoneNo: 'S9', isAvailable: false, carat: 1.01, shape: 'Round' }),
      '1.01 ct Round S9 is no longer available',
    );
  });

  it('sends one cart reminder per cart change', async () => {
    const user = await userWithDevice('reminder');
    const Cart = model(mods.Cart.Cart.name);

    await api('PUT', '/cart', {
      token: user.token,
      body: { items: [{ stockId: 'S1', productType: 'stone', totalPrice: 1500 }] },
    });

    // Not yet 24 hours old.
    assert.equal(await scheduler().runCartReminders(new Date()), 0);
    assert.equal(expoCalls.length, 0);

    const later = new Date(Date.now() + DAY + 60_000);
    assert.equal(await scheduler().runCartReminders(later), 1);
    assert.equal(expoCalls.length, 1);
    assert.deepEqual(expoCalls[0].body, [
      {
        to: user.pushToken,
        title: 'Your cart is waiting',
        body: '1 stone · total $1,500',
        data: { type: 'cart_reminder' },
      },
    ]);

    const cart = await Cart.findOne({ userId: new Types.ObjectId(user.userId) }).lean<{ remindedAt: Date }>();
    assert.equal(cart!.remindedAt.getTime(), later.getTime());

    // Never repeats for the same cart state.
    assert.equal(await scheduler().runCartReminders(new Date(later.getTime() + 7 * DAY)), 0);

    // Empty carts are never reminded.
    const empty = await signup();
    await Cart.create({ userId: new Types.ObjectId(empty.userId), items: [], updatedAt: new Date(0) });

    // A change re-arms it.
    await api('PUT', '/cart', {
      token: user.token,
      body: { items: [{ stockId: 'S2', productType: 'stone' }] },
    });
    assert.equal(await scheduler().runCartReminders(new Date(Date.now() + DAY + 60_000)), 1);
    assert.equal(expoCalls[1].body[0].body, '1 stone');
  });

  it('alerts once per sold stone and keeps it in the cart', async () => {
    const user = await userWithDevice('sold');
    const Kira = model(mods.Diamond.Diamond.name, mods.db.KIRA_DB_CONNECTION);
    const Easysoft = model(mods.Diamond.Diamond.name, mods.db.EASYSOFT_DB_CONNECTION);

    await Kira.create([
      { stoneNo: 'SOLD1', isAvailable: false, carat: 1.01, shape: 'Round' },
      { stoneNo: 'LIVE1', isAvailable: true, carat: 2, shape: 'Oval' },
    ]);
    await Easysoft.create({ stoneNo: 'SOLD2', isAvailable: false, carat: 0.5, shape: 'Pear' });

    const items = [
      { stockId: 'SOLD1', productType: 'stone' },
      { stockId: 'LIVE1', productType: 'stone' },
      { stockId: 'SOLD2', productType: 'stone' },
      { stockId: 'SOLD1-MELEE', productType: 'melee' },
    ];
    await api('PUT', '/cart', { token: user.token, body: { items } });

    assert.equal(await scheduler().runSoldStoneAlerts(), 2);
    const bodies = expoCalls.flatMap((call) => call.body).map((m) => [m.title, m.body]);
    assert.deepEqual(bodies.sort(), [
      ['A stone in your cart was sold', '0.5 ct Pear SOLD2 is no longer available'],
      ['A stone in your cart was sold', '1.01 ct Round SOLD1 is no longer available'],
    ]);

    assert.equal(await scheduler().runSoldStoneAlerts(), 0);

    const cart = await api('GET', '/cart', { token: user.token });
    assert.deepEqual(cart.body.items, items);
  });

  it('skips everything during quiet hours', async () => {
    const user = await userWithDevice('quiet');
    await model(mods.Cart.Cart.name).create({
      userId: new Types.ObjectId(user.userId),
      items: [{ stockId: 'Q1', productType: 'stone' }],
      updatedAt: new Date(NOON_IST.getTime() - 2 * DAY),
    });

    // 22:00 IST.
    assert.equal(await scheduler().runAll(new Date('2026-10-23T16:30:00Z')), false);
    assert.equal(expoCalls.length, 0);

    assert.equal(await scheduler().runAll(NOON_IST), true);
    assert.equal(expoCalls.length, 1);
  });

  it('does nothing from the cron unless NOTIFICATIONS_ENABLED=true', async () => {
    const user = await userWithDevice('cron');
    await model(mods.Cart.Cart.name).create({
      userId: new Types.ObjectId(user.userId),
      items: [{ stockId: 'C1', productType: 'stone' }],
      updatedAt: new Date(Date.now() - 2 * DAY),
    });

    await scheduler().handleCron();
    assert.equal(expoCalls.length, 0);
  });
});

describe('ExpoPushService', () => {
  function service() {
    return app.get(mods.expo.ExpoPushService);
  }

  it('chunks by 100 and sends the access token only when set', async () => {
    const messages = Array.from({ length: 250 }, (_, i) => ({
      to: `ExponentPushToken[c${i}]`,
      title: 't',
      body: 'b',
    }));

    await service().send(messages);
    assert.deepEqual(expoCalls.map((c) => c.body.length), [100, 100, 50]);
    assert.equal(expoCalls[0].url, 'https://exp.host/--/api/v2/push/send');
    assert.equal(expoCalls[0].headers.Authorization, undefined);

    expoCalls = [];
    process.env.EXPO_ACCESS_TOKEN = 'secret-token';
    try {
      await service().send(messages.slice(0, 1));
    } finally {
      delete process.env.EXPO_ACCESS_TOKEN;
    }
    assert.equal(expoCalls[0].headers.Authorization, 'Bearer secret-token');
  });

  it('removes DeviceNotRegistered tokens and tolerates other errors', async () => {
    const user = await signup();
    const Device = model(mods.Device.Device.name);

    for (const suffix of ['gone', 'keep', 'flaky']) {
      await api('POST', '/devices', {
        token: user.token,
        body: { token: `ExponentPushToken[${suffix}]`, platform: 'ios' },
      });
    }

    expoTicketFor = (message) => {
      if (message.to.includes('gone')) {
        return { status: 'error', message: 'gone', details: { error: 'DeviceNotRegistered' } };
      }
      if (message.to.includes('flaky')) {
        return { status: 'error', message: 'rate', details: { error: 'MessageRateExceeded' } };
      }
      return { status: 'ok', id: 'x' };
    };

    await service().send(
      ['gone', 'keep', 'flaky'].map((s) => ({
        to: `ExponentPushToken[${s}]`,
        title: 't',
        body: 'b',
      })),
    );

    assert.equal(await Device.countDocuments({ token: 'ExponentPushToken[gone]' }), 0);
    assert.equal(await Device.countDocuments({ token: 'ExponentPushToken[keep]' }), 1);
    assert.equal(await Device.countDocuments({ token: 'ExponentPushToken[flaky]' }), 1);
  });

  it('does not throw when Expo is unreachable', async () => {
    const previous = globalThis.fetch;
    globalThis.fetch = (async () => {
      throw new Error('network down');
    }) as typeof fetch;

    try {
      await service().send([{ to: 'ExponentPushToken[x]', title: 't', body: 'b' }]);
    } finally {
      globalThis.fetch = previous;
    }
  });
});

describe('rate limits', () => {
  it('limits POST /devices to 10 per minute', async () => {
    const { token } = await signup();
    const statuses: number[] = [];

    for (let i = 0; i < 12; i += 1) {
      const response = await api('POST', '/devices', {
        token,
        body: { token: `ExponentPushToken[rl${i}]`, platform: 'ios' },
      });
      statuses.push(response.status);
    }

    assert.ok(statuses.includes(429), statuses.join(','));
  });
});

describe('email via Resend', () => {
  const enquiry = {
    type: 'contact',
    source: 'website',
    firstName: 'Asha',
    lastName: 'Rao',
    email: 'asha@example.com',
    phone: '+91 98765 43210',
    message: 'Looking for 1ct ovals.',
  };

  beforeEach(() => {
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.MAIL_FROM = 'Bright Trading <no-reply@example.com>';
    process.env.ENQUIRY_TO = 'sales@example.com';
  });

  after(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.MAIL_FROM;
    delete process.env.ENQUIRY_TO;
  });

  it('sends website contact enquiries to the sales inbox', async () => {
    const response = await api('POST', '/enquiries', { body: enquiry });

    assert.equal(response.status, 202, JSON.stringify(response.body));
    assert.equal(resendCalls.length, 1);
    assert.equal(resendCalls[0].headers.Authorization, 'Bearer re_test_key');
    assert.deepEqual(resendCalls[0].body.to, ['sales@example.com']);
    assert.equal(resendCalls[0].body.from, 'Bright Trading <no-reply@example.com>');
    assert.equal(resendCalls[0].body.reply_to, 'asha@example.com');
    assert.equal(resendCalls[0].body.subject, 'Trade enquiry (website): Asha Rao');
    assert.match(resendCalls[0].body.text, /Source: website/);
    assert.match(resendCalls[0].body.text, /Looking for 1ct ovals\./);
  });

  it('keeps accepting app enquiries without a source', async () => {
    const { source: _source, ...appEnquiry } = enquiry;
    const response = await api('POST', '/enquiries', {
      body: { ...appEnquiry, type: 'quote' },
    });

    assert.equal(response.status, 202, JSON.stringify(response.body));
    assert.equal(resendCalls[0].body.subject, 'Quote request (mobile app): Asha Rao');
  });

  it('rejects unknown types and sources', async () => {
    const badType = await api('POST', '/enquiries', {
      body: { ...enquiry, type: 'spam' },
    });
    const badSource = await api('POST', '/enquiries', {
      body: { ...enquiry, source: 'fax' },
    });

    assert.equal(badType.status, 400);
    assert.equal(badSource.status, 400);
    assert.equal(resendCalls.length, 0);
  });

  it('answers 500 when Resend fails', async () => {
    resendStatus = 422;
    const response = await api('POST', '/enquiries', { body: enquiry });

    assert.equal(response.status, 500);
    assert.equal(
      response.body.message,
      'Unable to send your request. Please try again later.',
    );
  });

  it('sends the password reset code through Resend', async () => {
    const { email } = await signup();
    const response = await api('POST', '/auth/forgot-password', {
      body: { email },
    });

    assert.ok(response.status < 300, JSON.stringify(response.body));
    assert.equal(resendCalls.length, 1);
    assert.deepEqual(resendCalls[0].body.to, [email]);
    assert.match(resendCalls[0].body.text, /Your password reset code is \d{6}\./);
  });
});
