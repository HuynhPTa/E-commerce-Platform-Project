-- ============================================================================
-- MarketHub - seed du lieu demo day du (idempotent, khong xoa du lieu cu)
--
-- Chay sau khi backend da migrate DB:
--   docker cp Backend/src/main/resources/db/seed/demo-seed.sql ecommerce-mysql:/tmp/demo-seed.sql
--   docker exec ecommerce-mysql mysql -uroot --default-character-set=utf8mb4 ecommerce_db -e "source /tmp/demo-seed.sql"
--
-- Script nay:
--   - tao/reuse 7 tai khoan demo (mat khau Demo@123, admin Admin@123)
--   - tao/reuse 4 shop: 3 APPROVED + 1 PENDING
--   - them 6 san pham moi (2 san pham/shop), moi san pham 2 bien the
--   - them gio hang 3 shop cho buyer.demo
--   - them 9 don cho buyer.demo + 1 don cho buyer2.demo, du 6 trang thai
--   - them payment VNPAY/MOMO: PENDING / SUCCEEDED / FAILED
--   - them review cho don COMPLETED, tinh lai rating_avg/rating_count/sold_count
--
-- Khong dung DELETE/TRUNCATE. Chay lai nhieu lan khong nhan doi du lieu.
-- ============================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- 1. Tai khoan demo
--    Hash duoi day la BCrypt cua mat khau demo da cong bo trong README.
--    INSERT ... WHERE NOT EXISTS de khong ghi de tai khoan da co.
-- ---------------------------------------------------------------------------
INSERT INTO user (id, email, password, first_name, last_name, phone, date_of_birth, avatar, status, is_delete, is_admin, role)
SELECT 1001, 'admin@markethub.vn', '$2b$10$g9.YmNcfQx7ihsuvpr8yfOYLInQBf9ihqNL4W2xGIRwWPanM3lUYS',
       'Admin', 'MarketHub', '0900000001', NULL, 'default-avatar.png', 1, 0, 1, 'ADMIN'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM user WHERE email = 'admin@markethub.vn' AND is_delete = 0);

INSERT INTO user (id, email, password, first_name, last_name, phone, date_of_birth, avatar, status, is_delete, is_admin, role)
SELECT 1002, 'buyer.demo@markethub.vn', '$2b$10$zzMLsCx.kUgZz.OVBNxt2eKaZkjNYRx.Zc1JNrDqIzvyQurvGEify',
       'An', 'Võ', '0934567890', NULL, 'default-avatar.png', 1, 0, 0, 'USER'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM user WHERE email = 'buyer.demo@markethub.vn' AND is_delete = 0);

INSERT INTO user (id, email, password, first_name, last_name, phone, date_of_birth, avatar, status, is_delete, is_admin, role)
SELECT 1003, 'seller.demo@markethub.vn', '$2b$10$zzMLsCx.kUgZz.OVBNxt2eKaZkjNYRx.Zc1JNrDqIzvyQurvGEify',
       'Minh', 'Nguyễn', '0901111222', NULL, 'default-avatar.png', 1, 0, 0, 'USER'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM user WHERE email = 'seller.demo@markethub.vn' AND is_delete = 0);

INSERT INTO user (id, email, password, first_name, last_name, phone, date_of_birth, avatar, status, is_delete, is_admin, role)
SELECT 1004, 'seller.style@markethub.vn', '$2b$10$zzMLsCx.kUgZz.OVBNxt2eKaZkjNYRx.Zc1JNrDqIzvyQurvGEify',
       'Lan', 'Phạm', '0902222333', NULL, 'default-avatar.png', 1, 0, 0, 'USER'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM user WHERE email = 'seller.style@markethub.vn' AND is_delete = 0);

INSERT INTO user (id, email, password, first_name, last_name, phone, date_of_birth, avatar, status, is_delete, is_admin, role)
SELECT 1005, 'seller.home@markethub.vn', '$2b$10$zzMLsCx.kUgZz.OVBNxt2eKaZkjNYRx.Zc1JNrDqIzvyQurvGEify',
       'Hùng', 'Trần', '0903333444', NULL, 'default-avatar.png', 1, 0, 0, 'USER'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM user WHERE email = 'seller.home@markethub.vn' AND is_delete = 0);

INSERT INTO user (id, email, password, first_name, last_name, phone, date_of_birth, avatar, status, is_delete, is_admin, role)
SELECT 1006, 'buyer2.demo@markethub.vn', '$2b$10$zzMLsCx.kUgZz.OVBNxt2eKaZkjNYRx.Zc1JNrDqIzvyQurvGEify',
       'Bình', 'Trần', '0912345678', NULL, 'default-avatar.png', 1, 0, 0, 'USER'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM user WHERE email = 'buyer2.demo@markethub.vn' AND is_delete = 0);

