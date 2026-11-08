import React, { useMemo } from 'react';
import { Product, Variant, ThemeId } from '../mock/types';
import { ProductCard } from '../components/product/ProductCard';
import { ProductCarousel } from '../components/product/ProductCarousel';
import { ArrowRight, BadgeCheck, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import '../styles/amora-home.css';

export interface HomePageProps {
  products: Product[];
  onOpenDetail: (product: Product) => void;
  onQuickAdd: (product: Product, variant: Variant) => void;
  onOpenQuickAddSheet: (product: Product) => void;
  onViewAllTheme: (themeId: ThemeId) => void;
  onSelectRegion: (region: string) => void;
  onNavigate: (path: string) => void;
}

const TRUST = [
  { icon: BadgeCheck, title: 'Nguồn gốc minh bạch', text: 'Từ HTX & nông dân' },
  { icon: ShieldCheck, title: 'Chất lượng kiểm định', text: 'An toàn, đạt chuẩn' },
  { icon: Truck, title: 'Giao hàng Hà Nội', text: 'Đóng gói kỹ, giữ tươi' },
  { icon: RotateCcw, title: 'Đổi trả linh hoạt', text: 'Trong 7 ngày' },
];

const CATEGORIES = [
  { icon: '🍵', title: 'Trà & thức uống', text: 'Chè Shan tuyết, trà hoa vàng', to: '/san-pham?q=ch%C3%A8' },
  { icon: '🍯', title: 'Mật ong & chế biến', text: 'Sản vật làm thủ công', to: '/san-pham?q=m%E1%BA%ADt' },
  { icon: '🍎', title: 'Nông sản theo mùa', text: 'Mận, cốm, gạo đầu vụ', to: '/san-pham?chu-de=in_season' },
  { icon: '🎁', title: 'Quà tặng tinh hoa', text: 'Gói ghém câu chuyện quê nhà', to: '/san-pham?chu-de=gift' },
];

const REGIONS = [
  { name: 'Bắc Hà', img: '/images/stitch/region-2.jpg', note: 'Mận tam hoa, rượu ngô, phở hồng' },
  { name: 'Sa Pa', img: '/images/stitch/region-1.jpg', note: 'Gác bếp, cá tầm, thảo quả' },
  { name: 'Mường Khương', img: '/images/stitch/hero.jpg', note: 'Gạo Séng Cù, tương ớt' },
  { name: 'Suối Giàng', img: '/images/stitch/region-4.jpg', note: 'Chè Shan tuyết cổ thụ' },
  { name: 'Tú Lệ', img: '/images/stitch/farmer.jpg', note: 'Cốm non thung lũng' },
  { name: 'Bảo Hà', img: '/images/stitch/honey.jpg', note: 'Mật ong hoa rừng' },
  { name: 'Bảo Yên', img: '/images/stitch/tea.jpg', note: 'Trà hoa vàng' },
  { name: 'Xem tất cả', img: '', note: 'Toàn bộ vùng đặc sản' },
];

export const HomePage: React.FC<HomePageProps> = ({
  products,
  onOpenDetail,
  onQuickAdd,
  onOpenQuickAddSheet,
  onViewAllTheme,
  onSelectRegion,
  onNavigate,
}) => {
  // Sản phẩm nổi bật: ưu tiên bán chạy; luật BR-PT-01 (đủ 5 ảnh đã duyệt)
  const featured = useMemo(() => {
    const ok = products.filter((p) => p.media.filter((m) => m.approvalStatus === 'approved').length >= 5);
    const rank = (p: Product) => p.themeMappings.find((t) => t.themeId === 'best_seller' && t.isActive)?.sortOrder ?? 99;
    return [...ok].sort((a, b) => rank(a) - rank(b)).slice(0, 4);
  }, [products]);

  const cardProps = { onOpenDetail, onQuickAdd, onOpenQuickAddSheet, themeVariant: 'light' as const };

  return (
    <div className="ah">
      {/* HERO */}
      <section className="ah-hero" aria-labelledby="hero-heading">
        <div className="ah-wrap">
          <div className="ah-hero__frame">
            <img className="ah-hero__photo" src="/images/amora/hero.jpg" alt="Đặc sản vùng miền: tương ớt, thịt gác bếp, bánh cuốn, trứng gà" />
            <div className="ah-hero__copy">
              <p className="ah-hero__brand">Đặc Sản Số</p>
              <h1 id="hero-heading">Đặc sản vùng miền</h1>
              <p className="ah-hero__tag">Chuẩn vị · Chính gốc · Bền vững</p>
              <div className="ah-hero__btns">
                <button type="button" className="ah-btn ah-btn--green" onClick={() => onNavigate('/san-pham')}>
                  Mua ngay
                </button>
                <button
                  type="button"
                  className="ah-btn ah-btn--ghost"
                  onClick={() => document.getElementById('vung-mien')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Khám phá vùng miền
                </button>
              </div>
            </div>
          </div>

          <div className="ah-trust">
            {TRUST.map(({ icon: Icon, title, text }) => (
              <div key={title} className="ah-trust__item">
                <Icon size={26} strokeWidth={1.6} aria-hidden="true" />
                <div>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SẢN PHẨM NỔI BẬT */}
      <section className="ah-section" id="san-pham-noi-bat">
        <div className="ah-wrap">
          <div className="ah-head">
            <div>
              <p className="ah-eyebrow">Tuyển chọn cho bạn</p>
              <h2 className="ah-h2">Sản phẩm nổi bật</h2>
            </div>
            <button type="button" className="ah-link" onClick={() => onNavigate('/san-pham')}>
              Xem tất cả <ArrowRight size={14} />
            </button>
          </div>
          {featured.length > 0 ? (
            <div className="ah-grid4">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} {...cardProps} />
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--ah-muted)' }}>Sản phẩm đang được cập nhật.</p>
          )}
        </div>
      </section>

      {/* DANH MỤC */}
      <section className="ah-section" style={{ paddingTop: 0 }}>
        <div className="ah-wrap">
          <div className="ah-head">
            <div>
              <p className="ah-eyebrow">Khám phá theo nhóm</p>
              <h2 className="ah-h2">Chọn theo nhu cầu</h2>
            </div>
          </div>
          <div className="ah-cats">
            {CATEGORIES.map((c) => (
              <button key={c.title} type="button" className="ah-cat" onClick={() => onNavigate(c.to)}>
                <span className="ah-cat__ic" aria-hidden="true">{c.icon}</span>
                <span>
                  <h3>{c.title}</h3>
                  <p>{c.text}</p>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* THEO MÙA & QUÀ BIẾU (giữ băng chuyền hiện có) */}
      <section style={{ padding: '24px 0 40px', background: '#F5F1E8' }} id="exhibition-section">
        <div className="ah-wrap" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 36 }}>
          {(['in_season', 'gift'] as ThemeId[]).map((t) => (
            <ProductCarousel
              key={t}
              themeId={t}
              products={products}
              onOpenDetail={onOpenDetail}
              onQuickAdd={onQuickAdd}
              onOpenQuickAddSheet={onOpenQuickAddSheet}
              onViewAll={onViewAllTheme}
              themeVariant="light"
            />
          ))}
        </div>
      </section>

      {/* VÙNG MIỀN */}
      <section className="ah-band" id="vung-mien">
        <div className="ah-wrap">
          <div className="ah-head">
            <div>
              <p className="ah-eyebrow">Khám phá theo vùng</p>
              <h2 className="ah-h2">Hành trình qua những miền đất</h2>
            </div>
            <p>Khám phá vùng đất qua sản vật, con người và câu chuyện.</p>
          </div>
          <div className="ah-regions">
            {REGIONS.map((r) => (
              <button
                key={r.name}
                type="button"
                className="ah-region"
                style={r.img ? { backgroundImage: `linear-gradient(0deg,rgba(20,60,42,.85),rgba(20,60,42,.05) 70%),url(${r.img})`, backgroundSize: 'cover', backgroundPosition: 'center 65%' } : undefined}
                onClick={() => (r.name === 'Xem tất cả' ? onNavigate('/san-pham') : onSelectRegion(r.name))}
              >
                <span>{r.name} ↗</span>
                <small>{r.note}</small>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CÂU CHUYỆN */}
      <section className="ah-section">
        <div className="ah-wrap ah-story">
          <div className="ah-story__art">
            <img src="/images/amora/hero.jpg" alt="Không gian văn hoá và đặc sản địa phương" loading="lazy" />
            <q>Hương vị lưu giữ ký ức của một vùng đất.</q>
          </div>
          <div className="ah-story__copy">
            <p className="ah-eyebrow">Câu chuyện phía sau</p>
            <h2>Hơn cả một sản phẩm. Là hơi thở của một vùng đất.</h2>
            <p>
              Đặc Sản Số kể câu chuyện phía sau mỗi món ngon: vùng đất nơi nguyên liệu sinh trưởng, bàn tay người làm nghề và
              những tập quán được gìn giữ. Mỗi sản phẩm là một lời mời khám phá Việt Nam sâu sắc hơn.
            </p>
            <button type="button" className="ah-link" onClick={() => onNavigate('/cau-chuyen')}>
              Tìm hiểu câu chuyện <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* HTX & NHÀ SẢN XUẤT */}
      <section className="ah-maker" id="nha-san-xuat">
        <div className="ah-wrap ah-maker__in">
          <div>
            <p className="ah-eyebrow">HTX & Nhà sản xuất</p>
            <h2>Dành cho những người làm nghề có câu chuyện để kể</h2>
            <p>Đưa sản phẩm bản địa đến gần hơn với khách hàng, đồng thời giữ lại dấu ấn của người làm ra nó.</p>
          </div>
          <button type="button" className="ah-btn ah-btn--solid" onClick={() => onNavigate('/gioi-thieu')}>
            Tìm hiểu thêm <ArrowRight size={15} />
          </button>
        </div>
      </section>
    </div>
  );
};
