/**
 * Lưu dữ liệu demo vào localStorage để các vai trò trên cùng trình duyệt thấy chung dữ liệu.
 * Mọi thao tác đọc/ghi bọc try/catch: trình duyệt chặn lưu trữ thì app vẫn chạy với dữ liệu mẫu.
 */
export const STORAGE_KEY = 'dac-san-so-lao-cai:data';
export const STORAGE_VERSION = 2;

interface Envelope<T> {
  version: number;
  data: T;
}

export function loadState<T>(fallback: () => T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback();
    const parsed = JSON.parse(raw) as Envelope<T>;
    if (parsed?.version !== STORAGE_VERSION || !parsed.data) return fallback();
    return { ...fallback(), ...parsed.data };
  } catch {
    return fallback();
  }
}

export function saveState<T>(data: T): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, data } satisfies Envelope<T>));
  } catch {
    // Không lưu được (chế độ riêng tư, hết dung lượng…): bỏ qua, dữ liệu vẫn giữ trong phiên.
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // bỏ qua
  }
}