INSERT INTO user (id, email, password, first_name, last_name, phone, date_of_birth, avatar, status, is_delete, is_admin, role)
SELECT 1007, 'seller.pending@markethub.vn', '$2b$10$zzMLsCx.kUgZz.OVBNxt2eKaZkjNYRx.Zc1JNrDqIzvyQurvGEify',
       'Phúc', 'Lê', '0909876543', NULL, 'default-avatar.png', 1, 0, 0, 'USER'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM user WHERE email = 'seller.pending@markethub.vn' AND is_delete = 0);

SET @buyer := (SELECT id FROM user WHERE email = 'buyer.demo@markethub.vn' AND is_delete = 0 LIMIT 1);
SET @buyer2 := (SELECT id FROM user WHERE email = 'buyer2.demo@markethub.vn' AND is_delete = 0 LIMIT 1);
SET @seller_tech := (SELECT id FROM user WHERE email = 'seller.demo@markethub.vn' AND is_delete = 0 LIMIT 1);
SET @seller_fashion := (SELECT id FROM user WHERE email = 'seller.style@markethub.vn' AND is_delete = 0 LIMIT 1);
SET @seller_home := (SELECT id FROM user WHERE email = 'seller.home@markethub.vn' AND is_delete = 0 LIMIT 1);
SET @seller_pending := (SELECT id FROM user WHERE email = 'seller.pending@markethub.vn' AND is_delete = 0 LIMIT 1);

-- Hibernate dung bang sequence cho user/address, nang len de khong cap ID trung.
UPDATE user_seq SET next_val = GREATEST(next_val, 1100);
UPDATE address_seq SET next_val = GREATEST(next_val, 1100);

-- ---------------------------------------------------------------------------
-- 2. Dia chi
-- ---------------------------------------------------------------------------
INSERT INTO address (id, user_id, recipient_name, phone, full_address, is_default, created_at, updated_at)
SELECT 1001, @buyer2, 'Trần Thị Bình', '0912345678',
       '45 Nguyễn Thị Minh Khai, Phường Đa Kao, Quận 1, TP.HCM', 1, NOW(), NOW()
FROM DUAL
WHERE @buyer2 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM address WHERE user_id = @buyer2 AND recipient_name = 'Trần Thị Bình');

INSERT INTO address (id, user_id, recipient_name, phone, full_address, is_default, created_at, updated_at)
SELECT 1002, @buyer, 'An Võ (Văn phòng)', '0934567890',
       'Tòa nhà Bitexco, 2 Hải Triều, Phường Bến Nghé, Quận 1, TP.HCM', 0, NOW(), NOW()
FROM DUAL
WHERE @buyer IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM address WHERE user_id = @buyer AND recipient_name = 'An Võ (Văn phòng)');

-- ---------------------------------------------------------------------------
-- 3. Shop demo (3 APPROVED + 1 PENDING)
-- ---------------------------------------------------------------------------
INSERT INTO shops (id, user_id, name, description, logo_url, phone, pickup_address, status, status_note, reviewed_at, created_at, updated_at)
SELECT 1001, @seller_tech, 'MarketHub Demo - Công nghệ',
       'Thiết bị công nghệ, phụ kiện chính hãng cho học tập và làm việc.',
       NULL, '0901111222', '12 Nguyễn Huệ, Quận 1, TP.HCM', 'APPROVED', NULL, NOW(), NOW(), NOW()
FROM DUAL
WHERE @seller_tech IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM shops WHERE name = 'MarketHub Demo - Công nghệ')
  AND NOT EXISTS (SELECT 1 FROM shops WHERE user_id = @seller_tech);

INSERT INTO shops (id, user_id, name, description, logo_url, phone, pickup_address, status, status_note, reviewed_at, created_at, updated_at)
SELECT 1002, @seller_fashion, 'MarketHub Demo - Thời trang',
       'Quần áo, giày dép và phụ kiện thời trang nam nữ.',
       NULL, '0902222333', '45 Lê Lợi, Quận 1, TP.HCM', 'APPROVED', NULL, NOW(), NOW(), NOW()
FROM DUAL
WHERE @seller_fashion IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM shops WHERE name = 'MarketHub Demo - Thời trang')
  AND NOT EXISTS (SELECT 1 FROM shops WHERE user_id = @seller_fashion);

INSERT INTO shops (id, user_id, name, description, logo_url, phone, pickup_address, status, status_note, reviewed_at, created_at, updated_at)
SELECT 1003, @seller_home, 'MarketHub Demo - Nhà cửa',
       'Đồ dùng nhà bếp, trang trí và đồ gia dụng tiện ích.',
       NULL, '0903333444', '88 Võ Văn Tần, Quận 3, TP.HCM', 'APPROVED', NULL, NOW(), NOW(), NOW()
FROM DUAL
WHERE @seller_home IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM shops WHERE name = 'MarketHub Demo - Nhà cửa')
  AND NOT EXISTS (SELECT 1 FROM shops WHERE user_id = @seller_home);

