-- Công việc 7 (F15): lịch sử trạng thái đơn hàng, dùng cho Order Timeline của người mua.
-- Mỗi lần đơn đổi trạng thái (tạo đơn, người bán xác nhận / giao / huỷ...) ghi thêm 1 dòng.
CREATE TABLE IF NOT EXISTS order_status_history (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    order_id    INT         NOT NULL,
    status      VARCHAR(16) NOT NULL,
    changed_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_osh_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    INDEX idx_osh_order (order_id, changed_at)
);

-- Đơn có từ trước khi có bảng này: chỉ biết lúc tạo (PENDING) và trạng thái hiện tại.
INSERT INTO order_status_history (order_id, status, changed_at)
SELECT o.id, 'PENDING', o.created_at
FROM orders o
WHERE NOT EXISTS (SELECT 1 FROM order_status_history h WHERE h.order_id = o.id);

INSERT INTO order_status_history (order_id, status, changed_at)
SELECT o.id, o.status, o.updated_at
FROM orders o
WHERE o.status <> 'PENDING'
  AND NOT EXISTS (SELECT 1 FROM order_status_history h WHERE h.order_id = o.id AND h.status = o.status);
