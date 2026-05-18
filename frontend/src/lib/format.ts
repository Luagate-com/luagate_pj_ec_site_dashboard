// 数値・日付フォーマット小ヘルパ

export function formatYen(value: number): string {
  return `¥${value.toLocaleString("ja-JP")}`;
}

export function formatYenCompact(value: number): string {
  if (Math.abs(value) >= 10000) {
    const man = value / 10000;
    return `${man.toLocaleString("ja-JP", { maximumFractionDigits: 1 })}万円`;
  }
  return formatYen(value);
}

export function formatNumber(value: number): string {
  return value.toLocaleString("ja-JP");
}

export function formatDelta(value: number, prefix = ""): string {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${prefix}${Math.abs(value).toLocaleString("ja-JP")}`;
}

export function formatDateTimeJa(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
}
