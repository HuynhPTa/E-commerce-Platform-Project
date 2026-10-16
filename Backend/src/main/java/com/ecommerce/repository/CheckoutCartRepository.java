package com.ecommerce.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

/**
 * Truy vấn SQL trực tiếp phục vụ checkout. Dùng JDBC (không dùng entity của CV2/3/4)
 * để CV5 không phụ thuộc code của người khác, chỉ phụ thuộc TÊN BẢNG / TÊN CỘT.
 * Nếu tên bảng/cột của nhóm khác tài liệu, chỉ cần sửa trong file này.
 *
 * JdbcTemplate dùng chung connection với JPA trong cùng @Transactional.
 */
@Repository
@RequiredArgsConstructor
public class CheckoutCartRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public record CartLine(
            int cartItemId,
            int variantId,
            int quantity,
            int unitPriceMinor,
            String attributesJson,
            int productId,
            String productName,
            int shopId,
            String productStatus) {
    }

    /** Lấy các dòng giỏ của user, kèm giá và shop từ DB (không tin dữ liệu từ client). */
    public List<CartLine> findLines(int userId, Collection<Integer> cartItemIds) {
        StringBuilder sql = new StringBuilder("""
                SELECT ci.id AS cart_item_id, ci.variant_id, ci.quantity,
                       v.price_minor, CAST(v.attributes AS CHAR) AS attributes,
                       p.id AS product_id, p.name AS product_name,
                       p.shop_id, p.status AS product_status
                FROM cart_items ci
                JOIN product_variants v ON v.id = ci.variant_id
                JOIN products p ON p.id = v.product_id
                WHERE ci.user_id = :userId AND p.deleted_at IS NULL
                """);
        MapSqlParameterSource params = new MapSqlParameterSource("userId", userId);
        if (cartItemIds != null && !cartItemIds.isEmpty()) {
            sql.append(" AND ci.id IN (:ids)");
            params.addValue("ids", cartItemIds);
        }
        sql.append(" ORDER BY ci.id");

        return jdbc.query(sql.toString(), params, (rs, i) -> new CartLine(
                rs.getInt("cart_item_id"),
                rs.getInt("variant_id"),
                rs.getInt("quantity"),
                rs.getInt("price_minor"),
                rs.getString("attributes"),
                rs.getInt("product_id"),
                rs.getString("product_name"),
                rs.getInt("shop_id"),
                rs.getString("product_status")));
    }

    /**
     * Trừ kho nguyên tử trong 1 câu lệnh: điều kiện stock >= qty nằm CHÍNH TRONG UPDATE,
     * nên 2 người mua cùng lúc món còn 1 cái thì chỉ 1 người update được (1 dòng bị ảnh hưởng).
     *
     * @return true nếu trừ thành công, false nếu không đủ hàng
     */
    public boolean decreaseStock(int variantId, int quantity) {
        int updated = jdbc.update("""
                UPDATE product_variants
                SET stock_quantity = stock_quantity - :qty
                WHERE id = :id AND stock_quantity >= :qty
                """, new MapSqlParameterSource().addValue("qty", quantity).addValue("id", variantId));
        return updated == 1;
    }

    public void deleteCartItems(int userId, Collection<Integer> cartItemIds) {
        if (cartItemIds.isEmpty()) return;
        jdbc.update("DELETE FROM cart_items WHERE user_id = :userId AND id IN (:ids)",
                new MapSqlParameterSource().addValue("userId", userId).addValue("ids", cartItemIds));
    }
}
