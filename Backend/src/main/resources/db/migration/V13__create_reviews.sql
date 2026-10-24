-- Công việc 8 (F16): đánh giá sản phẩm.
--
-- Chỉ tạo FK tới orders/order_items (do V9 tạo) vì trên database mới Flyway chạy
-- trước Hibernate, còn user/products do Hibernate quản lý. Quan hệ user_id/product_id
-- được bảo đảm ở tầng service và đánh index để truy vấn nhanh.
CREATE TABLE IF NOT EXISTS reviews (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    order_item_id INT     NOT NULL,
    order_id      INT     NOT NULL,
    user_id       INT     NOT NULL,
    product_id    INT     NOT NULL,
    rating        TINYINT NOT NULL,
    comment       TEXT    NULL,
    created_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_reviews_order_item FOREIGN KEY (order_item_id) REFERENCES order_items (id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),

    -- Mỗi món hàng chỉ được đánh giá 1 lần
    UNIQUE KEY uk_reviews_order_item (order_item_id),
    -- Mỗi sản phẩm chỉ được đánh giá 1 lần trong cùng một đơn (kể cả nhiều biến thể)
    UNIQUE KEY uk_reviews_order_product (order_id, product_id),

    INDEX idx_reviews_product_created (product_id, created_at),
    INDEX idx_reviews_user (user_id)
);
