import {productEditLocks} from './productEditLocks';
export interface Command { name: string; args: unknown[];editToken?:string }
let commands: Command[] | null = null;
let results: unknown[] | null = null;

/** Keep existing typed domain callbacks while sending only named operations to the server. */
export function invoke(name: string, fn: (...args: any[]) => any, args: any[]): any {
  if (results) {
    if (!results.length) throw new Error('Phản hồi thao tác không đầy đủ.');
    return results.shift();
  }
  if (commands) commands.push({ name, ...(name==='coopRequestContentChange'?{editToken:productEditLocks.get(args[1])}:{}),args: args.slice(1).map(a => a instanceof Date ? a.toISOString() : (a && typeof a === 'object' && ['customer','coop','admin','regulator','shipper','system','carrier_sim','gateway_sim'].includes(a.kind) && 'name' in a) ? null : a) });
  return runAsRootIfNeeded(fn, args);
}

const ADMIN_GROUPS = ['operations', 'quality', 'cskh', 'finance'] as const;
const isRootActor = (a: any) => a && typeof a === 'object' && a.kind === 'admin' && a.adminGroup === 'root';

/**
 * Quản trị gốc làm được mọi chức năng: máy chủ chạy lệnh dưới vai nhóm phụ trách (server/command-service.mjs).
 * Bản chạy thử trên trình duyệt làm tương tự — nếu vai root bị hàm nghiệp vụ từ chối, thử lại với từng nhóm.
 * Kết quả thật vẫn do máy chủ quyết định.
 */
function runAsRootIfNeeded(fn: (...args: any[]) => any, args: any[]): any {
  const idx = args.findIndex(isRootActor);
  const first = fn(...args);
  if (idx < 0 || !first || typeof first !== 'object' || first.ok !== false) return first;
  const denied = JSON.stringify(first);
  let realError: unknown = null;
  for (const group of ADMIN_GROUPS) {
    const retry = fn(...args.map((a, i) => (i === idx ? { ...a, adminGroup: group } : a)));
    if (retry && typeof retry === 'object' && retry.ok !== false) return retry;
    // Nhóm này qua được bước kiểm tra quyền nhưng lỗi vì dữ liệu → đó mới là lỗi thật cần báo
    if (realError === null && JSON.stringify(retry) !== denied) realError = retry;
  }
  return realError ?? first;
}
export function capture<T>(fn: () => T): { value: T; commands: Command[] } {
  if (commands || results) throw new Error('Không chạy lồng thao tác.');
  commands = [];
  try { const value = fn(); return { value, commands }; }
  finally { commands = null; }
}
export function replay<T>(values: unknown[], fn: () => T): T {
  results = [...values];
  try { return fn(); } finally { results = null; }
}
