import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress,
} from "../api/address.api";
import { hasToken } from "./useMe";

export const ADDRESSES_KEY = ["addresses"];

// Server state: danh sách địa chỉ của người đang đăng nhập
export function useAddresses() {
  return useQuery({
    queryKey: ADDRESSES_KEY,
    queryFn: fetchAddresses,
    staleTime: 5 * 60 * 1000,
    enabled: hasToken(),
    retry: false,
  });
}

// Mọi mutation đều invalidate: server có thể tự đổi cờ mặc định của địa chỉ khác,
// nên FE không tự suy ra được danh sách mới mà phải tải lại.
function useAddressMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY }),
  });
}

export const useCreateAddress = () => useAddressMutation(createAddress);
export const useUpdateAddress = () => useAddressMutation(updateAddress);
export const useDeleteAddress = () => useAddressMutation(deleteAddress);
export const useSetDefaultAddress = () => useAddressMutation(setDefaultAddress);