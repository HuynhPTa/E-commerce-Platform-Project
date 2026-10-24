import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CircleAlert, CircleCheck, ImageOff, LoaderCircle, MapPin, Phone, Save, Store,
} from "lucide-react";
import { shopSchema } from "../../schemas/shop.schema";
import { useMyShop, useUpdateMyShop } from "../../queries/useShops";
import ShopStatusBadge from "../../components/shop/ShopStatusBadge";
import { errMsg, formatDate } from "../../lib/errors";
import { assetUrl, onImageError } from "../../lib/assetUrl";

function toFormValues(shop) {
  return {
    name: shop.name ?? "",
    description: shop.description ?? "",
    logoUrl: shop.logoUrl ?? "",
    phone: shop.phone ?? "",
    pickupAddress: shop.pickupAddress ?? "",
    // shopSchema dùng chung với trang đăng ký nên vẫn yêu cầu trường này;
    // ở trang cài đặt shop đã tồn tại nên mặc định đồng ý.
    agree: true,
  };
}

export default function SellerSettingsPage() {
  const { data: shop } = useMyShop(); // đã có trong cache từ SellerLayout
  const mutation = useUpdateMyShop();
  const [saved, setSaved] = useState(false);
  const {
    register, handleSubmit, reset, control, formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(shopSchema),
    defaultValues: shop ? toFormValues(shop) : {},
  });

  // Hook phải gọi trước mọi early return để không đổi thứ tự hook giữa các lần render.
  const logoUrl = useWatch({ control, name: "logoUrl" });

  if (!shop) return null;

  const onSubmit = (values) => {
    setSaved(false);
    const payload = { ...values };
    delete payload.agree; // agree chỉ phục vụ validate phía form
    mutation.mutate(payload, {
      onSuccess: (updated) => {
        reset(toFormValues(updated));
        setSaved(true);
      },
    });
  };

  return (
    <div className="settings-layout">
      <section className="card">
        <div className="card-header">
          <h3>Thông tin shop</h3>
          <span className="cell-sub">Cập nhật lần cuối: {formatDate(shop.reviewedAt ?? shop.createdAt)}</span>
        </div>
        <form className="card-body" onSubmit={handleSubmit(onSubmit)} noValidate>
          {saved && (
            <div className="alert alert-success">
              <CircleCheck size={18} />
              <div><strong>Đã lưu thay đổi</strong>Thông tin shop đã được cập nhật.</div>
            </div>
          )}
          {mutation.isError && (
            <div className="alert alert-danger">
              <CircleAlert size={18} />
              <div>{errMsg(mutation.error, "Không lưu được thông tin shop.")}</div>
            </div>
          )}

          <div className="field">
            <label className="required" htmlFor="shop-name">Tên shop</label>
            <input id="shop-name" {...register("name")} placeholder="Tên shop hiển thị với người mua" />
            {errors.name && <div className="error">{errors.name.message}</div>}
            <div className="hint">Đổi tên shop cũng cập nhật tên shop trên toàn bộ sản phẩm đang bán.</div>
          </div>

          <div className="field">
            <label htmlFor="shop-description">Mô tả shop</label>
            <textarea id="shop-description" rows={5} {...register("description")}
                      placeholder="Giới thiệu về shop, thế mạnh, chính sách bán hàng…" />
            {errors.description && <div className="error">{errors.description.message}</div>}
          </div>

          <div className="field">
            <label htmlFor="shop-logo">Logo shop (URL)</label>
            <div className="logo-preview">
              <span className="box">
                {logoUrl ? (
                  <img src={assetUrl(logoUrl)} alt="" onError={onImageError} />
                ) : <ImageOff size={24} />}
              </span>
              <div style={{ flex: 1 }}>
                <input id="shop-logo" {...register("logoUrl")} placeholder="https://…" />
                {errors.logoUrl && <div className="error">{errors.logoUrl.message}</div>}
                <div className="hint">Dán đường dẫn ảnh công khai. Để trống nếu chưa có logo.</div>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label className="required" htmlFor="shop-phone">Số điện thoại</label>
              <input id="shop-phone" {...register("phone")} placeholder="0901234567" />
              {errors.phone && <div className="error">{errors.phone.message}</div>}
            </div>
            <div className="field">
              <label className="required" htmlFor="shop-address">Địa chỉ lấy hàng</label>
              <input id="shop-address" {...register("pickupAddress")} placeholder="Số nhà, đường, phường, quận…" />
              {errors.pickupAddress && <div className="error">{errors.pickupAddress.message}</div>}
            </div>
          </div>

          <div className="row">
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending || !isDirty}>
              {mutation.isPending ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />}
              Lưu thay đổi
            </button>
            <button type="button" className="btn" disabled={mutation.isPending || !isDirty}
                    onClick={() => { reset(toFormValues(shop)); setSaved(false); mutation.reset(); }}>
              Hoàn tác
            </button>
            <span className="spacer" />
            <span className="cell-sub">Trạng thái duyệt không thay đổi khi sửa thông tin.</span>
          </div>
        </form>
      </section>

      <aside className="stack">
        <section className="card">
          <div className="card-header"><h3>Trạng thái shop</h3></div>
          <div className="card-body stack">
            <div className="cell-main">
              {shop.logoUrl
                ? <img className="logo-thumb" style={{ width: 56, height: 56 }} src={assetUrl(shop.logoUrl)}
                       alt="" onError={onImageError} />
                : <span className="logo-thumb" style={{ width: 56, height: 56, fontSize: 22 }}>{shop.name[0]}</span>}
              <div>
                <strong>{shop.name}</strong>
                <div className="cell-sub">Mã shop #{shop.id}</div>
              </div>
            </div>
            <div><ShopStatusBadge status={shop.status} /></div>
            <div className="row"><Phone size={15} className="muted" /> {shop.phone}</div>
            <div className="row"><MapPin size={15} className="muted" /> {shop.pickupAddress}</div>
          </div>
        </section>
        <section className="card">
          <div className="card-body stack" style={{ gap: 8 }}>
            <div className="row"><Store size={16} className="muted" /> Shop đã được duyệt và đang hoạt động.</div>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              Nếu cần đổi trạng thái hoặc báo cáo vi phạm, vui lòng liên hệ quản trị viên MarketHub.
            </p>
          </div>
        </section>
      </aside>
    </div>
  );
}
