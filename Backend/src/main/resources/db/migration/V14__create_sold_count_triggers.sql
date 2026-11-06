-- Công việc 8 (F19): tự động tính sold_count khi đơn hàng chuyển vào/ra COMPLETED.
--
-- sold_count = tổng quantity của các order_item thuộc những đơn COMPLETED.
-- Dùng hai trigger một câu lệnh (không cần BEGIN/END) để Flyway MySQL parse an toàn.
-- Trigger đọc order_items/product_variants (không đọc lại bảng orders đang UPDATE).

-- Đồng bộ dữ liệu lịch sử trước khi bật trigger.
UPDATE products p
SET p.sold_count = (
    SELECT COALESCE(SUM(oi.quantity), 0)
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN product_variants pv ON pv.id = oi.variant_id
    WHERE o.status = 'COMPLETED' AND pv.product_id = p.id
);

DROP TRIGGER IF EXISTS trg_orders_sold_count_add;
CREATE TRIGGER trg_orders_sold_count_add
AFTER UPDATE ON orders
FOR EACH ROW
UPDATE products p
JOIN (
    SELECT pv.product_id AS product_id, SUM(oi.quantity) AS quantity
    FROM order_items oi
    JOIN product_variants pv ON pv.id = oi.variant_id
    WHERE oi.order_id = NEW.id
    GROUP BY pv.product_id
) d ON d.product_id = p.id
SET p.sold_count = p.sold_count + d.quantity
WHERE NEW.status = 'COMPLETED' AND OLD.status <> 'COMPLETED';

DROP TRIGGER IF EXISTS trg_orders_sold_count_subtract;
CREATE TRIGGER trg_orders_sold_count_subtract
AFTER UPDATE ON orders
FOR EACH ROW
UPDATE products p
JOIN (
    SELECT pv.product_id AS product_id, SUM(oi.quantity) AS quantity
    FROM order_items oi
    JOIN product_variants pv ON pv.id = oi.variant_id
    WHERE oi.order_id = NEW.id
    GROUP BY pv.product_id
) d ON d.product_id = p.id
SET p.sold_count = GREATEST(p.sold_count - d.quantity, 0)
WHERE NEW.status <> 'COMPLETED' AND OLD.status = 'COMPLETED';
