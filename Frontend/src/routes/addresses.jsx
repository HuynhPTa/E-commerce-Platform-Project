import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressSchema } from "../schemas/address.schema";
import {
  useAddresses, useCreateAddress, useUpdateAddress,
  useDeleteAddress, useSetDefaultAddress,
} from "../queries/useAddresses";

const errMsg = (e) => e?.response?.data?.message ?? "Thao tác thất bại";

function AddressForm({ initial, onSubmit, onCancel, isPending, error }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      recipientName: initial?.recipientName ?? "",
      phone: initial?.phone ?? "",
      fullAddress: initial?.fullAddress ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h2>{initial ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}</h2>

      <label>Người nhận <input {...register("recipientName")} /></label>
      {errors.recipientName && <p role="alert">{errors.recipientName.message}</p>}

      <label>Số điện thoại <input {...register("phone")} /></label>
      {errors.phone && <p role="alert">{errors.phone.message}</p>}

      <label>Địa chỉ <textarea {...register("fullAddress")} /></label>
      {errors.fullAddress && <p role="alert">{errors.fullAddress.message}</p>}

      <button type="submit" disabled={isPending}>{isPending ? "Đang lưu..." : "Lưu"}</button>
      <button type="button" onClick={onCancel}>Huỷ</button>
      {error && <p role="alert">{errMsg(error)}</p>}
    </form>
  );
}

export default function AddressesPage() {
  const { data: addresses, isLoading, isError } = useAddresses();
  const createMut = useCreateAddress();
  const updateMut = useUpdateAddress();
  const deleteMut = useDeleteAddress();
  const defaultMut = useSetDefaultAddress();

  // editing: null (đóng form) | "new" (thêm) | object địa chỉ (sửa).
  // Đây là CLIENT state của riêng trang này, không phải server state.
  const [editing, setEditing] = useState(null);

  if (isLoading) return <p>Đang tải địa chỉ...</p>;
  if (isError) return <p>Không tải được địa chỉ. Vui lòng đăng nhập lại.</p>;

  const closeForm = () => setEditing(null);

  function handleSubmit(values) {
    if (editing === "new") {
      createMut.mutate(values, { onSuccess: closeForm });
    } else {
      updateMut.mutate({ id: editing.id, ...values }, { onSuccess: closeForm });
    }
  }

  function handleDelete(a) {
    if (window.confirm(`Xoá địa chỉ "${a.fullAddress}"?`)) deleteMut.mutate(a.id);
  }

  return (
    <div>
      <h1>Địa chỉ nhận hàng</h1>

      {addresses.length === 0 && <p>Bạn chưa có địa chỉ nào.</p>}

      <ul>
        {addresses.map((a) => (
          <li key={a.id}>
            <strong>{a.recipientName}</strong> · {a.phone}
            {a.defaultAddress && <span> [Mặc định]</span>}
            <div>{a.fullAddress}</div>
            <button onClick={() => setEditing(a)}>Sửa</button>
            <button onClick={() => handleDelete(a)} disabled={deleteMut.isPending}>Xoá</button>
            {!a.defaultAddress && (
              <button onClick={() => defaultMut.mutate(a.id)} disabled={defaultMut.isPending}>
                Đặt làm mặc định
              </button>
            )}
          </li>
        ))}
      </ul>

      {(deleteMut.isError || defaultMut.isError) && (
        <p role="alert">{errMsg(deleteMut.error ?? defaultMut.error)}</p>
      )}

      {editing === null ? (
        <button onClick={() => setEditing("new")}>+ Thêm địa chỉ</button>
      ) : (
        <AddressForm
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? null : editing}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          isPending={createMut.isPending || updateMut.isPending}
          error={createMut.error ?? updateMut.error}
        />
      )}
    </div>
  );
}