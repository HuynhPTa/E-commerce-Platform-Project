import { useState } from "react";
import { ChevronDown } from "lucide-react";

// Thành phần này hiển thị một nhóm bộ lọc có thể mở hoặc đóng.
// Thẻ details là thành phần HTML giúp đóng mở nội dung mà không cần thư viện ngoài.
export default function NhomBoLoc(thuocTinh) {
  // Biến này lưu trạng thái mở ban đầu của nhóm bộ lọc.
  let moBanDau = false;

  // Nếu thành phần cha có truyền trạng thái mở ban đầu thì dùng giá trị đó.
  if (thuocTinh.moBanDau !== undefined) {
    moBanDau = thuocTinh.moBanDau;
  }

  // useState tạo trạng thái mở của nhóm và trả về mảng gồm giá trị, hàm cập nhật.
  const trangThaiMo = useState(moBanDau);

  // Biến này lưu trạng thái đóng mở hiện tại.
  const dangMo = trangThaiMo[0];

  // Biến này lưu hàm dùng để cập nhật trạng thái đóng mở.
  const capNhatDangMo = trangThaiMo[1];

  // Hàm này đồng bộ trạng thái của React với thẻ details của trình duyệt.
  function xuLyBatTat(suKienBatTat) {
    capNhatDangMo(suKienBatTat.currentTarget.open);
  }

  return (
    <details
      className="filter-group"
      open={dangMo}
      onToggle={xuLyBatTat}
    >
      <summary>
        {thuocTinh.tieuDe}
        <ChevronDown className="icon icon--sm" />
      </summary>
      {thuocTinh.children}
    </details>
  );
}
