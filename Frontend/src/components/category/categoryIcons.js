import {
  Smartphone, Laptop, Shirt, ShoppingBag, Footprints, Sofa, Sparkles, BookOpen, Dumbbell,
  Headphones, Monitor, Tv, Watch, Camera, Gamepad2, Baby, Car, Bike, PawPrint, Gift,
  Utensils, Heart, House, Package,
} from "lucide-react";

// DB chỉ lưu tên icon (vd "Smartphone"); chỉ các icon trong danh sách này được dùng,
// tránh import toàn bộ thư viện lucide vào bundle.
export const CATEGORY_ICONS = {
  Smartphone, Laptop, Shirt, ShoppingBag, Footprints, Sofa, Sparkles, BookOpen, Dumbbell,
  Headphones, Monitor, Tv, Watch, Camera, Gamepad2, Baby, Car, Bike, PawPrint, Gift,
  Utensils, Heart, House, Package,
};

export const ICON_NAMES = Object.keys(CATEGORY_ICONS);
