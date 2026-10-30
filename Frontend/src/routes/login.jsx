import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { useLoginMutation } from "../queries/useAuth";
import { OAUTH2_PROVIDERS, oauth2LoginUrl } from "../lib/oauth";
import { errMsg } from "../lib/errors";

const OAUTH_ERRORS = {
  no_email: "Tài khoản mạng xã hội không cung cấp email. Vui lòng dùng tài khoản khác hoặc đăng ký bằng email.",
  account_disabled: "Tài khoản đã bị khoá. Vui lòng liên hệ quản trị viên.",
  oauth2_failed: "Đăng nhập bằng mạng xã hội thất bại. Vui lòng thử lại.",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [params] = useState(() => new URLSearchParams(window.location.search));
  const oauthError = params.get("error");
  const registered = params.get("registered") === "1";
  const loginMutation = useLoginMutation();
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    loginMutation.mutate(
      { email, password },
      { onSuccess: () => navigate({ to: "/" }) }
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Đăng nhập</h1>
        <p className="auth-sub">Tiếp tục mua sắm và quản lý đơn hàng trên MarketHub.</p>

        {registered && (
          <div className="alert alert-success">
            <CircleCheck size={18} />
            <div><strong>Đăng ký thành công</strong>Hãy đăng nhập bằng tài khoản vừa tạo.</div>
          </div>
        )}
        {oauthError && (
          <div className="alert alert-danger">
            <CircleAlert size={18} />
            <div>{OAUTH_ERRORS[oauthError] ?? "Đăng nhập bằng mạng xã hội thất bại. Vui lòng thử lại."}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="stack" style={{ gap: 14 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="login-email">Email</label>
            <input id="login-email" type="email" value={email} autoComplete="email"
                   onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="login-password">Mật khẩu</label>
            <input id="login-password" type="password" value={password} autoComplete="current-password"
                   onChange={(e) => setPassword(e.target.value)} placeholder="Nhập mật khẩu" required />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? <><LoaderCircle size={16} className="spin" /> Đang đăng nhập…</> : "Đăng nhập"}
          </button>
          {loginMutation.isError && (
            <p role="alert" style={{ margin: 0 }}>{errMsg(loginMutation.error, "Sai email hoặc mật khẩu.")}</p>
          )}
        </form>

        <div className="auth-divider">hoặc tiếp tục với</div>
        <div className="oauth-buttons">
          {OAUTH2_PROVIDERS.map((provider) => (
            <a key={provider.id} className="btn btn-oauth" href={oauth2LoginUrl(provider.id)}>
              <span className={`oauth-icon ${provider.id}`} aria-hidden="true">
                {provider.id === "google" ? "G" : "f"}
              </span>
              Đăng nhập bằng {provider.label}
            </a>
          ))}
        </div>

        <p className="auth-footer">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}
