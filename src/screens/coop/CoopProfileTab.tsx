import { useState } from 'react';
import { useUi } from '../../app/UiContext';
import { Field, Input, PrimaryButton, Textarea } from '../../components/form';
import { CONTACT_PHONE_RULE, coopPhonesOf, coopSetPhones, formatContactPhone } from '../../domain/coopContact';
import { coopSubmitProfile } from '../../domain/coopProfile';
import { useStore } from '../../store/AppDataContext';

const STATUS = { approved: 'Đã duyệt', pending: 'Chờ duyệt', rejected: 'Bị từ chối' } as const;

/** Hồ sơ HTX: sửa và gửi duyệt, theo dõi kết quả (FR-TK-06/07); 2 SĐT liên hệ cho khách gọi (lưu ngay). */
export function CoopProfileTab() {
  const { state, run } = useStore();
  const { coopActor, showToast } = useUi();
  const coop = state.coops.find((c) => c.id === coopActor.id);
  const [form, setForm] = useState({
    name: coop?.pendingProfile?.name ?? coop?.name ?? '',
    region: coop?.pendingProfile?.region ?? coop?.region ?? '',
    representative: coop?.pendingProfile?.representative ?? coop?.representative ?? '',
    description: coop?.pendingProfile?.description ?? coop?.description ?? '',
  });
  const [phones, setPhones] = useState<string[]>(() => (coop ? coopPhonesOf(coop).map(formatContactPhone) : ['', '']));
  const [phoneError, setPhoneError] = useState<string | null>(null);
  if (!coop) return null;
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const setPhone = (i: number, v: string) => {
    setPhoneError(null);
    setPhones((p) => p.map((x, j) => (j === i ? v : x)));
  };
  const savePhones = () => {
    const r = run((s, at) => coopSetPhones(s, coopActor, phones, at));
    if (!r.ok) {
      setPhoneError(r.error);
      return;
    }
    setPhones(coopPhonesOf(r.value.coops.find((c) => c.id === coop.id)!).map(formatContactPhone));
    showToast('Đã lưu số điện thoại. Khách thấy ngay ở trang sản phẩm và chi tiết đơn.');
  };

  return (
    <div className="space-y-3 xl:grid xl:grid-cols-2 xl:items-start xl:gap-4 xl:space-y-0">
      <div className="space-y-3">
        <section className="space-y-1 rounded-2xl border border-stone-200 bg-white p-3 text-sm">
          <p>
            Tình trạng hồ sơ: <strong>{STATUS[coop.profileStatus]}</strong>
            {coop.profileStatus === 'rejected' && coop.profileRejectReason ? ` – ${coop.profileRejectReason}` : ''}
          </p>
          <p>
            Quyền bán: <strong>{coop.status === 'active' ? 'Đang được bán' : `Tạm khoá – ${coop.suspendReason ?? ''}`}</strong>
          </p>
          <p>Tài khoản nhận chi trả: {coop.payoutAccountMasked}</p>
        </section>
        <section aria-labelledby="sdt-htx" className="space-y-3 rounded-2xl border border-stone-200 bg-white p-3">
          <h4 id="sdt-htx" className="text-sm font-bold">
            Số điện thoại liên hệ (2 số)
          </h4>
          <p className="text-sm text-stone-600">Khách thấy 2 số này ở trang sản phẩm và chi tiết đơn để gọi cho cửa hàng. Lưu ngay, không cần chờ duyệt.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {phones.map((p, i) => (
              <Field key={i} label={`Số điện thoại ${i + 1}`}>
                <Input type="tel" inputMode="tel" autoComplete="tel" value={p} onChange={(e) => setPhone(i, e.target.value)} />
              </Field>
            ))}
          </div>
          <p className="text-xs text-muted">{CONTACT_PHONE_RULE}</p>
          {phoneError && (
            <p role="alert" className="rounded-2xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
              {phoneError}
            </p>
          )}
          <PrimaryButton className="w-full" onClick={savePhones}>
            Lưu số điện thoại
          </PrimaryButton>
        </section>
      </div>
      <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-3">
        <h4 className="text-sm font-bold">Hồ sơ HTX</h4>
        <Field label="Tên HTX">
          <Input value={form.name} onChange={(e) => set({ name: e.target.value })} disabled={coop.profileStatus === 'pending'} />
        </Field>
        <Field label="Vùng sản xuất">
          <Input value={form.region} onChange={(e) => set({ region: e.target.value })} disabled={coop.profileStatus === 'pending'} />
        </Field>
        <Field label="Người đại diện">
          <Input value={form.representative} onChange={(e) => set({ representative: e.target.value })} disabled={coop.profileStatus === 'pending'} />
        </Field>
        <Field label="Giới thiệu">
          <Textarea rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} disabled={coop.profileStatus === 'pending'} />
        </Field>
        <PrimaryButton
          className="w-full"
          disabled={coop.profileStatus === 'pending'}
          onClick={() => {
            const r = run((s, at) => coopSubmitProfile(s, coopActor, form, at));
            showToast(r.ok ? 'Đã gửi hồ sơ. Trạng thái: Chờ duyệt.' : r.error);
          }}
        >
          {coop.profileStatus === 'pending' ? 'Hồ sơ đang chờ duyệt' : 'Gửi duyệt hồ sơ'}
        </PrimaryButton>
        <p className="text-sm text-stone-600">Trong lúc chờ duyệt, khách vẫn thấy thông tin hồ sơ cũ.</p>
      </section>
    </div>
  );
}
