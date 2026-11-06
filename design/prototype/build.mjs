import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const write = (name, html) => writeFileSync(join(here, name), html, "utf8");

/* --------------------------------------------------------------------------
   Data — names, prices, ratings and order states come from the demo database.
   Photography is illustrative (Wikimedia Commons) and is credited in the UI.
   -------------------------------------------------------------------------- */

const P = {
  bag: { name: "Túi du lịch MarketHub M2220", price: 459000, rating: 5, count: 2, img: "assets/bag.jpg", cat: "Thể thao & Du lịch", sold: 4 },
  laptop: { name: "Laptop văn phòng MarketHub M2061", price: 13030000, rating: 4, count: 3, img: "assets/laptop.jpg", cat: "Máy tính & Laptop", sold: 3 },
  perfume: { name: "Nước hoa MarketHub M2171", price: 939000, rating: 0, count: 0, img: "assets/perfume.jpg", cat: "Sắc đẹp", sold: 0 },
  shoes: { name: "Giày thể thao MarketHub M2121", price: 899000, rating: 0, count: 0, img: "assets/shoes.jpg", cat: "Giày dép", sold: 0 },
  headphones: { name: "Tai nghe Bluetooth MarketHub Air", price: 459000, rating: 0, count: 0, img: "assets/audio.jpg", cat: "Tai nghe", sold: 0 },
  lamp: { name: "Đèn ngủ để bàn MarketHub Glow", price: 249000, rating: 0, count: 0, img: "assets/lamp.jpg", cat: "Nhà cửa & Đời sống", sold: 0 },
  glasses: { name: "Bộ ly thủy tinh MarketHub 6 món", price: 329000, rating: 0, count: 0, img: "assets/ceramics.jpg", cat: "Nhà cửa & Đời sống", sold: 0 },
  book: { name: "Sách kỹ năng MarketHub M2193", price: 99000, rating: 0, count: 0, img: "assets/books.jpg", cat: "Sách & Văn phòng phẩm", sold: 0 },
  shelf: { name: "Kệ gỗ treo tường MarketHub", price: 349000, rating: 4, count: 1, img: "assets/books.jpg", cat: "Nhà cửa & Đời sống", sold: 1 },
  mouse: { name: "Chuột không dây MarketHub Silent", price: 299000, rating: 0, count: 0, img: "assets/audio.jpg", cat: "Phụ kiện", sold: 0 },
  jeans: { name: "Quần jean MarketHub Slim", price: 499000, rating: 0, count: 0, img: "assets/shoes.jpg", cat: "Thời trang nam", sold: 0 },
  tee: { name: "Áo thun thể thao MarketHub M2094", price: 219000, rating: 0, count: 0, img: "assets/sunglasses.jpg", cat: "Thể thao & Du lịch", sold: 0 },
  perfume2: { name: "Xịt thơm MarketHub M2174", price: 899000, rating: 0, count: 0, img: "assets/perfume.jpg", cat: "Sắc đẹp", sold: 0 },
  soap: { name: "Kem dưỡng da MarketHub M2169", price: 299000, rating: 0, count: 0, img: "assets/soap.jpg", cat: "Sắc đẹp", sold: 0 },
  headphones2: { name: "Tai nghe Bluetooth MarketHub M2002", price: 510000, rating: 0, count: 0, img: "assets/audio.jpg", cat: "Tai nghe", sold: 0 },
};

const NAV = [
  ["Hàng mới", "products.html", "new"],
  ["Công nghệ", "products.html", "tech"],
  ["Nhà cửa", "products.html", "home"],
  ["Thời trang", "products.html", "fashion"],
  ["Làm đẹp", "products.html", "beauty"],
  ["Sách", "products.html", "books"],
  ["Thể thao", "products.html", "sport"],
];

const STATUS = {
  PENDING: ["Chờ xác nhận", "pending"],
  CONFIRMED: ["Đã xác nhận", "confirmed"],
  SHIPPING: ["Đang giao", "shipping"],
  DELIVERED: ["Đã giao", "delivered"],
  COMPLETED: ["Hoàn tất", "completed"],
  CANCELLED: ["Đã huỷ", "cancelled"],
};

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */

const money = (n) => n.toLocaleString("vi-VN") + "₫";

const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
  package: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4.5 7.5 7.5 4 7.5-4"/><path d="M12 21v-9.5"/>',
  bag: '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  arrowRight: '<path d="M4 12h16"/><path d="m14 6 6 6-6 6"/>',
  arrowLeft: '<path d="M20 12H4"/><path d="m10 18-6-6 6-6"/>',
  arrowUpRight: '<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  truck: '<path d="M3 6h11v10H3z"/><path d="M14 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>',
  shield: '<path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
  rotate: '<path d="M4 11a8 8 0 0 1 13.5-4.5L20 9"/><path d="M20 4v5h-5"/><path d="M20 13a8 8 0 0 1-13.5 4.5L4 15"/><path d="M4 20v-5h5"/>',
  menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
  close: '<path d="m6 6 12 12"/><path d="m18 6-12 12"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="m6 7 1 13h10l1-13"/>',
  pin: '<path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="0"/><path d="M3 10h18"/>',
  wallet: '<path d="M4 6h14a2 2 0 0 1 2 2v10H4z"/><path d="M4 6V4h12v2"/><path d="M16 12h4v4h-4z"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6"/><path d="M12 17h.01"/>',
  grid: '<rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><rect x="14" y="14" width="6" height="6"/>',
  box: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4.5 7.5 7.5 4 7.5-4"/><path d="M12 21v-9.5"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.5a3 3 0 0 1 0 5.5"/><path d="M17.5 14.5A5.5 5.5 0 0 1 21 20"/>',
  folder: '<path d="M3 6h6l2 2h10v10H3z"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17"/><path d="M9 4V2h6v2"/><path d="M8 9h8"/><path d="M8 13h8"/><path d="M8 17h5"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M4.2 4.2 6.3 6.3"/><path d="m17.7 17.7 2.1 2.1"/><path d="M2 12h3"/><path d="M19 12h3"/><path d="m4.2 19.8 2.1-2.1"/><path d="m17.7 6.3 2.1-2.1"/>',
  logout: '<path d="M9 4H5v16h4"/><path d="M14 8l4 4-4 4"/><path d="M9 12h9"/>',
  phone: '<path d="M5 4h4l1.5 4-2 1.5a12 12 0 0 0 6 6L16 13.5l4 1.5v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
  mail: '<rect x="3" y="5" width="18" height="14"/><path d="m3 6 9 7 9-7"/>',
  star: '<path d="M12 2.5l2.9 6.1 6.6.9-4.8 4.7 1.2 6.6L12 17.6 6.1 20.8l1.2-6.6L2.5 9.5l6.6-.9z"/>',
  external: '<path d="M14 4h6v6"/><path d="m20 4-9 9"/><path d="M20 14v6H4V4h6"/>',
};

function icon(name, cls = "icon") {
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}

function stars(rating) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  const one = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.9-4.8 4.7 1.2 6.6L12 17.6 6.1 20.8l1.2-6.6L2.5 9.5l6.6-.9z"/></svg>';
  return `<span class="stars${filled === 0 ? " stars--empty" : ""}" aria-hidden="true">${one.repeat(filled)}${'<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.9-4.8 4.7 1.2 6.6L12 17.6 6.1 20.8l1.2-6.6L2.5 9.5l6.6-.9z"/></svg>'.repeat(5 - filled)}</span>`;
}

function statusPill(status) {
  const [label, tone] = STATUS[status];
  return `<span class="status status--${tone}">${label}</span>`;
}

function productCard(p, tag = "") {
  return `<article class="product-card">
    <div class="product-media">
      <a href="product.html" aria-label="${p.name}">
        <img src="${p.img}" alt="${p.name}">
      </a>
      ${tag ? `<span class="product-media__tag">${tag}</span>` : ""}
      <button class="quick-add" type="button" data-add="${p.name}" aria-label="Thêm ${p.name} vào giỏ">${icon("plus")}</button>
    </div>
    <div class="product-info">
      <a class="product-name" href="product.html">${p.name}</a>
      <div class="product-price">${money(p.price)}</div>
      <div class="product-rating">${stars(p.rating)}<span>${p.count ? `${p.rating.toFixed(1)} (${p.count})` : "Chưa có đánh giá"}</span></div>
    </div>
  </article>`;
}

const check = (label, count = "", checked = false) =>
  `<label class="checkbox"><input type="checkbox"${checked ? " checked" : ""}><span>${label}</span>${count !== "" ? `<span>${count}</span>` : ""}</label>`;

const googleG = `<svg viewBox="0 0 18 18" aria-hidden="true">
  <path fill="var(--google-blue)" d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615Z"/>
  <path fill="var(--google-green)" d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18Z"/>
  <path fill="var(--google-yellow)" d="M3.964 10.71c-.18-.54-.2822-1.1168-.2822-1.71s.1023-1.17.2823-1.71V4.9582H.9573A8.9965 8.9965 0 0 0 0 9c0 1.4523.3477 2.8268.9573 4.0418L3.964 10.71Z"/>
  <path fill="var(--google-red)" d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.656 3.5795 9 3.5795Z"/>
</svg>`;

