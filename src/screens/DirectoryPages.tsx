import React from 'react';
import { ArrowRight, BadgeCheck, MapPin, Store, Home } from 'lucide-react';
import { Product } from '../mock/types';
import { mockSuppliers } from '../mock/suppliers';
import { Link } from '../components/ui/Link';
import '../styles/amora-home.css';

const REGION_INFO: { name: string; img: string; tag: string; desc: string }[] = [
  { name: 'Bắc Hà', img: '/images/stitch/region-2.jpg', tag: 'Cao nguyên đá', desc: 'Mận tam hoa, rượu ngô men lá, phở hồng — hương vị của phiên chợ vùng cao.' },
  { name: 'Sa Pa', img: '/images/stitch/region-1.jpg', tag: 'Mây & sương', desc: 'Thịt gác bếp, cá tầm, thảo quả — sản vật của đại ngàn Hoàng Liên.' },
  { name: 'Mường Khương', img: '/images/stitch/hero.jpg', tag: 'Ruộng bậc thang', desc: 'Gạo Séng Cù dẻo thơm, tương ớt gia truyền theo mùa gặt.' },
  { name: 'Suối Giàng', img: '/images/stitch/region-4.jpg', tag: 'Chè cổ thụ', desc: 'Chè Shan tuyết nghìn năm tuổi, hái tay giữa tầng mây.' },
  { name: 'Tú Lệ', img: '/images/stitch/farmer.jpg', tag: 'Thung lũng cốm', desc: 'Cốm non dẻo thơm, gói lá sen trong mùa lúa chín.' },
  { name: 'Bảo Hà', img: '/images/stitch/honey.jpg', tag: 'Mật rừng', desc: 'Mật ong hoa rừng nguyên chất, lấy theo vụ hoa.' },
  { name: 'Bảo Yên', img: '/images/stitch/tea.jpg', tag: 'Trà hoa vàng', desc: 'Trà hoa vàng thượng hạng, vị ngọt hậu thanh mát.' },
];

const Hero: React.FC<{ eyebrow: string; title: string; text: string }> = ({ eyebrow, title, text }) => (
  <header style={{ background: '#2A6F50', color: '#fff', padding: '48px 0' }}>
    <div className="ah-wrap">
      <p className="ah-eyebrow" style={{ color: '#E0BD7E' }}>{eyebrow}</p>
      <h1 className="ah-h2" style={{ fontSize: 'clamp(30px,4vw,48px)' }}>{title}</h1>
      <p style={{ color: 'rgba(255,255,255,.85)', marginTop: 10, maxWidth: 560 }}>{text}</p>
    </div>
  </header>
);

export const RegionsPage: React.FC<{ products: Product[] }> = ({ products }) => (
  <div className="ah">
    <Hero eyebrow="Khám phá theo vùng" title="Vùng miền đặc sản Lào Cai" text="Mỗi vùng đất cho một hương vị riêng — chọn vùng để xem những sản vật đặc trưng." />
    <main className="ah-wrap ah-section" id="main-content">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
        {REGION_INFO.map((r) => {
          const items = products.filter((p) => p.region === r.name);
          return (
            <article key={r.name} style={{ background: 'var(--ah-surface)', border: '1px solid var(--ah-line)', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 160, background: `linear-gradient(0deg,rgba(20,60,42,.6),transparent 60%),url(${r.img}) center 65%/cover` }} role="img" aria-label={`Cảnh ${r.name}`} />
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                <p className="ah-eyebrow" style={{ margin: 0 }}>{r.tag}</p>
                <h2 className="ah-h2" style={{ fontSize: 26 }}>{r.name}</h2>
                <p style={{ color: 'var(--ah-muted)', fontSize: 14 }}>{r.desc}</p>
                {items.length > 0 ? (
                  <ul style={{ fontSize: 13, paddingLeft: 18, margin: '4px 0', listStyle: 'disc' }}>
                    {items.slice(0, 3).map((p) => (
                      <li key={p.id}><Link to={`/san-pham/${p.slug}`} style={{ textDecoration: 'underline' }}>{p.name}</Link></li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--ah-muted)' }}>Sắp có đặc sản mới.</p>
                )}
                <Link to={`/san-pham?vung=${encodeURIComponent(r.name)}`} className="ah-link" style={{ marginTop: 'auto', alignSelf: 'flex-start' }}>
                  Xem {items.length || ''} đặc sản <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  </div>
);

export const ProducersPage: React.FC<{ products: Product[] }> = ({ products }) => (
  <div className="ah">
    <Hero eyebrow="HTX & Nhà sản xuất" title="Những người làm nghề phía sau mỗi sản phẩm" text="Doanh nghiệp, hợp tác xã và hộ kinh doanh đã được xác minh nguồn gốc." />
    <main className="ah-wrap ah-section" id="main-content">
      <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
        {mockSuppliers.map((s) => {
          const items = products.filter((p) => p.supplierId === s.id);
          return (
            <li key={s.id} style={{ background: 'var(--ah-surface)', border: '1px solid var(--ah-line)', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ah-green)', fontSize: 12, fontWeight: 700 }}>
                {s.type === 'enterprise' ? <Store size={16} /> : <Home size={16} />}
                {s.type === 'enterprise' ? 'Doanh nghiệp' : 'Hộ kinh doanh'}
                {s.verified && (
                  <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                    <BadgeCheck size={15} /> Đã xác minh
                  </span>
                )}
              </div>
              <h2 className="ah-h2" style={{ fontSize: 21 }}>{s.name}</h2>
              <p style={{ fontSize: 13, color: 'var(--ah-muted)', display: 'flex', gap: 6 }}>
                <MapPin size={15} style={{ flex: 'none', marginTop: 2 }} />
                {s.address}
              </p>
              <div style={{ fontSize: 13 }}>
                <strong>Sản phẩm ({items.length}):</strong>
                <ul style={{ paddingLeft: 18, listStyle: 'disc', marginTop: 4 }}>
                  {items.slice(0, 4).map((p) => (
                    <li key={p.id}><Link to={`/san-pham/${p.slug}`} style={{ textDecoration: 'underline' }}>{p.name}</Link></li>
                  ))}
                </ul>
              </div>
              <Link to={`/san-pham?vung=${encodeURIComponent(s.region)}`} className="ah-link" style={{ marginTop: 'auto', alignSelf: 'flex-start' }}>
                Xem vùng {s.region} <ArrowRight size={14} />
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  </div>
);
