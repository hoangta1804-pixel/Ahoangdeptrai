/**
 * Đồng bộ dữ liệu dùng chung: hai "máy" (hai RemoteSync) cùng nói chuyện với một API trong bộ nhớ.
 */
import { describe, expect, it } from 'vitest';
import { createMemoryStore, handleStateRequest, type StateStore } from '../../../api/state';
import { registerCustomer } from '../../domain/auth';
import { addToCart } from '../../domain/cart';
import { recordRandom, replayRandom } from '../../domain/ids';
import type { DemoState } from '../../domain/types';
import { makeState, T0 } from '../../domain/__tests__/fixtures';
import { RemoteSync, type Mutation, type SyncStatus } from '../remoteSync';

const SCHEMA = 4;
const settle = async () => {
  for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0));
};

function fetchFor(store: StateStore) {
  return async (input: string, init?: RequestInit) => {
    const url = new URL(input, 'http://demo.local');
    const r = await handleStateRequest({ method: init?.method ?? 'GET', query: Object.fromEntries(url.searchParams), body: init?.body as string | undefined }, store);
    return new Response(JSON.stringify(r.body), { status: r.status, headers: { 'Content-Type': 'application/json' } });
  };
}

function device(fetch: (input: string, init?: RequestInit) => Promise<Response>) {
  const seen: { state: DemoState | null; status: SyncStatus | null; dropped: number } = { state: null, status: null, dropped: 0 };
  const sync = new RemoteSync({
    schema: SCHEMA,
    fetch,
    onState: (s) => (seen.state = s),
    onStatus: (s) => (seen.status = s),
    onDropped: (n) => (seen.dropped += n),
  });
  let shown: DemoState = makeState();
  /** Áp dụng thao tác trên màn hình của máy này và ghi nhận để đồng bộ (giống AppDataProvider). */
  const act = (apply: (base: DemoState) => DemoState | null) => {
    const { value, draws } = recordRandom(() => apply(shown));
    const mutation: Mutation = (base) => replayRandom(draws, () => apply(base));
    if (value) {
      shown = value;
      sync.record(mutation, value);
    }
    return value;
  };
  return {
    sync,
    seen,
    act,
    get shown() {
      return seen.state ?? shown;
    },
    set shown(s: DemoState) {
      shown = s;
    },
  };
}

const cartOf = (s: DemoState) => (s.carts['cust-1'] ?? []).map((l) => l.productId).sort();
const addCart = (productId: string) => (base: DemoState) => {
  const r = addToCart(base, 'cust-1', productId, 1, T0);
  return r.ok ? r.value : null;
};