function head(active = "") {
  const nav = NAV.map(([label, href, key]) => `<a href="${href}"${active === key ? ' aria-current="page"' : ""}>${label}</a>`).join("");
  return `<div class="announce">
    <div class="container announce__inner">
      <div class="announce__group announce__group--left"><span>Miễn phí giao hàng cho đơn từ 499.000₫</span></div>
      <div class="announce__group announce__group--right">
        <span>Thanh toán VNPay · MoMo</span>
        <a href="orders.html">Đổi trả 30 ngày</a>
      </div>
    </div>
  </div>
  <header class="site-head">
    <div class="container">
      <div class="head-main">
        <details class="mobile-nav">
          <summary class="menu-toggle" aria-label="Mở menu">${icon("menu")}</summary>
          <nav class="mobile-nav__panel" aria-label="Danh mục di động">
            ${NAV.map(([label, href]) => `<a href="${href}">${label}${icon("arrowRight", "icon icon--sm")}</a>`).join("")}
            <div class="mobile-nav__utility">
              <a href="orders.html">Đơn hàng</a>
              <a href="account.html">Tài khoản</a>
              <a href="login.html">Đăng nhập</a>
            </div>
          </nav>
        </details>
        <a class="brand" href="index.html" aria-label="MarketHub, trang chủ">
          <span class="brand__name">MarketHub</span>
          <span class="brand__sub">Cửa hàng chính thức</span>
        </a>
        <form class="head-search" role="search" action="products.html" method="get">
          <label class="sr-only" for="q">Tìm sản phẩm</label>
          <input id="q" name="q" type="search" placeholder="Tìm sản phẩm, danh mục…" autocomplete="off">
          <button type="submit" aria-label="Tìm kiếm">${icon("search")}</button>
        </form>
        <div class="head-actions">
          <a class="head-action" href="account.html">${icon("user")}<span>Tài khoản</span></a>
          <a class="head-action head-action--orders" href="orders.html">${icon("package")}<span>Đơn hàng</span></a>
          <a class="head-action" href="cart.html">${icon("bag")}<span>Giỏ</span><span class="cart-count">2</span></a>
        </div>
      </div>
    </div>
    <div class="nav-bar">
      <div class="container nav-bar__inner">
        <nav class="nav-list" aria-label="Danh mục sản phẩm">${nav}</nav>
        <span class="nav-note">300 sản phẩm, giao toàn quốc</span>
      </div>
    </div>
  </header>`;
}

function foot() {
  return `<footer class="site-footer">
    <div class="container">
      <div class="footer-main">
        <div class="footer-brand">
          <span class="brand__name">MarketHub</span>
          <p>Một cửa hàng tuyển chọn đồ công nghệ, nhà cửa, thời trang và sách. Chúng tôi chọn ít, nhưng chọn kỹ.</p>
          <div class="footer-pay">
            <span class="pay-mark">VNPay</span>
            <span class="pay-mark">MoMo</span>
            <span class="pay-mark">Visa · Mastercard</span>
          </div>
        </div>
        <div class="footer-col">
          <h2 class="footer-col__title">Mua sắm</h2>
          <ul>
            <li><a href="products.html">Tất cả sản phẩm</a></li>
            <li><a href="products.html">Hàng mới</a></li>
            <li><a href="products.html">Công nghệ</a></li>
            <li><a href="products.html">Nhà cửa &amp; Đời sống</a></li>
            <li><a href="products.html">Sách &amp; Văn phòng phẩm</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h2 class="footer-col__title">Hỗ trợ</h2>
          <ul>
            <li><a href="orders.html">Đơn hàng của tôi</a></li>
            <li><a href="account.html">Địa chỉ giao hàng</a></li>
            <li><a href="orders.html">Đổi trả &amp; bảo hành</a></li>
            <li><a href="login.html">Đăng nhập</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h2 class="footer-col__title">MarketHub</h2>
          <ul>
            <li><a href="index.html">Câu chuyện cửa hàng</a></li>
            <li><a href="index.html">Cách chúng tôi chọn hàng</a></li>
            <li><a href="index.html">Cửa hàng chính thức</a></li>
            <li><span>Hỗ trợ 8:00 tới 21:00</span></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2026 MarketHub. Ảnh minh hoạ từ Wikimedia Commons.</span>
        <span>Prototype UI · Dữ liệu demo từ MarketHub</span>
      </div>
    </div>
  </footer>`;
}

function documentHead(title, description = "") {
  return `<meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} | MarketHub</title>
  <meta name="description" content="${description}">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23007439'/%3E%3Ctext x='16' y='23' font-family='Arial,sans-serif' font-size='18' font-weight='700' fill='%23ffffff' text-anchor='middle'%3EM%3C/text%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,200..800&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">`;
}

function page({ title, description = "", active = "", body, script = "" }) {
  return `<!doctype html>
<html lang="vi">
<head>
  ${documentHead(title, description)}
</head>
<body>
  ${head(active)}
  <main class="app-main">${body}</main>
  ${foot()}
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <script src="app.js"></script>
  ${script}
</body>
</html>`;
}

function panelPage({ title, description = "", body }) {
  return `<!doctype html>
<html lang="vi">
<head>
  ${documentHead(title, description)}
</head>
<body>
  ${body}
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <script src="app.js"></script>
</body>
</html>`;
}

/* --------------------------------------------------------------------------
   Home
   -------------------------------------------------------------------------- */

const homeProducts = [P.bag, P.laptop, P.perfume, P.shoes, P.headphones, P.lamp, P.glasses, P.book];

const home = page({
  title: "Đồ tốt, chọn kỹ",
  description: "MarketHub, cửa hàng tuyển chọn đồ công nghệ, nhà cửa, thời trang, làm đẹp và sách.",
  active: "",
  body: `
  <div class="container">
    <section class="hero">
      <div class="hero__copy">
        <h1 class="hero__title">Đồ tốt,<br>chọn kỹ.</h1>
        <p class="hero__standfirst">Một cửa hàng, một chuẩn chọn. Đồ điện tử, nhà cửa, làm đẹp và sách, được chọn kỹ trước khi lên kệ.</p>
        <div class="hero__actions">
          <a class="btn btn--primary" href="products.html">Mua sắm ${icon("arrowRight", "icon icon--sm")}</a>
          <a class="link" href="#cau-chuyen">Cách chúng tôi chọn hàng ${icon("arrowRight", "icon icon--sm")}</a>
        </div>
        <div class="hero__proof">
          <span>${icon("truck", "icon icon--sm")} Giao hàng toàn quốc</span>
          <span>${icon("shield", "icon icon--sm")} Thanh toán VNPay / MoMo</span>
          <span>${icon("rotate", "icon icon--sm")} Đổi trả 30 ngày</span>
        </div>
      </div>
      <div class="hero__media">
        <figure>
          <div class="hero__figure">
            <img src="assets/ceramics.jpg" alt="Gốm sứ trong xưởng làm gốm" fetchpriority="high">
            <div class="hero__inset"><img src="assets/bag.jpg" alt="Túi du lịch da"></div>
          </div>
          <figcaption class="hero__caption">
            <span>Gốm sứ và đồ dùng nhà cửa, tuyển chọn bởi MarketHub</span>
            <span>Ảnh minh hoạ: Wikimedia Commons</span>
          </figcaption>
        </figure>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <div>
          <h2>Danh mục</h2>
          <p>Chín nhóm hàng, 300 sản phẩm. Không có shop thứ hai để bạn phải so sánh.</p>
        </div>
        <div class="section-head__aside"><a class="link" href="products.html">Xem tất cả ${icon("arrowRight", "icon icon--sm")}</a></div>
      </div>
      <div class="index-list">
        ${[
          ["01", "Điện thoại & Phụ kiện", 62],
          ["02", "Máy tính & Laptop", 37],
          ["03", "Nhà cửa & Đời sống", 29],
          ["04", "Thời trang nữ", 30],
          ["05", "Thời trang nam", 32],
          ["06", "Giày dép", 32],
          ["07", "Sắc đẹp", 24],
          ["08", "Sách & Văn phòng phẩm", 30],
          ["09", "Thể thao & Du lịch", 24],
        ].map(([no, name, count]) => `<a class="index-row" href="products.html">
          <span class="index-row__no">${no}</span>
          <span class="index-row__name">${name}</span>
          <span class="index-row__count">${count} sản phẩm</span>
          ${icon("arrowUpRight", "icon icon--sm")}
        </a>`).join("")}
      </div>
    </section>

    <section class="section section--tight">
      <div class="section-head">
        <div>
          <h2>Đang được chọn</h2>
          <p>Tám sản phẩm bán chạy, còn hàng và được đánh giá cao trong tháng này.</p>
        </div>
        <div class="section-head__aside"><a class="link" href="products.html">Xem tất cả ${icon("arrowRight", "icon icon--sm")}</a></div>
      </div>
      <div class="product-grid">${homeProducts.map((p) => productCard(p, p.rating === 5 ? "Được chọn" : "")).join("")}</div>
    </section>
  </div>

  <section class="feature-band" id="cau-chuyen">
    <div class="container feature-band__inner">
      <div class="feature-band__copy">
        <h2>Một cửa hàng. Không phải một sàn.</h2>
        <p>MarketHub bắt đầu bằng một danh mục nhỏ và một nguyên tắc đơn giản: chỉ bán thứ chúng tôi đã dùng thử. Không có hàng trăm người bán cạnh tranh, không có giá ảo, không có shop nào đứng sau bạn khi cần đổi trả.</p>
        <a class="link" href="products.html">Xem danh mục đang bán ${icon("arrowRight", "icon icon--sm")}</a>
      </div>
      <div class="feature-band__media"><img src="assets/books.jpg" alt="Kệ sách trong một hiệu sách cũ"></div>
    </div>
  </section>

  <div class="container">
    <section class="section">
      <div class="section-head">
        <div>
          <h2>Ba nhóm hàng nổi bật</h2>
          <p>Những danh mục được chọn nhiều nhất trong tuần qua.</p>
        </div>
      </div>
      <div class="triptych">
        <a class="triptych__item" href="products.html">
          <div class="triptych__media"><img src="assets/audio.jpg" alt="Thiết bị âm thanh"></div>
          <div class="triptych__caption"><h3>Điện thoại &amp; Phụ kiện</h3><span>62 sản phẩm</span></div>
        </a>
        <a class="triptych__item" href="products.html">
          <div class="triptych__media"><img src="assets/ceramics.jpg" alt="Gốm sứ gia dụng"></div>
          <div class="triptych__caption"><h3>Nhà cửa &amp; Đời sống</h3><span>29 sản phẩm</span></div>
        </a>
        <a class="triptych__item" href="products.html">
          <div class="triptych__media"><img src="assets/perfume.jpg" alt="Chai nước hoa"></div>
          <div class="triptych__caption"><h3>Sắc đẹp</h3><span>24 sản phẩm</span></div>
        </a>
      </div>
    </section>

    <section class="quote-band">
      <div class="quote-band__meta">
        <h2>Người mua nói gì</h2>
        <div>${stars(5)} <span class="eyebrow-free">5.0 trên 2 đánh giá</span></div>
        <a class="link" href="product.html">Đọc đánh giá sản phẩm ${icon("arrowUpRight", "icon icon--sm")}</a>
      </div>
      <div>
        <blockquote>“Đóng gói chắc chắn, giao đúng hẹn.”</blockquote>
        <div class="quote-band__by">
          <span><strong>Đặng Thanh Mai</strong></span>
          <span>Túi du lịch MarketHub M2220</span>
          <span>29/10/2026</span>
        </div>
      </div>
    </section>

    <div class="support-strip">
      <div class="support-item">${icon("truck")}<div><h3>Giao hàng toàn quốc</h3><p>Miễn phí cho đơn từ 499.000₫.</p></div></div>
      <div class="support-item">${icon("rotate")}<div><h3>Đổi trả 30 ngày</h3><p>Hàng còn nguyên tem, đúng tình trạng.</p></div></div>
      <div class="support-item">${icon("shield")}<div><h3>Thanh toán an toàn</h3><p>VNPay và MoMo, xác thực qua cổng thanh toán.</p></div></div>
    </div>
  </div>`,
});

