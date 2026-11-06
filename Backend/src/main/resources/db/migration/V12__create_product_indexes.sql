-- Công việc 8 (F19): tối ưu tìm kiếm và truy vấn theo khoá ngoại.
--
-- FULLTEXT INDEX phục vụ tìm kiếm tên sản phẩm trên MySQL 8 (InnoDB).
-- Các B-Tree INDEX dưới đây bổ sung cho những cột FK/điều kiện lọc thường dùng
-- mà schema hiện tại chưa có index (products trước đây chỉ có PRIMARY KEY).
ALTER TABLE products ADD FULLTEXT INDEX ft_products_name (name);
ALTER TABLE products ADD INDEX idx_products_shop (shop_id);
ALTER TABLE products ADD INDEX idx_products_category (category_id);
ALTER TABLE products ADD INDEX idx_products_status_created (status, created_at);

-- product_variants.product_id đã có index do FK (Hibernate tạo) nên không thêm trùng.
-- Các bảng khác đã có index cho user_id/shop_id/buyer_id:
--   orders.idx_orders_buyer, orders.idx_orders_shop,
--   checkout_sessions.idx_cs_buyer, cart_items.uk_cart_user_variant,
--   shops UK(user_id), address FK(user_id), reviews.idx_reviews_user.
