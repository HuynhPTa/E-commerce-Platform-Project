import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { CircleAlert, LoaderCircle, ShieldCheck } from "lucide-react";
import { useRegisterMutation } from "../queries/useAuth";
import { OAUTH2_PROVIDERS, oauth2LoginUrl } from "../lib/oauth";
import { errMsg } from "../lib/errors";

export default function RegisterPage() {
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const registerMutation = useRegisterMutation();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setLocalError("");
    if (form.password.length < 6) {
      setLocalError("Mật khẩu cần ít nhất 6 ký tự.");
      return;
    }
    if (form.password !== confirmPassword) {
      setLocalError("Mật khẩu nhập lại không khớp.");
      return;
    }
    registerMutation.mutate(form, {
      onSuccess: () => navigate({ to: "/login", search: { registered: "1" } }),
    });
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Đăng ký</h1>
        <p className="auth-sub">Tạo tài khoản MarketHub để mua sắm, mở shop và theo dõi đơn hàng.</p>

        <form onSubmit={handleSubmit} className="stack" style={{ gap: 14 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="register-name">Họ và tên</label>
            <input id="register-name" name="fullName" value={form.fullName} autoComplete="name"
                   onChange={handleChange} placeholder="Nguyễn Văn An" required />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="register-email">Email</label>
            <input id="register-email" name="email" type="email" value={form.email} autoComplete="email"
                   onChange={handleChange} placeholder="you@example.com" required />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="register-password">Mật khẩu</label>
            <input id="register-password" name="password" type="password" value={form.password}
                   autoComplete="new-password" onChange={handleChange} placeholder="Ít nhất 6 ký tự"
                   minLength={6} required />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="register-confirm">Nhập lại mật khẩu</label>
            <input id="register-confirm" type="password" value={confirmPassword}
                   autoComplete="new-password" onChange={(e) => setConfirmPassword(e.target.value)}
                   placeholder="Nhập lại mật khẩu" required />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? <><LoaderCircle size={16} className="spin" /> Đang đăng ký…</> : "Tạo tài khoản"}
          </button>
          {localError && <p role="alert" style={{ margin: 0 }}>{localError}</p>}
          {registerMutation.isError && (
            <div className="alert alert-danger" style={{ marginBottom: 0 }}>
              <CircleAlert size={18} />
              <div>{errMsg(registerMutation.error, "Đăng ký thất bại, vui lòng thử lại.")}</div>
            </div>
          )}
        </form>

        <div className="auth-divider">hoặc đăng ký nhanh với</div>
        <div className="oauth-buttons">
          {OAUTH2_PROVIDERS.map((provider) => (
            <a key={provider.id} className="btn btn-oauth" href={oauth2LoginUrl(provider.id)}>
              <span className={`oauth-icon ${provider.id}`} aria-hidden="true">
                {provider.id === "google" ? "G" : "f"}
              </span>
              Tiếp tục với {provider.label}
            </a>
          ))}
        </div>
        <p className="auth-note">
          <ShieldCheck size={14} /> Tài khoản mạng xã hội được tạo tự động nếu email chưa tồn tại.
        </p>

        <p className="auth-footer">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
