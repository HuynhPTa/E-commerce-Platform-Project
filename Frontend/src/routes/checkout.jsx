import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { checkoutSchema } from "../schemas/checkout.schema";
import { useCheckoutMutation } from "../queries/useCheckout";
import { useCartQuery } from "../queries/useCart";

export default function CheckoutPage() {
  const { data: cart } = useCartQuery();
  const checkout = useCheckoutMutation();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(checkoutSchema) });

  function onSubmit(values) {
    checkout.mutate(
      { ...values, cartItemIds: cart?.map((i) => i.id) },
      {
        // Chỉ điều hướng SAU KHI có response thật từ BE — không optimistic.
        onSuccess: (data) => {
          if (data.redirectUrl) {
            window.location.href = data.redirectUrl; // sang cổng VNPay/Momo
          } else {
            navigate({ to: "/orders" });
          }
        },
      }
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label>
        Tên người nhận
        <input {...register("recipientName")} />
        {errors.recipientName && <span role="alert">{errors.recipientName.message}</span>}
      </label>

      <label>
        Số điện thoại
        <input {...register("phone")} />
        {errors.phone && <span role="alert">{errors.phone.message}</span>}
      </label>

      <label>
        Địa chỉ giao hàng
        <textarea {...register("fullAddress")} />
        {errors.fullAddress && <span role="alert">{errors.fullAddress.message}</span>}
      </label>

      <fieldset>
        <legend>Phương thức thanh toán</legend>
        <label><input type="radio" value="VNPAY" {...register("paymentMethod")} /> VNPay</label>
        <label><input type="radio" value="MOMO" {...register("paymentMethod")} /> Momo</label>
        {errors.paymentMethod && <span role="alert">{errors.paymentMethod.message}</span>}
      </fieldset>

      <label>
        Ghi chú
        <textarea {...register("note")} />
        {errors.note && <span role="alert">{errors.note.message}</span>}
      </label>

      <button type="submit" disabled={checkout.isPending}>
        {checkout.isPending ? "Đang xử lý…" : "Đặt hàng & thanh toán"}
      </button>
      {checkout.isError && <p role="alert">Đặt hàng thất bại: {checkout.error.message}</p>}
    </form>
  );
}
