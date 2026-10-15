import { describe, expect, it } from 'vitest';
import { coopPhonesOf, coopSetPhones, formatContactPhone, isValidContactPhone, normalizeContactPhone } from '../coopContact';
import { ADMIN_QA, COOP_X, CUSTOMER, makeState, T0 } from './fixtures';

describe('SĐT liên hệ của HTX', () => {
  it('nhận số di động và số cố định, nhập dạng nào cũng lưu dạng bắt đầu bằng 0', () => {
    expect(normalizeContactPhone('0912 345 678')).toBe('0912345678');
    expect(normalizeContactPhone('912345678')).toBe('0912345678');
    expect(normalizeContactPhone('+84 912 345 678')).toBe('0912345678');
    expect(normalizeContactPhone('84912345678')).toBe('0912345678');
    expect(normalizeContactPhone('0214 382 1234')).toBe('02143821234');
    expect(normalizeContactPhone('+84 214 382 1234')).toBe('02143821234');
    expect(isValidContactPhone('0912345678')).toBe(true);
    expect(isValidContactPhone('02143821234')).toBe(true);
    expect(isValidContactPhone('09123456789')).toBe(false);
    expect(isValidContactPhone('091234567')).toBe(false);
    expect(formatContactPhone('0912345678')).toBe('0912 345 678');
    expect(formatContactPhone('02143821234')).toBe('0214 382 1234');
  });

  it('HTX lưu 2 số của mình, có nhật ký; khách thấy số mới', () => {
    const s = makeState();
    const r = coopSetPhones(s, COOP_X, ['+84 912 345 678', '0214 382 1234'], T0);
    if (!r.ok) throw new Error(r.error);
    const coop = r.value.coops.find((c) => c.id === 'coop-x')!;
    expect(coop.phones).toEqual(['0912345678', '02143821234']);
    expect(coopPhonesOf(coop)).toEqual(['0912345678', '02143821234']);
    expect(r.value.coops.find((c) => c.id === 'coop-y')!.phones).toBeUndefined();
    expect(r.value.auditLogs[0]).toMatchObject({ action: 'Cập nhật SĐT liên hệ', target: 'HTX X', detail: '0912 345 678 · 0214 382 1234' });
  });

  it('chặn: không phải HTX, thiếu số, số sai, hai số trùng nhau', () => {
    const s = makeState();
    expect(coopSetPhones(s, CUSTOMER, ['0912345678', '0912345679'], T0)).toEqual({ ok: false, error: 'Chỉ HTX cập nhật được SĐT của mình.' });
    expect(coopSetPhones(s, ADMIN_QA, ['0912345678', '0912345679'], T0).ok).toBe(false);
    expect(coopSetPhones(s, COOP_X, ['0912345678'], T0)).toEqual({ ok: false, error: 'Nhập đủ 2 số điện thoại.' });
    expect(coopSetPhones(s, COOP_X, ['0912345678', '  '], T0)).toEqual({ ok: false, error: 'Nhập số điện thoại 2.' });
    expect(coopSetPhones(s, COOP_X, ['12345', '0912345679'], T0).ok).toBe(false);
    expect(coopSetPhones(s, COOP_X, ['0912 345 678', '+84912345678'], T0)).toEqual({ ok: false, error: 'Hai số điện thoại phải khác nhau.' });
  });

  it('dữ liệu đã lưu từ bản trước (chưa có SĐT HTX): HTX mẫu dùng số mẫu, HTX khác chưa có số', () => {
    expect(coopPhonesOf({ id: 'coop-bacha' })).toEqual(['0900000411', '0900000412']);
    expect(coopPhonesOf({ id: 'coop-x' })).toEqual([]);
  });
});
