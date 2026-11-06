import { useEffect, useState } from "react";

// Hook này trả về giá trị sau khi người dùng ngừng thay đổi một khoảng thời gian.
export function useDebounce(giaTri, thoiGianCho) {
  // Trạng thái này lưu giá trị đã được trễ lại.
  const trangThaiGiaTriTre = useState(giaTri);

  // Biến này lưu giá trị trễ hiện tại.
  const giaTriTre = trangThaiGiaTriTre[0];

  // Biến này lưu hàm cập nhật giá trị trễ.
  const capNhatGiaTriTre = trangThaiGiaTriTre[1];

  useEffect(
    function () {
      // Hẹn giờ cập nhật giá trị sau khoảng thời gian chờ.
      const boHua = setTimeout(function () {
        capNhatGiaTriTre(giaTri);
      }, thoiGianCho);

      // Hàm dọn dẹp huỷ hẹn giờ cũ khi giá trị thay đổi.
      return function () {
        clearTimeout(boHua);
      };
    },
    [giaTri, thoiGianCho, capNhatGiaTriTre],
  );

  return giaTriTre;
}
