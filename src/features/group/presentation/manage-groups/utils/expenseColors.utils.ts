/**
 * Extended color palette for expenses
 * Provides a rich set of colors for visualizing multiple expenses
 */
const EXTENDED_COLOR_PALETTE = [
  "#0ea5e9", // Blue
  "#22c55e", // Green
  "#f59e0b", // Orange
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#f97316", // Deep Orange
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#6366f1", // Indigo
  "#f43f5e", // Rose
  "#10b981", // Emerald
  "#eab308", // Yellow
  "#a855f7", // Violet
  "#3b82f6", // Light Blue
  "#64748b", // Slate
  "#d946ef", // Fuchsia
  "#0891b2", // Dark Cyan
  "#65a30d", // Dark Lime
];

/**
 * Generates a color palette for expense visualization
 * Returns an array of colors to be used in charts and legends
 * If more colors are needed than available, it cycles through the palette
 *
 * @returns Array of color strings (hex values)
 */
export function getExpenseColorPalette(): string[] {
  return EXTENDED_COLOR_PALETTE;
}

/**
 * Gets the color for a specific expense by index
 * Cycles through the palette if index exceeds available colors
 *
 * @param index - The index of the expense
 * @returns The color string (hex value)
 */
export function getExpenseColorByIndex(index: number): string {
  return EXTENDED_COLOR_PALETTE[index % EXTENDED_COLOR_PALETTE.length];
}
