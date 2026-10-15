import { useUi } from '../../app/UiContext';
import { CoopCallLinks } from '../../components/CoopPhones';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import { listCoopContacts } from '../../domain/coopContact';
import { useStore } from '../../store/AppDataContext';

/**
 * Danh bạ HTX cho Admin (mọi nhóm quyền): 2 SĐT của từng HTX để Admin gọi khi cần (chủ repo yêu cầu).
 * SĐT HTX không công khai: khách không thấy ở trang sản phẩm hay trong đơn, QLNN không xem.
 */
export function AdminCoopContactsTab() {
  const { state } = useStore();
  const { adminActor } = useUi();
  const listed = listCoopContacts(state, adminActor);
  if (!listed.ok) return <ErrorState>{listed.error}</ErrorState>;
  if (listed.value.length === 0) return <EmptyState>Chưa có HTX nào.</EmptyState>;
  return (
    <div className="space-y-3">
      <p className="text-sm text-stone-600">Bấm số để gọi bằng điện thoại của bạn. SĐT do HTX tự cập nhật ở mục Hồ sơ; chỉ Admin xem được, khách và Cơ quan QLNN không thấy.</p>
      {/* Thẻ thay cho bảng: trên điện thoại nút gọi hiện ngay, không phải cuộn ngang. */}
      <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3" aria-label="Danh bạ HTX">
        {listed.value.map((c) => (
          <li key={c.coopId} className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
            <div>
              <h3 className="font-bold text-ink">{c.name}</h3>
              <p className="text-sm text-stone-600">
                Vùng {c.region}
                {c.representative ? ` · Đại diện: ${c.representative}` : ''} · {c.status === 'active' ? 'Đang được bán' : 'Tạm khoá bán'}
              </p>
            </div>
            <CoopCallLinks name={c.name} phones={c.phones} />
          </li>
        ))}
      </ul>
    </div>
  );
}
