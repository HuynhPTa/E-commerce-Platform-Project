import { orderStatusMeta } from "./orderStatus";

export default function OrderStatusBadge({ status }) {
  const meta = orderStatusMeta(status);
  return <span className={`badge badge-${meta.tone}`}>{meta.label}</span>;
}