/* --------------------------------------------------------------------------
   Catalogue
   -------------------------------------------------------------------------- */

const catalogProducts = [P.bag, P.laptop, P.perfume, P.shoes, P.headphones, P.lamp, P.glasses, P.book, P.shelf, P.perfume2, P.soap, P.headphones2];

const catalog = page({
  title: "Tất cả sản phẩm",
  description: "300 sản phẩm thuộc 9 danh mục tại MarketHub.",
  active: "new",
  body: `
  <div class="container">
    <div class="page-head">
      <div>
        <h1>Tất cả sản phẩm</h1>
        <p>300 sản phẩm thuộc 9 danh mục. Lọc theo nhu cầu, sắp xếp theo giá hoặc mức độ bán chạy.</p>
      </div>
      <div class="page-head__aside">Trang 1 / 25</div>
    </div>

    <div class="catalog-layout">
      <aside class="filters" aria-label="Bộ lọc sản phẩm">
        <div class="filter-panel">
          <details class="filter-group" open>
            <summary>Danh mục ${icon("chevronDown", "icon icon--sm")}</summary>
            <div class="filter-options">
              ${check("Điện thoại &amp; Phụ kiện", 62)}
              ${check("Máy tính &amp; Laptop", 37)}
              ${check("Thời trang nữ", 30)}
              ${check("Thời trang nam", 32)}
              ${check("Giày dép", 32)}
              ${check("Nhà cửa &amp; Đời sống", 29)}
              ${check("Sắc đẹp", 24)}
              ${check("Sách &amp; Văn phòng phẩm", 30)}
              ${check("Thể thao &amp; Du lịch", 24)}
            </div>
          </details>
          <details class="filter-group" open>
            <summary>Giá ${icon("chevronDown", "icon icon--sm")}</summary>
            <div class="price-range">
              <label class="sr-only" for="min">Giá thấp nhất</label>
              <input class="input" id="min" inputmode="numeric" placeholder="Từ">
              <label class="sr-only" for="max">Giá cao nhất</label>
              <input class="input" id="max" inputmode="numeric" placeholder="Đến">
            </div>
            <button class="btn btn--sm btn--block" type="button" style="margin-top: var(--space-2)">Áp dụng</button>
          </details>
          <details class="filter-group">
            <summary>Đánh giá ${icon("chevronDown", "icon icon--sm")}</summary>
            <div class="filter-options">
              ${check("5 sao")}
              ${check("4 sao trở lên")}
              ${check("3 sao trở lên")}
            </div>
          </details>
          <details class="filter-group">
            <summary>Tình trạng ${icon("chevronDown", "icon icon--sm")}</summary>
            <div class="filter-options">
              ${check("Còn hàng", "", true)}
            </div>
          </details>
        </div>
      </aside>

      <div>
        <div class="catalog-toolbar">
          <div class="catalog-toolbar__count">Hiển thị <strong>1-12</strong> trong <strong>300</strong> sản phẩm</div>
          <label class="sort-control" for="sort">Sắp xếp
            <select id="sort">
              <option>Mới nhất</option>
              <option>Bán chạy</option>
              <option>Giá thấp đến cao</option>
              <option>Giá cao đến thấp</option>
            </select>
          </label>
        </div>
        <div class="product-grid product-grid--3">${catalogProducts.map((p) => productCard(p)).join("")}</div>
        <nav class="pagination" aria-label="Phân trang">
          <span class="page-btn" aria-disabled="true">${icon("arrowLeft", "icon icon--sm")}</span>
          <a class="page-btn" href="#" aria-current="page">1</a>
          <a class="page-btn" href="#">2</a>
          <a class="page-btn" href="#">3</a>
          <span class="page-btn">…</span>
          <a class="page-btn" href="#">25</a>
          <a class="page-btn" href="#">${icon("arrowRight", "icon icon--sm")}</a>
        </nav>
      </div>
    </div>
  </div>`,
});

/* --------------------------------------------------------------------------
   Product detail
   -------------------------------------------------------------------------- */

const product = page({
  title: P.bag.name,
  description: "Túi du lịch MarketHub M2220, 459.000₫, 2 đánh giá 5 sao.",
  active: "sport",
  body: `
  <div class="container">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="index.html">Trang chủ</a><span>/</span>
      <a href="products.html">Thể thao &amp; Du lịch</a><span>/</span>
      <span aria-current="page">Túi du lịch MarketHub M2220</span>
    </nav>

    <div class="pdp">
      <div class="gallery">
        <div class="gallery__thumbs" role="tablist" aria-label="Ảnh sản phẩm">
          <button class="gallery__thumb" type="button" aria-current="true" data-img="assets/bag.jpg"><img src="assets/bag.jpg" alt="Túi du lịch, mặt trước"></button>
          <button class="gallery__thumb" type="button" data-img="assets/bag.jpg"><img src="assets/bag.jpg" alt="Túi du lịch, chi tiết" style="object-position: 30% 40%"></button>
          <button class="gallery__thumb" type="button" data-img="assets/bag.jpg"><img src="assets/bag.jpg" alt="Túi du lịch, quai đeo" style="object-position: 70% 60%"></button>
          <button class="gallery__thumb" type="button" data-img="assets/ceramics.jpg"><img src="assets/ceramics.jpg" alt="Ảnh bối cảnh sản phẩm"></button>
        </div>
        <div class="gallery__main"><img id="gallery-main" src="assets/bag.jpg" alt="Túi du lịch MarketHub M2220"></div>
      </div>

      <div class="pdp-info">
        <div class="pdp-brand"><span>MarketHub Official</span><span>Thể thao &amp; Du lịch</span></div>
        <h1 class="pdp-title">Túi du lịch MarketHub M2220</h1>
        <div class="pdp-rating">${stars(5)}<span>5.0 · 2 đánh giá</span><span>Đã bán 4</span></div>
        <div class="pdp-price">${money(459000)} <small>Giá đã bao gồm VAT</small></div>
        <p class="pdp-desc">Túi du lịch cỡ trung với ngăn chính rộng, ngăn phụ tiện dụng và dây đeo tùy chỉnh. Phù hợp cho chuyến đi ngắn ngày. Bảo hành 12 tháng.</p>

        <div class="option-block">
          <div class="option-head"><span>Màu</span><span>Đen</span></div>
          <div class="swatches" role="group" aria-label="Chọn màu">
            <button class="swatch" type="button" aria-pressed="true" data-price="459000"><span class="swatch__dot" style="background: var(--ink)"></span>Đen</button>
            <button class="swatch" type="button" aria-pressed="false" data-price="489000"><span class="swatch__dot" style="background: var(--white)"></span>Trắng</button>
          </div>
        </div>

        <div class="buy-row">
          <div class="qty">
            <button type="button" data-qty="-1" aria-label="Giảm số lượng">${icon("minus", "icon icon--sm")}</button>
            <label class="sr-only" for="qty">Số lượng</label>
            <input id="qty" type="number" value="1" min="1" max="18" inputmode="numeric">
            <button type="button" data-qty="1" aria-label="Tăng số lượng">${icon("plus", "icon icon--sm")}</button>
          </div>
          <button class="btn btn--primary" type="button" data-add="Túi du lịch MarketHub M2220">Thêm vào giỏ ${icon("bag", "icon icon--sm")}</button>
        </div>
        <div class="pdp-actions">
          <a class="btn" href="checkout.html">Mua ngay</a>
        </div>
        <div class="stock-note">${icon("checkCircle", "icon icon--sm")} Còn 18 sản phẩm · Giao trong 2-4 ngày</div>

        <div class="assurance">
          <div class="assurance__row">${icon("truck")}<div><strong>Giao hàng toàn quốc</strong><span>Miễn phí cho đơn từ 499.000₫.</span></div></div>
          <div class="assurance__row">${icon("rotate")}<div><strong>Đổi trả 30 ngày</strong><span>Hàng còn nguyên tem và đúng tình trạng.</span></div></div>
          <div class="assurance__row">${icon("shield")}<div><strong>Bảo hành 12 tháng</strong><span>Tiếp nhận qua cửa hàng chính thức.</span></div></div>
        </div>
      </div>
    </div>

    <div class="pdp-sections">
      <section class="pdp-section" id="mo-ta">
        <h2>Mô tả</h2>
        <div>
          <p class="pdp-desc" style="margin-top:0">Túi du lịch MarketHub M2220 thuộc nhóm Balo du lịch. Thiết kế cỡ trung, ngăn chính rộng và ngăn phụ tiện dụng cho chuyến đi ngắn ngày. Sản phẩm được bảo hành 12 tháng và giao hàng toàn quốc.</p>
          <p class="pdp-desc">Màu Đen và Trắng. Giá niêm yết đã bao gồm VAT. Tồn kho được cập nhật theo từng phiên bản màu.</p>
        </div>
      </section>

      <section class="pdp-section" id="thong-so">
        <h2>Thông số</h2>
        <table class="spec-table">
          <tbody>
            <tr><th>Mã sản phẩm</th><td>M2220</td></tr>
            <tr><th>Danh mục</th><td>Balo du lịch</td></tr>
            <tr><th>Bảo hành</th><td>12 tháng</td></tr>
            <tr><th>Tình trạng</th><td>Còn 18 sản phẩm</td></tr>
            <tr><th>Đánh giá</th><td>5.0 / 5 · 2 đánh giá</td></tr>
          </tbody>
        </table>
      </section>

      <section class="pdp-section" id="danh-gia">
        <h2>Đánh giá</h2>
        <div>
          <div class="review-summary">
            <div class="review-score">
              <strong>5.0</strong>
              ${stars(5)}
              <span class="eyebrow-free">2 đánh giá</span>
            </div>
            <div class="review-bars">
              <div class="review-bar"><span>5 sao</span><span class="review-bar__track"><span class="review-bar__fill" style="width:100%"></span></span><span>2</span></div>
              <div class="review-bar"><span>4 sao</span><span class="review-bar__track"><span class="review-bar__fill" style="width:0"></span></span><span>0</span></div>
              <div class="review-bar"><span>3 sao</span><span class="review-bar__track"><span class="review-bar__fill" style="width:0"></span></span><span>0</span></div>
              <div class="review-bar"><span>2 sao</span><span class="review-bar__track"><span class="review-bar__fill" style="width:0"></span></span><span>0</span></div>
              <div class="review-bar"><span>1 sao</span><span class="review-bar__track"><span class="review-bar__fill" style="width:0"></span></span><span>0</span></div>
            </div>
          </div>
          <div class="review-list">
            <article class="review">
              <div class="review__head">
                <span class="review__avatar">ĐM</span>
                <span class="review__name">Đặng Thanh Mai</span>
                <span class="review__date">29/10/2026</span>
                ${stars(5)}
              </div>
              <p>Đóng gói chắc chắn, giao đúng hẹn.</p>
            </article>
          </div>
        </div>
      </section>
    </div>

    <section class="section">
      <div class="section-head">
        <div><h2>Có thể bạn cũng thích</h2></div>
        <div class="section-head__aside"><a class="link" href="products.html">Xem tất cả ${icon("arrowRight", "icon icon--sm")}</a></div>
      </div>
      <div class="product-grid">${[P.laptop, P.headphones, P.shoes, P.lamp].map((p) => productCard(p)).join("")}</div>
    </section>
  </div>`,
});

