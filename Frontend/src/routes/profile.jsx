import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema } from "../schemas/profile.schema";
import { useMe } from "../queries/useMe";
import { useUpdateMeMutation } from "../queries/useUpdateMe";

export default function ProfilePage() {
  const { data: me, isLoading, isError } = useMe();
  const mutation = useUpdateMeMutation();

  const {
    register, handleSubmit, formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    // values: khi dữ liệu từ server về (hoặc cache đổi), form tự điền lại
    values: me && {
      firstName: me.firstName ?? "",
      lastName: me.lastName ?? "",
      phone: me.phone ?? "",
      dateOfBirth: me.dateOfBirth ?? "",
    },
  });

  if (isLoading) return <p>Đang tải hồ sơ...</p>;
  if (isError || !me) return <p>Không tải được hồ sơ. Vui lòng đăng nhập lại.</p>;

  const onSubmit = (values) => {
    mutation.mutate({
      ...values,
      phone: values.phone || null,
      dateOfBirth: values.dateOfBirth || null,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h1>Hồ sơ cá nhân</h1>
      <label>Email <input value={me.email} disabled /></label>

      <label>Họ <input {...register("firstName")} /></label>
      {errors.firstName && <p role="alert">{errors.firstName.message}</p>}

      <label>Tên <input {...register("lastName")} /></label>
      {errors.lastName && <p role="alert">{errors.lastName.message}</p>}

      <label>Số điện thoại <input {...register("phone")} /></label>
      {errors.phone && <p role="alert">{errors.phone.message}</p>}

      <label>Ngày sinh <input type="date" {...register("dateOfBirth")} /></label>

      <button type="submit" disabled={!isDirty || mutation.isPending}>
        {mutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
      </button>
      {mutation.isSuccess && <p>Đã cập nhật hồ sơ.</p>}
      {mutation.isError && (
        <p role="alert">{mutation.error?.response?.data?.message ?? "Cập nhật thất bại"}</p>
      )}
    </form>
  );
}