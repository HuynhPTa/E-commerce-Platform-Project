import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useLoginMutation } from "../queries/useAuth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mật khẩu"
        required
      />
      <button type="submit" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? "Đang đăng nhập…" : "Đăng nhập"}
      </button>
      {loginMutation.isError && <p role="alert">Sai email hoặc mật khẩu.</p>}
    </form>
  );
}
