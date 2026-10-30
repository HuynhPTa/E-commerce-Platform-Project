-- Job 3 (Gói A): ảnh sản phẩm do Seller upload.
-- Lưu ý: không đặt khoá ngoại cứng tới products vì một số môi trường tạo bảng products
-- bằng Hibernate (ddl-auto=update) trước khi Flyway chạy, còn DB mới chỉ có V9.
-- Quan hệ product_id được JPA (ProductImage.product) quản lý, xoá cứng product sẽ cascade.
CREATE TABLE IF NOT EXISTS product_images (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    product_id  INT          NOT NULL,
    url         VARCHAR(512) NOT NULL,
    sort_order  INT          NOT NULL DEFAULT 0,
    created_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_product_images_product (product_id)
);
