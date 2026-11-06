import { Link } from "react-router-dom";

// Thành phần này hiển thị trang báo lỗi khi đường dẫn không tồn tại.
export default function TrangKhongTimThay() {
  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Không tìm thấy trang</h1>
          <p>Đường dẫn bạn mở không tồn tại trong MarketHub.</p>
        </div>
      </div>

      <div className="catalog-state upcoming-state">
        <h2>Trang không tồn tại</h2>
        <p>Quay lại danh sách sản phẩm để tiếp tục mua sắm.</p>
        <Link className="btn" to="/products">
          Về danh sách sản phẩm
        </Link>
      </div>
    </div>
  );
}
