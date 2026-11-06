import { Link } from "react-router-dom";

// Thành phần (component) là một hàm JavaScript trả về giao diện.
// Thành phần này hiển thị dải thông báo nằm trên cùng của trang cửa hàng.
export default function ThanhThongBao() {
  return (
    <div className="announce">
      <div className="container announce__inner">
        <div className="announce__group announce__group--left">
          <span>Miễn phí giao hàng cho đơn từ 499.000₫</span>
        </div>
        <div className="announce__group announce__group--right">
          <span>Thanh toán VNPay · MoMo</span>
          <Link to="/orders">Đổi trả 30 ngày</Link>
        </div>
      </div>
    </div>
  );
}