/* --------------------------------------------------------------------------
   Cart
   -------------------------------------------------------------------------- */

const cart = page({
  title: "Giỏ hàng",
  description: "Giỏ hàng MarketHub.",
  body: `
  <div class="container">
    <div class="page-head">
      <div>
        <h1>Giỏ hàng</h1>
        <p>2 sản phẩm · Cùng một cửa hàng, một lần giao.</p>
      </div>
      <div class="page-head__aside"><a class="link" href="products.html">Tiếp tục mua sắm ${icon("arrowRight", "icon icon--sm")}</a></div>
    </div>

    <div class="cart-layout">
      <div>
        <div class="cart-lines">
          <article class="cart-line">
            <a class="cart-line__media" href="product.html"><img src="assets/bag.jpg" alt="Túi du lịch MarketHub M2220"></a>
            <div class="cart-line__body">
              <a class="cart-line__name" href="product.html">Túi du lịch MarketHub M2220</a>
              <span class="cart-line__variant">Màu: Đen · Mã: M2220</span>
              <div class="cart-line__controls">
                <div class="qty">
                  <button type="button" data-qty="-1" aria-label="Giảm số lượng">${icon("minus", "icon icon--sm")}</button>
                  <label class="sr-only" for="qty-bag">Số lượng</label>
                  <input id="qty-bag" type="number" value="1" min="1" max="18">
                  <button type="button" data-qty="1" aria-label="Tăng số lượng">${icon("plus", "icon icon--sm")}</button>
                </div>
                <button class="cart-line__remove" type="button" data-remove="Túi du lịch MarketHub M2220">Xoá</button>
              </div>
            </div>
            <div class="cart-line__price">${money(459000)}<span class="cart-line__each">${money(459000)} / sản phẩm</span></div>
          </article>

          <article class="cart-line">
            <a class="cart-line__media" href="product.html"><img src="assets/lamp.jpg" alt="Đèn ngủ để bàn MarketHub Glow"></a>
            <div class="cart-line__body">
              <a class="cart-line__name" href="product.html">Đèn ngủ để bàn MarketHub Glow</a>
              <span class="cart-line__variant">Màu: Trắng · Mã: MH-GLOW</span>
              <div class="cart-line__controls">
                <div class="qty">
                  <button type="button" data-qty="-1" aria-label="Giảm số lượng">${icon("minus", "icon icon--sm")}</button>
                  <label class="sr-only" for="qty-lamp">Số lượng</label>
                  <input id="qty-lamp" type="number" value="1" min="1" max="18">
                  <button type="button" data-qty="1" aria-label="Tăng số lượng">${icon("plus", "icon icon--sm")}</button>
                </div>
                <button class="cart-line__remove" type="button" data-remove="Đèn ngủ để bàn MarketHub Glow">Xoá</button>
              </div>
            </div>
            <div class="cart-line__price">${money(249000)}<span class="cart-line__each">${money(249000)} / sản phẩm</span></div>
          </article>
        </div>
        <p class="muted" style="margin-top: var(--space-4); font-size: var(--text-xs)">Giá và tồn kho được kiểm tra lại khi bạn đặt hàng.</p>
      </div>

      <aside class="summary" aria-label="Tóm tắt đơn hàng">
        <h2>Tóm tắt</h2>
        <div class="ship-progress">
          <p>Đơn từ 499.000₫ được miễn phí giao hàng.</p>
          <div class="ship-progress__track"><div class="ship-progress__fill" style="width:100%"></div></div>
        </div>
        <div class="summary__rows">
          <div class="summary__row"><span>Tạm tính (2 sản phẩm)</span><span>${money(708000)}</span></div>
          <div class="summary__row"><span>Phí giao hàng</span><span>Miễn phí</span></div>
          <div class="summary__row summary__row--total"><span>Tổng cộng</span><span>${money(708000)}</span></div>
        </div>
        <a class="btn btn--primary btn--block" href="checkout.html">Tiến hành thanh toán ${icon("arrowRight", "icon icon--sm")}</a>
        <p class="summary__note">${icon("shield", "icon icon--sm")} Thanh toán qua VNPay hoặc MoMo. Giá đã bao gồm VAT.</p>
      </aside>
    </div>
  </div>`,
});

/* --------------------------------------------------------------------------
   Checkout
   -------------------------------------------------------------------------- */

