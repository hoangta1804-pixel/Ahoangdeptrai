import { ScanFace } from 'lucide-react';

export function FaceIdModal() {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white p-6">
      <div className="relative w-36 h-36 border-2 border-emerald-500/60 rounded-3xl flex items-center justify-center overflow-hidden mb-4">
        <ScanFace size={72} className="text-emerald-400 animate-pulse" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-400 shadow-[0_0_15px_#10b981] animate-scanline"></div>
      </div>
      <span className="text-sm font-bold tracking-wide">Đang quét Face ID Apple...</span>
      <span className="text-xs text-stone-400 mt-1">Giữ khuôn mặt trong khung hình</span>
    </div>
  );
}
