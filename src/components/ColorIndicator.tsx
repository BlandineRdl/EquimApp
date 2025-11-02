import { View } from "tamagui";

interface ColorIndicatorProps {
  color: string;
  size?: number;
}

/**
 * Generic color indicator component
 * Displays a circular colored dot, typically used for legends or visual associations
 *
 * @param color - The hex color code to display
 * @param size - The diameter of the indicator in pixels (default: 12)
 */
export function ColorIndicator({ color, size = 12 }: ColorIndicatorProps) {
  return (
    <View
      width={size}
      height={size}
      borderRadius={size / 2}
      backgroundColor={color}
    />
  );
}
