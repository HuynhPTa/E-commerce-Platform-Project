import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCart, addToCart, updateCartItem, removeCartItem } from "../api/cart.api";

export function useCartQuery() {
  return useQuery({
    queryKey: ["cart"],
    queryFn: fetchCart,
    staleTime: 0, // giỏ hàng phải luôn đúng số lượng thật ngay lúc thao tác
  });
}

// Tầng 1B — "Mutation nâng cao: optimistic update, rollback khi lỗi".
// Đây KHÔNG phải chỉ invalidateQueries sau khi thành công — UI phải đổi NGAY
// trước khi server trả lời, và tự phục hồi nếu server báo lỗi (vd hết hàng).
export function useAddToCartMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addToCart,

    onMutate: async (newItem) => {
      // 1. Huỷ mọi refetch đang chạy để không bị ghi đè optimistic update
      await queryClient.cancelQueries({ queryKey: ["cart"] });

      // 2. Snapshot state cũ — để rollback nếu lỗi
      const previousCart = queryClient.getQueryData(["cart"]);

      // 3. Cập nhật UI ngay lập tức, không chờ server
      queryClient.setQueryData(["cart"], (old = []) => {
        const existing = old.find((i) => i.variantId === newItem.variantId);
        if (existing) {
          return old.map((i) =>
            i.variantId === newItem.variantId
              ? { ...i, quantity: i.quantity + newItem.quantity }
              : i
          );
        }
        return [...old, { ...newItem, id: `optimistic-${Date.now()}` }];
      });

      return { previousCart };
    },

    // 4. Lỗi (vd hết hàng, InsufficientStockException từ BE) → rollback về snapshot cũ
    onError: (_err, _newItem, context) => {
      queryClient.setQueryData(["cart"], context.previousCart);
    },

    // 5. Dù thành công hay lỗi, luôn đồng bộ lại với server để chắc chắn đúng số thật
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useUpdateCartItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCartItem,
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previousCart = queryClient.getQueryData(["cart"]);
      queryClient.setQueryData(["cart"], (old = []) =>
        old.map((i) => (i.id === itemId ? { ...i, quantity } : i))
      );
      return { previousCart };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(["cart"], context.previousCart);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });
}

export function useRemoveCartItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeCartItem,
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previousCart = queryClient.getQueryData(["cart"]);
      queryClient.setQueryData(["cart"], (old = []) =>
        old.filter((i) => i.id !== itemId)
      );
      return { previousCart };
    },
    onError: (_err, _itemId, context) => {
      queryClient.setQueryData(["cart"], context.previousCart);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });
}
