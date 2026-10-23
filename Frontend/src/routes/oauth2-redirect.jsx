import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { fetchMe } from "../api/auth.api";
import { clearUserScopedCache } from "../queries/useAuth";
import { ME_KEY, ME_STALE_TIME } from "../queries/useMe";

// Backend chuyển về đây kèm JWT sau khi Google/Facebook xác thực thành công.
export default function OAuth2RedirectPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [token] = useState(() => new URLSearchParams(window.location.search).get("token"));

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;
    clearUserScopedCache(queryClient);
    localStorage.setItem("access_token", token);

    queryClient.fetchQuery({
      queryKey: ME_KEY,
      queryFn: fetchMe,
      staleTime: ME_STALE_TIME,
    }).then(() => {
      if (!cancelled) navigate({ to: "/", replace: true });
    }).catch(() => {
      if (cancelled) return;
      localStorage.removeItem("access_token");
      setError("Không lấy được thông tin tài khoản. Vui lòng đăng nhập lại.");
    });

    return () => { cancelled = true; };
  }, [token, navigate, queryClient]);

  if (!token || error) {
    return (
      <div className="center-box" style={{ minHeight: "55vh" }}>
        <CircleAlert size={48} color="var(--danger)" />
        <h1 style={{ color: "var(--text)" }}>Đăng nhập chưa hoàn tất</h1>
        <p>{error || "Thiếu token đăng nhập. Vui lòng thử đăng nhập lại."}</p>
        <Link to="/login" className="btn btn-primary">Về trang đăng nhập</Link>
      </div>
    );
  }

  return (
    <div className="center-box" style={{ minHeight: "55vh" }}>
      <LoaderCircle size={48} className="spin" color="var(--primary)" />
      <h1 style={{ color: "var(--text)" }}>Đang hoàn tất đăng nhập…</h1>
      <p>Vui lòng chờ trong giây lát.</p>
    </div>
  );
}
