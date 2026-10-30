#!/usr/bin/env node
/**
 * Seed dữ liệu mẫu cho MarketHub qua API thật (không sửa schema, không chèn thẳng DB).
 *
 * Cách chạy (backend + MySQL đang chạy):
 *   node scripts/seed-demo.mjs
 *
 * Script idempotent: chạy lại sẽ dùng tài khoản/shop/sản phẩm đã có, chỉ bổ sung
 * phần còn thiếu (variant, ảnh, địa chỉ) thay vì tạo bản ghi trùng. Nếu DB còn
 * bản ghi ảnh nhưng file upload đã bị xoá, script upload lại ảnh demo.
 *
 * Lưu ý: shop được duyệt qua API Admin; nếu JWT admin hiện bị lỗi scope=USER (403)
 * thì script tự fallback sang SQL local qua Docker. Fallback chỉ dành cho môi trường dev.
 */
import { spawnSync } from "node:child_process";
import { deflateSync } from "node:zlib";

const API_BASE = process.env.API_BASE ?? "http://localhost:8080/api";
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE).origin;
  } catch {
    return "";
  }
})();
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "Demo@123";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@markethub.vn";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin@123";
const MYSQL_CONTAINER = process.env.MYSQL_CONTAINER ?? "ecommerce-mysql";
const MYSQL_DATABASE = process.env.MYSQL_DATABASE ?? "ecommerce_db";
const MYSQL_ROOT_PASSWORD = process.env.MYSQL_ROOT_PASSWORD ?? "";

const SELLERS = [
  {
    email: "seller.demo@markethub.vn",
    firstName: "Minh",
    lastName: "Nguyễn",
    phone: "0901234567",
    shop: {
      name: "MarketHub Demo - Công nghệ",
      description: "Shop mẫu chuyên tai nghe, bàn phím cơ và phụ kiện công nghệ.",
      phone: "0901234567",
      pickupAddress: "12 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM",
    },
    products: [
      {
        name: "Tai nghe Bluetooth MarketHub Air",
        description:
          "Tai nghe không dây chống ồn, pin 30 giờ, kết nối Bluetooth 5.3. Sản phẩm mẫu để thử luồng thêm giỏ và checkout.",
        category: "Tai nghe",
        theme: [[32, 78, 160], [112, 213, 255]],
        variants: [
          { sku: "DEMO-AIR-DEN", attributes: { color: "Đen" }, priceMinor: 459000, stockQuantity: 25 },
          { sku: "DEMO-AIR-TRANG", attributes: { color: "Trắng" }, priceMinor: 499000, stockQuantity: 15 },
        ],
      },
      {
        name: "Bàn phím cơ MarketHub K87",
        description:
          "Bàn phím cơ 87 phím, switch êm, đèn nền trắng, kết nối USB-C. Phù hợp làm việc và gaming.",
        category: "Bàn phím",
        theme: [[34, 38, 52], [244, 132, 63]],
        variants: [
          { sku: "DEMO-K87-RED", attributes: { switch: "Red", layout: "87 phím" }, priceMinor: 890000, stockQuantity: 12 },
        ],
      },
    ],
  },
  {
    email: "seller.style@markethub.vn",
    firstName: "Lan",
    lastName: "Trần",
    phone: "0912345678",
    shop: {
      name: "MarketHub Demo - Thời trang",
      description: "Shop mẫu thời trang nam nữ: áo thun cotton, giày sneaker.",
      phone: "0912345678",
      pickupAddress: "45 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM",
    },
    products: [
      {
        name: "Áo thun cotton MarketHub Basic",
        description:
          "Áo thun cotton 100% form regular, thấm hút tốt, có size M và L. Màu trắng dễ phối đồ.",
        category: "Áo thun",
        theme: [[22, 128, 107], [173, 232, 182]],
        variants: [
          { sku: "DEMO-TEE-M", attributes: { size: "M", color: "Trắng" }, priceMinor: 199000, stockQuantity: 30 },
          { sku: "DEMO-TEE-L", attributes: { size: "L", color: "Trắng" }, priceMinor: 219000, stockQuantity: 20 },
        ],
      },
      {
        name: "Sneaker MarketHub Urban",
        description:
          "Giày sneaker đế cao su, upper vải lưới thoáng khí, phù hợp đi làm và dạo phố.",
        category: "Giày thể thao",
        theme: [[91, 53, 150], [238, 130, 238]],
        variants: [
          { sku: "DEMO-URBAN-40", attributes: { size: "40", color: "Xanh navy" }, priceMinor: 1290000, stockQuantity: 8 },
          { sku: "DEMO-URBAN-41", attributes: { size: "41", color: "Xanh navy" }, priceMinor: 1290000, stockQuantity: 6 },
        ],
      },
    ],
  },
  {
    email: "seller.home@markethub.vn",
    firstName: "Hùng",
    lastName: "Phạm",
    phone: "0923456789",
    shop: {
      name: "MarketHub Demo - Nhà cửa",
      description: "Shop mẫu đồ dùng nhà cửa, trang trí và nhà bếp.",
      phone: "0923456789",
      pickupAddress: "88 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
    },
    products: [
      {
        name: "Đèn ngủ để bàn MarketHub Glow",
        description:
          "Đèn LED để bàn 3 mức sáng, ánh sáng ấm, phù hợp phòng ngủ và góc làm việc.",
        category: "Trang trí",
        theme: [[191, 119, 36], [255, 224, 130]],
        variants: [
          { sku: "DEMO-GLOW-TRANG", attributes: { color: "Trắng" }, priceMinor: 249000, stockQuantity: 18 },
          { sku: "DEMO-GLOW-VANG", attributes: { color: "Vàng" }, priceMinor: 249000, stockQuantity: 12 },
        ],
      },
      {
        name: "Bộ ly thủy tinh MarketHub 6 món",
        description:
          "Bộ 6 ly thủy tinh trong suốt, dung tích 300ml, an toàn với máy rửa chén.",
        category: "Nhà bếp",
        theme: [[49, 130, 170], [196, 235, 245]],
        variants: [
          { sku: "DEMO-GLASS-6", attributes: { set: "6 món" }, priceMinor: 329000, stockQuantity: 14 },
        ],
      },
    ],
  },
];

