import { useQuery } from "@tanstack/react-query";
import { layCayDanhMuc } from "../api/categoryApi";

// Hook là hàm đặc biệt của React dùng để gắn logic vào vòng đời của thành phần.
// Hook này gọi API lấy cây danh mục và trả về kết quả truy vấn.
export function useCayDanhMuc() {
  return useQuery({
    queryKey: ["categories", "tree"],
    queryFn: layCayDanhMuc,
    staleTime: 10 * 60 * 1000,
  });
}
