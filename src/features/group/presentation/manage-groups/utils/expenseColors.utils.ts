const EXTENDED_COLOR_PALETTE = [
  "#0ea5e9",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
  "#84cc16",
  "#6366f1",
  "#f43f5e",
  "#10b981",
  "#eab308",
  "#a855f7",
  "#3b82f6",
  "#64748b",
  "#d946ef",
  "#0891b2",
  "#65a30d",
];

export function getExpenseColorPalette(): string[] {
  return EXTENDED_COLOR_PALETTE;
}

export function getExpenseColorByIndex(index: number): string {
  return EXTENDED_COLOR_PALETTE[index % EXTENDED_COLOR_PALETTE.length];
}