const BUYER = {
  email: "buyer.demo@markethub.vn",
  firstName: "An",
  lastName: "Võ",
  phone: "0934567890",
  address: {
    recipientName: "An Võ",
    phone: "0934567890",
    fullAddress: "99 Trần Hưng Đạo, Phường 7, Quận 5, TP.HCM",
  },
};

const warnings = [];

class ApiError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function api(path, { method = "GET", token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { method, headers, body: payload });
  } catch (error) {
    throw new ApiError(
      `Không kết nối được ${API_BASE}. Hãy chắc chắn backend đang chạy. (${error.message})`,
    );
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    throw new ApiError(data?.message ?? `HTTP ${response.status}`, {
      status: response.status,
      code: data?.code,
    });
  }
  if (data && typeof data === "object" && "code" in data && data.code !== 1000) {
    throw new ApiError(data.message ?? `Mã lỗi ${data.code}`, { status: response.status, code: data.code });
  }
  return data;
}

async function login(email, password) {
  const data = await api("/auth/login", { method: "POST", body: { email, password } });
  if (!data?.token) throw new ApiError(`Đăng nhập ${email} không trả về token`);
  return data.token;
}

async function ensureAccount(account) {
  try {
    const token = await login(account.email, DEMO_PASSWORD);
    return { token, created: false };
  } catch (error) {
    if (error.status !== 400) throw error;

    try {
      await api("/auth/register", {
        method: "POST",
        body: {
          email: account.email,
          password: DEMO_PASSWORD,
          firstName: account.firstName,
          lastName: account.lastName,
          phone: account.phone,
        },
      });
    } catch (registerError) {
      if (registerError.status === 400) {
        throw new ApiError(
          `Tài khoản ${account.email} đã tồn tại nhưng không đăng nhập được bằng mật khẩu demo. ` +
            `Đặt DEMO_PASSWORD khớp mật khẩu hiện tại hoặc dùng email demo khác. ` +
            `(${registerError.message})`,
        );
      }
      throw registerError;
    }

    const token = await login(account.email, DEMO_PASSWORD);
    return { token, created: true };
  }
}

