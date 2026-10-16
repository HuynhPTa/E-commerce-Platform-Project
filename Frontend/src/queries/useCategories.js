import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCategoryTree, fetchCategoryFlat, createCategory, updateCategory, deleteCategory,
} from "../api/category.api";

export const CATEGORIES_KEY = ["categories"];
const STALE = 10 * 60 * 1000; // danh mục rất ít thay đổi

// Dùng chung cho header dropdown, sidebar, trang chủ: cùng key nên chỉ gọi API 1 lần
export function useCategoryTree() {
  return useQuery({ queryKey: [...CATEGORIES_KEY, "tree"], queryFn: fetchCategoryTree, staleTime: STALE });
}

export function useCategoryFlat() {
  return useQuery({ queryKey: [...CATEGORIES_KEY, "flat"], queryFn: fetchCategoryFlat, staleTime: STALE });
}

// Mọi thay đổi đều làm cả dạng cây lẫn dạng phẳng cũ đi -> invalidate theo tiền tố ["categories"]
function useCategoryMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  });
}

export const useCreateCategory = () => useCategoryMutation(createCategory);
export const useUpdateCategory = () => useCategoryMutation(updateCategory);
export const useDeleteCategory = () => useCategoryMutation(deleteCategory);
