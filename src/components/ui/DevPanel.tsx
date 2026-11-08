import React, { useState, useEffect } from 'react';
import { Settings, User, Smartphone, RefreshCw, X, ShieldAlert, Zap, Layers } from 'lucide-react';
import { getFeatureFlags, saveFeatureFlags, FeatureFlags } from '../../lib/featureFlags';

export interface DevPanelProps {
  currentUserType: 'guest' | 'user_with_address' | 'user_no_address';
  onSwitchUser: (type: 'guest' | 'user_with_address' | 'user_no_address') => void;
  currentDevice: 'device_1' | 'device_2';
  onSwitchDevice: (device: 'device_1' | 'device_2') => void;
  onSimulateOutOfStockRace: () => void;
  onSimulatePriceChange: () => void;
  onSimulatePaymentFailure: () => void;
  onSimulateLatePaymentArrival: () => void;
}

export const DevPanel: React.FC<DevPanelProps> = ({
  currentUserType,
  onSwitchUser,
  currentDevice,
  onSwitchDevice,
  onSimulateOutOfStockRace,
  onSimulatePriceChange,
  onSimulatePaymentFailure,
  onSimulateLatePaymentArrival,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [flags, setFlags] = useState<FeatureFlags>(getFeatureFlags());

  useEffect(() => {
    const handleFlags = () => setFlags(getFeatureFlags());
    window.addEventListener('dss:flags-changed', handleFlags);
    return () => window.removeEventListener('dss:flags-changed', handleFlags);
  }, []);

  const toggleFlag = (section: keyof FeatureFlags, key: string) => {
    const updated = {
      ...flags,
      [section]: {
        ...(flags[section] as any),
        [key]: !(flags[section] as any)[key],
      },
    };
    setFlags(updated);
    saveFeatureFlags(updated);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Mở công cụ giả lập kiểm thử"
        className="fixed bottom-20 left-4 z-40 flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#2F6650]/90 text-[#CDA25A] text-xs font-mono font-medium shadow-lg border border-[#B8893B]/40 hover:bg-[#35705A] active:scale-95 transition-transform backdrop-blur-md cursor-pointer"
      >
        <Settings size={14} className="animate-spin-slow" />
        <span>Dev Panel</span>
      </button>

      {/* Slide-out Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2F6650]/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#FAF7F0] text-[#1B1B1F] rounded-3xl shadow-2xl border border-[#B8893B]/30 overflow-hidden max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#2F6650] text-[#FAF7F0] border-b border-[#5E9A80]">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-[#CDA25A]" />
                <h3 className="font-serif text-lg font-bold text-[#CDA25A]">
                  Dev & Test Simulator Panel
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[#FAF7F0]/70 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
              {/* User Persona Switcher */}
              <section>
                <div className="flex items-center gap-2 font-semibold text-[#6B4A32] mb-2.5">
                  <User size={16} />
                  <span>Người dùng giả lập (Persona)</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => onSwitchUser('guest')}
                    className={`text-left p-3 rounded-xl border text-xs transition-all ${
                      currentUserType === 'guest'
                        ? 'bg-[#35705A] text-[#FAF7F0] border-[#35705A] font-semibold'
                        : 'bg-white text-[#1B1B1F] border-[#E7DFCF] hover:bg-[#F3EEE2]'
                    }`}
                  >
                    <div className="font-bold">Khách vãng lai (Chưa đăng nhập)</div>
                    <div className="text-xs opacity-80">
                      Giỏ tạm lưu máy khách, không hỏi đăng nhập khi thêm món.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSwitchUser('user_with_address')}
                    className={`text-left p-3 rounded-xl border text-xs transition-all ${
                      currentUserType === 'user_with_address'
                        ? 'bg-[#35705A] text-[#FAF7F0] border-[#35705A] font-semibold'
                        : 'bg-white text-[#1B1B1F] border-[#E7DFCF] hover:bg-[#F3EEE2]'
                    }`}
                  >
                    <div className="font-bold">Anh Hoàng (Đã đăng nhập)</div>
                    <div className="text-xs opacity-80">
                      Có địa chỉ mặc định Ba Đình, Hà Nội + lần trước chọn Trả khi nhận (COD). Đủ điều kiện Mua ngay ≤ 3 chạm.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSwitchUser('user_no_address')}
                    className={`text-left p-3 rounded-xl border text-xs transition-all ${
                      currentUserType === 'user_no_address'
                        ? 'bg-[#35705A] text-[#FAF7F0] border-[#35705A] font-semibold'
                        : 'bg-white text-[#1B1B1F] border-[#E7DFCF] hover:bg-[#F3EEE2]'
                    }`}
                  >
                    <div className="font-bold">Chị Lan (Đã đăng nhập, chưa có địa chỉ)</div>
                    <div className="text-xs opacity-80">
                      Khi vào Đặt hàng sẽ tự mở ngay bảng thêm địa chỉ Hà Nội.
                    </div>
                  </button>
                </div>
              </section>

              {/* Multi-device Simulation */}
              <section>
                <div className="flex items-center gap-2 font-semibold text-[#6B4A32] mb-2.5">
                  <Smartphone size={16} />
                  <span>Giả lập đa thiết bị (Đồng bộ giỏ & Gộp giỏ)</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onSwitchDevice('device_1')}
                    className={`flex-1 py-2 px-3 rounded-xl border text-center text-xs font-semibold ${
                      currentDevice === 'device_1'
                        ? 'bg-[#B8893B] text-[#2F6650] border-[#B8893B]'
                        : 'bg-white text-[#1B1B1F] border-[#E7DFCF]'
                    }`}
                  >
                    Thiết bị A (Điện thoại)
                  </button>
                  <button
                    type="button"
                    onClick={() => onSwitchDevice('device_2')}
                    className={`flex-1 py-2 px-3 rounded-xl border text-center text-xs font-semibold ${
                      currentDevice === 'device_2'
                        ? 'bg-[#B8893B] text-[#2F6650] border-[#B8893B]'
                        : 'bg-white text-[#1B1B1F] border-[#E7DFCF]'
                    }`}
                  >
                    Thiết bị B (Máy tính bảng)
                  </button>
                </div>
              </section>

              {/* Edge Case Simulation Buttons */}
              <section>
                <div className="flex items-center gap-2 font-semibold text-[#6B4A32] mb-2.5">
                  <ShieldAlert size={16} />
                  <span>Kịch bản nghiệp vụ đặc thù (SRS Section 5.8 & 12)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSimulateOutOfStockRace();
                      setIsOpen(false);
                    }}
                    className="p-2.5 bg-white border border-[#E7DFCF] hover:border-[#A63D3D] rounded-xl text-left text-xs hover:bg-[#FDF1F1] transition-colors"
                  >
                    <div className="font-bold text-[#A63D3D]">Tranh món cuối (Race)</div>
                    <div className="text-xs text-[#6B4A32]">
                      Giả lập người khác mua mất món cuối ngay trước khi bấm Đặt hàng.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSimulatePriceChange();
                      setIsOpen(false);
                    }}
                    className="p-2.5 bg-white border border-[#E7DFCF] hover:border-[#B7791F] rounded-xl text-left text-xs hover:bg-[#FEF7EA] transition-colors"
                  >
                    <div className="font-bold text-[#B7791F]">Đổi giá / Ngừng bán</div>
                    <div className="text-xs text-[#6B4A32]">
                      Máy chủ cập nhật giá hoặc ngừng bán, chặn đặt tự động.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSimulatePaymentFailure();
                      setIsOpen(false);
                    }}
                    className="p-2.5 bg-white border border-[#E7DFCF] hover:border-[#A63D3D] rounded-xl text-left text-xs hover:bg-[#FDF1F1] transition-colors"
                  >
                    <div className="font-bold text-[#A63D3D]">Cổng thanh toán lỗi / huỷ</div>
                    <div className="text-xs text-[#6B4A32]">
                      Giả lập giao dịch thanh toán thất bại, cho phép thử lại.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSimulateLatePaymentArrival();
                      setIsOpen(false);
                    }}
                    className="p-2.5 bg-white border border-[#E7DFCF] hover:border-[#2F6B4F] rounded-xl text-left text-xs hover:bg-[#EAF4EE] transition-colors"
                  >
                    <div className="font-bold text-[#2F6B4F]">Tiền về muộn</div>
                    <div className="text-xs text-[#6B4A32]">
                      Tiền về sau khi đơn đã hết 15 phút huỷ → tạo yêu cầu hoàn tiền.
                    </div>
                  </button>
                </div>
              </section>

              {/* Feature Flags */}
              <section>
                <div className="flex items-center gap-2 font-semibold text-[#6B4A32] mb-2.5">
                  <Layers size={16} />
                  <span>Feature Flags (Cờ tính năng)</span>
                </div>
                <div className="space-y-2 bg-white p-3 rounded-2xl border border-[#E7DFCF]">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs">Ảnh xoay 360° (shouldHave.carousel360)</span>
                    <input
                      type="checkbox"
                      checked={flags.shouldHave.carousel360}
                      onChange={() => toggleFlag('shouldHave', 'carousel360')}
                      className="accent-[#B8893B] w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs">Chuyển trước/sau (shouldHave.prevNextProduct)</span>
                    <input
                      type="checkbox"
                      checked={flags.shouldHave.prevNextProduct}
                      onChange={() => toggleFlag('shouldHave', 'prevNextProduct')}
                      className="accent-[#B8893B] w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs">Mua lại từ đơn cũ (shouldHave.reorder)</span>
                    <input
                      type="checkbox"
                      checked={flags.shouldHave.reorder}
                      onChange={() => toggleFlag('shouldHave', 'reorder')}
                      className="accent-[#B8893B] w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs">Báo khi có hàng (couldHave.notifyBackInStock)</span>
                    <input
                      type="checkbox"
                      checked={flags.couldHave.notifyBackInStock}
                      onChange={() => toggleFlag('couldHave', 'notifyBackInStock')}
                      className="accent-[#B8893B] w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs">AR Placeholder (mockup.arPlaceholder)</span>
                    <input
                      type="checkbox"
                      checked={flags.mockup.arPlaceholder}
                      onChange={() => toggleFlag('mockup', 'arPlaceholder')}
                      className="accent-[#B8893B] w-4 h-4"
                    />
                  </label>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-[#F3EEE2] border-t border-[#E7DFCF] text-right">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-full bg-[#35705A] text-[#FAF7F0] text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
