import { Link } from "@tanstack/react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Store, Clock, CircleCheck, Ban, Lock, ImageOff, Send, LoaderCircle, FileText, ShieldCheck, Rocket,
} from "lucide-react";
import { shopSchema } from "../../schemas/shop.schema";
import { useMyShop, useRegisterShop } from "../../queries/useShops";
import { useMe } from "../../queries/useMe";
import { useAddresses } from "../../queries/useAddresses";
import { errMsg, formatDate } from "../../lib/errors";

function StatusBanner({ shop }) {
  if (shop.status === "PENDING") {
    return (
      <div className="alert alert-warning">
        <Clock size={18} />
        <div><strong>Shop đang chờ duyệt</strong>Hồ sơ gửi ngày {formatDate(shop.createdAt)}. Admin sẽ phản hồi trong 1–2 ngày làm việc.</div>
      </div>
    );
  }
  if (shop.status === "APPROVED") {
    return (
      <div className="alert alert-success">
        <CircleCheck size={18} />
        <div><strong>Shop đã được duyệt</strong>Bạn có thể bắt đầu đăng bán sản phẩm từ Kênh người bán.</div>
      </div>
    );
  }
  if (shop.status === "SUSPENDED") {
    return (
      <div className="alert alert-danger">
        <Lock size={18} />
        <div><strong>Shop đang bị khoá</strong>Lý do: {shop.statusNote || "—"}. Vui lòng liên hệ Admin để được hỗ trợ.</div>
      </div>
    );
  }
  return (
    <div className="alert alert-danger">
      <Ban size={18} />
      <div><strong>Hồ sơ bị từ chối</strong>Lý do: {shop.statusNote || "—"}. Bạn có thể chỉnh sửa và gửi lại bên dưới.</div>
    </div>
  );
}

function ShopForm({ shop, defaults }) {
  const mutation = useRegisterShop();
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      name: shop?.name ?? "",
      description: shop?.description ?? "",
      logoUrl: shop?.logoUrl ?? "",
      phone: shop?.phone ?? defaults.phone ?? "",
      pickupAddress: shop?.pickupAddress ?? defaults.address ?? "",
      agree: false,
    },
  });
  const logoUrl = useWatch({ control, name: "logoUrl" });
  const description = useWatch({ control, name: "description" }) ?? "";

  // agree chỉ kiểm tra ở FE, không gửi lên Backend
  const onSubmit = (data) => {
    const values = { ...data };
    delete values.agree;
    mutation.mutate(values);
  };
  const field = (name) => `field${errors[name] ? " has-error" : ""}`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className={field("name")}>
        <label className="required" htmlFor="name">Tên shop</label>
        <input id="name" placeholder="VD: TechZone Official" {...register("name")} />
        {errors.name ? <p className="error">{errors.name.message}</p> : <p className="hint">Tên shop là duy nhất trên MarketHub.</p>}
      </div>

      <div className={field("description")}>
        <label htmlFor="description">Mô tả shop</label>
        <textarea id="description" rows={4} placeholder="Giới thiệu ngắn về shop, sản phẩm chính, chính sách đổi trả…" {...register("description")} />
        {errors.description ? <p className="error">{errors.description.message}</p>
          : <p className="hint">{description.length}/2000 ký tự</p>}
      </div>

      <div className={field("logoUrl")}>
        <label htmlFor="logoUrl">Logo shop</label>
        <div className="logo-preview">
          <div className="box">
            {logoUrl && !errors.logoUrl ? <img src={logoUrl} alt="Xem trước logo" /> : <ImageOff size={26} />}
          </div>
          <div style={{ flex: 1 }}>
            <input id="logoUrl" placeholder="https://…/logo.png" {...register("logoUrl")} />
            {errors.logoUrl ? <p className="error">{errors.logoUrl.message}</p>
              : <p className="hint">Dán đường dẫn ảnh (vuông, tối thiểu 200×200px). Có thể bỏ trống.</p>}
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className={field("phone")}>
          <label className="required" htmlFor="phone">Số điện thoại</label>
          <input id="phone" placeholder="0901234567" {...register("phone")} />
          {errors.phone && <p className="error">{errors.phone.message}</p>}
        </div>
        <div className={field("pickupAddress")}>
          <label className="required" htmlFor="pickupAddress">Địa chỉ lấy hàng</label>
          <input id="pickupAddress" placeholder="Số nhà, đường, phường, quận, tỉnh" {...register("pickupAddress")} />
          {errors.pickupAddress && <p className="error">{errors.pickupAddress.message}</p>}
        </div>
      </div>

      <div className={field("agree")}>
        <label className="row" style={{ fontWeight: 400 }}>
          <input type="checkbox" {...register("agree")} /> Tôi đồng ý với quy định và chính sách dành cho người bán của MarketHub
        </label>
        {errors.agree && <p className="error">{errors.agree.message}</p>}
      </div>

      {mutation.isError && <div className="alert alert-danger"><Ban size={18} /><div>{errMsg(mutation.error)}</div></div>}

      <button type="submit" className="btn-primary btn-block" disabled={mutation.isPending}>
        {mutation.isPending ? <><LoaderCircle size={16} className="spin" /> Đang gửi…</> : <><Send size={16} /> {shop ? "Gửi lại hồ sơ" : "Gửi đăng ký"}</>}
      </button>
    </form>
  );
}

