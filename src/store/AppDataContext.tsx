/**
 * Store dữ liệu demo (mục 7). Mọi thay đổi dữ liệu đi qua các hàm trong src/domain thông qua run().
 * Tác vụ theo giờ (hết hạn thanh toán, quá hạn xác nhận…) chạy khi tải app, mỗi 5 giây và sau khi tua đồng hồ.
 * Sau mỗi thay đổi, deriveNotifications() sinh thông báo cho đúng tài khoản (FR-CSKH-10).
 *
 * Lưu dữ liệu:
 * - Có API /api/state (bản deploy trên Vercel đã nối cơ sở dữ liệu, hoặc `npm run dev` / `npm run preview`):
 *   dữ liệu dùng chung giữa mọi máy mở demo (RemoteSync). localStorage chỉ làm bản lưu tạm để mở app nhanh.
 * - Không có API: lưu localStorage như trước, các tab cùng trình duyệt thấy chung dữ liệu.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { now as clockNow, setClockOffset } from '../domain/clock';
import { recordRandom, replayRandom } from '../domain/ids';
import { jobsChanged, runScheduledJobs } from '../domain/jobs';
import { deriveNotifications } from '../domain/notifications';
import type { DemoState, Result } from '../domain/types';
import { createSeedState } from '../data/seed';
import { clearState, loadState, saveState, STORAGE_KEY, STORAGE_VERSION } from './persistence';
import { RemoteSync, type Mutation, type SyncStatus } from './remoteSync';

/** Hỏi API dữ liệu mới bao lâu một lần khi trang đang mở trên màn hình. */
const POLL_MS = 10_000;

interface StoreValue {
  state: DemoState;
  /** Giờ hiện tại của đồng hồ demo. */
  now: () => Date;
  /** Chạy một thao tác domain trên dữ liệu mới nhất. Thành công thì lưu và trả về kết quả. */
  run: <T = DemoState>(op: (s: DemoState, at: Date) => Result<T>, pick?: (value: T) => DemoState) => Result<T>;
  /** Tua đồng hồ demo thêm `ms` mili giây rồi chạy các tác vụ theo giờ. */
  advanceClock: (ms: number) => void;
  resetClock: () => void;
  /** Xoá dữ liệu đã lưu và nạp lại dữ liệu mẫu (dữ liệu dùng chung thì mọi máy cùng thấy). */
  resetDemoData: () => void;
  /** Trạng thái lưu dữ liệu: dùng chung qua API hay chỉ trên trình duyệt này. */
  sync: SyncStatus;
  /** Gửi ngay thay đổi đang chờ và lấy dữ liệu mới nhất. */
  syncNow: () => void;
  /** Thông báo khi có thao tác không áp dụng được vì máy khác vừa đổi dữ liệu. */
  syncNotice: string | null;
  clearSyncNotice: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

/** Chạy tác vụ theo giờ rồi sinh thông báo cho phần dữ liệu thay đổi. */
function withJobs(state: DemoState, at: Date): { state: DemoState; changed: boolean } {
  const { state: next, report } = runScheduledJobs(state, at);
  return { state: deriveNotifications(state, next, at), changed: jobsChanged(report) };
}

function initialState(): DemoState {
  const loaded = loadState<DemoState>(() => createSeedState(new Date()));
  setClockOffset(loaded.clockOffsetMs ?? 0);
  return withJobs(loaded, clockNow()).state;
}

/**
 * Chạy `apply` trên dữ liệu hiện tại, đồng thời tạo bản chạy lại được trên dữ liệu khác
 * (dùng lại đúng các mã ngẫu nhiên, để đơn / giao dịch giữ nguyên mã).
 */
function replayable(apply: (base: DemoState) => DemoState | null, current: DemoState): { next: DemoState | null; mutation: Mutation } {
  const { value, draws } = recordRandom(() => apply(current));
  return { next: value, mutation: (base) => replayRandom(draws, () => apply(base)) };
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(initialState);
  const ref = useRef(state);
  const [sync, setSync] = useState<SyncStatus>({ mode: 'checking' });
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const syncRef = useRef<RemoteSync | null>(null);

  const show = useCallback((next: DemoState) => {
    ref.current = next;
    setClockOffset(next.clockOffsetMs);
    setState(next);
  }, []);

  /** Áp dụng thay đổi trên màn hình và gửi lên API (nếu đang dùng chung dữ liệu). */
  const commit = useCallback(
    (next: DemoState, mutation: Mutation) => {
      show(next);
      syncRef.current?.record(mutation, next);
    },
    [show],
  );

  useEffect(() => {
    saveState(state);
  }, [state]);

  // Kết nối API dữ liệu chung.
  useEffect(() => {
    const remote = new RemoteSync({
      schema: STORAGE_VERSION,
      onState: show,
      onStatus: setSync,
      onDropped: (n) => setSyncNotice(`${n} thao tác không áp dụng được vì dữ liệu vừa được máy khác thay đổi. Màn hình đã cập nhật theo dữ liệu mới nhất.`),
    });
    syncRef.current = remote;
    void remote.start(ref.current);

    const pollIfVisible = () => {
      if (document.visibilityState === 'visible') void remote.poll();
    };
    const timer = setInterval(pollIfVisible, POLL_MS);
    document.addEventListener('visibilitychange', pollIfVisible);
    window.addEventListener('focus', pollIfVisible);
    return () => {
      remote.stop();
      syncRef.current = null;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', pollIfVisible);
      window.removeEventListener('focus', pollIfVisible);
    };
  }, [show]);

  // Tab khác cùng trình duyệt ghi dữ liệu: dùng chung qua API thì hỏi API ngay; không thì nạp lại từ localStorage.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const remote = syncRef.current;
      if (remote?.getStatus().mode === 'local') show(loadState<DemoState>(() => createSeedState(new Date())));
      else void remote?.poll();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [show]);

