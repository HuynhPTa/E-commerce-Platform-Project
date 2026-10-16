import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Search, Check, X, Lock, LockOpen, Eye, LoaderCircle, Inbox, ChevronLeft, ChevronRight, TriangleAlert,
  Phone, MapPin, Mail, ExternalLink, RotateCcw,
} from "lucide-react";
import { useAdminShops, useAdminShopSummary, useUpdateShopStatus } from "../../queries/useShops";
import { useDebounce } from "../../hooks/useDebounce";
import ShopStatusBadge from "../../components/shop/ShopStatusBadge";
import { SHOP_STATUS } from "../../components/shop/shopStatus";
import Modal from "../../components/common/Modal";
import { errMsg, formatDate } from "../../lib/errors";

const TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "Chờ duyệt" },
  { key: "APPROVED", label: "Đang hoạt động" },
  { key: "REJECTED", label: "Bị từ chối" },
  { key: "SUSPENDED", label: "Đã khoá" },
];

// Hành động hợp lệ theo trạng thái hiện tại (khớp ShopStatus.canMoveTo ở Backend)
const ACTIONS = {
  APPROVE: { to: "APPROVED", label: "Duyệt", Icon: Check, className: "btn-success", title: "Duyệt shop" },
  REJECT: { to: "REJECTED", label: "Từ chối", Icon: X, className: "btn-danger", title: "Từ chối hồ sơ", needsReason: true,
    reasons: ["Thông tin shop chưa đầy đủ", "Tên shop vi phạm quy định", "Logo không phù hợp", "Không xác minh được số điện thoại"] },
  SUSPEND: { to: "SUSPENDED", label: "Khoá", Icon: Lock, className: "btn-danger", title: "Khoá shop", needsReason: true,
    reasons: ["Bán hàng giả, hàng nhái", "Nhiều khiếu nại từ người mua", "Vi phạm chính sách sàn"] },
  UNLOCK: { to: "APPROVED", label: "Mở khoá", Icon: LockOpen, className: "btn-success", title: "Mở khoá shop" },
  REAPPROVE: { to: "APPROVED", label: "Duyệt lại", Icon: RotateCcw, className: "", title: "Duyệt lại shop" },
};
const ACTIONS_BY_STATUS = {
  PENDING: ["APPROVE", "REJECT"],
  APPROVED: ["SUSPEND"],
  SUSPENDED: ["UNLOCK"],
  REJECTED: ["REAPPROVE"],
};

function ShopLogo({ shop }) {
  return shop.logoUrl ? <img className="logo-thumb" src={shop.logoUrl} alt="" />
    : <span className="logo-thumb">{shop.name[0]}</span>;
}

function ActionModal({ shop, actionKey, onClose }) {
  const action = ACTIONS[actionKey];
  const [note, setNote] = useState("");
  const mutation = useUpdateShopStatus();
  const invalid = action.needsReason && !note.trim();

  return (
    <Modal title={`${action.title}: ${shop.name}`} onClose={onClose} width={480}
      footer={<>
        <button onClick={onClose}>Huỷ</button>
        <button className={action.className || "btn-primary"} disabled={invalid || mutation.isPending}
                onClick={() => mutation.mutate({ id: shop.id, status: action.to, note: note.trim() || null }, { onSuccess: onClose })}>
          {mutation.isPending ? <LoaderCircle size={16} className="spin" /> : <action.Icon size={16} />} {action.label}
        </button>
      </>}>
      <div className="cell-main" style={{ marginBottom: 14 }}>
        <ShopLogo shop={shop} />
        <div><strong>{shop.name}</strong><div className="cell-sub">{shop.ownerEmail}</div></div>
      </div>
      {action.needsReason ? (
        <div className="field">
          <label className="required" htmlFor="reason">Lý do (người bán sẽ thấy)</label>
          <div className="row" style={{ flexWrap: "wrap", marginBottom: 8 }}>
            {action.reasons.map((r) => (
              <button key={r} type="button" className="btn-sm" onClick={() => setNote(r)}>{r}</button>
            ))}
          </div>
          <textarea id="reason" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Nhập lý do…" />
        </div>
      ) : (
        <p>Xác nhận chuyển shop sang trạng thái <ShopStatusBadge status={action.to} />?</p>
      )}
      {mutation.isError && <div className="alert alert-danger"><TriangleAlert size={18} /><div>{errMsg(mutation.error)}</div></div>}
    </Modal>
  );
}

