import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useRegisterMutation } from "../queries/useAuth";

export default function RegisterPage() {
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });
  const registerMutation = useRegisterMutation();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    registerMutation.mutate(form, {
      onSuccess: () => navigate({ to: "/login" }),
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="fullName"
        value={form.fullName}
        onChange={handleChange}
        placeholder="Họ và tên"
        required
      />
      <input
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email"
        required
      />
      <input
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
        placeholder="Mật khẩu"
        required
      />
      <button type="submit" disabled={registerMutation.isPending}>
        {registerMutation.isPending ? "Đang đăng ký…" : "Đăng ký"}
      </button>
      {registerMutation.isError && (
        <p role="alert">Đăng ký thất bại: {registerMutation.error.message}</p>
      )}
    </form>
  );
}
