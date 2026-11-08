import React, { useState } from 'react';
import { Product, MediaItem, MediaType, MediaGroup, MediaApprovalStatus } from '../../mock/types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck,
  Film,
  Box,
  RefreshCw,
  Image as ImageIcon,
  Eye,
  ShieldAlert,
} from 'lucide-react';

export interface MediaManagerProps {
  products: Product[];
  onUpdateProductMedia: (productId: string, updatedMedia: MediaItem[]) => void;
  onBack: () => void;
}

export const MediaManager: React.FC<MediaManagerProps> = ({
  products,
  onUpdateProductMedia,
  onBack,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [rejectModalItem, setRejectModalItem] = useState<MediaItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const currentProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const handleApprove = (item: MediaItem) => {
    // Kiểm tra các điều kiện chặn duyệt theo BR-PT-01 đến 07 & US-09:
    // 1. Video / 360 / 3D thiếu ảnh poster đại diện thì không duyệt được
    if ((item.type === 'video' || item.type === 'spin360' || item.type === 'model3d') && !item.posterUrl) {
      setActionNotice('Không thể duyệt: Phương tiện loại ' + item.type + ' bắt buộc phải có ảnh đại diện (poster).');
      return;
    }

    // 2. Ảnh từ nhà cung cấp gửi hoặc có người làm mà chưa có phiếu đồng ý thì không duyệt được
    if ((item.source === 'supplier' || item.group === 'origin') && !item.hasConsentDoc) {
      setActionNotice('Không thể duyệt: Thiếu phiếu đồng ý sử dụng hình ảnh (Consent Doc).');
      return;
    }

    // 3. Tệp 3D vượt quá 5MB
    if (item.type === 'model3d' && (item.fileSizeBytes || 0) > 5 * 1024 * 1024) {
      setActionNotice('Không thể duyệt: Dung lượng tệp 3D vượt quá 5MB.');
      return;
    }

    const updated = currentProduct.media.map((m) =>
      m.id === item.id ? { ...m, approvalStatus: 'approved' as MediaApprovalStatus, rejectReason: undefined } : m
    );
    onUpdateProductMedia(currentProduct.id, updated);
    setActionNotice(`Đã duyệt phương tiện ${item.alt}`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleOpenReject = (item: MediaItem) => {
    setRejectModalItem(item);
    setRejectReason(item.rejectReason || '');
  };

  const handleConfirmReject = () => {
    if (!rejectModalItem) return;
    if (!rejectReason.trim()) {
      setActionNotice('Bắt buộc phải ghi rõ lý do khi chọn Cần sửa / Từ chối (SRS 5.11).');
      return;
    }

    const updated = currentProduct.media.map((m) =>
      m.id === rejectModalItem.id
        ? {
            ...m,
            approvalStatus: 'rejected' as MediaApprovalStatus,
            rejectReason: rejectReason.trim(),
          }
        : m
    );
    onUpdateProductMedia(currentProduct.id, updated);
    setRejectModalItem(null);
    setActionNotice(`Đã chuyển trạng thái "Cần sửa" cho: ${rejectModalItem.alt}`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const approvedPhotosCount = currentProduct.media.filter(
    (m) => m.type === 'photo' && m.approvalStatus === 'approved'
  ).length;

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#1B1B1F] py-8 px-4 lg:px-8">
      <main className="max-w-5xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7DFCF]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#35705A] text-[#CDA25A] text-xs font-mono font-bold">
                ADMIN WORKFLOW
              </span>
              <h1 className="font-serif text-2xl font-bold text-[#35705A]">
                Quản lý & Duyệt chất lượng phương tiện (BR-PT-01 đến 07)
              </h1>
            </div>
            <p className="text-small text-[#6B4A32] mt-1">
              Kiểm tra dung lượng, ảnh đại diện, phiếu đồng ý hình ảnh và trung thực 3D trước khi hiển thị cho khách hàng.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={onBack}>
            Thoát về trang chủ
          </Button>
        </div>

        {/* Cảnh báo trung thực 3D BR-PT-02 */}
        <div className="p-4 bg-[#FEF7EA] rounded-2xl border border-[#B7791F]/40 flex items-start gap-3">
          <ShieldAlert size={20} className="text-[#B7791F] flex-shrink-0 mt-0.5" />
          <div className="text-small text-[#6B4A32] space-y-1">
            <strong className="text-[#B7791F] block">Quy tắc thể hiện trung thực (BR-PT-02):</strong>
            <span>
              Mô hình 3D và ảnh phải mô phỏng chính xác màu sắc, kích thước và bao bì thật của sản phẩm tại Lào Cai. Tuyệt đối không chỉnh sửa làm sản phẩm bóng bẩy hoặc đẹp hơn thực tế.
            </span>
          </div>
        </div>

        {/* Thông báo thao tác */}
        {actionNotice && (
          <div className="p-3.5 bg-[#EAF4EE] text-[#2F6B4F] rounded-xl border border-[#2F6B4F]/30 text-small font-semibold">
            {actionNotice}
          </div>
        )}

        {/* Chọn sản phẩm để duyệt */}
        <div className="p-4 bg-white rounded-2xl border border-[#E7DFCF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="text-small font-bold text-[#1B1B1F]">Chọn sản phẩm:</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="h-10 px-3 rounded-xl border border-[#E7DFCF] text-small font-medium bg-[#FAF7F0] outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.region})
                </option>
              ))}
            </select>
          </div>

          {/* Kiểm tra điều kiện băng chuyền nổi bật BR-PT-01 */}
          <div className="text-small">
            {approvedPhotosCount >= 5 ? (
              <span className="text-[#2F6B4F] font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={16} /> Đủ điều kiện hiển thị Băng chuyền nổi bật ({approvedPhotosCount}/5 ảnh)
              </span>
            ) : (
              <span className="text-[#B7791F] font-semibold flex items-center gap-1.5">
                <AlertTriangle size={16} /> Chưa đủ 5 ảnh ({approvedPhotosCount}/5 ảnh). Vẫn bán được ở danh mục nhưng KHÔNG lên băng chuyền nổi bật.
              </span>
            )}
          </div>
        </div>

        {/* Bảng danh sách phương tiện */}
        <div className="bg-white rounded-3xl border border-[#E7DFCF] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-small">
              <thead className="bg-[#FAF7F0] border-b border-[#E7DFCF] text-[#6B4A32] font-serif font-bold">
                <tr>
                  <th className="p-4">STT</th>
                  <th className="p-4">Loại & Nhóm</th>
                  <th className="p-4">Mô tả (Alt)</th>
                  <th className="p-4">Nguồn & Phiếu đồng ý</th>
                  <th className="p-4">Dung lượng</th>
                  <th className="p-4">Trạng thái duyệt</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7DFCF]">
                {currentProduct.media.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-[#FAF7F0]/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-[#8F6A4D]">{idx + 1}</td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {item.type === 'model3d' && <Box size={16} className="text-[#B8893B]" />}
                        {item.type === 'spin360' && <RefreshCw size={16} className="text-[#CDA25A]" />}
                        {item.type === 'video' && <Film size={16} className="text-[#2F6B4F]" />}
                        {item.type === 'photo' && <ImageIcon size={16} className="text-[#8F6A4D]" />}
                        <div>
                          <strong className="block text-[#1B1B1F] capitalize">{item.type}</strong>
                          <span className="text-caption text-[#8F6A4D]">Nhóm: {item.group}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 max-w-xs">
                      <p className="line-clamp-2 text-[#33333A]">{item.alt}</p>
                      {item.rejectReason && (
                        <p className="text-caption text-[#A63D3D] font-medium mt-1">
                          Lý do sửa: {item.rejectReason}
                        </p>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="text-caption text-[#6B4A32] block capitalize">
                          {item.source === 'self_shot' ? 'Tự chụp' : 'Nhà cung cấp gửi'}
                        </span>
                        {item.hasConsentDoc ? (
                          <span className="text-xs text-[#2F6B4F] font-semibold flex items-center gap-1">
                            <FileCheck size={13} /> Có phiếu đồng ý
                          </span>
                        ) : (
                          <span className="text-xs text-[#A63D3D] font-semibold flex items-center gap-1">
                            <XCircle size={13} /> Thiếu phiếu đồng ý
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 font-mono text-caption text-[#6B4A32]">
                      {item.fileSizeBytes ? `${(item.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB` : '< 500 KB'}
                    </td>

                    <td className="p-4">
                      {item.approvalStatus === 'approved' ? (
                        <span className="px-2.5 py-1 rounded-full bg-[#EAF4EE] text-[#2F6B4F] text-caption font-semibold">
                          Đã duyệt
                        </span>
                      ) : item.approvalStatus === 'rejected' ? (
                        <span className="px-2.5 py-1 rounded-full bg-[#FDF1F1] text-[#A63D3D] text-caption font-semibold">
                          Cần sửa
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-[#FEF7EA] text-[#B7791F] text-caption font-semibold">
                          Chờ duyệt
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleApprove(item)}
                          disabled={item.approvalStatus === 'approved'}
                          className="px-3 py-1 rounded-full bg-[#EAF4EE] text-[#2F6B4F] hover:bg-[#2F6B4F] hover:text-white disabled:opacity-40 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Duyệt
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenReject(item)}
                          className="px-3 py-1 rounded-full bg-[#FDF1F1] text-[#A63D3D] hover:bg-[#A63D3D] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Cần sửa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal nhập lý do từ chối (bắt buộc theo SRS 5.11) */}
        {rejectModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2F6650]/70 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#1B1B1F]">
                Yêu cầu chỉnh sửa phương tiện
              </h3>
              <p className="text-small text-[#6B4A32]">
                Quy tắc SRS: Khi chọn "Cần sửa", bắt buộc phải ghi rõ lý do để người chụp/nhà cung cấp khắc phục.
              </p>

              <div>
                <label className="block text-small font-semibold text-[#1B1B1F] mb-1">
                  Lý do chi tiết:
                </label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Thiếu phiếu đồng ý quyền hình ảnh; hoặc tệp 3D sai màu so với bao bì thật..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E7DFCF] text-small outline-none focus:border-[#B8893B]"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="ghost" onClick={() => setRejectModalItem(null)}>
                  Huỷ bỏ
                </Button>
                <Button variant="danger" className="flex-1" onClick={handleConfirmReject}>
                  Lưu & Chuyển trạng thái
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