const checkout = page({
  title: "Thanh toán",
  description: "Hoàn tất đơn hàng MarketHub.",
  body: `
  <div class="container">
    <div class="page-head">
      <div><h1>Thanh toán</h1></div>
      <div class="page-head__aside"><a class="link" href="cart.html">Quay lại giỏ hàng</a></div>
    </div>

    <div class="steps" aria-label="Các bước thanh toán">
      <span class="step" aria-current="step"><span class="step__no">1</span> Thông tin nhận hàng</span>
      <span class="step__sep"></span>
      <span class="step"><span class="step__no">2</span> Thanh toán</span>
      <span class="step__sep"></span>
      <span class="step"><span class="step__no">3</span> Hoàn tất</span>
    </div>

    <div class="checkout-layout">
      <form class="checkout-form" data-nav="checkout-result.html">
        <section class="checkout-section">
          <div class="checkout-section__head"><h2>Thông tin nhận hàng</h2><a href="account.html">Quản lý địa chỉ</a></div>
          <div class="form-grid">
            <div class="field span-2">
              <label for="saved-address">Địa chỉ đã lưu</label>
              <select class="select" id="saved-address">
                <option>[Mặc định] An Võ, 99 Trần Hưng Đạo, Phường 7, Quận 5, TP.HCM</option>
              </select>
            </div>
            <div class="field">
              <label class="required" for="recipientName">Người nhận</label>
              <input class="input" id="recipientName" name="recipientName" autocomplete="name" value="An Võ">
            </div>
            <div class="field">
              <label class="required" for="phone">Số điện thoại</label>
              <input class="input" id="phone" name="phone" inputmode="numeric" autocomplete="tel" value="0934567890">
            </div>
            <div class="field span-2">
              <label class="required" for="fullAddress">Địa chỉ</label>
              <textarea class="textarea" id="fullAddress" name="fullAddress" rows="3" autocomplete="street-address">99 Trần Hưng Đạo, Phường 7, Quận 5, TP.HCM</textarea>
            </div>
          </div>
        </section>

        <section class="checkout-section">
          <div class="checkout-section__head"><h2>Phương thức thanh toán</h2></div>
          <fieldset class="pay-options">
            <legend class="sr-only">Chọn phương thức thanh toán</legend>
            <label class="pay-option">
              <input type="radio" name="paymentMethod" value="VNPay" checked>
              <span class="pay-option__body"><span class="pay-option__name">VNPay</span><span class="pay-option__hint">Thanh toán bằng thẻ ATM, Visa, Mastercard hoặc QR.</span></span>
              <span class="pay-option__mark">VNPAY</span>
            </label>
            <label class="pay-option">
              <input type="radio" name="paymentMethod" value="MoMo">
              <span class="pay-option__body"><span class="pay-option__name">MoMo</span><span class="pay-option__hint">Thanh toán bằng ví MoMo hoặc QR.</span></span>
              <span class="pay-option__mark">MoMo</span>
            </label>
          </fieldset>
          <p class="checkout-legal">Đơn hàng được ghi nhận ngay sau khi đặt. Bạn sẽ được chuyển đến cổng thanh toán tương ứng để hoàn tất.</p>
        </section>

        <div class="checkout-actions">
          <button class="btn btn--primary btn--block" type="submit">Đặt hàng · ${money(708000)}</button>
        </div>
        <p class="checkout-legal">Bằng việc đặt hàng, bạn đồng ý với điều khoản mua bán và chính sách đổi trả của MarketHub.</p>
      </form>

      <aside class="summary" aria-label="Đơn hàng của bạn">
        <h2>Đơn hàng của bạn</h2>
        <div class="order-mini">
          <div class="order-mini__item">
            <span class="order-mini__media"><img src="assets/bag.jpg" alt=""></span>
            <span><span class="order-mini__name">Túi du lịch MarketHub M2220</span><span class="order-mini__qty">Đen · SL 1</span></span>
            <span class="order-mini__price">${money(459000)}</span>
          </div>
          <div class="order-mini__item">
            <span class="order-mini__media"><img src="assets/lamp.jpg" alt=""></span>
            <span><span class="order-mini__name">Đèn ngủ để bàn MarketHub Glow</span><span class="order-mini__qty">Trắng · SL 1</span></span>
            <span class="order-mini__price">${money(249000)}</span>
          </div>
        </div>
        <div class="summary__rows">
          <div class="summary__row"><span>Tạm tính</span><span>${money(708000)}</span></div>
          <div class="summary__row"><span>Phí giao hàng</span><span>Miễn phí</span></div>
          <div class="summary__row summary__row--total"><span>Tổng cộng</span><span>${money(708000)}</span></div>
        </div>
        <p class="summary__note">${icon("shield", "icon icon--sm")} Giao hàng toàn quốc · Đổi trả 30 ngày.</p>
      </aside>
    </div>
  </div>`,
});

const checkoutResult = page({
  title: "Đặt hàng thành công",
  description: "Đơn hàng MarketHub đã được ghi nhận.",
  body: `
  <div class="container result-wrap">
    <div class="result-card">
      <div class="result-mark">${icon("check", "icon icon--lg")}</div>
      <h1>Đơn hàng đã được ghi nhận</h1>
      <p>Cảm ơn An Võ. MarketHub đã nhận đơn và đang chờ xác nhận thanh toán VNPay.</p>
      <div class="result-rows">
        <div><span>Mã đơn hàng</span><strong>#3034</strong></div>
        <div><span>Tổng thanh toán</span><strong>${money(708000)}</strong></div>
        <div><span>Phương thức</span><strong>VNPay</strong></div>
        <div><span>Trạng thái</span>${statusPill("PENDING")}</div>
      </div>
      <div class="btn-row">
        <a class="btn btn--primary" href="orders.html">Xem đơn hàng ${icon("arrowRight", "icon icon--sm")}</a>
        <a class="btn" href="products.html">Tiếp tục mua sắm</a>
      </div>
    </div>
  </div>`,
});

/* --------------------------------------------------------------------------
   Login
   -------------------------------------------------------------------------- */

const login = page({
  title: "Đăng nhập",
  description: "Đăng nhập MarketHub bằng Google hoặc email.",
  body: `
  <div class="auth">
    <div class="auth__media">
      <img src="assets/ceramics.jpg" alt="Gốm sứ trong xưởng làm gốm">
      <div class="auth__media-caption">Đồ tốt, chọn kỹ. Một cửa hàng, một chuẩn chọn.</div>
    </div>
    <div class="auth__panel">
      <div class="auth__box">
        <h1>Đăng nhập</h1>
        <p>Tiếp tục với Google để mua sắm nhanh hơn, hoặc dùng email của bạn.</p>

        <a class="google-btn" href="http://localhost:8080/oauth2/authorization/google">${googleG} Tiếp tục với Google</a>
        <div class="auth-divider">hoặc</div>

        <form class="auth-form" data-nav="account.html">
          <div class="field">
            <label for="email">Email</label>
            <input class="input" id="email" name="email" type="email" autocomplete="email" placeholder="ban@example.com" required>
          </div>
          <div class="field">
            <label for="password">Mật khẩu</label>
            <input class="input" id="password" name="password" type="password" autocomplete="current-password" placeholder="Nhập mật khẩu" required>
          </div>
          <button class="btn btn--primary" type="submit">Đăng nhập</button>
        </form>

        <p class="auth-switch">Chưa có tài khoản? <a href="register.html">Đăng ký</a></p>
        <p class="auth-note">Lần đầu đăng nhập bằng Google, MarketHub sẽ tạo tài khoản từ email và tên hiển thị của bạn. Chúng tôi không nhận mật khẩu Google.</p>
      </div>
    </div>
  </div>`,
});

const register = page({
  title: "Đăng ký",
  description: "Tạo tài khoản MarketHub bằng Google hoặc email.",
  body: `
  <div class="auth">
    <div class="auth__media">
      <img src="assets/books.jpg" alt="Kệ sách trong một hiệu sách cũ">
      <div class="auth__media-caption">Một tài khoản cho đơn hàng, địa chỉ và đánh giá của bạn.</div>
    </div>
    <div class="auth__panel">
      <div class="auth__box">
        <h1>Đăng ký</h1>
        <p>Tạo tài khoản để theo dõi đơn hàng và lưu địa chỉ giao hàng.</p>

        <a class="google-btn" href="http://localhost:8080/oauth2/authorization/google">${googleG} Tiếp tục với Google</a>
        <div class="auth-divider">hoặc</div>

        <form class="auth-form" data-nav="account.html">
          <div class="field">
            <label for="reg-name">Họ và tên</label>
            <input class="input" id="reg-name" name="fullName" autocomplete="name" placeholder="Nguyễn Minh Anh" required>
          </div>
          <div class="field">
            <label for="reg-email">Email</label>
            <input class="input" id="reg-email" name="email" type="email" autocomplete="email" placeholder="ban@example.com" required>
          </div>
          <div class="field">
            <label for="reg-phone">Số điện thoại</label>
            <input class="input" id="reg-phone" name="phone" inputmode="numeric" autocomplete="tel" placeholder="09xx xxx xxx" required>
          </div>
          <div class="field">
            <label for="reg-password">Mật khẩu</label>
            <input class="input" id="reg-password" name="password" type="password" autocomplete="new-password" placeholder="Tối thiểu 6 ký tự" required>
          </div>
          <button class="btn btn--primary" type="submit">Tạo tài khoản</button>
        </form>

        <p class="auth-switch">Đã có tài khoản? <a href="login.html">Đăng nhập</a></p>
        <p class="auth-note">Bằng việc đăng ký, bạn đồng ý với điều khoản sử dụng và chính sách bảo mật của MarketHub.</p>
      </div>
    </div>
  </div>`,
});

/* --------------------------------------------------------------------------
   Orders
   -------------------------------------------------------------------------- */

const orderRows = [
  { id: 1001, status: "PENDING", date: "05/11/2026 · 14:23", total: 299000, pay: "VNPay", name: "Chuột không dây MarketHub Silent", meta: "Đen · SL 1", img: "assets/audio.jpg" },
  { id: 3001, status: "SHIPPING", date: "04/11/2026 · 23:25", total: 2490000, pay: "VNPay", name: "Điện thoại MarketHub M2001", meta: "Đen · SL 1", img: "assets/audio.jpg" },
  { id: 1002, status: "CONFIRMED", date: "04/11/2026 · 16:23", total: 499000, pay: "MoMo", name: "Quần jean MarketHub Slim", meta: "30 / Xanh · SL 1", img: "assets/shoes.jpg" },
  { id: 3004, status: "COMPLETED", date: "01/11/2026 · 17:25", total: 438000, pay: "MoMo", name: "Áo thun thể thao MarketHub M2094", meta: "M / Đen · SL 2", img: "assets/sunglasses.jpg" },
  { id: 1007, status: "CANCELLED", date: "29/10/2026 · 16:23", total: 319000, pay: "VNPay", name: "Chuột không dây MarketHub Silent", meta: "Trắng · SL 1", img: "assets/audio.jpg" },
];

const orderCard = (o) => `<article class="order-card">
  <div class="order-card__head">
    <span class="order-card__id">Đơn #${o.id}</span>
    <span class="order-card__meta"><span>${o.date}</span><span>${o.pay}</span></span>
    ${statusPill(o.status)}
  </div>
  <div class="order-card__body">
    <div class="order-card__items">
      <div class="order-card__item">
        <span class="order-card__media"><img src="${o.img}" alt=""></span>
        <span><span class="order-card__item-name">${o.name}</span><span class="order-card__item-meta">${o.meta}</span></span>
      </div>
    </div>
    <div class="order-card__total"><span>Tổng cộng</span><strong>${money(o.total)}</strong></div>
  </div>
  <div class="order-card__foot">
    ${o.status === "PENDING" ? `<a class="btn btn--sm btn--primary" href="checkout-result.html">Thanh toán lại</a>` : ""}
    <a class="btn btn--sm" href="order.html">Xem chi tiết</a>
  </div>
</article>`;

