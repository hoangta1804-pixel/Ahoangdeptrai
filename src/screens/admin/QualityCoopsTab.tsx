import { useState } from 'react';
import { useUi } from '../../app/UiContext';
import { DangerButton, Input, PrimaryButton, SecondaryButton } from '../../components/form';
import { qualityDecideCoopProfile, qualitySetSellingRights } from '../../domain/coopProfile';
import type { Coop } from '../../domain/types';
import { useStore } from '../../store/AppDataContext';

/** Admin – Chất lượng duyệt hồ sơ HTX (FR-TK-08/09) và kích hoạt / tạm khoá quyền bán (FR-TK-13). */
export function QualityCoopsTab() {
  const { state } = useStore();
  return (
    <div className="space-y-3">
      {state.coops.map((c) => (
        <CoopRow key={c.id} coop={c} />
      ))}
    </div>
  );
}

function CoopRow({ coop: c }: { coop: Coop }) {
  const { run } = useStore();
  const { adminActor, showToast } = useUi();
  const [reason, setReason] = useState('');
  const act = (op: Parameters<typeof run>[0], ok: string) => {
    const r = run(op);
    showToast(r.ok ? ok : r.error);
    if (r.ok) setReason('');
  };
  return (
    <div className="space-y-2 rounded-2xl border border-stone-200 bg-white p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong className="text-base">{c.name}</strong>
        <span className="flex gap-1 text-xs font-bold">
          <span className="rounded-md bg-stone-100 px-2 py-0.5">Hồ sơ: {c.profileStatus === 'approved' ? 'Đã duyệt' : c.profileStatus === 'pending' ? 'Chờ duyệt' : 'Bị từ chối'}</span>
          <span className={`rounded-md px-2 py-0.5 ${c.status === 'active' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>{c.status === 'active' ? 'Đang được bán' : 'Tạm khoá bán'}</span>
        </span>
      </div>
      <p className="text-stone-600">
        Vùng {c.region}
        {c.representative ? ` · Đại diện: ${c.representative}` : ''}
        {c.suspendReason ? ` · Lý do khoá: ${c.suspendReason}` : ''}
      </p>
      {c.profileStatus === 'pending' && c.pendingProfile && (
        <div className="rounded-xl bg-amber-50 p-2">
          <p className="font-semibold">Hồ sơ gửi duyệt:</p>
          <p>
            {c.pendingProfile.name} · {c.pendingProfile.region} · Đại diện: {c.pendingProfile.representative}
          </p>
          {c.pendingProfile.description && <p className="text-stone-700">{c.pendingProfile.description}</p>}
        </div>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-56 flex-1">
          <Input aria-label={`Lý do cho ${c.name}`} placeholder="Lý do (bắt buộc khi từ chối hoặc khoá bán)" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        {c.profileStatus === 'pending' && (
          <>
            <DangerButton onClick={() => act((s, t) => qualityDecideCoopProfile(s, adminActor, c.id, false, reason, t), 'Đã từ chối hồ sơ.')}>Từ chối hồ sơ</DangerButton>
            <PrimaryButton onClick={() => act((s, t) => qualityDecideCoopProfile(s, adminActor, c.id, true, '', t), 'Đã duyệt hồ sơ.')}>Duyệt hồ sơ</PrimaryButton>
          </>
        )}
        {c.status === 'active' ? (
          <DangerButton onClick={() => act((s, t) => qualitySetSellingRights(s, adminActor, c.id, false, reason, t), 'Đã tạm khoá quyền bán.')}>Tạm khoá bán</DangerButton>
        ) : (
          <SecondaryButton onClick={() => act((s, t) => qualitySetSellingRights(s, adminActor, c.id, true, reason, t), 'Đã kích hoạt quyền bán.')}>Kích hoạt bán</SecondaryButton>
        )}
      </div>
    </div>
  );
}