// Hồ sơ đã gửi (chỉ xem): hiển thị khi shop đang chờ duyệt / đã duyệt / bị khoá
function ShopSummary({ shop }) {
  return (
    <div className="stack">
      <div className="cell-main">
        {shop.logoUrl ? <img className="logo-thumb" src={shop.logoUrl} alt="" />
          : <span className="logo-thumb">{shop.name[0]}</span>}
        <div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{shop.name}</div>
          <div className="cell-sub">{shop.phone} · {shop.pickupAddress}</div>
        </div>
      </div>
      {shop.description && <p className="muted" style={{ whiteSpace: "pre-line" }}>{shop.description}</p>}
      <div className="row">
        {shop.status === "APPROVED" && <Link to="/seller" className="btn btn-primary"><Store size={16} /> Vào Kênh người bán</Link>}
        <Link to="/shops/$shopId" params={{ shopId: String(shop.id) }} className="btn btn-outline">Xem trang shop</Link>
      </div>
    </div>
  );
}

const STEPS = [
  { Icon: FileText, title: "Gửi thông tin shop", text: "Tên shop, mô tả, logo và địa chỉ lấy hàng." },
  { Icon: ShieldCheck, title: "Admin xét duyệt", text: "Kiểm tra thông tin trong 1–2 ngày làm việc." },
  { Icon: Rocket, title: "Bắt đầu bán hàng", text: "Đăng sản phẩm và nhận đơn từ người mua." },
];

export default function RegisterShopPage() {
  const { data: shop, isLoading, isError } = useMyShop();
  const { data: me } = useMe();
  const { data: addresses } = useAddresses();

  if (isLoading) return <div className="center-box"><LoaderCircle className="spin" /> Đang tải…</div>;
  if (isError) return <div className="alert alert-danger"><Ban size={18} /> Không tải được thông tin shop, vui lòng thử lại.</div>;

  const defaultAddress = addresses?.find((a) => a.defaultAddress)?.fullAddress;
  const showForm = !shop || shop.status === "REJECTED";

  return (
    <div className="with-sidebar" style={{ gridTemplateColumns: "1fr 300px" }}>
      <section className="card">
        <div className="card-header">
          <h2 className="row"><Store size={20} color="var(--primary)" /> Đăng ký mở Shop</h2>
        </div>
        <div className="card-body">
          {shop && <StatusBanner shop={shop} />}
          {showForm
            // key đổi khi hồ sơ/địa chỉ tải xong để form nhận giá trị mặc định mới
            ? <ShopForm key={`${shop?.id ?? "new"}-${addresses ? "a" : ""}-${me ? "m" : ""}`}
                        shop={shop} defaults={{ phone: me?.phone, address: defaultAddress }} />
            : <ShopSummary shop={shop} />}
        </div>
      </section>

      <aside className="card card-body">
        <h3>Quy trình mở shop</h3>
        <div className="stack" style={{ gap: 16, marginTop: 8 }}>
          {STEPS.map(({ Icon, title, text }, i) => (
            <div key={title} className="row" style={{ alignItems: "flex-start", gap: 12 }}>
              <span className="icon-chip"><Icon size={16} /></span>
              <div><strong>{i + 1}. {title}</strong><div className="cell-sub">{text}</div></div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
