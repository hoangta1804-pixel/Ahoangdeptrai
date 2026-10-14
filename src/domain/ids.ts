/** Mã đơn duy nhất dạng DH-yyyymmdd-xxxxxx; không dùng 4 số cuối của timestamp (mục 5.1). */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomSuffix(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export function generateOrderCode(at: Date, existing: Iterable<string> = []): string {
  const taken = new Set(existing);
  const ymd = `${at.getFullYear()}${String(at.getMonth() + 1).padStart(2, '0')}${String(at.getDate()).padStart(2, '0')}`;
  let code: string;
  do {
    code = `DH-${ymd}-${randomSuffix(6)}`;
  } while (taken.has(code));
  return code;
}

/** Mã định danh nội bộ cho bản ghi khác (địa chỉ, ticket…). */
export function generateId(prefix: string): string {
  return `${prefix}-${randomSuffix(10)}`;
}
