import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, X, ZoomIn, ZoomOut, Box, AlertCircle } from 'lucide-react';

export interface Viewer3DProps {
  modelUrl: string;
  posterUrl?: string;
  alt: string;
  onClose: () => void;
  onFallbackTo360?: () => void;
}

export const Viewer3D: React.FC<Viewer3DProps> = ({
  modelUrl,
  posterUrl,
  alt,
  onClose,
  onFallbackTo360,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showHint, setShowHint] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);

  // Kiểm tra WebGL
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        // Không hỗ trợ WebGL: chuyển fallback âm thầm sang 360 hoặc ảnh (NFR-MN-05)
        if (onFallbackTo360) onFallbackTo360();
        else onClose();
        return;
      }
    } catch {
      if (onFallbackTo360) onFallbackTo360();
      else onClose();
      return;
    }

    // Nạp dynamic <model-viewer> CHỈ khi khách mở 3D (FR-TKSP-13, NFR-MN-02)
    const existingScript = document.querySelector('script[src*="model-viewer"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => setIsLoading(false);
      script.onerror = () => {
        // Fallback
        setIsLoading(false);
      };
      document.head.appendChild(script);
    } else {
      setIsLoading(false);
    }

    // Tự ẩn chỉ dẫn sau 3 giây
    const timer = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(timer);
  }, [onFallbackTo360, onClose]);

  // Kiểm tra file .glb thật sự tồn tại (nếu thiếu -> dùng khung minh hoạ)
  useEffect(() => {
    let cancelled = false;
    fetch(modelUrl, { method: 'HEAD' })
      .then((r) => {
        const type = r.headers.get('content-type') || '';
        if (!cancelled) setModelReady(r.ok && !type.includes('text/html'));
      })
      .catch(() => !cancelled && setModelReady(false));
    return () => {
      cancelled = true;
    };
  }, [modelUrl]);

  // Giải phóng bộ nhớ khi đóng (NFR-MN-09)
  useEffect(() => {
    return () => {
      // Dọn dẹp bộ nhớ WebGL/canvas
      if (containerRef.current) {
        const mv = containerRef.current.querySelector('model-viewer') as any;
        if (mv && typeof mv.dismissPoster === 'function') {
          try {
            mv.pause();
          } catch {}
        }
      }
    };
  }, []);

  // Xử lý kéo xoay (touch & mouse) khóa scroll-snap (BR-PT-06, TS-UI-05)
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    lastXRef.current = e.clientX;
    setShowHint(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    e.stopPropagation();
    const delta = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    setRotationAngle((prev) => prev + delta * 0.8);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    isDraggingRef.current = false;
  };

  const handleReset = () => {
    setRotationAngle(0);
    setZoomLevel(1);
  };

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Khung xem mô hình 3D tương tác"
      className="fixed inset-0 z-50 bg-[#2F6650] flex flex-col items-center justify-between p-4 touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Header điều khiển */}
      <div className="w-full max-w-4xl flex items-center justify-between z-20 pt-2 px-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#4B8A71] flex items-center justify-center text-[#CDA25A]">
            <Box size={18} />
          </div>
          <div>
            <span className="text-small font-bold text-[#FAF7F0] block">Chế độ xem 3D</span>
            <span className="text-xs text-[#A5A5B2]">
              Mô hình 3D mô phỏng theo bao bì thật
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            aria-label="Đặt lại góc nhìn 3D"
            className="min-h-[44px] px-3 py-1.5 rounded-full bg-[#35705A] hover:bg-[#4B8A71] text-[#CDA25A] text-small font-medium border border-[#5E9A80] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw size={15} />
            <span className="hidden sm:inline">Đặt lại góc</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng xem 3D"
            className="min-h-[44px] min-w-[44px] rounded-full bg-[#35705A] hover:bg-[#4B8A71] text-[#FAF7F0] flex items-center justify-center border border-[#5E9A80] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Vùng hiển thị 3D */}
      <div className="relative flex-1 w-full max-w-3xl flex items-center justify-center overflow-hidden">
        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#2F6650]/80">
            <div className="w-12 h-12 border-3 border-[#B8893B]/20 border-t-[#B8893B] rounded-full animate-spin mb-3" />
            <span className="text-small text-[#CDA25A] font-medium">Đang nạp mô hình 3D...</span>
          </div>
        )}

        {/* Dynamic Model-Viewer Element */}
        {modelReady && !loadError && !isLoading ? (
          <div className="relative w-full h-[65vh]">
            {React.createElement('model-viewer', {
              src: modelUrl,
              poster: posterUrl,
              alt,
              'camera-controls': true,
              'auto-rotate': true,
              'shadow-intensity': '1',
              'touch-action': 'pan-y',
              style: { width: '100%', height: '100%', background: 'transparent' },
              onError: () => setLoadError(true),
            })}
          </div>
        ) : (
        <div
          className="relative w-full h-[65vh] flex items-center justify-center"
          style={{
            transform: `scale(${zoomLevel}) rotateY(${rotationAngle}deg)`,
            transition: isDraggingRef.current ? 'none' : 'transform 200ms ease-out',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Tương tác 3D đa chiều */}
          <div className="relative w-64 h-80 rounded-3xl bg-gradient-to-b from-[#FAF7F0] via-[#FAF7F0]/90 to-[#E7DFCF] p-4 flex flex-col items-center justify-between border-2 border-[#B8893B]/60 shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
            {/* Ánh sáng phản chiếu */}
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/70 to-transparent rounded-t-3xl pointer-events-none" />

            <div className="w-full flex justify-between items-center text-[#8F6A4D] text-xs font-semibold uppercase tracking-wider pt-2">
              <span>Đặc Sản Số</span>
              <span>Lào Cai</span>
            </div>

            <div className="my-auto text-center px-2">
              <span className="text-5xl block mb-3 filter drop-shadow-md">🏔️</span>
              <h4 className="font-serif text-xl font-bold text-[#1B1B1F] leading-tight">
                {alt}
              </h4>
              <p className="text-xs text-[#6B4A32] mt-2">Tuyển chọn từ đất lành vùng cao</p>
            </div>

            <div className="w-full pt-2 border-t border-[#E7DFCF] flex justify-between items-center text-xs text-[#8F6A4D]">
              <span>Chuẩn OCOP</span>
              <span className="font-mono text-[#B8893B] font-bold">100% Nguyên bản</span>
            </div>

            {/* Bóng đổ đa tầng mềm mại */}
            <div className="absolute -bottom-8 w-48 h-6 bg-black/40 blur-lg rounded-full pointer-events-none" />
          </div>
        </div>
        )}

        {!modelReady && !isLoading && (
          <p className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-[#F0D9A9] bg-[#2F6650]/90 px-3 py-1 rounded-full">
            Chưa có file mô hình 3D thật — đang hiện bản minh hoạ
          </p>
        )}

        {/* Chỉ dẫn kéo để xoay */}
        {showHint && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-[#35705A]/90 text-[#CDA25A] text-small font-medium border border-[#B8893B]/40 shadow-lg pointer-events-none animate-pulse">
            Chạm và kéo để xoay mô hình 360°
          </div>
        )}
      </div>

      {/* Footer thanh chỉnh Zoom */}
      <div className="w-full max-w-xs flex items-center justify-center gap-4 pb-4 z-20">
        <button
          type="button"
          onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.2))}
          aria-label="Thu nhỏ mô hình"
          className="min-h-[44px] min-w-[44px] rounded-full bg-[#35705A] text-[#FAF7F0] hover:bg-[#4B8A71] flex items-center justify-center border border-[#5E9A80] cursor-pointer"
        >
          <ZoomOut size={18} />
        </button>

        <span className="text-small font-mono text-[#FAF7F0] min-w-[50px] text-center">
          {Math.round(zoomLevel * 100)}%
        </span>

        <button
          type="button"
          onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.2))}
          aria-label="Phóng to mô hình"
          className="min-h-[44px] min-w-[44px] rounded-full bg-[#35705A] text-[#FAF7F0] hover:bg-[#4B8A71] flex items-center justify-center border border-[#5E9A80] cursor-pointer"
        >
          <ZoomIn size={18} />
        </button>
      </div>
    </div>
  );
};
