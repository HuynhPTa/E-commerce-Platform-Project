import { useEffect, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Trash2, TriangleAlert, X } from "lucide-react";
import Modal from "../common/Modal";
import { errMsg } from "../../lib/errors";
import { assetUrl, onImageError } from "../../lib/assetUrl";
import { useDeleteProductImage, useUploadProductImage } from "../../queries/useSellerProducts";

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ACCEPT = ALLOWED_TYPES.join(",");

let pendingSeq = 0;

function DeleteImageModal({ product, image, onClose }) {
  const mutation = useDeleteProductImage();
  return (
    <Modal
      title="Xoá ảnh sản phẩm"
      onClose={onClose}
      width={440}
      footer={
        <>
          <button onClick={onClose}>Huỷ</button>
          <button className="btn-danger" disabled={mutation.isPending}
                  onClick={() => mutation.mutate(
                    { productId: product.id, imageId: image.id },
                    { onSuccess: onClose },
                  )}>
            {mutation.isPending ? <LoaderCircle size={16} className="spin" /> : <Trash2 size={16} />} Xoá
          </button>
        </>
      }
    >
      <p>Xoá ảnh này khỏi sản phẩm? File trên máy chủ cũng bị xoá và không thể khôi phục.</p>
      <div className="image-delete-preview">
        <img src={assetUrl(image.url)} alt="" onError={onImageError} />
      </div>
      {mutation.isError && <div className="alert alert-danger"><TriangleAlert size={18} /><div>{errMsg(mutation.error)}</div></div>}
    </Modal>
  );
}

export default function ImageManager({ product, disabled = false }) {
  const uploadMutation = useUploadProductImage();
  const [pending, setPending] = useState([]); // [{ id, file, previewUrl, status, error }]
  const [notice, setNotice] = useState("");
  const [deleting, setDeleting] = useState(null);
  const inputRef = useRef(null);
  const pendingRef = useRef(pending);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  // Giải phóng URL xem trước khi rời trang
  useEffect(() => () => {
    pendingRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  }, []);

  const images = product.images ?? [];
  const uploading = pending.some((item) => item.status === "waiting" || item.status === "uploading");
  const atLimit = images.length + pending.length >= MAX_IMAGES;

  function removePending(id) {
    setPending((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  async function handleFiles(event) {
    const files = Array.from(event.target.files ?? []);
    if (inputRef.current) inputRef.current.value = "";
    if (!files.length) return;

    setNotice("");
    const remaining = Math.max(0, MAX_IMAGES - images.length - pending.length);
    const issues = [];
    const accepted = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        issues.push(`${file.name}: chỉ nhận JPEG/PNG/WEBP/GIF.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        issues.push(`${file.name}: vượt quá 5 MB.`);
        continue;
      }
      if (accepted.length >= remaining) {
        issues.push(`Chỉ còn ${remaining} vị trí ảnh (tối đa ${MAX_IMAGES} ảnh/sản phẩm).`);
        break;
      }
      accepted.push(file);
    }

    if (issues.length) setNotice(issues.join(" "));
    if (!accepted.length) return;

    const items = accepted.map((file) => ({
      id: `pending-${Date.now()}-${pendingSeq++}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: "waiting",
      error: "",
    }));
    setPending((prev) => [...prev, ...items]);

    // Upload tuần tự, chỉ hiển thị ảnh thật sau khi server trả thành công.
    // Không optimistic update.
    for (const item of items) {
      setPending((prev) => prev.map((p) => (p.id === item.id ? { ...p, status: "uploading" } : p)));
      try {
        await uploadMutation.mutateAsync({ productId: product.id, file: item.file });
        URL.revokeObjectURL(item.previewUrl);
        setPending((prev) => prev.filter((p) => p.id !== item.id));
      } catch (err) {
        setPending((prev) => prev.map((p) => (p.id === item.id
          ? { ...p, status: "error", error: errMsg(err) }
          : p)));
      }
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h3>Ảnh sản phẩm</h3>
          <div className="cell-sub">
            {images.length}/{MAX_IMAGES} ảnh · ảnh đầu tiên tự động làm ảnh bìa nếu chưa có
          </div>
        </div>
      </div>

      <div className="card-body">
        {notice && <div className="alert alert-warning"><TriangleAlert size={18} /><div>{notice}</div></div>}

        {images.length === 0 && pending.length === 0 && (
          <p className="muted">Chưa có ảnh nào. Thêm ảnh để người mua xem sản phẩm rõ hơn.</p>
        )}

        <div className="image-grid">
          {images.map((image) => (
            <figure className="image-tile" key={image.id}>
              <img src={assetUrl(image.url)} alt="" onError={onImageError} />
              {image.url === product.thumbnailUrl && <span className="image-badge">Ảnh bìa</span>}
              <button type="button" className="image-remove" title="Xoá ảnh" disabled={disabled}
                      onClick={() => setDeleting(image)}>
                <X size={14} />
              </button>
            </figure>
          ))}

          {pending.map((item) => (
            <figure className={`image-tile is-pending${item.status === "error" ? " has-error" : ""}`} key={item.id}>
              <img src={item.previewUrl} alt="" />
              <figcaption className="image-status" title={item.error || undefined}>
                {item.status === "uploading" || item.status === "waiting" ? (
                  <><LoaderCircle size={14} className="spin" /> Đang tải lên…</>
                ) : (
                  <><TriangleAlert size={14} /> {item.error}</>
                )}
              </figcaption>
              {item.status === "error" && (
                <button type="button" className="image-remove" title="Bỏ ảnh lỗi"
                        onClick={() => removePending(item.id)}>
                  <X size={14} />
                </button>
              )}
            </figure>
          ))}
        </div>

        {!disabled && !atLimit && (
          <label className={`image-upload-zone${uploading ? " disabled" : ""}`}>
            <ImagePlus size={22} />
            <span>
              <strong>Chọn ảnh để tải lên</strong>
              <span className="cell-sub">Có thể chọn nhiều file · JPEG/PNG/WEBP/GIF · tối đa 5 MB/ảnh</span>
            </span>
            <input ref={inputRef} type="file" accept={ACCEPT} multiple hidden
                   disabled={uploading} onChange={handleFiles} />
          </label>
        )}
        {!disabled && atLimit && (
          <p className="hint">Đã đạt giới hạn {MAX_IMAGES} ảnh. Xoá bớt ảnh nếu muốn thêm.</p>
        )}
      </div>

      {deleting && <DeleteImageModal product={product} image={deleting} onClose={() => setDeleting(null)} />}
    </section>
  );
}