const orders = page({
  title: "Đơn hàng của tôi",
  description: "29 đơn hàng của An Võ tại MarketHub.",
  body: `
  <div class="container">
    <div class="page-head">
      <div><h1>Đơn hàng của tôi</h1><p>29 đơn hàng · Cập nhật gần nhất 05/11/2026.</p></div>
      <div class="page-head__aside"><a class="link" href="account.html">Tài khoản của tôi</a></div>
    </div>

    <nav class="filter-tabs" aria-label="Lọc theo trạng thái">
      <a class="filter-tab" href="#" aria-current="page">Tất cả <span class="filter-tab__count">29</span></a>
      <a class="filter-tab" href="#">Chờ xác nhận <span class="filter-tab__count">5</span></a>
      <a class="filter-tab" href="#">Đã xác nhận <span class="filter-tab__count">7</span></a>
      <a class="filter-tab" href="#">Đang giao <span class="filter-tab__count">4</span></a>
      <a class="filter-tab" href="#">Đã giao <span class="filter-tab__count">5</span></a>
      <a class="filter-tab" href="#">Hoàn tất <span class="filter-tab__count">6</span></a>
      <a class="filter-tab" href="#">Đã huỷ <span class="filter-tab__count">2</span></a>
    </nav>

    <div class="order-list">${orderRows.map(orderCard).join("")}</div>

    <nav class="pagination" aria-label="Phân trang đơn hàng">
      <span class="page-btn" aria-disabled="true">${icon("arrowLeft", "icon icon--sm")}</span>
      <a class="page-btn" href="#" aria-current="page">1</a>
      <a class="page-btn" href="#">2</a>
      <a class="page-btn" href="#">3</a>
      <a class="page-btn" href="#">${icon("arrowRight", "icon icon--sm")}</a>
    </nav>
  </div>`,
});

const order = page({
  title: "Đơn hàng #3001",
  description: "Chi tiết đơn hàng #3001 của An Võ.",
  body: `
  <div class="container">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="index.html">Trang chủ</a><span>/</span><a href="orders.html">Đơn hàng</a><span>/</span><span aria-current="page">#3001</span>
    </nav>

    <div class="page-head">
      <div>
        <h1>Đơn hàng #3001</h1>
        <p>Đặt 04/11/2026, cập nhật 05/11/2026, VNPay</p>
      </div>
      <div class="page-head__aside">${statusPill("SHIPPING")}</div>
    </div>

    <div class="timeline" aria-label="Tiến trình đơn hàng">
      <div class="timeline__step timeline__step--done"><div class="timeline__bar"></div><div class="timeline__label">Chờ xác nhận</div><div class="timeline__date">04/11 · 23:25</div></div>
      <div class="timeline__step timeline__step--done"><div class="timeline__bar"></div><div class="timeline__label">Đã xác nhận</div><div class="timeline__date">Đã xử lý</div></div>
      <div class="timeline__step timeline__step--current"><div class="timeline__bar"></div><div class="timeline__label">Đang giao</div><div class="timeline__date">05/11 · 00:25</div></div>
      <div class="timeline__step"><div class="timeline__bar"></div><div class="timeline__label">Đã giao</div><div class="timeline__date">Chưa tới</div></div>
      <div class="timeline__step"><div class="timeline__bar"></div><div class="timeline__label">Hoàn tất</div><div class="timeline__date">Chưa tới</div></div>
    </div>

    <div class="order-detail">
      <div>
        <section class="order-block">
          <h2>Sản phẩm</h2>
          <div class="order-item">
            <span class="order-item__media"><img src="assets/audio.jpg" alt=""></span>
            <span><span class="order-item__name">Điện thoại MarketHub M2001</span><span class="order-item__meta">Màu: Đen, SL 1, 2.490.000₫ / sản phẩm</span></span>
            <span class="order-item__price">${money(2490000)}</span>
          </div>
        </section>

        <section class="order-block">
          <h2>Tổng cộng</h2>
          <div class="summary__rows" style="margin-top:0;padding-top:0;border-top:0">
            <div class="summary__row"><span>Tạm tính</span><span>${money(2490000)}</span></div>
            <div class="summary__row"><span>Phí giao hàng</span><span>Miễn phí</span></div>
            <div class="summary__row summary__row--total"><span>Tổng cộng</span><span>${money(2490000)}</span></div>
          </div>
        </section>

        <section class="order-block" style="border-bottom:0">
          <h2>Hỗ trợ</h2>
          <p class="muted" style="font-size: var(--text-sm)">Cần thay đổi địa chỉ hoặc kiểm tra đơn? Liên hệ hỗ trợ 8:00 tới 21:00.</p>
        </section>
      </div>

      <aside class="order-side">
        <div class="side-card">
          <h2>Địa chỉ nhận hàng</h2>
          <dl class="info-list">
            <div class="info-list__row"><dt>Người nhận</dt><dd>An Võ</dd></div>
            <div class="info-list__row"><dt>Điện thoại</dt><dd>0934567890</dd></div>
            <div class="info-list__row"><dt>Địa chỉ</dt><dd>99 Trần Hưng Đạo, Phường 7, Quận 5, TP.HCM</dd></div>
          </dl>
        </div>
        <div class="side-card">
          <h2>Thanh toán</h2>
          <dl class="info-list">
            <div class="info-list__row"><dt>Phương thức</dt><dd>VNPay</dd></div>
            <div class="info-list__row"><dt>Trạng thái</dt><dd><span class="status status--completed">Đã thanh toán</span></dd></div>
            <div class="info-list__row"><dt>Số tiền</dt><dd>${money(2490000)}</dd></div>
          </dl>
        </div>
        <a class="btn btn--block" href="orders.html">${icon("arrowRight", "icon icon--sm")} Về danh sách đơn</a>
      </aside>
    </div>
  </div>`,
});

/* --------------------------------------------------------------------------
   Account
   -------------------------------------------------------------------------- */

const account = page({
  title: "Tài khoản",
  description: "Thông tin tài khoản và địa chỉ của An Võ.",
  body: `
  <div class="container">
    <div class="page-head">
      <div><h1>Tài khoản</h1><p>Quản lý thông tin cá nhân và địa chỉ giao hàng.</p></div>
      <div class="page-head__aside"><a class="link" href="orders.html">Đơn hàng của tôi ${icon("arrowRight", "icon icon--sm")}</a></div>
    </div>

    <div class="account-layout">
      <nav class="account-nav" aria-label="Tài khoản">
        <a href="account.html" aria-current="page">Thông tin cá nhân ${icon("arrowRight", "icon icon--sm")}</a>
        <a href="#dia-chi">Địa chỉ giao hàng ${icon("arrowRight", "icon icon--sm")}</a>
        <a href="orders.html">Đơn hàng ${icon("arrowRight", "icon icon--sm")}</a>
        <a href="login.html">Đăng xuất ${icon("logout", "icon icon--sm")}</a>
      </nav>

      <div class="account-content">
        <section>
          <h2>Thông tin cá nhân</h2>
          <form class="account-form" action="#" method="post">
            <div class="form-grid">
              <div class="field span-2">
                <label for="fullName">Họ và tên</label>
                <input class="input" id="fullName" value="An Võ" autocomplete="name">
              </div>
              <div class="field">
                <label for="accountEmail">Email</label>
                <input class="input" id="accountEmail" value="buyer.demo@markethub.vn" type="email" disabled>
                <span class="field-hint">Email không thể thay đổi.</span>
              </div>
              <div class="field">
                <label for="accountPhone">Số điện thoại</label>
                <input class="input" id="accountPhone" value="0934567890" inputmode="numeric" autocomplete="tel">
              </div>
            </div>
            <div class="btn-row"><button class="btn btn--primary" type="submit">Lưu thay đổi</button></div>
          </form>
        </section>

        <section id="dia-chi">
          <h2>Địa chỉ giao hàng</h2>
          <div class="address-card" style="margin-top: var(--space-4)">
            <div class="address-card__body">
              <span class="address-card__name">An Võ <span class="status status--completed" style="margin-left: var(--space-2)">Mặc định</span></span>
              <span class="address-card__meta">0934567890</span>
              <span class="address-card__meta">99 Trần Hưng Đạo, Phường 7, Quận 5, TP.HCM</span>
            </div>
            <div class="address-card__actions"><a href="#">Sửa</a><a href="#">Xoá</a></div>
          </div>
          <button class="btn btn--sm" type="button" style="margin-top: var(--space-3)">${icon("plus", "icon icon--sm")} Thêm địa chỉ</button>
        </section>
      </div>
    </div>
  </div>`,
});

/* --------------------------------------------------------------------------
   Store management
   -------------------------------------------------------------------------- */

function panelShell({ brand, sub, nav, active, topLeft, topRight, body }) {
  return `<div class="panel">
    <aside class="panel__side">
      <a class="panel__brand" href="index.html">
        <span class="brand__name">${brand}</span>
        <span class="brand__sub">${sub}</span>
      </a>
      <nav class="panel__nav" aria-label="Điều hướng quản lý">
        <span class="panel__label">Không gian làm việc</span>
        ${nav.map(([label, href, key, iconName, badge]) => `<a class="panel__link" href="${href}"${active === key ? ' aria-current="page"' : ""}>${icon(iconName, "icon icon--sm")}<span>${label}</span>${badge ? `<span class="cart-count" style="margin-left:auto">${badge}</span>` : ""}</a>`).join("")}
      </nav>
      <div class="panel__foot">
        <p>MarketHub · ${sub}</p>
        <p style="margin-top:var(--space-2)">Giao diện thử nghiệm</p>
      </div>
    </aside>
    <div class="panel__main">
      <div class="panel__top">
        <div class="panel__top-left">${topLeft}</div>
        <div class="panel__top-right">${topRight}</div>
      </div>
      <div class="panel__content">${body}</div>
    </div>
  </div>`;
}

