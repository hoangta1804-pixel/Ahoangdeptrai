import { useState } from 'react';
import { useUi } from '../../app/UiContext';
import { DangerButton, Input, PrimaryButton, SecondaryButton } from '../../components/form';
import { GIFT_BOX_MAX, GIFT_BOX_MIN, opsDeleteGiftBox, opsDeleteWard, opsSaveGiftBox, opsSaveWard, opsUpdateParam } from '../../domain/adminConfig';
import { formatMoney } from '../../domain/pricing';
import type { ExpressTier } from '../../domain/params';
import type { GiftBoxType, Ward } from '../../domain/types';
import { useStore } from '../../store/AppDataContext';

/** Danh mục dùng chung (FR-HT-04): phường/xã giao hàng, loại hộp quà (2–3 loại), bậc phụ phí hoả tốc (FEE-02). */
export function SharedCatalogTab() {
  const { state } = useStore();
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="text-base font-bold">Phường/xã giao hàng (Hà Nội)</h3>
        <p className="text-sm text-stone-600">Danh sách mẫu, ghi "(mẫu)" cho tới khi nhóm nạp danh mục chính thức. Không dùng cấp quận/huyện. Khoảng cách dùng để tính phụ phí hoả tốc.</p>
        <ul className="space-y-1">
          {state.wards.map((w) => (
            <WardRow key={w.id} ward={w} />
          ))}
          <WardRow />
        </ul>
      </section>
      <section className="space-y-2">
        <h3 className="text-base font-bold">
          Loại hộp quà ({state.giftBoxTypes.length}/{GIFT_BOX_MAX}, tối thiểu {GIFT_BOX_MIN})
        </h3>
        <ul className="space-y-1">
          {state.giftBoxTypes.map((b) => (
            <GiftRow key={b.id} box={b} />
          ))}
          {state.giftBoxTypes.length < GIFT_BOX_MAX && <GiftRow />}
        </ul>
      </section>
      <ExpressTiers />
    </div>
  );
}

function WardRow({ ward }: { ward?: Ward }) {
  const { run } = useStore();
  const { adminActor, showToast } = useUi();
  const [name, setName] = useState(ward?.name ?? '');
  const [km, setKm] = useState(ward ? String(ward.distanceKm) : '');
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-2">
      <div className="min-w-56 flex-1">
        <Input aria-label="Tên phường/xã" value={name} onChange={(e) => setName(e.target.value)} placeholder="Thêm phường/xã (mẫu)" />
      </div>
      <div className="w-28">
        <Input aria-label="Khoảng cách km" type="number" step="0.1" value={km} onChange={(e) => setKm(e.target.value)} placeholder="km" />
      </div>
      <SecondaryButton
        onClick={() => {
          const r = run((s, at) => opsSaveWard(s, adminActor, { id: ward?.id, name, distanceKm: Number(km) }, at));
          showToast(r.ok ? 'Đã lưu phường/xã.' : r.error);
          if (r.ok && !ward) {
            setName('');
            setKm('');
          }
        }}
      >
        {ward ? 'Lưu' : 'Thêm'}
      </SecondaryButton>
      {ward && (
        <DangerButton
          onClick={() => {
            const r = run((s, at) => opsDeleteWard(s, adminActor, ward.id, at));
            showToast(r.ok ? 'Đã xoá.' : r.error);
          }}
        >
          Xoá
        </DangerButton>
      )}
    </li>
  );
}

function GiftRow({ box }: { box?: GiftBoxType }) {
  const { run } = useStore();
  const { adminActor, showToast } = useUi();
  const [name, setName] = useState(box?.name ?? '');
  const [fee, setFee] = useState(box ? String(box.fee) : '');
  const [desc, setDesc] = useState(box?.description ?? '');
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-2">
      <div className="min-w-48 flex-1">
        <Input aria-label="Tên hộp quà" value={name} onChange={(e) => setName(e.target.value)} placeholder="Thêm loại hộp" />
      </div>
      <div className="w-32">
        <Input aria-label="Phí hộp (đồng)" type="number" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="Phí (đ)" />
      </div>
      <div className="min-w-48 flex-1">
        <Input aria-label="Mô tả hộp quà" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Mô tả" />
      </div>
      <SecondaryButton
        onClick={() => {
          const r = run((s, at) => opsSaveGiftBox(s, adminActor, { id: box?.id, name, fee: Number(fee), description: desc }, at));
          showToast(r.ok ? 'Đã lưu hộp quà.' : r.error);
        }}
      >
        {box ? 'Lưu' : 'Thêm'}
      </SecondaryButton>
      {box && (
        <DangerButton
          onClick={() => {
            const r = run((s, at) => opsDeleteGiftBox(s, adminActor, box.id, at));
            showToast(r.ok ? 'Đã xoá.' : r.error);
          }}
        >
          Xoá
        </DangerButton>
      )}
    </li>
  );
}

function ExpressTiers() {
  const { state, run } = useStore();
  const { adminActor, showToast } = useUi();
  const [tiers, setTiers] = useState<ExpressTier[]>(state.params.expressTiers);
  const [reason, setReason] = useState('');
  return (
    <section className="space-y-2">
      <h3 className="text-base font-bold">Bậc phụ phí hoả tốc (FEE-02)</h3>
      <ul className="space-y-1">
        {tiers.map((t, i) => (
          <li key={i} className="flex items-center gap-2 rounded-xl bg-white p-2 text-sm">
            <span className="w-32">
              {i === 0 ? 0 : tiers[i - 1].maxKm}–{t.maxKm} km
            </span>
            <div className="w-36">
              <Input aria-label={`Phụ phí bậc ${i + 1}`} type="number" value={t.fee} onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, fee: Number(e.target.value) } : x)))} />
            </div>
            <span className="text-stone-500">hiện tại {formatMoney(state.params.expressTiers[i]?.fee ?? 0)}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <div className="min-w-56 flex-1">
          <Input aria-label="Lý do sửa bậc phí" placeholder="Lý do" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <PrimaryButton
          onClick={() => {
            const r = run((s, at) => opsUpdateParam(s, adminActor, 'expressTiers', tiers, reason, at));
            showToast(r.ok ? 'Đã sửa bậc phụ phí. Áp cho đơn tạo từ bây giờ.' : r.error);
          }}
        >
          Lưu bậc phí
        </PrimaryButton>
      </div>
    </section>
  );
}
