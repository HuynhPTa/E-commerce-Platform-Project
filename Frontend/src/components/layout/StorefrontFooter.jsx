import { Link } from "react-router-dom";

// Thành phần này hiển thị chân trang với thông tin thương hiệu,
// các nhóm liên kết mua sắm, hỗ trợ và thông tin cửa hàng.
export default function ChanTrangCuaHang() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand">
            <span className="brand__name">MarketHub</span>
            <p>
              Một cửa hàng tuyển chọn đồ công nghệ, nhà cửa, thời trang và sách.
              Chúng tôi chọn ít, nhưng chọn kỹ.
            </p>
            <div className="footer-pay">
              <span className="pay-mark">VNPay</span>
              <span className="pay-mark">MoMo</span>
              <span className="pay-mark">Visa · Mastercard</span>
            </div>
          </div>

          <div className="footer-col">
            <h2 className="footer-col__title">Mua sắm</h2>
            <ul>
              <li>
                <Link to="/products">Tất cả sản phẩm</Link>
              </li>
              <li>
                <Link to="/products?sort=newest">Hàng mới</Link>
              </li>
              <li>
                <Link to="/products?sort=best_selling">Bán chạy</Link>
              </li>
              <li>
                <Link to="/products?sort=price_asc">Giá thấp đến cao</Link>
              </li>
              <li>
                <Link to="/products?sort=price_desc">Giá cao đến thấp</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h2 className="footer-col__title">Hỗ trợ</h2>
            <ul>
              <li>
                <Link to="/orders">Đơn hàng của tôi</Link>
              </li>
              <li>
                <Link to="/account">Địa chỉ giao hàng</Link>
              </li>
              <li>
                <Link to="/orders">Đổi trả &amp; bảo hành</Link>
              </li>
              <li>
                <Link to="/account">Tài khoản</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h2 className="footer-col__title">MarketHub</h2>
            <ul>
              <li>
                <Link to="/products">Câu chuyện cửa hàng</Link>
              </li>
              <li>
                <Link to="/products">Cách chúng tôi chọn hàng</Link>
              </li>
              <li>
                <Link to="/products">Cửa hàng chính thức</Link>
              </li>
              <li>
                <span>Hỗ trợ 8:00 tới 21:00</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 MarketHub. Ảnh minh hoạ từ Wikimedia Commons.</span>
          <span>Dữ liệu sản phẩm từ MarketHub</span>
        </div>
      </div>
    </footer>
  );
}