const storeNav = [
  ["Tổng quan", "store.html", "dashboard", "grid"],
  ["Sản phẩm", "store-products.html", "products", "box"],
  ["Đơn hàng", "store-orders.html", "orders", "clipboard", "7"],
  ["Cài đặt cửa hàng", "store.html", "settings", "settings"],
];

const storeTop = `<span>Cửa hàng</span><span>/</span><strong style="color:var(--ink);font-weight:600">Tổng quan</strong>`;

const storeDashboard = panelShell({
  brand: "MarketHub",
  sub: "Quản lý cửa hàng",
  nav: storeNav,
  active: "dashboard",
  topLeft: storeTop,
  topRight: `<a class="link link--plain" href="index.html">Xem cửa hàng ${icon("external", "icon icon--sm")}</a><span class="user-chip"><span class="user-chip__avatar">TZ</span>Tech Zone</span>`,
  body: `
    <div class="panel__head">
      <div>
        <h1>Tổng quan cửa hàng</h1>
        <p>MarketHub Tech Zone, cập nhật 05/11/2026 lúc 23:24</p>
      </div>
      <div class="panel__head-actions">
        <select class="select" style="min-height:36px;width:auto;font-size:var(--text-xs)" aria-label="Khoảng thời gian">
          <option>30 ngày qua</option>
          <option>7 ngày qua</option>
          <option>Hôm nay</option>
        </select>
        <a class="btn btn--sm btn--primary" href="store-products.html">${icon("plus", "icon icon--sm")} Thêm sản phẩm</a>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat"><div class="stat__label">Sản phẩm đang bán</div><div class="stat__value">24</div><div class="stat__meta">Tất cả đang hoạt động</div></div>
      <div class="stat"><div class="stat__label">Đơn hàng</div><div class="stat__value">19</div><div class="stat__meta">19 đơn trong 30 ngày</div></div>
      <div class="stat"><div class="stat__label">Chờ xác nhận</div><div class="stat__value">7</div><div class="stat__meta">Cần xử lý</div></div>
      <div class="stat"><div class="stat__label">Doanh thu</div><div class="stat__value">${money(10000000)}</div><div class="stat__meta">Đơn đã thanh toán</div></div>
    </div>

    <div class="panel-grid">
      <section class="panel-card">
        <div class="panel-card__head"><h2>Đơn hàng gần đây</h2><a href="store-orders.html">Xem tất cả</a></div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Đơn</th><th>Khách</th><th>Trạng thái</th><th class="num">Tổng</th><th>Ngày</th></tr></thead>
            <tbody>
              <tr><td><strong>#2001</strong></td><td>Minh Anh Nguyễn</td><td>${statusPill("PENDING")}</td><td class="num">${money(2490000)}</td><td>05/11 · 23:24</td></tr>
              <tr><td><strong>#2121</strong></td><td>Minh Anh Nguyễn</td><td>${statusPill("PENDING")}</td><td class="num">${money(2490000)}</td><td>05/11 · 23:24</td></tr>
              <tr><td><strong>#2061</strong></td><td>Đức Huy Võ</td><td>${statusPill("PENDING")}</td><td class="num">${money(2530000)}</td><td>05/11 · 11:24</td></tr>
              <tr><td><strong>#2181</strong></td><td>Đức Huy Võ</td><td>${statusPill("PENDING")}</td><td class="num">${money(2530000)}</td><td>05/11 · 11:24</td></tr>
              <tr><td><strong>#3001</strong></td><td>An Võ</td><td>${statusPill("SHIPPING")}</td><td class="num">${money(2490000)}</td><td>04/11 · 23:25</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <div style="display:grid;gap:var(--space-6)">
        <section class="panel-card">
          <div class="panel-card__head"><h2>Trạng thái đơn</h2><span class="eyebrow-free">19 đơn</span></div>
          <div class="panel-card__body">
            <div class="bars">
              <div class="bar-row"><span class="bar-row__label">Chờ xác nhận</span><span class="bar-row__track"><span class="bar-row__fill" style="width:100%"></span></span><span class="bar-row__value">7</span></div>
              <div class="bar-row"><span class="bar-row__label">Đã xác nhận</span><span class="bar-row__track"><span class="bar-row__fill" style="width:14%"></span></span><span class="bar-row__value">1</span></div>
              <div class="bar-row"><span class="bar-row__label">Đang giao</span><span class="bar-row__track"><span class="bar-row__fill" style="width:100%"></span></span><span class="bar-row__value">7</span></div>
              <div class="bar-row"><span class="bar-row__label">Hoàn tất</span><span class="bar-row__track"><span class="bar-row__fill" style="width:57%"></span></span><span class="bar-row__value">4</span></div>
            </div>
          </div>
        </section>

        <section class="panel-card">
          <div class="panel-card__head"><h2>Việc cần làm</h2></div>
          <div class="panel-card__body" style="display:grid;gap:var(--space-3)">
            <div class="summary__row"><span>Đơn chờ xác nhận</span><strong>7</strong></div>
            <div class="summary__row"><span>Sản phẩm sắp hết hàng</span><strong>0</strong></div>
            <a class="btn btn--sm btn--block" href="store-orders.html">Xử lý đơn hàng</a>
          </div>
        </section>
      </div>
    </div>`,
});

