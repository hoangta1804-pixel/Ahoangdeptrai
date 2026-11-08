import { assert, inAdminGroup } from './security.mjs';
import { mockProducts } from '../src/mock/products.ts';

/**
 * Sản phẩm hiển thị trên cửa hàng (giao diện mới).
 * Lưu trong app_state.storefrontProducts. Lần đầu chưa có thì dùng danh sách mẫu ban đầu.
 *   GET    /api/v1/storefront/products        — công khai (khách chỉ thấy sản phẩm không ẩn)
 *   POST   /api/v1/storefront/products        — tạo  (Admin Vận hành / Chất lượng / Quản trị gốc)
 *   PUT    /api/v1/storefront/products/:id    — sửa
 *   DELETE /api/v1/storefront/products/:id    — xoá
 */

const CATEGORIES = ['dry', 'fresh', 'processed', 'tea', 'gift'];
const STATUSES = ['active', 'hidden', 'discontinued'];
const VARIANT_STATUSES = ['in_stock', 'preorder', 'out_of_stock'];
const THEMES = ['in_season', 'best_seller', 'gift'];

const list = (state) => (Array.isArray(state.storefrontProducts) ? state.storefrontProducts : structuredClone(mockProducts));
const canManage = (user) => inAdminGroup(user, 'operations', 'quality');
const text = (v, min, max, label) => {
  assert(typeof v === 'string' && v.trim().length >= min && v.trim().length <= max, 400, `${label} phải từ ${min} đến ${max} ký tự.`);
  return v.trim();
};
const slugify = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
const safeUrl = (u) => typeof u === 'string' && (u.startsWith('/') || /^https:\/\//.test(u)) && u.length <= 600;

/** Kiểm tra & chuẩn hoá dữ liệu gửi lên; giữ các trường nâng cao (story, media…) của bản cũ nếu có. */
function normalize(input, id, previous, all) {
  assert(input && typeof input === 'object' && !Array.isArray(input), 400, 'Dữ liệu sản phẩm không hợp lệ.');
  const name = text(input.name, 2, 120, 'Tên sản phẩm');
  const slug = slugify(typeof input.slug === 'string' && input.slug.trim() ? input.slug : name);
  assert(slug.length >= 2, 400, 'Đường dẫn (slug) không hợp lệ.');
  assert(!all.some((p) => p.slug === slug && p.id !== id), 409, 'Đường dẫn (slug) đã được dùng cho sản phẩm khác.');
  const region = text(input.region, 2, 60, 'Vùng');
  assert(CATEGORIES.includes(input.category), 400, 'Nhóm hàng không hợp lệ.');
  assert(STATUSES.includes(input.status ?? 'active'), 400, 'Trạng thái không hợp lệ.');
  const shortDescription = text(input.shortDescription ?? '', 0, 600, 'Mô tả ngắn');
  const supplierId = typeof input.supplierId === 'string' && input.supplierId ? input.supplierId.slice(0, 60) : previous?.supplierId ?? '';

  assert(Array.isArray(input.variants) && input.variants.length >= 1 && input.variants.length <= 10, 400, 'Cần từ 1 đến 10 quy cách.');
  const variants = input.variants.map((v, i) => {
    assert(v && typeof v === 'object', 400, 'Quy cách không hợp lệ.');
    const label = text(v.label, 1, 80, `Quy cách #${i + 1}`);
    assert(Number.isInteger(v.price) && v.price > 0 && v.price <= 1e9, 400, `Giá quy cách "${label}" phải là số nguyên dương.`);
    assert(Number.isInteger(v.stock) && v.stock >= 0 && v.stock <= 1e6, 400, `Tồn kho quy cách "${label}" không hợp lệ.`);
    assert(VARIANT_STATUSES.includes(v.status), 400, `Trạng thái quy cách "${label}" không hợp lệ.`);
    const old = previous?.variants?.find((x) => x.id === v.id);
    return {
      ...(old ?? {}),
      id: typeof v.id === 'string' && v.id ? v.id.slice(0, 60) : `var_${id}_${Date.now().toString(36)}_${i}`,
      productId: id,
      label,
      price: v.price,
      stock: v.stock,
      status: v.status,
      depositPercent: old?.depositPercent ?? 30,
      sortOrder: i + 1,
      ...(safeUrl(v.imageUrl) ? { imageUrl: v.imageUrl } : {}),
    };
  });

  // Ảnh chính: giữ media cũ, thay/ thêm ảnh nhóm "main"
  let media = Array.isArray(previous?.media) ? previous.media.filter((m) => !(m.type === 'photo' && m.group === 'main')) : [];
  if (input.mainImageUrl !== undefined && input.mainImageUrl !== '') {
    assert(safeUrl(input.mainImageUrl), 400, 'Ảnh chính phải là đường dẫn bắt đầu bằng / hoặc https://');
  }
  const mainUrl = input.mainImageUrl === undefined ? previous?.media?.find((m) => m.type === 'photo' && m.group === 'main')?.url : input.mainImageUrl;
  if (mainUrl) {
    media = [
      { id: `med_${id}_main`, productId: id, type: 'photo', group: 'main', url: mainUrl, alt: name, sortOrder: 1, source: 'self_shot', hasConsentDoc: false, approvalStatus: 'approved' },
      ...media,
    ];
  }

  const themes = Array.isArray(input.themes) ? input.themes.filter((t) => THEMES.includes(t)) : null;
  const themeMappings = themes
    ? themes.map((t) => previous?.themeMappings?.find((m) => m.themeId === t) ?? { themeId: t, sortOrder: 99, isActive: true })
    : previous?.themeMappings ?? [];

  return {
    ...(previous ?? {}),
    id,
    slug,
    name,
    region,
    supplierId,
    category: input.category,
    shortDescription,
    status: input.status ?? 'active',
    variants,
    defaultVariantId: variants.some((v) => v.id === previous?.defaultVariantId) ? previous.defaultVariantId : variants[0].id,
    media,
    themeMappings,
  };
}

export async function storefrontProductsRoute(path, method, body, { db, auth }) {
  const one = path.match(/^\/api\/v1\/storefront\/products\/([\w-]+)$/);
  if (path !== '/api/v1/storefront/products' && !one) return null;

  if (method === 'GET' && !one) {
    const { state } = await db.read();
    const all = list(state);
    const admin = canManage(auth?.user);
    return { status: 200, body: { products: admin ? all : all.filter((p) => p.status !== 'hidden') } };
  }

  assert(auth?.user, 401, 'Vui lòng đăng nhập.');
  assert(canManage(auth.user), 403, 'Chỉ Admin Vận hành, Chất lượng hoặc Quản trị gốc được quản lý sản phẩm.');
  const { state } = await db.read();
  const all = list(state);

  if (method === 'POST' && !one) {
    const id = `prod_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const product = normalize(body?.product, id, null, all);
    state.storefrontProducts = [product, ...all];
    await db.save(state);
    await db.audit(auth.user.id, 'storefront-product-create', product.id, product.name);
    return { status: 201, body: { product } };
  }
  if (one && method === 'PUT') {
    const idx = all.findIndex((p) => p.id === one[1]);
    assert(idx >= 0, 404, 'Không tìm thấy sản phẩm.');
    const product = normalize(body?.product, one[1], all[idx], all);
    all[idx] = product;
    state.storefrontProducts = all;
    await db.save(state);
    await db.audit(auth.user.id, 'storefront-product-update', product.id, product.name);
    return { status: 200, body: { product } };
  }
  if (one && method === 'DELETE') {
    const found = all.find((p) => p.id === one[1]);
    assert(found, 404, 'Không tìm thấy sản phẩm.');
    state.storefrontProducts = all.filter((p) => p.id !== one[1]);
    await db.save(state);
    await db.audit(auth.user.id, 'storefront-product-delete', found.id, found.name);
    return { status: 200, body: { ok: true } };
  }
  assert(false, 405, 'Phương thức không được hỗ trợ.');
}