function DetailModal({ shop, onClose, onAction }) {
  return (
    <Modal title="Chi tiết hồ sơ shop" onClose={onClose} width={560}
      footer={<>
        <Link to="/shops/$shopId" params={{ shopId: String(shop.id) }} target="_blank" className="btn">
          <ExternalLink size={16} /> Trang shop
        </Link>
        <span className="spacer" />
        {(ACTIONS_BY_STATUS[shop.status] ?? []).map((key) => {
          const a = ACTIONS[key];
          return <button key={key} className={a.className} onClick={() => onAction(shop, key)}><a.Icon size={16} /> {a.label}</button>;
        })}
      </>}>
      <div className="cell-main" style={{ marginBottom: 16 }}>
        <ShopLogo shop={shop} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{shop.name} <span className="cell-sub">#{shop.id}</span></div>
          <ShopStatusBadge status={shop.status} />
        </div>
      </div>
      {shop.statusNote && <div className="alert alert-warning"><TriangleAlert size={18} /><div><strong>Ghi chú của Admin</strong>{shop.statusNote}</div></div>}
      <div className="stack" style={{ gap: 8 }}>
        <div className="row"><Mail size={16} className="muted" /> {shop.ownerName} — {shop.ownerEmail}</div>
        <div className="row"><Phone size={16} className="muted" /> {shop.phone}</div>
        <div className="row"><MapPin size={16} className="muted" /> {shop.pickupAddress}</div>
        <div className="muted">Đăng ký: {formatDate(shop.createdAt)} · Xử lý gần nhất: {formatDate(shop.reviewedAt)} · {shop.productCount} sản phẩm</div>
      </div>
      <h3 style={{ marginTop: 16 }}>Mô tả</h3>
      <p className="muted" style={{ whiteSpace: "pre-line" }}>{shop.description || "(Không có mô tả)"}</p>
    </Modal>
  );
}

export default function AdminShopsPage() {
  const [tab, setTab] = useState("PENDING");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounce(keyword.trim(), 400);
  const [detail, setDetail] = useState(null);
  const [action, setAction] = useState(null); // { shop, key }

  const { data: summary } = useAdminShopSummary();
  const { data, isLoading, isError, isFetching } = useAdminShops({
    status: tab === "ALL" ? undefined : tab, q: q || undefined, page, size: 10,
  });

  const changeTab = (key) => { setTab(key); setPage(1); };
  const openAction = (shop, key) => { setDetail(null); setAction({ shop, key }); };

  return (
    <section className="card">
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? "active" : ""} onClick={() => changeTab(t.key)}>
            {t.label} <span className="count">{summary?.[t.key] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="card-header">
        <div className="row" style={{ flex: 1, maxWidth: 380 }}>
          <Search size={16} className="muted" />
          <input value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1); }} placeholder="Tìm theo tên shop hoặc email chủ shop…" />
        </div>
        {isFetching && !isLoading && <LoaderCircle size={16} className="spin muted" />}
      </div>

      {isLoading && <div className="center-box"><LoaderCircle className="spin" /> Đang tải danh sách shop…</div>}
      {isError && <div className="alert alert-danger" style={{ margin: 16 }}>Không tải được danh sách shop.</div>}
      {data?.items.length === 0 && (
        <div className="center-box"><Inbox size={44} /> Không có shop nào {tab !== "ALL" && `ở trạng thái “${SHOP_STATUS[tab].label}”`}.</div>
      )}

      {data?.items.length > 0 && (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Shop</th><th>Chủ shop</th><th>Liên hệ</th><th>Ngày đăng ký</th><th>Trạng thái</th><th style={{ textAlign: "right" }}>Thao tác</th></tr>
              </thead>
              <tbody>
                {data.items.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="cell-main">
                        <ShopLogo shop={s} />
                        <div><strong>{s.name}</strong><div className="cell-sub">#{s.id} · {s.productCount} sản phẩm</div></div>
                      </div>
                    </td>
                    <td>{s.ownerName || "—"}<div className="cell-sub">{s.ownerEmail}</div></td>
                    <td>{s.phone}<div className="cell-sub" style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.pickupAddress}</div></td>
                    <td>{formatDate(s.createdAt)}</td>
                    <td>
                      <ShopStatusBadge status={s.status} />
                      {s.statusNote && <div className="cell-sub" title={s.statusNote} style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.statusNote}</div>}
                    </td>
                    <td>
                      <div className="actions">
                        <button className="btn-sm btn-ghost" title="Xem chi tiết" onClick={() => setDetail(s)}><Eye size={15} /></button>
                        {(ACTIONS_BY_STATUS[s.status] ?? []).map((key) => {
                          const a = ACTIONS[key];
                          return (
                            <button key={key} className={`btn-sm ${a.className}`} onClick={() => openAction(s, key)}>
                              <a.Icon size={14} /> {a.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination" style={{ padding: "0 16px 16px" }}>
            <button className="btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /> Trước</button>
            <span className="muted">Trang {data.page} / {Math.max(1, data.totalPages)} · {data.totalItems} shop</span>
            <button className="btn-sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>Sau <ChevronRight size={16} /></button>
          </div>
        </>
      )}

      {detail && <DetailModal shop={detail} onClose={() => setDetail(null)} onAction={openAction} />}
      {action && <ActionModal shop={action.shop} actionKey={action.key} onClose={() => setAction(null)} />}
    </section>
  );
}
