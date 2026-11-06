// Thành phần này hiển thị một ô số liệu dùng chung cho các trang quản trị.
export default function OChiSoQuanTri(thuocTinh) {
  const ThanhPhanBieuTuong = thuocTinh.icon;

  // Biến này lưu màu nhấn của ô số liệu.
  let mauNhan = "var(--ink)";

  if (thuocTinh.tone !== undefined) {
    mauNhan = thuocTinh.tone;
  }

  // Phần tử này hiển thị dòng ghi chú phụ nếu có.
  let phanTuMeta = null;

  if (thuocTinh.meta !== undefined) {
    phanTuMeta = <div className="stat__meta">{thuocTinh.meta}</div>;
  }

  return (
    <div className="stat" style={{ borderTopColor: mauNhan }}>
      <div className="stat__label">
        <ThanhPhanBieuTuong size={14} />
        <span>{thuocTinh.label}</span>
      </div>
      <div className="stat__value">{thuocTinh.value}</div>
      {phanTuMeta}
    </div>
  );
}


