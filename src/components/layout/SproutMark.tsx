import React from 'react';

/** Logo Đặc Sản Số: mầm cây một thân, hai lá (lá trái xanh, lá phải vàng đồng). */
export const SproutMark: React.FC<{ size?: number; leaf?: string; accent?: string; stem?: string }> = ({
  size = 34,
  leaf = '#2A6F50',
  accent = '#C0A06A',
  stem = '#2A6F50',
}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
    {/* Thân cây */}
    <path d="M20 36V19" stroke={stem} strokeWidth="2.6" strokeLinecap="round" />
    {/* Lá trái */}
    <path d="M20 22C19.5 13.5 13 8.5 4.5 9.2C4.4 17.6 10.8 22.6 20 22Z" fill={leaf} />
    <path d="M19 21C15 17.5 11.5 15 7.5 12.5" stroke="#fff" strokeOpacity=".45" strokeWidth="1.1" strokeLinecap="round" />
    {/* Lá phải */}
    <path d="M20 17.5C20.6 9.8 26.4 4.6 34.5 4.8C34.8 12.8 28.8 18 20 17.5Z" fill={accent} />
    <path d="M21 16.6C24.6 13.4 27.6 10.6 31.5 7.8" stroke="#fff" strokeOpacity=".5" strokeWidth="1.1" strokeLinecap="round" />
    {/* Mặt đất */}
    <path d="M12 36.2H28" stroke={stem} strokeWidth="2.2" strokeLinecap="round" opacity=".35" />
  </svg>
);
