import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Product } from '../../mock/types';
import { ShoppingBag, Search, User as UserIcon, X } from 'lucide-react';
import { Link } from '../ui/Link';
import { useCart } from '../../stores/cartStore';
import { useAuth } from '../../stores/authStore';
import '../../styles/amora-home.css';

export interface HeaderProps {
  products?: Product[];
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenCart: () => void;
  onOpenAuth: () => void;
}

const MountainMark: React.FC = () => (
  <svg width="34" height="28" viewBox="0 0 34 28" fill="none" aria-hidden="true">
    <path d="M1 26 12 6l6 10 4-6 11 16" stroke="#2A6F50" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 26l8-13" stroke="#c0a06a" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const fold = (t: string) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

export const Header: React.FC<HeaderProps> = ({ products = [], currentPath, onNavigate, onOpenCart, onOpenAuth }) => {
  const { lines } = useCart();
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState('');

  const headerRef = useRef<HTMLElement>(null);

  // Đóng ô tìm kiếm: đổi trang, phím Escape, bấm ra ngoài
  useEffect(() => {
    setSearchOpen(false);
  }, [currentPath]);

  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSearchOpen(false);
    const onDown = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [searchOpen]);

  // Gợi ý khi gõ: so khớp tên / vùng, bỏ dấu tiếng Việt
  const suggestions = useMemo(() => {
    const k = fold(q.trim());
    if (k.length < 2) return [];
    return products.filter((p) => fold(`${p.name} ${p.region}`).includes(k)).slice(0, 6);
  }, [q, products]);

  const totalItems = lines.reduce((s, l) => s + l.quantity, 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    if (!v) return;
    onNavigate(`/san-pham?q=${encodeURIComponent(v)}`);
    setSearchOpen(false);
  };

  const nav: { label: string; to: string; on: boolean }[] = [
    { label: 'Trang chủ', to: '/', on: currentPath === '/' },
    { label: 'Sản phẩm', to: '/san-pham', on: currentPath.startsWith('/san-pham') },
    { label: 'Vùng miền', to: '/vung-mien', on: currentPath === '/vung-mien' },
    { label: 'HTX & Nhà sản xuất', to: '/htx', on: currentPath === '/htx' },
    { label: 'Giới thiệu', to: '/gioi-thieu', on: currentPath === '/gioi-thieu' },
  ];

  return (
    <header className="ah-header" ref={headerRef}>
      <div className="ah-header__in">
        <Link to="/" className="ah-logo" aria-label="Đặc Sản Số — về trang chủ">
          <MountainMark />
          <b>Đặc Sản Số</b>
        </Link>

        <nav className="ah-nav" aria-label="Điều hướng chính">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} active={n.on} className={n.on ? 'on' : ''}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ah-icons">
          <button type="button" className="ah-icon" aria-label="Tìm kiếm" onClick={() => setSearchOpen((o) => !o)}>
            {searchOpen ? <X size={20} /> : <Search size={20} />}
          </button>
          <button
            type="button"
            className="ah-icon"
            onClick={onOpenAuth}
            aria-label={user ? `Tài khoản ${user.name}` : 'Đăng nhập'}
          >
            <UserIcon size={20} />
          </button>
          <button type="button" className="ah-icon" onClick={onOpenCart} aria-label={`Giỏ hàng, ${totalItems} sản phẩm`}>
            <ShoppingBag size={20} />
            {totalItems > 0 && <span className="ah-badge">{totalItems}</span>}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="ah-search">
          <form onSubmit={submit} role="search">
            <input
              type="search"
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm chè Shan, mận Bắc Hà, mật ong…"
              aria-label="Tìm đặc sản"
            />
            <button type="submit" className="ah-btn ah-btn--solid">Tìm</button>
          </form>
          {q.trim().length >= 2 && (
            <div className="ah-suggest" role="region" aria-live="polite" aria-label="Gợi ý tìm kiếm">
              {suggestions.length > 0 ? (
                <ul>
                  {suggestions.map((p) => (
                    <li key={p.id}>
                      <Link to={`/san-pham/${p.slug}`} onClick={() => setSearchOpen(false)}>
                        <span>{p.name}</span>
                        <small>{p.region}</small>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>
                  Không tìm thấy đặc sản cho “{q.trim()}”. Thử “chè”, “mật ong”, “Bắc Hà”…
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
