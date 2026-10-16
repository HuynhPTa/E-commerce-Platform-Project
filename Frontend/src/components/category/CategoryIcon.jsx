import { Tag } from "lucide-react";
import { CATEGORY_ICONS } from "./categoryIcons";

export default function CategoryIcon({ name, size = 18, ...rest }) {
  const Icon = CATEGORY_ICONS[name] ?? Tag;
  return <Icon size={size} {...rest} />;
}
