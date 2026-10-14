/**
 * Store dữ liệu dùng chung, lưu localStorage (mục 7). Mở nhiều tab cùng trình duyệt thấy chung dữ liệu.
 * Mọi thay đổi dữ liệu đi qua các hàm trong src/domain thông qua run().
 * Tác vụ theo giờ (hết hạn thanh toán, quá hạn xác nhận…) chạy khi tải app, mỗi 5 giây và sau khi tua đồng hồ.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { now as clockNow, setClockOffset } from '../domain/clock';
import { jobsChanged, runScheduledJobs } from '../domain/jobs';
import type { DemoState, Result } from '../domain/types';
import { createSeedState } from '../data/seed';
import { clearState, loadState, saveState, STORAGE_KEY } from './persistence';

interface StoreValue {
  state: DemoState;
  /** Giờ hiện tại của đồng hồ demo. */
  now: () => Date;
  /** Chạy một thao tác domain trên dữ liệu mới nhất. Thành công thì lưu và trả về kết quả. */
  run: <T = DemoState>(op: (s: DemoState, at: Date) => Result<T>, pick?: (value: T) => DemoState) => Result<T>;
  /** Tua đồng hồ demo thêm `ms` mili giây rồi chạy các tác vụ theo giờ. */
  advanceClock: (ms: number) => void;
  resetClock: () => void;
  /** Xoá dữ liệu đã lưu và nạp lại dữ liệu mẫu. */
  resetDemoData: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function initialState(): DemoState {
  const loaded = loadState<DemoState>(() => createSeedState(new Date()));
  setClockOffset(loaded.clockOffsetMs ?? 0);
  return runScheduledJobs(loaded, clockNow()).state;
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(initialState);
  const ref = useRef(state);

  const commit = useCallback((next: DemoState) => {
    ref.current = next;
    setClockOffset(next.clockOffsetMs);
    setState(next);
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  // Tab khác cùng trình duyệt ghi dữ liệu thì nạp lại.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) commit(loadState<DemoState>(() => createSeedState(new Date())));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [commit]);

  const runJobs = useCallback(() => {
    const { state: next, report } = runScheduledJobs(ref.current, clockNow());
    if (jobsChanged(report)) commit(next);
  }, [commit]);

  useEffect(() => {
    const t = setInterval(runJobs, 5_000);
    return () => clearInterval(t);
  }, [runJobs]);

  const run = useCallback(
    <T,>(op: (s: DemoState, at: Date) => Result<T>, pick?: (value: T) => DemoState): Result<T> => {
      const r = op(ref.current, clockNow());
      if (r.ok) commit(pick ? pick(r.value) : (r.value as unknown as DemoState));
      return r;
    },
    [commit],
  );

  const advanceClock = useCallback(
    (ms: number) => {
      const shifted = { ...ref.current, clockOffsetMs: ref.current.clockOffsetMs + ms };
      setClockOffset(shifted.clockOffsetMs);
      commit(runScheduledJobs(shifted, clockNow()).state);
    },
    [commit],
  );

  const resetClock = useCallback(() => {
    setClockOffset(0);
    commit(runScheduledJobs({ ...ref.current, clockOffsetMs: 0 }, clockNow()).state);
  }, [commit]);

  const resetDemoData = useCallback(() => {
    clearState();
    setClockOffset(0);
    commit(createSeedState(new Date()));
  }, [commit]);

  const value = useMemo<StoreValue>(
    () => ({ state, now: clockNow, run, advanceClock, resetClock, resetDemoData }),
    [state, run, advanceClock, resetClock, resetDemoData],
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