const storeProducts = panelShell({
  brand: "MarketHub",
  sub: "Quản lý cửa hàng",
  nav: storeNav,
  active: "products",
  topLeft: `<span>Cửa hàng</span><span>/</span><strong style="color:var(--ink);font-weight:600">Sản phẩm</strong>`,
  topRight: `<a class="link link--plain" href="index.html">Xem cửa hàng ${icon("external", "icon icon--sm")}</a><span class="user-chip"><span class="user-chip__avatar">TZ</span>Tech Zone</span>`,
  body: `
    <div class="panel__head">
      <div><h1>Sản phẩm</h1><p>24 sản phẩm, 24 đang hoạt động, 0 đã xoá</p></div>
      <div class="panel__head-actions"><a class="btn btn--sm btn--primary" href="#">${icon("plus", "icon icon--sm")} Thêm sản phẩm</a></div>
    </div>

    <div class="panel-toolbar">
      <div class="segmented" aria-label="Lọc trạng thái">
        <a href="#" aria-current="page">Đang bán <span class="filter-tab__count">24</span></a>
        <a href="#">Đã xoá <span class="filter-tab__count">0</span></a>
      </div>
      <label class="search-inline">${icon("search", "icon icon--sm")}<span class="sr-only">Tìm sản phẩm</span><input type="search" placeholder="Tìm theo tên hoặc SKU…"></label>
    </div>

    <section class="panel-card">
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Sản phẩm</th><th>Danh mục</th><th class="num">Giá</th><th class="num">Tồn kho</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            ${[
              ["Điện thoại MarketHub M2001", "M2001 · Large-TechZone-01", "Điện thoại", 2490000, 25, "assets/audio.jpg"],
              ["Tai nghe Bluetooth MarketHub M2002", "M2002 · Large-TechZone-02", "Tai nghe", 510000, 27, "assets/audio.jpg"],
              ["Sạc dự phòng MarketHub M2003", "M2003 · Large-TechZone-03", "Sạc dự phòng", 439000, 29, "assets/laptop.jpg"],
              ["Ốp lưng silicon MarketHub M2004", "M2004 · Large-TechZone-04", "Ốp lưng", 159000, 31, "assets/sunglasses.jpg"],
              ["Điện thoại thông minh MarketHub M2005", "M2005 · Large-TechZone-05", "Điện thoại", 2570000, 33, "assets/audio.jpg"],
              ["Tai nghe chống ồn MarketHub M2006", "M2006 · Large-TechZone-06", "Tai nghe", 490000, 35, "assets/audio.jpg"],
              ["Pin sạc nhanh MarketHub M2007", "M2007 · Large-TechZone-07", "Sạc dự phòng", 419000, 37, "assets/laptop.jpg"],
              ["Ốp lưng chống sốc MarketHub M2008", "M2008 · Large-TechZone-08", "Ốp lưng", 139000, 39, "assets/sunglasses.jpg"],
            ].map(([name, sku, cat, price, stock, img]) => `<tr>
              <td><div class="table-product"><span class="table-product__media"><img src="${img}" alt=""></span><span><span class="table-product__name">${name}</span><span class="table-product__sku">${sku}</span></span></div></td>
              <td>${cat}</td>
              <td class="num">${money(price)}</td>
              <td class="num">${stock}</td>
              <td><span class="status status--completed">Đang bán</span></td>
              <td><div class="table-actions"><a href="#" aria-label="Sửa ${name}">${icon("settings", "icon icon--sm")}</a></div></td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </section>

    <nav class="pagination" aria-label="Phân trang sản phẩm">
      <span class="page-btn" aria-disabled="true">${icon("arrowLeft", "icon icon--sm")}</span>
      <a class="page-btn" href="#" aria-current="page">1</a>
      <a class="page-btn" href="#">2</a>
      <a class="page-btn" href="#">3</a>
      <a class="page-btn" href="#">${icon("arrowRight", "icon icon--sm")}</a>
    </nav>`,
});

const storeOrders = panelShell({
  brand: "MarketHub",
  sub: "Quản lý cửa hàng",
  nav: storeNav,
  active: "orders",
  topLeft: `<span>Cửa hàng</span><span>/</span><strong style="color:var(--ink);font-weight:600">Đơn hàng</strong>`,
  topRight: `<a class="link link--plain" href="index.html">Xem cửa hàng ${icon("external", "icon icon--sm")}</a><span class="user-chip"><span class="user-chip__avatar">TZ</span>Tech Zone</span>`,
  body: `
    <div class="panel__head">
      <div><h1>Đơn hàng</h1><p>19 đơn, 7 chờ xác nhận, 4 hoàn tất</p></div>
      <div class="panel__head-actions"><button class="btn btn--sm" type="button">${icon("clipboard", "icon icon--sm")} Xuất danh sách</button></div>
    </div>

    <div class="panel-toolbar">
      <div class="segmented" aria-label="Lọc trạng thái">
        <a href="#" aria-current="page">Tất cả <span class="filter-tab__count">19</span></a>
        <a href="#">Chờ xác nhận <span class="filter-tab__count">7</span></a>
        <a href="#">Đang giao <span class="filter-tab__count">7</span></a>
        <a href="#">Hoàn tất <span class="filter-tab__count">4</span></a>
      </div>
      <label class="search-inline">${icon("search", "icon icon--sm")}<span class="sr-only">Tìm đơn hàng</span><input type="search" placeholder="Tìm mã đơn hoặc khách hàng…"></label>
    </div>

    <section class="panel-card">
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Đơn</th><th>Khách hàng</th><th>Thanh toán</th><th>Trạng thái</th><th class="num">Tổng</th><th>Ngày</th><th></th></tr></thead>
          <tbody>
            ${[
              [2001, "Minh Anh Nguyễn", "buyer03.demo@markethub.vn", "PENDING", "VNPay", 2490000, "05/11 · 23:24"],
              [2121, "Minh Anh Nguyễn", "buyer03.demo@markethub.vn", "PENDING", "VNPay", 2490000, "05/11 · 23:24"],
              [2061, "Đức Huy Võ", "buyer07.demo@markethub.vn", "PENDING", "VNPay", 2530000, "05/11 · 11:24"],
              [2181, "Đức Huy Võ", "buyer07.demo@markethub.vn", "PENDING", "VNPay", 2530000, "05/11 · 11:24"],
              [3001, "An Võ", "buyer.demo@markethub.vn", "SHIPPING", "VNPay", 2490000, "04/11 · 23:25"],
              [2073, "Minh Anh Nguyễn", "buyer03.demo@markethub.vn", "SHIPPING", "VNPay", 2490000, "24/10 · 23:24"],
            ].map(([id, name, email, status, pay, total, date]) => `<tr>
              <td><strong>#${id}</strong></td>
              <td><div><div style="font-weight:500">${name}</div><div class="table-product__sku">${email}</div></div></td>
              <td>${pay}</td>
              <td>${statusPill(status)}</td>
              <td class="num">${money(total)}</td>
              <td>${date}</td>
              <td><div class="table-actions"><a href="order.html" aria-label="Xem đơn #${id}">${icon("arrowUpRight", "icon icon--sm")}</a></div></td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </section>

    <nav class="pagination" aria-label="Phân trang đơn hàng">
      <span class="page-btn" aria-disabled="true">${icon("arrowLeft", "icon icon--sm")}</span>
      <a class="page-btn" href="#" aria-current="page">1</a>
      <a class="page-btn" href="#">2</a>
      <a class="page-btn" href="#">3</a>
      <a class="page-btn" href="#">${icon("arrowRight", "icon icon--sm")}</a>
    </nav>`,
});

/* --------------------------------------------------------------------------
   Admin
   -------------------------------------------------------------------------- */

const adminNav = [
  ["Tổng quan", "admin.html", "dashboard", "grid"],
  ["Đơn hàng", "admin.html", "orders", "clipboard", "48"],
  ["Người dùng", "admin.html", "users", "users"],
  ["Danh mục", "admin.html", "categories", "folder"],
  ["Cửa hàng", "admin.html", "shops", "box"],
];

const admin = panelShell({
  brand: "MarketHub",
  sub: "Quản trị hệ thống",
  nav: adminNav,
  active: "dashboard",
  topLeft: `<span>Quản trị</span><span>/</span><strong style="color:var(--ink);font-weight:600">Tổng quan</strong>`,
  topRight: `<a class="link link--plain" href="index.html">Xem cửa hàng ${icon("external", "icon icon--sm")}</a><span class="user-chip"><span class="user-chip__avatar">AD</span>Admin</span>`,
  body: `
    <div class="panel__head">
      <div><h1>Tổng quan hệ thống</h1><p>Cập nhật 05/11/2026 lúc 23:24, dữ liệu demo</p></div>
      <div class="panel__head-actions"><a class="btn btn--sm" href="admin.html">${icon("clipboard", "icon icon--sm")} Đối soát đơn hàng</a></div>
    </div>

    <div class="stat-grid">
      <div class="stat"><div class="stat__label">Đơn hàng</div><div class="stat__value">233</div><div class="stat__meta">8 đơn hôm nay</div></div>
      <div class="stat"><div class="stat__label">Chờ xác nhận</div><div class="stat__value">48</div><div class="stat__meta">Toàn hệ thống</div></div>
      <div class="stat"><div class="stat__label">Doanh thu</div><div class="stat__value">${money(152217000)}</div><div class="stat__meta">Đơn đã thanh toán</div></div>
      <div class="stat"><div class="stat__label">Sản phẩm</div><div class="stat__value">300</div><div class="stat__meta">9 danh mục gốc</div></div>
    </div>

    <div class="panel-grid">
      <section class="panel-card">
        <div class="panel-card__head"><h2>Đơn hàng gần đây</h2><a href="admin.html">Xem tất cả</a></div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Đơn</th><th>Khách</th><th>Cửa hàng</th><th>Trạng thái</th><th class="num">Tổng</th></tr></thead>
            <tbody>
              <tr><td><strong>#2001</strong></td><td>Minh Anh Nguyễn</td><td>Tech Zone</td><td>${statusPill("PENDING")}</td><td class="num">${money(2490000)}</td></tr>
              <tr><td><strong>#2121</strong></td><td>Minh Anh Nguyễn</td><td>Tech Zone</td><td>${statusPill("PENDING")}</td><td class="num">${money(2490000)}</td></tr>
              <tr><td><strong>#3033</strong></td><td>Admin MarketHub</td><td>Fashion House</td><td>${statusPill("PENDING")}</td><td class="num">${money(279000)}</td></tr>
              <tr><td><strong>#3032</strong></td><td>Admin MarketHub</td><td>Women Style</td><td>${statusPill("PENDING")}</td><td class="num">${money(479000)}</td></tr>
              <tr><td><strong>#3031</strong></td><td>Admin MarketHub</td><td>Laptop Center</td><td>${statusPill("PENDING")}</td><td class="num">${money(2560000)}</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <div style="display:grid;gap:var(--space-6)">
        <section class="panel-card">
          <div class="panel-card__head"><h2>Phân bố trạng thái</h2><span class="eyebrow-free">233 đơn</span></div>
          <div class="panel-card__body">
            <div class="bars">
              <div class="bar-row"><span class="bar-row__label">Chờ xác nhận</span><span class="bar-row__track"><span class="bar-row__fill" style="width:100%"></span></span><span class="bar-row__value">48</span></div>
              <div class="bar-row"><span class="bar-row__label">Đã xác nhận</span><span class="bar-row__track"><span class="bar-row__fill" style="width:96%"></span></span><span class="bar-row__value">46</span></div>
              <div class="bar-row"><span class="bar-row__label">Đang giao</span><span class="bar-row__track"><span class="bar-row__fill" style="width:73%"></span></span><span class="bar-row__value">35</span></div>
              <div class="bar-row"><span class="bar-row__label">Đã giao</span><span class="bar-row__track"><span class="bar-row__fill" style="width:96%"></span></span><span class="bar-row__value">46</span></div>
              <div class="bar-row"><span class="bar-row__label">Hoàn tất</span><span class="bar-row__track"><span class="bar-row__fill" style="width:98%"></span></span><span class="bar-row__value">47</span></div>
              <div class="bar-row"><span class="bar-row__label">Đã huỷ</span><span class="bar-row__track"><span class="bar-row__fill" style="width:23%"></span></span><span class="bar-row__value">11</span></div>
            </div>
          </div>
        </section>

        <section class="panel-card">
          <div class="panel-card__head"><h2>Hệ thống</h2></div>
          <div class="panel-card__body" style="display:grid;gap:var(--space-3)">
            <div class="summary__row"><span>Người dùng</span><strong>29</strong></div>
            <div class="summary__row"><span>Cửa hàng</span><strong>18</strong></div>
            <div class="summary__row"><span>Chờ duyệt cửa hàng</span><strong>3</strong></div>
            <div class="summary__row"><span>Danh mục</span><strong>36</strong></div>
          </div>
        </section>
      </div>
    </div>`,
});

/* --------------------------------------------------------------------------
   Write
   -------------------------------------------------------------------------- */

write("index.html", home);
write("products.html", catalog);
write("product.html", product);
write("cart.html", cart);
write("checkout.html", checkout);
write("checkout-result.html", checkoutResult);
write("login.html", login);
write("register.html", register);
write("orders.html", orders);
write("order.html", order);
write("account.html", account);
write("store.html", panelPage({ title: "Tổng quan cửa hàng", body: storeDashboard }));
write("store-products.html", panelPage({ title: "Sản phẩm | Quản lý cửa hàng", body: storeProducts }));
write("store-orders.html", panelPage({ title: "Đơn hàng | Quản lý cửa hàng", body: storeOrders }));
write("admin.html", panelPage({ title: "Tổng quan hệ thống", body: admin }));

console.log("Built 15 pages in", here);