INSERT INTO shops (id, user_id, name, description, logo_url, phone, pickup_address, status, status_note, reviewed_at, created_at, updated_at)
SELECT 1004, @seller_pending, 'MarketHub Seed - Shop chờ duyệt',
       'Shop moi dang ky, dung de test luong Admin duyet/tu choi.',
       NULL, '0909876543', '25 Pasteur, Quận 1, TP.HCM', 'PENDING', NULL, NULL, NOW(), NOW()
FROM DUAL
WHERE @seller_pending IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM shops WHERE name = 'MarketHub Seed - Shop chờ duyệt')
  AND NOT EXISTS (SELECT 1 FROM shops WHERE user_id = @seller_pending);

SET @shop_tech := (SELECT id FROM shops WHERE name = 'MarketHub Demo - Công nghệ' LIMIT 1);
SET @shop_fashion := (SELECT id FROM shops WHERE name = 'MarketHub Demo - Thời trang' LIMIT 1);
SET @shop_home := (SELECT id FROM shops WHERE name = 'MarketHub Demo - Nhà cửa' LIMIT 1);

-- ---------------------------------------------------------------------------
-- 4. San pham moi: 2 san pham/shop, moi san pham 2 bien the
-- ---------------------------------------------------------------------------
INSERT INTO products (id, name, description, category_id, shop_id, shop_name, thumbnail_url, rating_avg, rating_count, sold_count, status, created_at)
SELECT 1001, 'Chuột không dây MarketHub Silent',
       'Chuột không dây chống ồn, kết nối Bluetooth 5.2 và USB receiver, pin dùng 6 tháng.',
       '9', @shop_tech, 'MarketHub Demo - Công nghệ',
       '/uploads/product-images/a88ed6f8-4d86-46ac-9c2c-04b429d58090.png', 0, 0, 0, 'ACTIVE', NOW()
FROM DUAL
WHERE @shop_tech IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Chuột không dây MarketHub Silent');

INSERT INTO products (id, name, description, category_id, shop_id, shop_name, thumbnail_url, rating_avg, rating_count, sold_count, status, created_at)
SELECT 1002, 'Sạc dự phòng MarketHub 20.000mAh',
       'Sạc dự phòng 20.000mAh, sạc nhanh 22.5W, có màn hình hiển thị phần trăm pin.',
       '4', @shop_tech, 'MarketHub Demo - Công nghệ',
       '/uploads/product-images/c56bddde-64f0-479a-bc6f-9b2249fe8a0e.png', 0, 0, 0, 'ACTIVE', NOW()
FROM DUAL
WHERE @shop_tech IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Sạc dự phòng MarketHub 20.000mAh');

INSERT INTO products (id, name, description, category_id, shop_id, shop_name, thumbnail_url, rating_avg, rating_count, sold_count, status, created_at)
SELECT 1003, 'Quần jean MarketHub Slim',
       'Quần jean nam form slim, co giãn nhẹ, chất liệu cotton pha spandex.',
       '13', @shop_fashion, 'MarketHub Demo - Thời trang',
       '/uploads/product-images/67a5c92f-97f1-44ca-8c88-0185974319e5.png', 0, 0, 0, 'ACTIVE', NOW()
FROM DUAL
WHERE @shop_fashion IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Quần jean MarketHub Slim');

INSERT INTO products (id, name, description, category_id, shop_id, shop_name, thumbnail_url, rating_avg, rating_count, sold_count, status, created_at)
SELECT 1004, 'Áo khoác gió MarketHub',
       'Áo khoác gió chống nước nhẹ, có mũ, phù hợp đi làm và du lịch.',
       '14', @shop_fashion, 'MarketHub Demo - Thời trang',
       '/uploads/product-images/1b751a4c-abed-44e7-a20f-7491a2e11851.png', 0, 0, 0, 'ACTIVE', NOW()
FROM DUAL
WHERE @shop_fashion IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Áo khoác gió MarketHub');

INSERT INTO products (id, name, description, category_id, shop_id, shop_name, thumbnail_url, rating_avg, rating_count, sold_count, status, created_at)
SELECT 1005, 'Bình giữ nhiệt MarketHub 500ml',
       'Bình giữ nhiệt inox 304, giữ nóng 12 giờ, giữ lạnh 24 giờ, nắp chống rò rỉ.',
       '26', @shop_home, 'MarketHub Demo - Nhà cửa',
       '/uploads/product-images/fe69d60d-be11-4dd8-a031-95c35ac03334.png', 0, 0, 0, 'ACTIVE', NOW()
FROM DUAL
WHERE @shop_home IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Bình giữ nhiệt MarketHub 500ml');