async function tryAdminToken() {
  try {
    return await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  } catch (error) {
    warnings.push(`Không đăng nhập được admin (${ADMIN_EMAIL}): ${error.message}`);
    return null;
  }
}

async function ensureShop(seller, token) {
  try {
    const data = await api("/shops/me", { token });
    return { shop: data.result, created: false };
  } catch (error) {
    if (error.status !== 404 && error.code !== 1050) throw error;
    const data = await api("/shops", { method: "POST", token, body: seller.shop });
    return { shop: data.result, created: true };
  }
}

function approveShopViaSql(shopId) {
  const sql =
    `UPDATE shops SET status='APPROVED', status_note=NULL, ` +
    `reviewed_at=COALESCE(reviewed_at, NOW()) WHERE id=${Number(shopId)};`;
  const args = ["exec", MYSQL_CONTAINER, "mysql", "-uroot"];
  if (MYSQL_ROOT_PASSWORD) args.push(`-p${MYSQL_ROOT_PASSWORD}`);
  args.push(MYSQL_DATABASE, "-e", sql);

  const result = spawnSync("docker", args, { encoding: "utf8" });
  if (result.error) {
    throw new Error(`Không chạy được docker để duyệt shop #${shopId}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`Duyệt shop #${shopId} bằng SQL thất bại: ${(result.stderr || "").trim()}`);
  }
}

async function ensureApprovedShop(shop, token, adminToken) {
  if (shop.status === "APPROVED") return { shop, method: "đã duyệt trước đó" };

  if (adminToken) {
    try {
      const data = await api(`/admin/shops/${shop.id}/status`, {
        method: "PATCH",
        token: adminToken,
        body: { status: "APPROVED" },
      });
      return { shop: data.result, method: "API Admin" };
    } catch (error) {
      warnings.push(
        `API Admin không duyệt được shop #${shop.id} (${error.status ?? "?"} ${error.message}). ` +
          `Chuyển sang SQL local.`,
      );
    }
  }

  approveShopViaSql(shop.id);
  const data = await api("/shops/me", { token });
  return { shop: data.result, method: "SQL local (dev)" };
}

async function loadCategories() {
  const data = await api("/categories/flat");
  const byName = new Map();
  for (const category of data.result ?? []) {
    if (!byName.has(category.name)) byName.set(category.name, category);
  }
  return byName;
}

function requireCategory(categories, name) {
  const category = categories.get(name);
  if (!category) {
    throw new Error(`Không tìm thấy danh mục "${name}". Hãy khởi động backend để seed danh mục trước.`);
  }
  return category;
}

async function findProduct(token, name) {
  const params = new URLSearchParams({ q: name, size: "50" });
  const data = await api(`/seller/products?${params}`, { token });
  return (data.result?.items ?? []).find((product) => product.name === name) ?? null;
}

function variantBody(variant, imageUrl = null) {
  return {
    sku: variant.sku,
    attributes: variant.attributes,
    priceMinor: variant.priceMinor,
    stockQuantity: variant.stockQuantity,
    imageUrl,
  };
}

async function hasUnreachableImage(images) {
  if (!images.length || !API_ORIGIN) return false;

  for (const image of images) {
    const url = image.url?.startsWith("http") ? image.url : `${API_ORIGIN}${image.url ?? ""}`;
    try {
      const response = await fetch(url);
      if (!response.ok) return true;
    } catch {
      return true;
    }
  }
  return false;
}

async function ensureProduct(token, productDef, categories) {
  const category = requireCategory(categories, productDef.category);
  let product = await findProduct(token, productDef.name);
  let action = "giữ nguyên";
  let variantsAdded = 0;
  let variantsUpdated = 0;

  if (!product) {
    const data = await api("/seller/products", {
      method: "POST",
      token,
      body: {
        name: productDef.name,
        description: productDef.description,
        categoryId: String(category.id),
        variants: productDef.variants.map((variant) => variantBody(variant)),
      },
    });
    product = data.result;
    action = "tạo mới";
    variantsAdded = productDef.variants.length;
  } else {
    await api(`/seller/products/${product.id}`, {
      method: "PUT",
      token,
      body: {
        name: productDef.name,
        description: productDef.description,
        categoryId: String(category.id),
      },
    });
    product = (await api(`/seller/products/${product.id}`, { token })).result;

    for (const variant of productDef.variants) {
      const existing = (product.variants ?? []).find((item) => item.sku === variant.sku);
      if (existing) {
        await api(`/seller/products/${product.id}/variants/${existing.id}`, {
          method: "PUT",
          token,
          body: variantBody(variant, existing.imageUrl),
        });
        variantsUpdated += 1;
      } else {
        await api(`/seller/products/${product.id}/variants`, {
          method: "POST",
          token,
          body: variantBody(variant),
        });
        variantsAdded += 1;
      }
    }
  }

  product = (await api(`/seller/products/${product.id}`, { token })).result;
  let imageUploaded = false;
  const images = product.images ?? [];
  const needsImage = images.length === 0 || await hasUnreachableImage(images);
  if (needsImage) {
    // File upload bị xoá nhưng DB vẫn còn bản ghi: xoá bản ghi cũ rồi upload lại.
    for (const image of images) {
      await api(`/seller/products/${product.id}/images/${image.id}`, { method: "DELETE", token });
    }
    const png = createDemoPng(productDef.theme);
    const form = new FormData();
    form.append("file", new Blob([png], { type: "image/png" }), `demo-${slugify(productDef.name)}.png`);
    await api(`/seller/products/${product.id}/images`, { method: "POST", token, form });
    product = (await api(`/seller/products/${product.id}`, { token })).result;
    imageUploaded = true;
  }

  return { product, action, variantsAdded, variantsUpdated, imageUploaded };
}

async function ensureAddress(token) {
  const data = await api("/addresses", { token });
  const existing = (data.result ?? []).find((address) => address.defaultAddress) ?? data.result?.[0];
  if (existing) return { address: existing, created: false };

  const created = await api("/addresses", { method: "POST", token, body: BUYER.address });
  return { address: created.result, created: true };
}

// ---------------------------------------------------------------- PNG generator

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuffer = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function createDemoPng(theme, size = 800) {
  const [from, to] = theme;
  const image = Buffer.alloc((size * 3 + 1) * size);
  let offset = 0;

  for (let y = 0; y < size; y += 1) {
    image[offset] = 0; // filter: none
    offset += 1;
    for (let x = 0; x < size; x += 1) {
      const t = (x / size) * 0.6 + (y / size) * 0.4;
      let r = from[0] + (to[0] - from[0]) * t;
      let g = from[1] + (to[1] - from[1]) * t;
      let b = from[2] + (to[2] - from[2]) * t;

      // Vệt chéo mờ
      const stripe = (x + y + 120) % 260;
      if (stripe < 46) {
        r += (255 - r) * 0.16;
        g += (255 - g) * 0.16;
        b += (255 - b) * 0.16;
      }

      // Hai vòng tròn trang trí
      const dx1 = x - 560;
      const dy1 = y - 250;
      if (dx1 * dx1 + dy1 * dy1 < 190 * 190) {
        r = r * 0.7 + 255 * 0.3;
        g = g * 0.7 + 255 * 0.3;
        b = b * 0.7 + 255 * 0.3;
      }
      const dx2 = x - 190;
      const dy2 = y - 590;
      if (dx2 * dx2 + dy2 * dy2 < 150 * 150) {
        r *= 0.82;
        g *= 0.82;
        b *= 0.82;
      }

      image[offset] = Math.max(0, Math.min(255, Math.round(r)));
      image[offset + 1] = Math.max(0, Math.min(255, Math.round(g)));
      image[offset + 2] = Math.max(0, Math.min(255, Math.round(b)));
      offset += 3;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // RGB
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(image, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// ---------------------------------------------------------------- main

async function main() {
  console.log(`Seed dữ liệu mẫu vào ${API_BASE}`);

  // Kiểm tra backend + danh mục trước khi tạo dữ liệu.
  const categories = await loadCategories();
  if (categories.size === 0) throw new Error("Chưa có danh mục nào. Hãy khởi động backend để seed danh mục.");

  const adminToken = await tryAdminToken();
  const summary = { sellers: [], buyer: null };

  for (const seller of SELLERS) {
    const account = await ensureAccount(seller);
    const shopResult = await ensureShop(seller, account.token);
    const approval = await ensureApprovedShop(shopResult.shop, account.token, adminToken);
    const shop = approval.shop;

    const shopLine = {
      email: seller.email,
      accountCreated: account.created,
      shopId: shop.id,
      shopName: shop.name,
      shopStatus: shop.status,
      shopCreated: shopResult.created,
      approvedBy: approval.method,
      products: [],
    };

    for (const productDef of seller.products) {
      const result = await ensureProduct(account.token, productDef, categories);
      shopLine.products.push({
        id: result.product.id,
        name: result.product.name,
        action: result.action,
        variantsAdded: result.variantsAdded,
        variantsUpdated: result.variantsUpdated,
        imageUploaded: result.imageUploaded,
        imageCount: (result.product.images ?? []).length,
        imageUrl: result.product.images?.[0]?.url ?? null,
        priceFrom: Math.min(...result.product.variants.map((variant) => variant.priceMinor)),
        stock: result.product.variants.reduce((sum, variant) => sum + variant.stockQuantity, 0),
      });
    }

    summary.sellers.push(shopLine);
    console.log(
      `✓ ${seller.email} — shop #${shop.id} "${shop.name}" [${shop.status}] ` +
        `(${shopResult.created ? "tạo mới" : "đã có"}, duyệt: ${approval.method})`,
    );
    for (const product of shopLine.products) {
      console.log(
        `  • #${product.id} ${product.name} — ${product.action}, ` +
          `${product.variantsAdded} variant thêm, ${product.variantsUpdated} variant cập nhật, ` +
          `${product.imageCount} ảnh${product.imageUploaded ? " (vừa upload)" : ""}`,
      );
    }
  }

  const buyer = await ensureAccount(BUYER);
  const address = await ensureAddress(buyer.token);
  summary.buyer = {
    email: BUYER.email,
    accountCreated: buyer.created,
    addressId: address.address.id,
    address: address.address.fullAddress,
    addressCreated: address.created,
  };
  console.log(
    `✓ ${BUYER.email} — địa chỉ #${address.address.id} [${address.address.defaultAddress ? "mặc định" : "không mặc định"}] ` +
      `(${address.created ? "tạo mới" : "đã có"})`,
  );

  if (warnings.length > 0) {
    console.log("\nCảnh báo:");
    for (const warning of warnings) console.log(`  ! ${warning}`);
  }

  console.log("\n=== Seed hoàn tất ===");
  console.log(`Tài khoản demo (mật khẩu chung: ${DEMO_PASSWORD})`);
  for (const seller of SELLERS) console.log(`  Seller: ${seller.email}`);
  console.log(`  Buyer : ${BUYER.email}`);
  console.log(`  Admin : ${ADMIN_EMAIL} (mật khẩu lấy từ ADMIN_PASSWORD)`);
  console.log("\nMở http://localhost:5173 để xem sản phẩm mẫu, hoặc đăng nhập buyer để thử checkout nhiều shop.");
  return summary;
}

main()
  .then((summary) => {
    if (process.env.SEED_JSON === "1") console.log(JSON.stringify(summary, null, 2));
  })
  .catch((error) => {
    console.error(`\nSeed thất bại: ${error.message}`);
    process.exitCode = 1;
  });
