import { useState } from 'react';
import { useUi } from '../../app/UiContext';
import { Field, Input, PrimaryButton, Textarea } from '../../components/form';
import { coopSubmitProfile } from '../../domain/coopProfile';
import { useStore } from '../../store/AppDataContext';

const STATUS = { approved: 'Đã duyệt', pending: 'Chờ duyệt', rejected: 'Bị từ chối' } as const;

/** Hồ sơ HTX: sửa và gửi duyệt, theo dõi kết quả (FR-TK-06/07). */
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
  if (!coop) return null;
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  return (
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