INSERT INTO products (id, name, description, category_id, shop_id, shop_name, thumbnail_url, rating_avg, rating_count, sold_count, status, created_at)
SELECT 1006, 'Kệ gỗ treo tường MarketHub',
       'Kệ gỗ treo tường phong cách tối giản, chịu lực 10kg, phù hợp phòng khách và làm việc.',
       '25', @shop_home, 'MarketHub Demo - Nhà cửa',
       '/uploads/product-images/018bfc69-9ae2-40be-8ad2-430d7af523ab.png', 0, 0, 0, 'ACTIVE', NOW()
FROM DUAL
WHERE @shop_home IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Kệ gỗ treo tường MarketHub');

SET @p_mouse := (SELECT id FROM products WHERE name = 'Chuột không dây MarketHub Silent' LIMIT 1);
SET @p_power := (SELECT id FROM products WHERE name = 'Sạc dự phòng MarketHub 20.000mAh' LIMIT 1);
SET @p_jean := (SELECT id FROM products WHERE name = 'Quần jean MarketHub Slim' LIMIT 1);
SET @p_jacket := (SELECT id FROM products WHERE name = 'Áo khoác gió MarketHub' LIMIT 1);
SET @p_bottle := (SELECT id FROM products WHERE name = 'Bình giữ nhiệt MarketHub 500ml' LIMIT 1);
SET @p_shelf := (SELECT id FROM products WHERE name = 'Kệ gỗ treo tường MarketHub' LIMIT 1);

INSERT INTO product_variants (id, product_id, sku, attributes, price_minor, stock_quantity, image_url)
SELECT 1001, @p_mouse, 'SEED-TECH-MOUSE-BLACK', JSON_OBJECT('color', 'Đen'), 299000, 25,
       '/uploads/product-images/a88ed6f8-4d86-46ac-9c2c-04b429d58090.png'
FROM DUAL WHERE @p_mouse IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM product_variants WHERE sku = 'SEED-TECH-MOUSE-BLACK');

INSERT INTO product_variants (id, product_id, sku, attributes, price_minor, stock_quantity, image_url)
SELECT 1002, @p_mouse, 'SEED-TECH-MOUSE-WHITE', JSON_OBJECT('color', 'Trắng'), 319000, 18,
       '/uploads/product-images/a88ed6f8-4d86-46ac-9c2c-04b429d58090.png'
FROM DUAL WHERE @p_mouse IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM product_variants WHERE sku = 'SEED-TECH-MOUSE-WHITE');

INSERT INTO product_variants (id, product_id, sku, attributes, price_minor, stock_quantity, image_url)
SELECT 1003, @p_power, 'SEED-TECH-POWER-BLACK', JSON_OBJECT('color', 'Đen'), 399000, 30,
       '/uploads/product-images/c56bddde-64f0-479a-bc6f-9b2249fe8a0e.png'
FROM DUAL WHERE @p_power IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM product_variants WHERE sku = 'SEED-TECH-POWER-BLACK');

INSERT INTO product_variants (id, product_id, sku, attributes, price_minor, stock_quantity, image_url)
SELECT 1004, @p_power, 'SEED-TECH-POWER-WHITE', JSON_OBJECT('color', 'Trắng'), 419000, 20,
       '/uploads/product-images/c56bddde-64f0-479a-bc6f-9b2249fe8a0e.png'
FROM DUAL WHERE @p_power IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM product_variants WHERE sku = 'SEED-TECH-POWER-WHITE');

INSERT INTO product_variants (id, product_id, sku, attributes, price_minor, stock_quantity, image_url)
SELECT 1005, @p_jean, 'SEED-FASHION-JEAN-30', JSON_OBJECT('size', '30', 'color', 'Xanh'), 499000, 15,
       '/uploads/product-images/67a5c92f-97f1-44ca-8c88-0185974319e5.png'
FROM DUAL WHERE @p_jean IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM product_variants WHERE sku = 'SEED-FASHION-JEAN-30');

INSERT INTO product_variants (id, product_id, sku, attributes, price_minor, stock_quantity, image_url)
SELECT 1006, @p_jean, 'SEED-FASHION-JEAN-31', JSON_OBJECT('size', '31', 'color', 'Xanh'), 499000, 12,
       '/uploads/product-images/67a5c92f-97f1-44ca-8c88-0185974319e5.png'
FROM DUAL WHERE @p_jean IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM product_variants WHERE sku = 'SEED-FASHION-JEAN-31');

INSERT INTO product_variants (id, product_id, sku, attributes, price_minor, stock_quantity, image_url)
SELECT 1007, @p_jacket, 'SEED-FASHION-JACKET-M', JSON_OBJECT('size', 'M', 'color', 'Đen'), 599000, 14,
       '/uploads/product-images/1b751a4c-abed-44e7-a20f-7491a2e11851.png'
FROM DUAL WHERE @p_jacket IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM product_variants WHERE sku = 'SEED-FASHION-JACKET-M');

