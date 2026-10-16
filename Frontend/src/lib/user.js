// Chữ viết tắt cho avatar: "Nguyễn Văn An" -> "VA"
export function initials(me) {
  const name = `${me?.firstName ?? ""} ${me?.lastName ?? ""}`.trim() || me?.email || "?";
  return name.split(/\s+/).map((w) => w[0]).slice(-2).join("").toUpperCase();
}

export function displayName(me) {
  return `${me?.firstName ?? ""} ${me?.lastName ?? ""}`.trim() || me?.email || "";
}
