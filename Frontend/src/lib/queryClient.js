import { QueryClient } from "@tanstack/react-query";

// Tầng 1A — TanStack Query: query key, cache, stale data, invalidation.
// staleTime GLOBAL ở đây; từng hook trong queries/ override riêng theo bảng:
//
//   Dữ liệu              | staleTime | Vì sao
//   ---------------------|-----------|----------------------------------
//   products (list)      | 3 phút    | Danh sách đổi không liên tục
//   product (detail)     | 2 phút    | Review mới, seller sửa giá
//   cart                 | 0         | Phải luôn đúng số lượng thật ngay lúc thao tác
//   orders (me)          | 1 phút    | Trạng thái đơn đổi khi seller cập nhật
//
// Đây là câu trả lời trực tiếp cho câu hỏi tự kiểm:
// "Tại sao stale time khác nhau giữa các loại dữ liệu?"
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // mặc định 1 phút, các hook cụ thể tự ghi đè
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