INSERT INTO product_variants (id, product_id, sku, attributes, price_minor, stock_quantity, image_url)
SELECT 1008, @p_jacket, 'SEED-FASHION-JACKET-L', JSON_OBJECT('size', 'L', 'color', 'Đen'), 619000, 10,
       '/uploads/product-images/1b751a4c-abed-44e7-a20f-7491a2e11851.png'
FROM DUAL WHERE @p_jacket IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM product_variants WHERE sku = 'SEED-FASHION-JACKET-L');

INSERT INTO product_variants (id, product_id, sku, attributes, price_minor, stock_quantity, image_url)
SELECT 1009, @p_bottle, 'SEED-HOME-BOTTLE-SILVER', JSON_OBJECT('color', 'Bạc'), 259000, 22,
       '/uploads/product-images/fe69d60d-be11-4dd8-a031-95c35ac03334.png'
FROM DUAL WHERE @p_bottle IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM product_variants WHERE sku = 'SEED-HOME-BOTTLE-SILVER');

INSERT INTO product_variants (id, product_id, sku, attributes, price_minor, stock_quantity, image_url)
SELECT 1010, @p_bottle, 'SEED-HOME-BOTTLE-BLACK', JSON_OBJECT('color', 'Đen'), 279000, 16,
       '/uploads/product-images/fe69d60d-be11-4dd8-a031-95c35ac03334.png'
FROM DUAL WHERE @p_bottle IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM product_variants WHERE sku = 'SEED-HOME-BOTTLE-BLACK');

INSERT INTO product_variants (id, product_id, sku, attributes, price_minor, stock_quantity, image_url)
SELECT 1011, @p_shelf, 'SEED-HOME-SHELF-40', JSON_OBJECT('size', '40cm'), 349000, 10,
       '/uploads/product-images/018bfc69-9ae2-40be-8ad2-430d7af523ab.png'
FROM DUAL WHERE @p_shelf IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM product_variants WHERE sku = 'SEED-HOME-SHELF-40');

INSERT INTO product_variants (id, product_id, sku, attributes, price_minor, stock_quantity, image_url)
SELECT 1012, @p_shelf, 'SEED-HOME-SHELF-60', JSON_OBJECT('size', '60cm'), 449000, 8,
       '/uploads/product-images/018bfc69-9ae2-40be-8ad2-430d7af523ab.png'
FROM DUAL WHERE @p_shelf IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM product_variants WHERE sku = 'SEED-HOME-SHELF-60');

SET @v_mouse_black := (SELECT id FROM product_variants WHERE sku = 'SEED-TECH-MOUSE-BLACK' LIMIT 1);
SET @v_mouse_white := (SELECT id FROM product_variants WHERE sku = 'SEED-TECH-MOUSE-WHITE' LIMIT 1);
SET @v_power_black := (SELECT id FROM product_variants WHERE sku = 'SEED-TECH-POWER-BLACK' LIMIT 1);
SET @v_jean_30 := (SELECT id FROM product_variants WHERE sku = 'SEED-FASHION-JEAN-30' LIMIT 1);
SET @v_jacket_m := (SELECT id FROM product_variants WHERE sku = 'SEED-FASHION-JACKET-M' LIMIT 1);
SET @v_bottle_silver := (SELECT id FROM product_variants WHERE sku = 'SEED-HOME-BOTTLE-SILVER' LIMIT 1);
SET @v_shelf_60 := (SELECT id FROM product_variants WHERE sku = 'SEED-HOME-SHELF-60' LIMIT 1);

INSERT INTO product_images (product_id, url, sort_order, created_at)
SELECT @p_mouse, '/uploads/product-images/a88ed6f8-4d86-46ac-9c2c-04b429d58090.png', 0, NOW()
FROM DUAL WHERE @p_mouse IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = @p_mouse);

INSERT INTO product_images (product_id, url, sort_order, created_at)
SELECT @p_power, '/uploads/product-images/c56bddde-64f0-479a-bc6f-9b2249fe8a0e.png', 0, NOW()
FROM DUAL WHERE @p_power IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = @p_power);

INSERT INTO product_images (product_id, url, sort_order, created_at)
SELECT @p_jean, '/uploads/product-images/67a5c92f-97f1-44ca-8c88-0185974319e5.png', 0, NOW()
FROM DUAL WHERE @p_jean IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = @p_jean);

INSERT INTO product_images (product_id, url, sort_order, created_at)
SELECT @p_jacket, '/uploads/product-images/1b751a4c-abed-44e7-a20f-7491a2e11851.png', 0, NOW()
FROM DUAL WHERE @p_jacket IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = @p_jacket);

INSERT INTO product_images (product_id, url, sort_order, created_at)
SELECT @p_bottle, '/uploads/product-images/fe69d60d-be11-4dd8-a031-95c35ac03334.png', 0, NOW()
FROM DUAL WHERE @p_bottle IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = @p_bottle);

