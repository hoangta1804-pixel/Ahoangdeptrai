import React from 'react';
import { Leaf, ShieldCheck, MapPin, Phone, Mail, ArrowRight } from 'lucide-react';
import { Link } from '../ui/Link';
import { SproutMark } from './SproutMark';
import '../../styles/amora-shell.css';

export interface FooterProps {
  onNavigate: (path: string) => void;
}

const EXPLORE = [
  { to: '/san-pham', label: 'Tất cả sản phẩm' },
  { to: '/san-pham?chu-de=in_season', label: 'Sản phẩm theo mùa' },
  { to: '/san-pham?chu-de=best_seller', label: 'Được yêu thích' },
  { to: '/san-pham?chu-de=gift', label: 'Quà tặng' },
  { to: '/vung-mien', label: 'Vùng miền' },
];

const STORY = [
  { to: '/cau-chuyen', label: 'Câu chuyện vùng miền' },
  { to: '/htx', label: 'HTX & Nhà sản xuất' },
  { to: '/gioi-thieu', label: 'Về chúng tôi' },
  { to: '/chinh-sach', label: 'Chính sách chất lượng' },
];

export const Footer: React.FC<FooterProps> = () => (
  <footer className="amora-footer">
    <div className="amora-footer__top">
      <div className="amora-footer__brand">
        <div className="amora-footer__logo"><SproutMark size={24} leaf="#2A6F50" accent="#FFFDF8" stem="#2A6F50" /></div>
        <strong>Đặc Sản Số</strong>
        <p>Tuyển chọn sản vật đặc trưng từ nhiều miền đất, kết nối người làm nghề với những căn bếp yêu hương vị Việt.</p>
        <span><Leaf size={14} /> Từ tâm huyết địa phương đến bàn ăn gia đình</span>
      </div>
      <nav aria-label="Khám phá">
        <h3>Khám phá</h3>
        {EXPLORE.map((l) => (
          <Link key={l.to} to={l.to} className="amora-footer__link">{l.label}</Link>
        ))}
      </nav>
      <nav aria-label="Câu chuyện">
        <h3>Câu chuyện</h3>
        {STORY.map((l) => (
          <Link key={l.to} to={l.to} className="amora-footer__link">{l.label}</Link>
        ))}
      </nav>
      <div>
        <h3>Liên hệ & hỗ trợ</h3>
        <p><MapPin size={16} /> Giao hàng tại Hà Nội</p>
        <p><Phone size={16} /> <a href="tel:19006868">Hotline: 1900 6868</a></p>
        <p><Mail size={16} /> <a href="mailto:chamsoc@dacsanso.vn">chamsoc@dacsanso.vn</a></p>
        <Link to="/san-pham?chu-de=in_season" className="amora-footer__newsletter">
          <span>Xem sản phẩm mới vào mùa</span>
          <span className="amora-footer__go" aria-hidden="true"><ArrowRight size={16} /></span>
        </Link>
      </div>
    </div>
    <div className="amora-footer__bottom">
      <span>© {new Date().getFullYear()} Đặc Sản Số. Bảo lưu mọi quyền.</span>
      <span><ShieldCheck size={15} /> Thông tin sản phẩm minh bạch · Chăm sóc tận tâm</span>
    </div>
  </footer>
);
