/**
 * Tạo nội dung mã VietQR (chuẩn EMVCo / NAPAS 247) cho chuyển khoản có sẵn số tiền.
 * Ứng dụng ngân hàng ở Việt Nam quét mã sẽ tự điền: ngân hàng, số tài khoản, số tiền, nội dung.
 * Tạo hoàn toàn ở trình duyệt, không gọi dịch vụ ngoài.
 */

export interface VietQrAccount {
  /** Mã BIN ngân hàng 6 số theo NAPAS, ví dụ Vietcombank 970436, MB 970422, Techcombank 970407. */
  bankBin: string;
  accountNo: string;
  accountName?: string;
  bankName?: string;
}

/** Mã BIN NAPAS của các ngân hàng phổ biến (tên viết tắt → BIN, tên hiển thị). */
export const BANKS: Record<string, { bin: string; name: string }> = {
  VCB: { bin: '970436', name: 'Vietcombank' },
  VIETCOMBANK: { bin: '970436', name: 'Vietcombank' },
  MB: { bin: '970422', name: 'MB Bank' },
  MBBANK: { bin: '970422', name: 'MB Bank' },
  TCB: { bin: '970407', name: 'Techcombank' },
  TECHCOMBANK: { bin: '970407', name: 'Techcombank' },
  BIDV: { bin: '970418', name: 'BIDV' },
  AGRIBANK: { bin: '970405', name: 'Agribank' },
  VBA: { bin: '970405', name: 'Agribank' },
  VIETINBANK: { bin: '970415', name: 'VietinBank' },
  ICB: { bin: '970415', name: 'VietinBank' },
  ACB: { bin: '970416', name: 'ACB' },
  VPB: { bin: '970432', name: 'VPBank' },
  VPBANK: { bin: '970432', name: 'VPBank' },
  TPB: { bin: '970423', name: 'TPBank' },
  TPBANK: { bin: '970423', name: 'TPBank' },
  SACOMBANK: { bin: '970403', name: 'Sacombank' },
  STB: { bin: '970403', name: 'Sacombank' },
  HDB: { bin: '970437', name: 'HDBank' },
  HDBANK: { bin: '970437', name: 'HDBank' },
  VIB: { bin: '970441', name: 'VIB' },
  SHB: { bin: '970443', name: 'SHB' },
  OCB: { bin: '970448', name: 'OCB' },
  MSB: { bin: '970426', name: 'MSB' },
  EIB: { bin: '970431', name: 'Eximbank' },
  EXIMBANK: { bin: '970431', name: 'Eximbank' },
  SEAB: { bin: '970440', name: 'SeABank' },
  SEABANK: { bin: '970440', name: 'SeABank' },
  LPB: { bin: '970449', name: 'LPBank' },
  NAB: { bin: '970428', name: 'Nam A Bank' },
};

/** Nhận tên viết tắt (MB, VCB…) hoặc mã BIN 6 số. */
export function resolveBank(input: string): { bin: string; name: string } {
  const key = input.trim().toUpperCase().replace(/[\s_-]/g, '');
  if (/^\d{6}$/.test(key)) {
    const known = Object.values(BANKS).find((b) => b.bin === key);
    return { bin: key, name: known?.name ?? '' };
  }
  return BANKS[key] ?? { bin: '', name: '' };
}

/** Đọc cấu hình một dòng "NGÂN HÀNG|SỐ TÀI KHOẢN|TÊN CHỦ TÀI KHOẢN". */
export function parseVietQrConfig(raw: string): { bank: string; accountNo: string; accountName: string } {
  const [bank = '', accountNo = '', ...name] = raw.split('|');
  return { bank: bank.trim(), accountNo: accountNo.replace(/\s/g, ''), accountName: name.join('|').trim() };
}

const env = import.meta.env;
// Ưu tiên biến gộp VITE_VIETQR; vẫn đọc các biến tách rời cũ nếu có.
const single = parseVietQrConfig(String(env.VITE_VIETQR ?? ''));
const bankInput = single.bank || String(env.VITE_VIETQR_BANK ?? env.VITE_VIETQR_BANK_BIN ?? '').trim();
const bank = resolveBank(bankInput);

/** Tài khoản nhận tiền, đặt ở .env.local / Vercel (công khai — chỉ là thông tin nhận chuyển khoản). */
export const shopAccount: VietQrAccount = {
  bankBin: bank.bin,
  accountNo: single.accountNo || String(env.VITE_VIETQR_ACCOUNT_NO ?? '').replace(/\s/g, ''),
  accountName: single.accountName || String(env.VITE_VIETQR_ACCOUNT_NAME ?? '').trim(),
  bankName: String(env.VITE_VIETQR_BANK_NAME ?? '').trim() || bank.name,
};

/** Lý do chưa tạo được QR (để báo rõ cho quản trị). */
export function configProblem(): string | null {
  const example = 'Ví dụ: VITE_VIETQR=MB|0123456789|NGUYEN VAN A';
  if (!bankInput) return `Chưa điền VITE_VIETQR. ${example}`;
  if (!bank.bin) return `Không nhận ra ngân hàng "${bankInput}". Dùng tên viết tắt (VCB, MB, TCB, BIDV…) hoặc mã BIN 6 số.`;
  if (!shopAccount.accountNo) return `Thiếu số tài khoản trong VITE_VIETQR. ${example}`;
  if (!/^[0-9A-Za-z]{4,19}$/.test(shopAccount.accountNo)) return 'Số tài khoản không hợp lệ (4–19 chữ/số).';
  return null;
}

export const vietQrConfigured = (acc: VietQrAccount = shopAccount) =>
  /^\d{6}$/.test(acc.bankBin) && /^[0-9A-Za-z]{4,19}$/.test(acc.accountNo);

const tlv = (id: string, value: string) => `${id}${String(value.length).padStart(2, '0')}${value}`;

/** CRC16-CCITT (False): poly 0x1021, khởi tạo 0xFFFF — theo chuẩn EMVCo. */
export function crc16(input: string): string {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(input)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Nội dung chuyển khoản: chỉ chữ/số/khoảng trắng không dấu (nhiều ngân hàng cắt ký tự lạ), tối đa 25 ký tự. */
export function transferNote(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'D')
    .replace(/[^0-9A-Za-z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 25);
}

export function buildVietQrPayload(acc: VietQrAccount, amount: number, note: string): string {
  if (!vietQrConfigured(acc)) throw new Error('Chưa cấu hình tài khoản nhận tiền.');
  if (!Number.isInteger(amount) || amount <= 0) throw new Error('Số tiền không hợp lệ.');
  const beneficiary = tlv('00', acc.bankBin) + tlv('01', acc.accountNo);
  const merchant = tlv('00', 'A000000727') + tlv('01', beneficiary) + tlv('02', 'QRIBFTTA');
  const cleanNote = transferNote(note);
  const body =
    tlv('00', '01') +
    tlv('01', '12') + // 12 = mã động (có số tiền, dùng một lần)
    tlv('38', merchant) +
    tlv('53', '704') + // VND
    tlv('54', String(amount)) +
    tlv('58', 'VN') +
    (cleanNote ? tlv('62', tlv('08', cleanNote)) : '') +
    '6304';
  return body + crc16(body);
}