INSERT INTO product_images (product_id, url, sort_order, created_at)
SELECT @p_shelf, '/uploads/product-images/018bfc69-9ae2-40be-8ad2-430d7af523ab.png', 0, NOW()
FROM DUAL WHERE @p_shelf IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = @p_shelf);

-- ---------------------------------------------------------------------------
-- 5. Gio hang 3 shop cho buyer.demo (du de test checkout nhieu shop)
-- ---------------------------------------------------------------------------
INSERT INTO cart_items (user_id, variant_id, quantity, created_at, updated_at)
VALUES
    (@buyer, @v_mouse_black, 1, NOW(), NOW()),
    (@buyer, @v_jean_30, 1, NOW(), NOW()),
    (@buyer, @v_bottle_silver, 2, NOW(), NOW())
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), updated_at = VALUES(updated_at);

-- ---------------------------------------------------------------------------
-- 6. Don hang cua buyer.demo: du 6 trang thai + 1 session 2 shop
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO checkout_sessions (id, buyer_id, status, payment_method, total_amount_minor, created_at, updated_at) VALUES
(1001, @buyer, 'PENDING', 'VNPAY', 299000, NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 2 HOUR),
(1002, @buyer, 'PAID',    'MOMO',  499000, NOW() - INTERVAL 1 DAY,  NOW() - INTERVAL 1 DAY),
(1003, @buyer, 'PAID',    'VNPAY', 259000, NOW() - INTERVAL 2 DAY,  NOW() - INTERVAL 2 DAY),
(1004, @buyer, 'PAID',    'MOMO',  399000, NOW() - INTERVAL 3 DAY,  NOW() - INTERVAL 3 DAY),
(1005, @buyer, 'PAID',    'VNPAY', 599000, NOW() - INTERVAL 5 DAY,  NOW() - INTERVAL 5 DAY),
(1006, @buyer, 'PAID',    'MOMO',  449000, NOW() - INTERVAL 6 DAY,  NOW() - INTERVAL 6 DAY),
(1007, @buyer, 'FAILED',  'VNPAY', 319000, NOW() - INTERVAL 7 DAY,  NOW() - INTERVAL 7 DAY),
(1008, @buyer, 'PAID',    'VNPAY', 798000, NOW() - INTERVAL 1 DAY,  NOW() - INTERVAL 1 DAY),
(1009, @buyer2, 'PENDING', 'VNPAY', 499000, NOW() - INTERVAL 3 DAY,  NOW() - INTERVAL 3 DAY);

INSERT IGNORE INTO orders (id, checkout_session_id, buyer_id, shop_id, status, shipping_address_snapshot, subtotal_minor, shipping_fee_minor, total_minor, created_at, updated_at) VALUES
(1001, 1001, @buyer, @shop_tech, 'PENDING',
 JSON_OBJECT('recipientName', 'An Võ', 'phone', '0934567890', 'fullAddress', '99 Trần Hưng Đạo, Phường 7, Quận 5, TP.HCM', 'seedKey', 'demo-v1'),
 299000, 0, 299000, NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 2 HOUR),
(1002, 1002, @buyer, @shop_fashion, 'CONFIRMED',
 JSON_OBJECT('recipientName', 'An Võ', 'phone', '0934567890', 'fullAddress', '99 Trần Hưng Đạo, Phường 7, Quận 5, TP.HCM', 'seedKey', 'demo-v1'),
 499000, 0, 499000, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),
(1003, 1003, @buyer, @shop_home, 'SHIPPING',
 JSON_OBJECT('recipientName', 'An Võ', 'phone', '0934567890', 'fullAddress', '99 Trần Hưng Đạo, Phường 7, Quận 5, TP.HCM', 'seedKey', 'demo-v1'),
 259000, 0, 259000, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),
(1004, 1004, @buyer, @shop_tech, 'DELIVERED',
 JSON_OBJECT('recipientName', 'An Võ', 'phone', '0934567890', 'fullAddress', '99 Trần Hưng Đạo, Phường 7, Quận 5, TP.HCM', 'seedKey', 'demo-v1'),
 399000, 0, 399000, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY),
(1005, 1005, @buyer, @shop_fashion, 'COMPLETED',
 JSON_OBJECT('recipientName', 'An Võ', 'phone', '0934567890', 'fullAddress', '99 Trần Hưng Đạo, Phường 7, Quận 5, TP.HCM', 'seedKey', 'demo-v1'),
 599000, 0, 599000, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY),
(1006, 1006, @buyer, @shop_home, 'COMPLETED',
 JSON_OBJECT('recipientName', 'An Võ', 'phone', '0934567890', 'fullAddress', '99 Trần Hưng Đạo, Phường 7, Quận 5, TP.HCM', 'seedKey', 'demo-v1'),
 449000, 0, 449000, NOW() - INTERVAL 6 DAY, NOW() - INTERVAL 6 DAY),
