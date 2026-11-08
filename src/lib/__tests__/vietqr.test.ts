import { describe, expect, it } from 'vitest';
import { buildVietQrPayload, crc16, transferNote, vietQrConfigured } from '../vietqr';

const acc = { bankBin: '970436', accountNo: '0011001234567' };

describe('VietQR', () => {
  it('CRC16-CCITT khớp giá trị chuẩn', () => {
    expect(crc16('123456789')).toBe('29B1');
  });

  it('tạo mã có đúng ngân hàng, tài khoản, số tiền, nội dung', () => {
    const p = buildVietQrPayload(acc, 185000, 'DSS-123456-ABCD');
    expect(p.startsWith('000201010212')).toBe(true);
    expect(p).toContain('0010A000000727');
    expect(p).toContain('0006970436');
    expect(p).toContain('01130011001234567');
    expect(p).toContain('0208QRIBFTTA');
    expect(p).toContain('5303704');
    expect(p).toContain('5406185000');
    expect(p).toContain('5802VN');
    expect(p).toContain('62170813DSS123456ABCD');
    // CRC ở cuối phải khớp phần còn lại
    expect(p.slice(-8, -4)).toBe('6304');
    expect(crc16(p.slice(0, -4))).toBe(p.slice(-4));
  });

  it('nội dung chuyển khoản bỏ dấu, bỏ ký tự lạ, tối đa 25 ký tự', () => {
    expect(transferNote('Đơn hàng #DSS-01 của Lê Minh An rất dài')).toBe('Don hang DSS01 cua Le Min');
  });

  it('từ chối cấu hình hoặc số tiền sai', () => {
    expect(vietQrConfigured({ bankBin: '', accountNo: '' })).toBe(false);
    expect(() => buildVietQrPayload(acc, 0, 'x')).toThrow();
    expect(() => buildVietQrPayload(acc, 1000.5, 'x')).toThrow();
  });
});

describe('resolveBank', () => {
  it('nhận tên viết tắt, không phân biệt hoa thường', async () => {
    const { resolveBank } = await import('../vietqr');
    expect(resolveBank('mb')).toEqual({ bin: '970422', name: 'MB Bank' });
    expect(resolveBank('VCB').bin).toBe('970436');
    expect(resolveBank(' Techcombank ').bin).toBe('970407');
  });
  it('nhận mã BIN 6 số, báo rỗng khi không biết', async () => {
    const { resolveBank } = await import('../vietqr');
    expect(resolveBank('970418').name).toBe('BIDV');
    expect(resolveBank('khongco').bin).toBe('');
  });
});

describe('parseVietQrConfig', () => {
  it('tách 1 dòng NGÂN HÀNG|STK|TÊN, bỏ khoảng trắng thừa', async () => {
    const { parseVietQrConfig } = await import('../vietqr');
    expect(parseVietQrConfig('BIDV| 341 234 5678 | TRAN ANH HOANG ')).toEqual({
      bank: 'BIDV',
      accountNo: '3412345678',
      accountName: 'TRAN ANH HOANG',
    });
    expect(parseVietQrConfig('')).toEqual({ bank: '', accountNo: '', accountName: '' });
  });
});
