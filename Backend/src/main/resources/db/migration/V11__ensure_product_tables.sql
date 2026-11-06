-- Công việc 8 (F19): bảo đảm products/product_variants tồn tại trước khi tạo index/trigger.
--
-- Trên database mới, Flyway chạy TRƯỚC Hibernate (ddl-auto=update) nên products và
-- product_variants chưa có. Trên database đang chạy, hai bảng này do Hibernate tạo;
-- CREATE TABLE IF NOT EXISTS sẽ không thay đổi schema hiện có.
CREATE TABLE IF NOT EXISTS products (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(200) NOT NULL,
    description   TEXT         NULL,
    category_id   VARCHAR(80)  NULL,
    shop_id       VARCHAR(80)  NULL,
    shop_name     VARCHAR(160) NULL,
    thumbnail_url VARCHAR(512) NULL,
    rating_avg    DOUBLE       NOT NULL DEFAULT 0,
    rating_count  INT          NOT NULL DEFAULT 0,
    sold_count    INT          NOT NULL DEFAULT 0,
    status        VARCHAR(24)  NOT NULL DEFAULT 'ACTIVE',
    created_at    DATETIME(6)  NULL
);

CREATE TABLE IF NOT EXISTS product_variants (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    product_id     INT          NOT NULL,
    sku            VARCHAR(64)  NULL,
    attributes     JSON         NULL,
    price_minor    BIGINT       NOT NULL,
    stock_quantity INT          NOT NULL,
    image_url      VARCHAR(512) NULL
);