describe('RemoteSync', () => {
  it('không có API (lỗi mạng) hoặc API chưa nối cơ sở dữ liệu (503) thì chuyển sang lưu trên trình duyệt', async () => {
    const offline = device(async () => {
      throw new TypeError('Failed to fetch');
    });
    await offline.sync.start(makeState());
    expect(offline.seen.status).toMatchObject({ mode: 'local' });

    const noDb = device(async () => new Response(JSON.stringify({ error: 'chưa cấu hình' }), { status: 503 }));
    await noDb.sync.start(makeState());
    expect(noDb.seen.status).toMatchObject({ mode: 'local', reason: expect.stringContaining('chưa nối cơ sở dữ liệu') });

    const html = device(async () => new Response('<!doctype html>', { status: 200 }));
    await html.sync.start(makeState());
    expect(html.seen.status).toMatchObject({ mode: 'local' });
    // Chế độ trình duyệt: ghi nhận thao tác nhưng không gửi đi đâu.
    expect(html.act(addCart('x-dry'))).not.toBeNull();
    expect(html.sync.pendingCount).toBe(0);
  });

  it('máy đầu tiên đưa dữ liệu lên; máy sau nhận đúng dữ liệu đó', async () => {
    const store = createMemoryStore();
    const a = device(fetchFor(store));
    const first = makeState();
    await a.sync.start(first);
    await settle();
    expect(a.seen.status).toMatchObject({ mode: 'shared', phase: 'synced' });
    expect(await store.version()).toBe(1);

    a.act(addCart('x-dry'));
    await settle();
    expect(await store.version()).toBe(2);

    const b = device(fetchFor(store));
    await b.sync.start(makeState());
    await settle();
    expect(cartOf(b.shown)).toEqual(['x-dry']);
  });

  it('hai máy ghi cùng lúc: máy sau chạy lại thao tác trên dữ liệu mới, không mất thay đổi của ai', async () => {
    const store = createMemoryStore();
    const a = device(fetchFor(store));
    await a.sync.start(makeState());
    await settle();
    const b = device(fetchFor(store));
    await b.sync.start(makeState());
    await settle();

    // A thêm x-dry và gửi trước; B (chưa biết) thêm y-dry trên dữ liệu cũ.
    a.act(addCart('x-dry'));
    await settle();
    b.act(addCart('y-dry'));
    await settle();

    expect(b.seen.dropped).toBe(0);
    expect(cartOf(b.shown)).toEqual(['x-dry', 'y-dry']);
    const server = (await store.read()).data as DemoState;
    expect(cartOf(server)).toEqual(['x-dry', 'y-dry']);

    // A hỏi lại thì thấy thay đổi của B.
    await a.sync.poll();
    expect(cartOf(a.shown)).toEqual(['x-dry', 'y-dry']);
  });

  it('chạy lại thao tác giữ nguyên mã đã sinh (tài khoản, đơn…), để màn hình không mất bản ghi đang mở', async () => {
    const store = createMemoryStore();
    const a = device(fetchFor(store));
    await a.sync.start(makeState());
    await settle();
    const b = device(fetchFor(store));
    await b.sync.start(makeState());
    await settle();

    a.act(addCart('x-dry'));
    await settle();
    let shownId = '';
    b.act((base) => {
      const r = registerCustomer(base, { name: 'Khách mới', phone: '912345678', otp: '123456' }, T0);
      if (!r.ok) return null;
      shownId = r.value.user.id;
      return r.value.state;
    });
    await settle();
    const server = (await store.read()).data as DemoState;
    expect(server.users.some((u) => u.id === shownId)).toBe(true);
    expect(cartOf(server)).toEqual(['x-dry']);
  });

  it('thao tác không còn hợp lệ trên dữ liệu mới thì bị bỏ và báo', async () => {
    const store = createMemoryStore();
    const a = device(fetchFor(store));
    await a.sync.start(makeState());
    await settle();
    const b = device(fetchFor(store));
    await b.sync.start(makeState());
    await settle();

    // A đăng ký SĐT 0912345678 trước; B cũng đăng ký đúng số đó trên dữ liệu cũ → khi chạy lại bị trùng.
    const register = (name: string) => (base: DemoState) => {
      const r = registerCustomer(base, { name, phone: '912345678', otp: '123456' }, T0);
      return r.ok ? r.value.state : null;
    };
    a.act(register('Máy A'));
    await settle();
    b.act(register('Máy B'));
    await settle();
    expect(b.seen.dropped).toBe(1);
    const server = (await store.read()).data as DemoState;
    expect(server.users.filter((u) => u.phone === '0912345678').map((u) => u.name)).toEqual(['Máy A']);
  });

  it('mất mạng khi gửi: giữ thay đổi, báo mất kết nối, gửi lại được', async () => {
    const store = createMemoryStore();
    const real = fetchFor(store);
    let down = false;
    const a = device(async (input, init) => {
      if (down) throw new TypeError('Failed to fetch');
      return real(input, init);
    });
    await a.sync.start(makeState());
    await settle();
    down = true;
    a.act(addCart('x-dry'));
    await settle();
    expect(a.seen.status).toMatchObject({ mode: 'shared', phase: 'offline' });
    expect(a.sync.pendingCount).toBe(1);
    down = false;
    await a.sync.syncNow();
    await settle();
    expect(a.sync.pendingCount).toBe(0);
    expect(cartOf((await store.read()).data as DemoState)).toEqual(['x-dry']);
    a.sync.stop();
  });

  it('dữ liệu trên server khác cấu trúc (bản cũ) thì bị thay bằng dữ liệu của máy này', async () => {
    const store = createMemoryStore();
    await store.write(0, JSON.stringify({ schema: 3, data: { users: [], products: [], orders: [] }, updatedAt: 'x' }));
    const a = device(fetchFor(store));
    await a.sync.start(makeState());
    await settle();
    const stored = await store.read();
    expect(stored.schema).toBe(SCHEMA);
    expect((stored.data as DemoState).products.length).toBeGreaterThan(0);
  });
});