(1007, 1007, @buyer, @shop_tech, 'CANCELLED',
 JSON_OBJECT('recipientName', 'An Võ', 'phone', '0934567890', 'fullAddress', '99 Trần Hưng Đạo, Phường 7, Quận 5, TP.HCM', 'seedKey', 'demo-v1'),
 319000, 0, 319000, NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 7 DAY),
(1008, 1008, @buyer, @shop_tech, 'CONFIRMED',
 JSON_OBJECT('recipientName', 'An Võ', 'phone', '0934567890', 'fullAddress', '99 Trần Hưng Đạo, Phường 7, Quận 5, TP.HCM', 'seedKey', 'demo-v1'),
 299000, 0, 299000, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),
(1009, 1008, @buyer, @shop_fashion, 'CONFIRMED',
 JSON_OBJECT('recipientName', 'An Võ', 'phone', '0934567890', 'fullAddress', '99 Trần Hưng Đạo, Phường 7, Quận 5, TP.HCM', 'seedKey', 'demo-v1'),
 499000, 0, 499000, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),
(1010, 1009, @buyer2, @shop_fashion, 'PENDING',
 JSON_OBJECT('recipientName', 'Trần Thị Bình', 'phone', '0912345678', 'fullAddress', '45 Nguyễn Thị Minh Khai, Phường Đa Kao, Quận 1, TP.HCM', 'seedKey', 'demo-v1'),
 499000, 0, 499000, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY);

INSERT IGNORE INTO order_items (id, order_id, variant_id, product_name_snapshot, variant_attributes_snapshot, unit_price_minor, quantity, subtotal_minor) VALUES
(1001, 1001, @v_mouse_black, 'Chuột không dây MarketHub Silent', JSON_OBJECT('color', 'Đen'), 299000, 1, 299000),
(1002, 1002, @v_jean_30, 'Quần jean MarketHub Slim', JSON_OBJECT('size', '30', 'color', 'Xanh'), 499000, 1, 499000),
(1003, 1003, @v_bottle_silver, 'Bình giữ nhiệt MarketHub 500ml', JSON_OBJECT('color', 'Bạc'), 259000, 1, 259000),
(1004, 1004, @v_power_black, 'Sạc dự phòng MarketHub 20.000mAh', JSON_OBJECT('color', 'Đen'), 399000, 1, 399000),
(1005, 1005, @v_jacket_m, 'Áo khoác gió MarketHub', JSON_OBJECT('size', 'M', 'color', 'Đen'), 599000, 1, 599000),
(1006, 1006, @v_shelf_60, 'Kệ gỗ treo tường MarketHub', JSON_OBJECT('size', '60cm'), 449000, 1, 449000),
(1007, 1007, @v_mouse_white, 'Chuột không dây MarketHub Silent', JSON_OBJECT('color', 'Trắng'), 319000, 1, 319000),
(1008, 1008, @v_mouse_black, 'Chuột không dây MarketHub Silent', JSON_OBJECT('color', 'Đen'), 299000, 1, 299000),
(1009, 1009, @v_jean_30, 'Quần jean MarketHub Slim', JSON_OBJECT('size', '30', 'color', 'Xanh'), 499000, 1, 499000),
(1010, 1010, @v_jean_30, 'Quần jean MarketHub Slim', JSON_OBJECT('size', '30', 'color', 'Xanh'), 499000, 1, 499000);

INSERT IGNORE INTO payments (id, checkout_session_id, provider, provider_transaction_id, amount_minor, status, paid_at, created_at) VALUES
(1001, 1001, 'VNPAY', NULL, 299000, 'PENDING', NULL, NOW() - INTERVAL 2 HOUR),
(1002, 1002, 'MOMO', 'SEED-MOMO-1002', 499000, 'SUCCEEDED', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),
(1003, 1003, 'VNPAY', 'SEED-VNPAY-1003', 259000, 'SUCCEEDED', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),
(1004, 1004, 'MOMO', 'SEED-MOMO-1004', 399000, 'SUCCEEDED', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY),
(1005, 1005, 'VNPAY', 'SEED-VNPAY-1005', 599000, 'SUCCEEDED', NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY),
(1006, 1006, 'MOMO', 'SEED-MOMO-1006', 449000, 'SUCCEEDED', NOW() - INTERVAL 6 DAY, NOW() - INTERVAL 6 DAY),
(1007, 1007, 'VNPAY', NULL, 319000, 'FAILED', NULL, NOW() - INTERVAL 7 DAY),
(1008, 1008, 'VNPAY', 'SEED-VNPAY-1008', 798000, 'SUCCEEDED', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),
(1009, 1009, 'VNPAY', NULL, 499000, 'PENDING', NULL, NOW() - INTERVAL 3 DAY);

