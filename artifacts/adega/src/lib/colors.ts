export const CATEGORY_COLORS = [
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-emerald-100 text-emerald-800 border-emerald-200",
  "bg-violet-100 text-violet-800 border-violet-200",
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-rose-100 text-rose-800 border-rose-200",
  "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
  "bg-cyan-100 text-cyan-800 border-cyan-200",
  "bg-orange-100 text-orange-800 border-orange-200",
];

export function getCategoryColor(id?: number) {
  if (!id) return "bg-slate-100 text-slate-800 border-slate-200";
  return CATEGORY_COLORS[id % CATEGORY_COLORS.length];
}

export function getStockStatusBadge(status: string) {
  switch (status) {
    case "ok": return { label: "OK", className: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    case "low": return { label: "Baixo", className: "bg-amber-100 text-amber-800 border-amber-200" };
    case "out": return { label: "Esgotado", className: "bg-rose-100 text-rose-800 border-rose-200" };
    default: return { label: status, className: "bg-slate-100 text-slate-800 border-slate-200" };
  }
}

export function getMovementTypeBadge(type: string) {
  switch (type) {
    case "entry": return { label: "Entrada", className: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    case "exit": return { label: "Saída", className: "bg-blue-100 text-blue-800 border-blue-200" };
    case "sale": return { label: "Venda", className: "bg-violet-100 text-violet-800 border-violet-200" };
    case "loss": return { label: "Perda", className: "bg-rose-100 text-rose-800 border-rose-200" };
    case "adjustment": return { label: "Ajuste", className: "bg-amber-100 text-amber-800 border-amber-200" };
    default: return { label: type, className: "bg-slate-100 text-slate-800 border-slate-200" };
  }
}
