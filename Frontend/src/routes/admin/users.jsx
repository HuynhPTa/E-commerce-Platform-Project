import { useState } from "react";
import {
  ChevronLeft, ChevronRight, Inbox, LoaderCircle, Lock, LockOpen, Search, ShieldCheck, TriangleAlert,
} from "lucide-react";
import { useAdminUsers, useUpdateAdminUserStatus } from "../../queries/useAdmin";
import { useMe } from "../../queries/useMe";
import { useDebounce } from "../../hooks/useDebounce";
import Modal from "../../components/common/Modal";
import ShopStatusBadge from "../../components/shop/ShopStatusBadge";
import { errMsg } from "../../lib/errors";
import { initials } from "../../lib/user";
import { assetUrl, onImageError } from "../../lib/assetUrl";

const ROLE_TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "USER", label: "Người dùng" },
  { key: "ADMIN", label: "Quản trị viên" },
];

function UserAvatar({ user }) {
  if (user.avatar) {
    return <img className="logo-thumb" style={{ borderRadius: "50%" }} src={assetUrl(user.avatar)}
                alt="" onError={onImageError} />;
  }
  return <span className="logo-thumb" style={{ borderRadius: "50%" }}>{initials(user)}</span>;
}

function StatusModal({ user, onClose }) {
  const mutation = useUpdateAdminUserStatus();
  const locking = user.status === 1;

  return (
    <Modal
      title={locking ? "Khoá tài khoản" : "Mở khoá tài khoản"}
      onClose={onClose}
      width={460}
      footer={
        <>
          <button onClick={onClose}>Huỷ</button>
          <button className={locking ? "btn-danger" : "btn-success"}
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate(
                    { id: user.id, status: locking ? 0 : 1 },
                    { onSuccess: onClose },
                  )}>
            {mutation.isPending
              ? <LoaderCircle size={16} className="spin" />
              : locking ? <Lock size={16} /> : <LockOpen size={16} />}
            {locking ? "Khoá tài khoản" : "Mở khoá"}
          </button>
        </>
      }
    >
      <div className="cell-main" style={{ marginBottom: 14 }}>
        <UserAvatar user={user} />
        <div><strong>{user.fullName}</strong><div className="cell-sub">{user.email}</div></div>
      </div>
      <p>
        {locking
          ? "Người dùng sẽ không thể đăng nhập hoặc đặt hàng cho đến khi được mở khoá."
          : "Người dùng sẽ có thể đăng nhập và tiếp tục mua sắm."}
      </p>
      {mutation.isError && (
        <div className="alert alert-danger" style={{ marginBottom: 0 }}>
          <TriangleAlert size={18} /><div>{errMsg(mutation.error)}</div>
        </div>
      )}
    </Modal>
  );
}

export default function AdminUsersPage() {
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState(null);
  const q = useDebounce(keyword.trim(), 400);
  const { data: me } = useMe();

  const { data, isLoading, isError, isFetching } = useAdminUsers({
    role: role === "ALL" ? undefined : role,
    status: status === "ALL" ? undefined : Number(status),
    q: q || undefined,
    page,
    size: 10,
  });

  const changeRole = (key) => { setRole(key); setPage(1); };

  return (
    <section className="card">
      <div className="tabs">
        {ROLE_TABS.map((t) => (
          <button key={t.key} className={role === t.key ? "active" : ""} onClick={() => changeRole(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card-header">
        <div className="row" style={{ flex: 1, maxWidth: 420 }}>
          <Search size={16} className="muted" />
          <input value={keyword}
                 onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
                 placeholder="Tìm theo email, họ tên hoặc số điện thoại…" />
        </div>
        <select value={status} style={{ width: 170 }}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="ALL">Mọi trạng thái</option>
          <option value="1">Đang hoạt động</option>
          <option value="0">Đã khoá</option>
        </select>
        {isFetching && !isLoading && <LoaderCircle size={16} className="spin muted" />}
      </div>

      {isLoading && <div className="center-box"><LoaderCircle className="spin" /> Đang tải người dùng…</div>}
      {isError && (
        <div className="alert alert-danger" style={{ margin: 16 }}>
          <TriangleAlert size={18} /><div>Không tải được danh sách người dùng.</div>
        </div>
      )}
      {data?.items.length === 0 && (
        <div className="center-box"><Inbox size={44} /> Không có người dùng phù hợp.</div>
      )}

      {data?.items.length > 0 && (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Người dùng</th><th>Liên hệ</th><th>Vai trò</th><th>Shop</th>
                  <th>Trạng thái</th><th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((user) => {
                  const isAdmin = user.role === "ADMIN";
                  const isSelf = me?.id === user.id;
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="cell-main">
                          <UserAvatar user={user} />
                          <div>
                            <strong>{user.fullName}</strong>
                            <div className="cell-sub">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{user.phone || "—"}<div className="cell-sub">#{user.id}</div></td>
                      <td>
                        <span className={`badge ${isAdmin ? "badge-info" : "badge-muted"}`}>
                          {isAdmin ? <><ShieldCheck size={12} /> Quản trị</> : "Người dùng"}
                        </span>
                      </td>
                      <td>
                        {user.shopId ? (
                          <>
                            {user.shopName}
                            <div className="cell-sub"><ShopStatusBadge status={user.shopStatus} /></div>
                          </>
                        ) : <span className="muted">—</span>}
                      </td>
                      <td>
                        <span className={`badge ${user.status === 1 ? "badge-success" : "badge-danger"}`}>
                          {user.status === 1 ? "Đang hoạt động" : "Đã khoá"}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          {isAdmin ? (
                            <span className="cell-sub">Không thể khoá</span>
                          ) : (
                            <button className={`btn-sm ${user.status === 1 ? "btn-danger" : "btn-success"}`}
                                    disabled={isSelf}
                                    title={isSelf ? "Không thể tự khoá tài khoản của mình" : undefined}
                                    onClick={() => setTarget(user)}>
                              {user.status === 1 ? <><Lock size={14} /> Khoá</> : <><LockOpen size={14} /> Mở khoá</>}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="pagination" style={{ padding: "0 16px 16px" }}>
            <button className="btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft size={16} /> Trước
            </button>
            <span className="muted">Trang {data.page} / {Math.max(1, data.totalPages)} · {data.totalItems} người dùng</span>
            <button className="btn-sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
              Sau <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}

      {target && <StatusModal user={target} onClose={() => setTarget(null)} />}
    </section>
  );
}