-- Dong bo 2 don COMPLETED cu (46, 47) de trang chi tiet khong hien paymentStatus = null.
UPDATE checkout_sessions SET status = 'PAID', updated_at = NOW()
WHERE id IN (36, 37) AND status = 'PENDING';

INSERT INTO payments (id, checkout_session_id, provider, provider_transaction_id, amount_minor, status, paid_at, created_at)
SELECT 1010, cs.id, 'VNPAY', 'SEED-VNPAY-36', cs.total_amount_minor, 'SUCCEEDED', NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 10 DAY
FROM checkout_sessions cs
WHERE cs.id = 36 AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.checkout_session_id = 36);

INSERT INTO payments (id, checkout_session_id, provider, provider_transaction_id, amount_minor, status, paid_at, created_at)
SELECT 1011, cs.id, 'VNPAY', 'SEED-VNPAY-37', cs.total_amount_minor, 'SUCCEEDED', NOW() - INTERVAL 9 DAY, NOW() - INTERVAL 9 DAY
FROM checkout_sessions cs
WHERE cs.id = 37 AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.checkout_session_id = 37);

-- ---------------------------------------------------------------------------
-- 7. Review cho don COMPLETED (moi order_item 1 review)
-- ---------------------------------------------------------------------------
INSERT INTO reviews (id, order_item_id, order_id, user_id, product_id, rating, comment, created_at, updated_at)
SELECT 1001, oi.id, oi.order_id, @buyer, pv.product_id, 5,
       'Áo khoác nhẹ, đúng size, giao hàng nhanh. Sẽ mua lại.',
       NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 4 DAY
FROM order_items oi
JOIN product_variants pv ON pv.id = oi.variant_id
WHERE oi.id = 1005
  AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.order_item_id = 1005);

INSERT INTO reviews (id, order_item_id, order_id, user_id, product_id, rating, comment, created_at, updated_at)
SELECT 1002, oi.id, oi.order_id, @buyer, pv.product_id, 4,
       'Kệ chắc chắn, đóng gói tốt. Màu gỗ đẹp hơn ảnh.',
       NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY
FROM order_items oi
JOIN product_variants pv ON pv.id = oi.variant_id
WHERE oi.id = 1006
  AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.order_item_id = 1006);

INSERT INTO reviews (id, order_item_id, order_id, user_id, product_id, rating, comment, created_at, updated_at)
SELECT 1003, oi.id, 47, @buyer, 5, 5, 'Tai nghe chống ồn tốt, pin lâu, rất đáng tiền.', NOW() - INTERVAL 8 DAY, NOW() - INTERVAL 8 DAY
FROM order_items oi
JOIN product_variants pv ON pv.id = oi.variant_id
WHERE oi.order_id = 47 AND pv.product_id = 5
  AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.order_id = 47 AND r.product_id = 5)
LIMIT 1;

-- ---------------------------------------------------------------------------
-- 8. Tinh lai rating va sold_count tu du lieu that
-- ---------------------------------------------------------------------------
UPDATE products p
LEFT JOIN (
    SELECT product_id, AVG(rating) AS avg_rating, COUNT(*) AS cnt
    FROM reviews
    GROUP BY product_id
) r ON r.product_id = p.id
SET p.rating_avg = COALESCE(r.avg_rating, 0),
    p.rating_count = COALESCE(r.cnt, 0);

UPDATE products p
SET p.sold_count = (
    SELECT COALESCE(SUM(oi.quantity), 0)
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN product_variants pv ON pv.id = oi.variant_id
    WHERE o.status = 'COMPLETED' AND pv.product_id = p.id
);

-- ---------------------------------------------------------------------------
-- 9. Ket qua
-- ---------------------------------------------------------------------------
SELECT 'users_demo' AS entity, COUNT(*) AS total FROM user
WHERE email IN ('admin@markethub.vn','buyer.demo@markethub.vn','seller.demo@markethub.vn',
                'seller.style@markethub.vn','seller.home@markethub.vn','buyer2.demo@markethub.vn',
                'seller.pending@markethub.vn') AND is_delete = 0
UNION ALL
SELECT 'shops_demo', COUNT(*) FROM shops WHERE name LIKE 'MarketHub %'
UNION ALL
SELECT 'products_seed', COUNT(*) FROM products WHERE id BETWEEN 1001 AND 1006
UNION ALL
SELECT 'orders_buyer_demo', COUNT(*) FROM orders WHERE buyer_id = @buyer
UNION ALL
SELECT 'orders_buyer2_demo', COUNT(*) FROM orders WHERE buyer_id = @buyer2
UNION ALL
SELECT 'payments_seed', COUNT(*) FROM payments WHERE id BETWEEN 1001 AND 1011
UNION ALL
SELECT 'reviews_seed', COUNT(*) FROM reviews WHERE id BETWEEN 1001 AND 1003
UNION ALL
SELECT 'cart_buyer_demo', COUNT(*) FROM cart_items WHERE user_id = @buyer;
