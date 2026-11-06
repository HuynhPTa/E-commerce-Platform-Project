import { Link } from "react-router-dom";

// Thành phần này hiển thị thông báo cho các trang chưa được hoàn thiện.
export default function TrangSapRaMat(thuocTinh) {
  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>{thuocTinh.tieuDe}</h1>
          <p>{thuocTinh.moTa}</p>
        </div>
      </div>

      <div className="catalog-state upcoming-state">
        <h2>Trang đang được hoàn thiện</h2>
        <p>
          Phần danh sách sản phẩm đã chạy với dữ liệu thật. Các trang còn lại
          sẽ được chuyển sang giao diện mới ở bước tiếp theo.
        </p>
        <Link className="btn" to="/products">
          Về danh sách sản phẩm
        </Link>
      </div>
    </div>
  );
}