  const runJobs = useCallback(() => {
    const at = clockNow();
    const { value, draws } = recordRandom(() => withJobs(ref.current, at));
    if (value.changed) commit(value.state, (base) => replayRandom(draws, () => withJobs(base, at).state));
  }, [commit]);

  useEffect(() => {
    const t = setInterval(runJobs, 5_000);
    return () => clearInterval(t);
  }, [runJobs]);

  const run = useCallback(
    <T,>(op: (s: DemoState, at: Date) => Result<T>, pick?: (value: T) => DemoState): Result<T> => {
      const at = clockNow();
      let result: Result<T> | undefined;
      const apply = (base: DemoState): DemoState | null => {
        const r = op(base, at);
        result ??= r; // kết quả trả cho màn hình là của lần chạy đầu
        return r.ok ? deriveNotifications(base, pick ? pick(r.value) : (r.value as unknown as DemoState), at) : null;
      };
      const { next, mutation } = replayable(apply, ref.current);
      if (next) commit(next, mutation);
      return result!;
    },
    [commit],
  );

  const advanceClock = useCallback(
    (ms: number) => {
      const realNow = Date.now();
      const { next, mutation } = replayable((base) => {
        const shifted = { ...base, clockOffsetMs: base.clockOffsetMs + ms };
        return withJobs(shifted, new Date(realNow + shifted.clockOffsetMs)).state;
      }, ref.current);
      commit(next!, mutation);
    },
    [commit],
  );

  const resetClock = useCallback(() => {
    const realNow = Date.now();
    const { next, mutation } = replayable((base) => withJobs({ ...base, clockOffsetMs: 0 }, new Date(realNow)).state, ref.current);
    commit(next!, mutation);
  }, [commit]);

  const resetDemoData = useCallback(() => {
    clearState();
    const seedAt = new Date();
    const { next, mutation } = replayable(() => createSeedState(seedAt), ref.current);
    commit(next!, mutation);
  }, [commit]);

  const syncNow = useCallback(() => void syncRef.current?.syncNow(), []);
  const clearSyncNotice = useCallback(() => setSyncNotice(null), []);

  const value = useMemo<StoreValue>(
    () => ({ state, now: clockNow, run, advanceClock, resetClock, resetDemoData, sync, syncNow, syncNotice, clearSyncNotice }),
    [state, run, advanceClock, resetClock, resetDemoData, sync, syncNow, syncNotice, clearSyncNotice],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore phải dùng bên trong AppDataProvider');
  return ctx;
}

/** Giờ demo, cập nhật mỗi `intervalMs` (dùng cho đồng hồ đếm ngược). */
export function useNow(intervalMs = 1_000): Date {
  const { state } = useStore();
  const [tick, setTick] = useState(() => clockNow());
  useEffect(() => {
    setTick(clockNow());
    const t = setInterval(() => setTick(clockNow()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs, state.clockOffsetMs]);
  return tick;
}
