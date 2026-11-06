#!/usr/bin/env node
/**
 * Seed bộ dữ liệu demo lớn cho MarketHub: ~300 sản phẩm, 18 shop, 29 tài khoản,
 * 220 đơn hàng, payment và review.
 *
 * Chạy sau khi đã chạy `node scripts/seed-demo.mjs` (seed nền):
 *   node scripts/seed-large-demo.mjs
 *
 * Script sinh SQL rồi thực thi qua `docker exec` vào MySQL local. Chỉ dùng cho dev.
 * Dữ liệu dùng ID cố định 2001+ và INSERT IGNORE, nên chạy lại không nhân đôi.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const MYSQL_CONTAINER = process.env.MYSQL_CONTAINER ?? "ecommerce-mysql";
const MYSQL_DATABASE = process.env.MYSQL_DATABASE ?? "ecommerce_db";
const MYSQL_ROOT_PASSWORD = process.env.MYSQL_ROOT_PASSWORD ?? "";
const UPLOAD_DIR = resolve(SCRIPT_DIR, "../Backend/uploads/product-images");

const DEMO_HASH = "$2b$10$zzMLsCx.kUgZz.OVBNxt2eKaZkjNYRx.Zc1JNrDqIzvyQurvGEify"; // Demo@123

const CATEGORY_GROUPS = {
  2: "tech", 3: "tech", 4: "tech", 5: "tech",
  7: "laptop", 8: "laptop", 9: "laptop", 10: "laptop",
  12: "fashion", 13: "fashion", 14: "fashion",
  16: "women", 17: "women", 18: "women",
  20: "shoes", 21: "shoes", 22: "shoes",
  24: "home", 25: "home", 26: "home",
  28: "beauty", 29: "beauty", 30: "beauty",
  32: "books", 33: "books",
  35: "sports", 36: "sports",
};

const GROUP_STYLE = {
  tech: { label: "Công nghệ", from: "#0f766e", to: "#0ea5e9" },
  laptop: { label: "Laptop", from: "#1e3a8a", to: "#6366f1" },
  fashion: { label: "Thời trang", from: "#be123c", to: "#f97316" },
  women: { label: "Thời trang nữ", from: "#9d174d", to: "#ec4899" },
  shoes: { label: "Giày dép", from: "#92400e", to: "#f59e0b" },
  home: { label: "Nhà cửa", from: "#166534", to: "#84cc16" },
  beauty: { label: "Sắc đẹp", from: "#6b21a8", to: "#d946ef" },
  books: { label: "Sách & Văn phòng", from: "#854d0e", to: "#eab308" },
  sports: { label: "Thể thao", from: "#115e59", to: "#14b8a6" },
};

const CATEGORY_NAMES = {
  2: "Điện thoại", 3: "Tai nghe", 4: "Sạc dự phòng", 5: "Ốp lưng",
  7: "Laptop", 8: "Bàn phím", 9: "Chuột", 10: "Màn hình",
  12: "Áo thun", 13: "Quần jean", 14: "Áo khoác",
  16: "Váy đầm", 17: "Áo kiểu", 18: "Túi xách",
  20: "Giày thể thao", 21: "Sandal", 22: "Dép",
  24: "Đồ gia dụng", 25: "Trang trí", 26: "Nhà bếp",
  28: "Chăm sóc da", 29: "Trang điểm", 30: "Nước hoa",
  32: "Sách", 33: "Dụng cụ học tập",
  35: "Dụng cụ thể thao", 36: "Balo du lịch",
};

const TEMPLATES = {
  2: ["Điện thoại MarketHub", "Điện thoại thông minh MarketHub"],
  3: ["Tai nghe Bluetooth MarketHub", "Tai nghe chống ồn MarketHub"],
  4: ["Sạc dự phòng MarketHub", "Pin sạc nhanh MarketHub"],
  5: ["Ốp lưng silicon MarketHub", "Ốp lưng chống sốc MarketHub"],
  7: ["Laptop MarketHub Book", "Laptop văn phòng MarketHub"],
  8: ["Bàn phím cơ MarketHub", "Bàn phím không dây MarketHub"],
  9: ["Chuột không dây MarketHub", "Chuột gaming MarketHub"],
  10: ["Màn hình LED MarketHub", "Màn hình cong MarketHub"],
  12: ["Áo thun cotton MarketHub", "Áo thun thể thao MarketHub"],
  13: ["Quần jean MarketHub", "Quần jean slim MarketHub"],
  14: ["Áo khoác gió MarketHub", "Áo khoác bomber MarketHub"],
  16: ["Váy đầm MarketHub", "Đầm công sở MarketHub"],
  17: ["Áo kiểu nữ MarketHub", "Áo sơ mi nữ MarketHub"],
  18: ["Túi xách MarketHub", "Túi đeo chéo MarketHub"],
  20: ["Giày thể thao MarketHub", "Sneaker MarketHub"],
  21: ["Sandal MarketHub", "Sandal quai ngang MarketHub"],
  22: ["Dép MarketHub", "Dép quai ngang MarketHub"],
  24: ["Đồ gia dụng MarketHub", "Bộ dụng cụ nhà bếp MarketHub"],
  25: ["Đèn trang trí MarketHub", "Kệ treo tường MarketHub"],
  26: ["Bình giữ nhiệt MarketHub", "Bộ ly thủy tinh MarketHub"],
  28: ["Kem dưỡng da MarketHub", "Sữa rửa mặt MarketHub"],
  29: ["Son môi MarketHub", "Phấn nền MarketHub"],
  30: ["Nước hoa MarketHub", "Xịt thơm MarketHub"],
  32: ["Sách kỹ năng MarketHub", "Sách kinh doanh MarketHub"],
  33: ["Bút bi MarketHub", "Sổ tay MarketHub"],
  35: ["Tạ tay MarketHub", "Thảm yoga MarketHub"],
  36: ["Balo du lịch MarketHub", "Túi du lịch MarketHub"],
};

const BASE_PRICE = {
  2: 2490000, 3: 490000, 4: 399000, 5: 99000,
  7: 12990000, 8: 690000, 9: 299000, 10: 2490000,
  12: 199000, 13: 499000, 14: 599000,
  16: 399000, 17: 299000, 18: 499000,
  20: 899000, 21: 299000, 22: 199000,
  24: 159000, 25: 249000, 26: 259000,
  28: 299000, 29: 199000, 30: 899000,
  32: 99000, 33: 39000,
  35: 199000, 36: 399000,
};

const LARGE_SHOPS = [
  { key: "techzone", shopId: 2001, sellerId: 2001, name: "MarketHub Tech Zone", categories: [2, 3, 4, 5], image: "tech" },
  { key: "mobile", shopId: 2002, sellerId: 2002, name: "MarketHub Mobile Store", categories: [2, 3, 4, 5], image: "tech" },
  { key: "laptop", shopId: 2003, sellerId: 2003, name: "MarketHub Laptop Center", categories: [7, 8, 9, 10], image: "laptop" },
  { key: "fashion", shopId: 2004, sellerId: 2004, name: "MarketHub Fashion House", categories: [12, 13, 14], image: "fashion" },
  { key: "women", shopId: 2005, sellerId: 2005, name: "MarketHub Women Style", categories: [16, 17, 18], image: "women" },
  { key: "sneaker", shopId: 2006, sellerId: 2006, name: "MarketHub Sneaker Lab", categories: [20, 21, 22], image: "shoes" },
  { key: "home", shopId: 2007, sellerId: 2007, name: "MarketHub Home Decor", categories: [24, 25, 26], image: "home" },
  { key: "beauty", shopId: 2008, sellerId: 2008, name: "MarketHub Beauty Corner", categories: [28, 29, 30], image: "beauty" },
  { key: "books", shopId: 2009, sellerId: 2009, name: "MarketHub Book & Office", categories: [32, 33], image: "books" },
  { key: "sport", shopId: 2010, sellerId: 2010, name: "MarketHub Sport & Travel", categories: [35, 36], image: "sports" },
  { key: "kids", shopId: 2011, sellerId: 2011, name: "MarketHub Kids World", categories: [12, 16, 20, 32], image: "fashion" },
  { key: "gadget", shopId: 2012, sellerId: 2012, name: "MarketHub Gadget Pro", categories: [3, 4, 5, 8, 9, 10], image: "tech" },
];

const LARGE_PENDING_SHOPS = [
  { key: "pending2", shopId: 2013, sellerId: 2013, name: "MarketHub Seed - Shop chờ duyệt 2", phone: "0908888002" },
  { key: "pending3", shopId: 2014, sellerId: 2014, name: "MarketHub Seed - Shop chờ duyệt 3", phone: "0908888003" },
];

const LARGE_BUYERS = [
  { id: 2015, email: "buyer03.demo@markethub.vn", first: "Minh Anh", last: "Nguyễn", phone: "0911000003", address: "Số 1 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM" },
  { id: 2016, email: "buyer04.demo@markethub.vn", first: "Thu Hà", last: "Trần", phone: "0911000004", address: "Số 12 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM" },
  { id: 2017, email: "buyer05.demo@markethub.vn", first: "Quốc Bảo", last: "Lê", phone: "0911000005", address: "Số 45 Hai Bà Trưng, Phường Tân Định, Quận 1, TP.HCM" },
  { id: 2018, email: "buyer06.demo@markethub.vn", first: "Ngọc Lan", last: "Phạm", phone: "0911000006", address: "Số 88 Võ Văn Tần, Phường 6, Quận 3, TP.HCM" },
  { id: 2019, email: "buyer07.demo@markethub.vn", first: "Đức Huy", last: "Võ", phone: "0911000007", address: "Số 25 Pasteur, Phường Nguyễn Thái Bình, Quận 1, TP.HCM" },
  { id: 2020, email: "buyer08.demo@markethub.vn", first: "Thanh Mai", last: "Đặng", phone: "0911000008", address: "Số 67 Điện Biên Phủ, Phường 15, Bình Thạnh, TP.HCM" },
  { id: 2021, email: "buyer09.demo@markethub.vn", first: "Hoàng Nam", last: "Bùi", phone: "0911000009", address: "Số 102 Cách Mạng Tháng 8, Phường 7, Quận 3, TP.HCM" },
  { id: 2022, email: "buyer10.demo@markethub.vn", first: "Kim Ngân", last: "Đỗ", phone: "0911000010", address: "Số 39 Trần Hưng Đạo, Phường 7, Quận 5, TP.HCM" },
];

const EXTRA_BUYERS = [
  {
    idExpr: "@buyer_demo",
    name: "An Võ",
    phone: "0934567890",
    address: "99 Trần Hưng Đạo, Phường 7, Quận 5, TP.HCM",
  },
  {
    idExpr: "@buyer2",
    name: "Trần Thị Bình",
    phone: "0912345678",
    address: "45 Nguyễn Thị Minh Khai, Phường Đa Kao, Quận 1, TP.HCM",
  },
];

const STATUS_CYCLE = [
  "PENDING", "PENDING", "CONFIRMED", "CONFIRMED", "SHIPPING", "SHIPPING",
  "DELIVERED", "DELIVERED", "COMPLETED", "COMPLETED", "PENDING", "CONFIRMED",
  "SHIPPING", "DELIVERED", "COMPLETED", "CANCELLED", "PENDING", "CONFIRMED",
  "DELIVERED", "COMPLETED",
];

const REVIEW_COMMENTS = [
  "Chất lượng sản phẩm tốt, đóng gói cẩn thận.",
  "Giao hàng nhanh, đúng mô tả.",
  "Giá hợp lý, sẽ mua lại.",
  "Shop tư vấn nhiệt tình, sản phẩm đẹp.",
  "Hàng chính hãng, dùng ổn định.",
  "Đóng gói chắc chắn, giao đúng hẹn.",
  "Rất đáng tiền, phù hợp nhu cầu.",
  "Form chuẩn, màu sắc giống ảnh.",
];

const esc = (value) => String(value).replace(/\\/g, "\\\\").replace(/'/g, "''");
const q = (value) => `'${esc(value)}'`;
const jq = (value) => q(JSON.stringify(value));

function fmt(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 86400000);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 3600000);
}

function svgFor(group) {
  const style = GROUP_STYLE[group];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${style.from}"/>
      <stop offset="1" stop-color="${style.to}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#g)"/>
  <circle cx="470" cy="120" r="150" fill="#ffffff" opacity="0.08"/>
  <circle cx="120" cy="500" r="180" fill="#ffffff" opacity="0.08"/>
  <text x="300" y="285" font-family="Arial, sans-serif" font-size="52" font-weight="700" fill="#ffffff" text-anchor="middle">${style.label}</text>
  <text x="300" y="340" font-family="Arial, sans-serif" font-size="26" fill="#ffffff" opacity="0.85" text-anchor="middle">MarketHub</text>
</svg>`;
}

function variantAttrs(categoryId, alt) {
  const group = CATEGORY_GROUPS[categoryId];
  if (group === "fashion" || group === "women") {
    return alt ? { size: "L", color: "Trắng" } : { size: "M", color: "Đen" };
  }
  if (group === "shoes") {
    return alt ? { size: "41", color: "Trắng" } : { size: "40", color: "Đen" };
  }
  if (group === "beauty") {
    return alt ? { loại: "Cao cấp" } : { loại: "Tiêu chuẩn" };
  }
  if (group === "books") {
    return alt ? { loại: "Bìa cứng" } : { loại: "Bìa mềm" };
  }
  if (group === "home") {
    return alt ? { color: "Trắng" } : { color: "Xám" };
  }
  return alt ? { color: "Trắng" } : { color: "Đen" };
}

function build() {
  const now = new Date();
  const lines = [];
  const push = (...rows) => lines.push(...rows);

  // Ảnh SVG theo nhóm danh mục, dùng lại cho 288 sản phẩm lớn.
  mkdirSync(UPLOAD_DIR, { recursive: true });
  for (const group of Object.keys(GROUP_STYLE)) {
    writeFileSync(resolve(UPLOAD_DIR, `seed-cat-${group}.svg`), svgFor(group), "utf8");
  }

  push(
    "-- ============================================================================",
    "-- MarketHub - seed demo lớn (sinh tự động bởi scripts/seed-large-demo.mjs)",
    "-- Chỉ dùng cho môi trường dev. Chạy sau scripts/seed-demo.mjs.",
    "-- ============================================================================",
    "SET NAMES utf8mb4;",
    "",
    "UPDATE user_seq SET next_val = GREATEST(next_val, 3000);",
    "UPDATE address_seq SET next_val = GREATEST(next_val, 3000);",
    "",
  );

  // ---------- Users ----------
  const userRows = [];
  for (const shop of [...LARGE_SHOPS, ...LARGE_PENDING_SHOPS]) {
    const first = shop.name.replace("MarketHub ", "").split(" ")[0];
    userRows.push(`(${shop.sellerId}, ${q(`seller.large.${shop.key}@markethub.vn`)}, ${q(DEMO_HASH)}, ${q(first)}, ${q("MarketHub")}, ${q(`090${String(shop.sellerId).slice(-7)}`)}, NULL, 'default-avatar.png', 1, 0, 0, 'USER')`);
  }
  for (const buyer of LARGE_BUYERS) {
    userRows.push(`(${buyer.id}, ${q(buyer.email)}, ${q(DEMO_HASH)}, ${q(buyer.first)}, ${q(buyer.last)}, ${q(buyer.phone)}, NULL, 'default-avatar.png', 1, 0, 0, 'USER')`);
  }
  push(
    "INSERT IGNORE INTO user (id, email, password, first_name, last_name, phone, date_of_birth, avatar, status, is_delete, is_admin, role) VALUES",
    `${userRows.join(",\n")};`,
    "",
  );

  // ---------- Shops ----------
  const shopRows = [];
  for (const shop of LARGE_SHOPS) {
    shopRows.push(`(${shop.shopId}, ${shop.sellerId}, ${q(shop.name)}, ${q(`Shop demo ${shop.name} - nhiều sản phẩm, giá tốt, giao hàng toàn quốc.`)}, NULL, ${q(`090${String(shop.shopId).slice(-7)}`)}, ${q(`Số ${shop.shopId % 100} Nguyễn Huệ, Quận 1, TP.HCM`)}, 'APPROVED', NULL, ${q(fmt(addDays(now, -30)))}, ${q(fmt(addDays(now, -30)))}, ${q(fmt(now))})`);
  }
  for (const shop of LARGE_PENDING_SHOPS) {
    shopRows.push(`(${shop.shopId}, ${shop.sellerId}, ${q(shop.name)}, ${q("Shop mới đăng ký, đang chờ Admin duyệt.")}, NULL, ${q(shop.phone)}, ${q("Số 25 Pasteur, Quận 1, TP.HCM")}, 'PENDING', ${q("Shop mới đăng ký, chờ Admin duyệt.")}, NULL, ${q(fmt(addDays(now, -5)))}, ${q(fmt(addDays(now, -5)))})`);
  }
  push(
    "INSERT IGNORE INTO shops (id, user_id, name, description, logo_url, phone, pickup_address, status, status_note, reviewed_at, created_at, updated_at) VALUES",
    `${shopRows.join(",\n")};`,
    "",
  );

  // ---------- Products / variants / images ----------
  const productRows = [];
  const variantRows = [];
  const imageRows = [];
  const shopProducts = [];
  let productId = 2001;

  for (const shop of LARGE_SHOPS) {
    const products = [];
    for (let index = 0; index < 24; index += 1) {
      const categoryId = shop.categories[index % shop.categories.length];
      const templateIndex = Math.floor(index / shop.categories.length) % 2;
      const name = `${TEMPLATES[categoryId][templateIndex]} M${productId}`;
      const group = CATEGORY_GROUPS[categoryId];
      const imageUrl = `/uploads/product-images/seed-cat-${group}.svg`;
      const price = BASE_PRICE[categoryId] + (index % 5) * 20000;
      const createdAt = fmt(addDays(now, -(index % 30)));

      productRows.push(`(${productId}, ${q(name)}, ${q(`${name} - sản phẩm thuộc danh mục ${CATEGORY_NAMES[categoryId]}, chất lượng tốt, bảo hành 12 tháng, giao hàng toàn quốc.`)}, ${q(String(categoryId))}, ${q(String(shop.shopId))}, ${q(shop.name)}, ${q(imageUrl)}, 0, 0, 0, 'ACTIVE', ${q(createdAt)})`);

      const v1Id = productId;
      const v2Id = productId + 1000;
      const v1Attrs = variantAttrs(categoryId, false);
      const v2Attrs = variantAttrs(categoryId, true);
      variantRows.push(
        `(${v1Id}, ${productId}, ${q(`LARGE-${shop.key.toUpperCase()}-${String(index + 1).padStart(2, "0")}-1`)}, ${jq(v1Attrs)}, ${price}, ${15 + (index % 30)}, ${q(imageUrl)})`,
        `(${v2Id}, ${productId}, ${q(`LARGE-${shop.key.toUpperCase()}-${String(index + 1).padStart(2, "0")}-2`)}, ${jq(v2Attrs)}, ${price + 30000}, ${10 + (index % 20)}, ${q(imageUrl)})`,
      );
      imageRows.push(`INSERT INTO product_images (product_id, url, sort_order, created_at) SELECT ${productId}, ${q(imageUrl)}, 0, ${q(createdAt)} FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = ${productId});`);

      products.push({
        productId,
        name,
        categoryId,
        price,
        variants: [
          { id: v1Id, price, attributes: v1Attrs },
          { id: v2Id, price: price + 30000, attributes: v2Attrs },
        ],
      });
      productId += 1;
    }
    shopProducts.push(products);
  }

  push(
    "INSERT IGNORE INTO products (id, name, description, category_id, shop_id, shop_name, thumbnail_url, rating_avg, rating_count, sold_count, status, created_at) VALUES",
    `${productRows.join(",\n")};`,
    "",
    "INSERT IGNORE INTO product_variants (id, product_id, sku, attributes, price_minor, stock_quantity, image_url) VALUES",
    `${variantRows.join(",\n")};`,
    "",
    ...imageRows,
    "",
  );

  // ---------- Addresses ----------
  const addressRows = LARGE_BUYERS.map((buyer, index) => {
    const id = 2001 + index;
    return `(${id}, ${buyer.id}, ${q(`${buyer.first} ${buyer.last}`)}, ${q(buyer.phone)}, ${q(buyer.address)}, 1, ${q(fmt(addDays(now, -20)))}, ${q(fmt(now))})`;
  });
  push(
    "INSERT IGNORE INTO address (id, user_id, recipient_name, phone, full_address, is_default, created_at, updated_at) VALUES",
    `${addressRows.join(",\n")};`,
    "",
  );

  // ---------- Cart ----------
  const cartRows = [];
  for (let b = 0; b < LARGE_BUYERS.length; b += 1) {
    const buyer = LARGE_BUYERS[b];
    for (let k = 0; k < 3; k += 1) {
      const shopIndex = (b * 3 + k * 4) % LARGE_SHOPS.length;
      const product = shopProducts[shopIndex][(b + k) % 24];
      cartRows.push(`(${buyer.id}, ${product.variants[0].id}, ${1 + ((b + k) % 2)}, ${q(fmt(now))}, ${q(fmt(now))})`);
    }
  }
  push(
    "INSERT INTO cart_items (user_id, variant_id, quantity, created_at, updated_at) VALUES",
    `${cartRows.join(",\n")}`,
    "ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), updated_at = VALUES(updated_at);",
    "",
  );

  // ---------- Orders / payments / reviews ----------
  const sessionRows = [];
  const orderRows = [];
  const itemRows = [];
  const paymentRows = [];
  const reviewRows = [];
  let itemId = 2001;
  let reviewId = 2001;

  for (let i = 0; i < 190; i += 1) {
    const orderId = 2001 + i;
    const buyer = LARGE_BUYERS[i % LARGE_BUYERS.length];
    const shopIndex = i % LARGE_SHOPS.length;
    const shop = LARGE_SHOPS[shopIndex];
    const products = shopProducts[shopIndex];
    const status = STATUS_CYCLE[i % STATUS_CYCLE.length];
    const method = i % 2 === 0 ? "VNPAY" : "MOMO";
    const createdAt = new Date(now.getTime() - (i % 60) * 86400000 - ((i * 3) % 24) * 3600000);
    const updatedAt = status === "PENDING" ? createdAt : addHours(createdAt, 1);
    const sessionStatus = status === "PENDING" ? "PENDING" : status === "CANCELLED" ? "FAILED" : "PAID";
    const paymentStatus = status === "PENDING" ? "PENDING" : status === "CANCELLED" ? "FAILED" : "SUCCEEDED";
    const paidAt = paymentStatus === "SUCCEEDED" ? addMinutes(createdAt, 10) : null;
    const shippingAddress = {
      recipientName: `${buyer.first} ${buyer.last}`,
      phone: buyer.phone,
      fullAddress: buyer.address,
    };

    const itemCount = 1 + (i % 3);
    const offsets = [];
    for (let k = 0; k < itemCount; k += 1) {
      let offset = (i * 7 + k * 5) % 24;
      while (offsets.includes(offset)) offset = (offset + 1) % 24;
      offsets.push(offset);
    }

    let subtotal = 0;
    const orderItems = [];
    for (let k = 0; k < offsets.length; k += 1) {
      const product = products[offsets[k]];
      const variant = product.variants[k % 2];
      const quantity = 1 + ((i + k) % 2);
      const lineTotal = variant.price * quantity;
      subtotal += lineTotal;
      const currentItemId = itemId;
      itemId += 1;
      orderItems.push({ currentItemId, product, variant, quantity, lineTotal });
      itemRows.push(`(${currentItemId}, ${orderId}, ${variant.id}, ${q(product.name)}, ${jq(variant.attributes)}, ${variant.price}, ${quantity}, ${lineTotal})`);
    }

    sessionRows.push(`(${orderId}, ${buyer.id}, '${sessionStatus}', '${method}', ${subtotal}, ${q(fmt(createdAt))}, ${q(fmt(updatedAt))})`);
    orderRows.push(`(${orderId}, ${orderId}, ${buyer.id}, ${shop.shopId}, '${status}', ${jq(shippingAddress)}, ${subtotal}, 0, ${subtotal}, ${q(fmt(createdAt))}, ${q(fmt(updatedAt))})`);
    paymentRows.push(`(${orderId}, ${orderId}, '${method}', ${paymentStatus === "SUCCEEDED" ? q(`LARGE-${method}-${orderId}`) : "NULL"}, ${subtotal}, '${paymentStatus}', ${paidAt ? q(fmt(paidAt)) : "NULL"}, ${q(fmt(createdAt))})`);

    if (status === "COMPLETED") {
      for (let k = 0; k < orderItems.length; k += 1) {
        if ((i + k) % 5 === 0) continue;
        const item = orderItems[k];
        const rating = (i + k) % 3 === 0 ? 5 : (i + k) % 3 === 1 ? 4 : 3;
        const comment = REVIEW_COMMENTS[(i + k) % REVIEW_COMMENTS.length];
        const reviewDate = addDays(createdAt, 2);
        reviewRows.push(`(${reviewId}, ${item.currentItemId}, ${orderId}, ${buyer.id}, ${item.product.productId}, ${rating}, ${q(comment)}, ${q(fmt(reviewDate))}, ${q(fmt(reviewDate))})`);
        reviewId += 1;
      }
    }
  }

  // Bổ sung đơn cho 2 buyer chính (buyer.demo, buyer2.demo) để trang đơn hàng có nhiều trang.
  push(
    "SET @buyer_demo := (SELECT id FROM user WHERE email = 'buyer.demo@markethub.vn' AND is_delete = 0 LIMIT 1);",
    "SET @buyer2 := (SELECT id FROM user WHERE email = 'buyer2.demo@markethub.vn' AND is_delete = 0 LIMIT 1);",
    "",
  );
  for (let e = 0; e < 30; e += 1) {
    const orderId = 3001 + e;
    const buyer = e < 20 ? EXTRA_BUYERS[0] : EXTRA_BUYERS[1];
    const shopIndex = e % LARGE_SHOPS.length;
    const shop = LARGE_SHOPS[shopIndex];
    const products = shopProducts[shopIndex];
    const status = STATUS_CYCLE[(e + 5) % STATUS_CYCLE.length];
    const method = e % 2 === 0 ? "VNPAY" : "MOMO";
    const createdAt = new Date(now.getTime() - ((e % 30) + 1) * 86400000 - ((e * 2) % 24) * 3600000);
    const updatedAt = status === "PENDING" ? createdAt : addHours(createdAt, 1);
    const sessionStatus = status === "PENDING" ? "PENDING" : status === "CANCELLED" ? "FAILED" : "PAID";
    const paymentStatus = status === "PENDING" ? "PENDING" : status === "CANCELLED" ? "FAILED" : "SUCCEEDED";
    const paidAt = paymentStatus === "SUCCEEDED" ? addMinutes(createdAt, 10) : null;
    const shippingAddress = {
      recipientName: buyer.name,
      phone: buyer.phone,
      fullAddress: buyer.address,
    };

    const itemCount = 1 + (e % 3);
    const offsets = [];
    for (let k = 0; k < itemCount; k += 1) {
      let offset = (e * 7 + k * 5) % 24;
      while (offsets.includes(offset)) offset = (offset + 1) % 24;
      offsets.push(offset);
    }

    let subtotal = 0;
    const orderItems = [];
    for (let k = 0; k < offsets.length; k += 1) {
      const product = products[offsets[k]];
      const variant = product.variants[k % 2];
      const quantity = 1 + ((e + k) % 2);
      const lineTotal = variant.price * quantity;
      subtotal += lineTotal;
      const currentItemId = itemId;
      itemId += 1;
      orderItems.push({ currentItemId, product, variant, quantity, lineTotal });
      itemRows.push(`(${currentItemId}, ${orderId}, ${variant.id}, ${q(product.name)}, ${jq(variant.attributes)}, ${variant.price}, ${quantity}, ${lineTotal})`);
    }

    sessionRows.push(`(${orderId}, ${buyer.idExpr}, '${sessionStatus}', '${method}', ${subtotal}, ${q(fmt(createdAt))}, ${q(fmt(updatedAt))})`);
    orderRows.push(`(${orderId}, ${orderId}, ${buyer.idExpr}, ${shop.shopId}, '${status}', ${jq(shippingAddress)}, ${subtotal}, 0, ${subtotal}, ${q(fmt(createdAt))}, ${q(fmt(updatedAt))})`);
    paymentRows.push(`(${orderId}, ${orderId}, '${method}', ${paymentStatus === "SUCCEEDED" ? q(`LARGE-${method}-${orderId}`) : "NULL"}, ${subtotal}, '${paymentStatus}', ${paidAt ? q(fmt(paidAt)) : "NULL"}, ${q(fmt(createdAt))})`);

    if (status === "COMPLETED") {
      for (let k = 0; k < orderItems.length; k += 1) {
        if ((e + k) % 5 === 0) continue;
        const item = orderItems[k];
        const rating = (e + k) % 3 === 0 ? 5 : (e + k) % 3 === 1 ? 4 : 3;
        const comment = REVIEW_COMMENTS[(e + k) % REVIEW_COMMENTS.length];
        const reviewDate = addDays(createdAt, 2);
        reviewRows.push(`(${reviewId}, ${item.currentItemId}, ${orderId}, ${buyer.idExpr}, ${item.product.productId}, ${rating}, ${q(comment)}, ${q(fmt(reviewDate))}, ${q(fmt(reviewDate))})`);
        reviewId += 1;
      }
    }
  }

  push(
    "INSERT IGNORE INTO checkout_sessions (id, buyer_id, status, payment_method, total_amount_minor, created_at, updated_at) VALUES",
    `${sessionRows.join(",\n")};`,
    "",
    "INSERT IGNORE INTO orders (id, checkout_session_id, buyer_id, shop_id, status, shipping_address_snapshot, subtotal_minor, shipping_fee_minor, total_minor, created_at, updated_at) VALUES",
    `${orderRows.join(",\n")};`,
    "",
    "INSERT IGNORE INTO order_items (id, order_id, variant_id, product_name_snapshot, variant_attributes_snapshot, unit_price_minor, quantity, subtotal_minor) VALUES",
    `${itemRows.join(",\n")};`,
    "",
    "INSERT IGNORE INTO payments (id, checkout_session_id, provider, provider_transaction_id, amount_minor, status, paid_at, created_at) VALUES",
    `${paymentRows.join(",\n")};`,
    "",
    "INSERT IGNORE INTO reviews (id, order_item_id, order_id, user_id, product_id, rating, comment, created_at, updated_at) VALUES",
    `${reviewRows.join(",\n")};`,
    "",
  );

  // ---------- Recalculate rating / sold_count ----------
  push(
    "UPDATE products p",
    "LEFT JOIN (",
    "    SELECT product_id, AVG(rating) AS avg_rating, COUNT(*) AS cnt",
    "    FROM reviews",
    "    GROUP BY product_id",
    ") r ON r.product_id = p.id",
    "SET p.rating_avg = COALESCE(r.avg_rating, 0),",
    "    p.rating_count = COALESCE(r.cnt, 0);",
    "",
    "UPDATE products p",
    "SET p.sold_count = (",
    "    SELECT COALESCE(SUM(oi.quantity), 0)",
    "    FROM order_items oi",
    "    JOIN orders o ON o.id = oi.order_id",
    "    JOIN product_variants pv ON pv.id = oi.variant_id",
    "    WHERE o.status = 'COMPLETED' AND pv.product_id = p.id",
    ");",
    "",
  );

  push(
    "SELECT 'large_users' AS entity, COUNT(*) AS total FROM user WHERE id BETWEEN 2001 AND 2022",
    "UNION ALL SELECT 'large_shops', COUNT(*) FROM shops WHERE id BETWEEN 2001 AND 2014",
    "UNION ALL SELECT 'large_products', COUNT(*) FROM products WHERE id BETWEEN 2001 AND 2288",
    "UNION ALL SELECT 'large_variants', COUNT(*) FROM product_variants WHERE id BETWEEN 2001 AND 3288",
    "UNION ALL SELECT 'large_orders', COUNT(*) FROM orders WHERE id BETWEEN 2001 AND 2190",
    "UNION ALL SELECT 'extra_buyer_orders', COUNT(*) FROM orders WHERE id BETWEEN 3001 AND 3030",
    "UNION ALL SELECT 'large_payments', COUNT(*) FROM payments WHERE id BETWEEN 2001 AND 3030",
    "UNION ALL SELECT 'large_reviews', COUNT(*) FROM reviews WHERE id >= 2001",
    "UNION ALL SELECT 'total_products', COUNT(*) FROM products",
    "UNION ALL SELECT 'total_orders', COUNT(*) FROM orders;",
  );

  return lines.join("\n");
}

function run() {
  const sql = build();
  const args = ["exec", "-i", MYSQL_CONTAINER, "mysql", "-uroot", "--default-character-set=utf8mb4"];
  if (MYSQL_ROOT_PASSWORD) args.push(`-p${MYSQL_ROOT_PASSWORD}`);
  args.push(MYSQL_DATABASE);

  const result = spawnSync("docker", args, {
    input: sql,
    encoding: "utf8",
    maxBuffer: 200 * 1024 * 1024,
  });

  if (result.error) {
    console.error(`Không chạy được docker: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error("Seed dữ liệu lớn thất bại:");
    console.error((result.stderr || "").trim());
    process.exit(1);
  }

  if (result.stdout) process.stdout.write(result.stdout);
  console.log("✓ Đã seed dữ liệu lớn: 288 sản phẩm, 12 shop, 8 buyer, 220 đơn hàng.");
}

run();
