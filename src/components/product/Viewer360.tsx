import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

export interface Viewer360Props {
  totalFrames?: number;
  productName: string;
  onClose: () => void;
}

export const Viewer360: React.FC<Viewer360Props> = ({
  totalFrames = 24,
  productName,
  onClose,
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const lastXRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    lastXRef.current = e.clientX;
    setShowHint(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.stopPropagation();
    const delta = e.clientX - lastXRef.current;
    if (Math.abs(delta) > 8) {
      const step = delta > 0 ? 1 : -1;
      setCurrentFrame((prev) => (prev + step + totalFrames) % totalFrames);
      lastXRef.current = e.clientX;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(false);
  };

  return (
    <div
      role="region"
      aria-label={`Ảnh xoay 360 độ ${productName}`}
      className="relative w-full h-full min-h-[340px] bg-[#2F6650] flex flex-col items-center justify-center p-4 touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Nút đóng chế độ xoay */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        <span className="text-caption text-[#CDA25A] bg-[#35705A] px-2.5 py-1 rounded-full border border-[#5E9A80]">
          Khung {currentFrame + 1} / {totalFrames}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng ảnh xoay 360"
          className="w-10 h-10 rounded-full bg-[#35705A] text-[#FAF7F0] hover:bg-[#4B8A71] flex items-center justify-center border border-[#5E9A80] cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Khung minh họa 360 frame view */}
      <div className="relative flex flex-col items-center justify-center">
        <div
          className="w-56 h-72 rounded-2xl bg-[#FAF7F0] border-2 border-[#B8893B]/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center p-4 transition-transform duration-75"
          style={{
            transform: `rotateY(${((currentFrame * 360) / totalFrames).toFixed(1)}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          <div className="text-4xl mb-3">📦</div>
          <span className="font-serif font-bold text-center text-body text-[#1B1B1F]">
            {productName}
          </span>
          <span className="text-caption text-[#8F6A4D] mt-2">Ảnh chụp xoay 360°</span>
        </div>

        {/* Bóng đổ dưới sản phẩm */}
        <div className="w-40 h-4 bg-black/50 blur-md rounded-full mt-4" />
      </div>

      {/* Chỉ dẫn chạm */}
      {showHint && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#35705A] text-[#CDA25A] text-small font-medium border border-[#B8893B]/40 pointer-events-none animate-pulse flex items-center gap-1.5">
          <RefreshCw size={14} className="animate-spin-slow" />
          <span>Kéo ngang để xoay 360°</span>
        </div>
      )}
    </div>
  );
};
