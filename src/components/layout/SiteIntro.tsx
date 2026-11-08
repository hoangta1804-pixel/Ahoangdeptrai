import React, { useEffect, useRef, useState } from 'react';

const SEEN = 'dss:intro-seen';
const DURATION = 2600; // thời gian hiển thị trước khi rèm kéo lên
const LEAVE = 800; // thời gian rèm kéo lên

/** Hiện một lần mỗi phiên; không hiện cho trình duyệt tự động (test). */
function shouldShow(): boolean {
  try {
    if (navigator.webdriver) return false;
    if (sessionStorage.getItem(SEEN)) return false;
  } catch {
    /* sessionStorage bị chặn: vẫn hiện */
  }
  return true;
}

const TITLE = 'Đặc Sản Số';

/** Màn chào khi mở web: mầm cây mọc lên → tên thương hiệu → rèm kéo lên lộ trang chủ. */
export const SiteIntro: React.FC = () => {
  const [phase, setPhase] = useState<'show' | 'leave' | 'done'>(() => (shouldShow() ? 'show' : 'done'));
  const skipRef = useRef<HTMLButtonElement>(null);

  // Trong lúc intro hiện: tạm dừng hiệu ứng hero bên dưới, khoá cuộn
  useEffect(() => {
    if (phase === 'done') {
      document.documentElement.classList.remove('intro-active');
      return;
    }
    if (phase === 'show') {
      document.documentElement.classList.add('intro-active');
      try {
        sessionStorage.setItem(SEEN, '1');
      } catch {
        /* bỏ qua */
      }
      skipRef.current?.focus({ preventScroll: true });
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const t = setTimeout(() => setPhase('leave'), reduced ? 700 : DURATION);
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPhase('leave');
      window.addEventListener('keydown', onKey);
      return () => {
        clearTimeout(t);
        window.removeEventListener('keydown', onKey);
        document.body.style.overflow = prevOverflow;
      };
    }
    // leave: thả hiệu ứng hero chạy cùng lúc rèm kéo lên
    document.documentElement.classList.remove('intro-active');
    const t = setTimeout(() => setPhase('done'), LEAVE);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === 'done') return null;
  const skip = () => setPhase('leave');

  return (
    <div className={`si ${phase === 'leave' ? 'si--leave' : ''}`} role="presentation" onClick={skip}>
      <div className="si__glow" aria-hidden="true" />
      <div className="si__center">
        <svg className="si__sprout" width="112" height="112" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path className="si__ground" d="M12 36.2H28" stroke="#2A6F50" strokeWidth="1.6" strokeLinecap="round" />
          <path className="si__stem" d="M20 36V19" stroke="#2A6F50" strokeWidth="2.4" strokeLinecap="round" />
          <g className="si__leaf si__leaf--l">
            <path d="M20 22C19.5 13.5 13 8.5 4.5 9.2C4.4 17.6 10.8 22.6 20 22Z" fill="#2A6F50" />
            <path d="M19 21C15 17.5 11.5 15 7.5 12.5" stroke="#fff" strokeOpacity=".45" strokeWidth="1" strokeLinecap="round" />
          </g>
          <g className="si__leaf si__leaf--r">
            <path d="M20 17.5C20.6 9.8 26.4 4.6 34.5 4.8C34.8 12.8 28.8 18 20 17.5Z" fill="#C0A06A" />
            <path d="M21 16.6C24.6 13.4 27.6 10.6 31.5 7.8" stroke="#fff" strokeOpacity=".5" strokeWidth="1" strokeLinecap="round" />
          </g>
        </svg>
        <p className="si__title" aria-label={TITLE}>
          {TITLE.split('').map((ch, i) => (
            <span key={i} aria-hidden="true" style={{ animationDelay: `${1.05 + i * 0.05}s` }}>
              {ch === ' ' ? ' ' : ch}
            </span>
          ))}
        </p>
        <p className="si__caption">Đặc sản Lào Cai · Tuyển chọn từ miền đất lành</p>
        <span className="si__bar" aria-hidden="true">
          <span />
        </span>
      </div>
      <button
        ref={skipRef}
        type="button"
        className="si__skip"
        onClick={(e) => {
          e.stopPropagation();
          skip();
        }}
      >
        Bỏ qua
      </button>
    </div>
  );
};
