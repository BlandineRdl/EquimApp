import { View } from "tamagui";

interface ColorIndicatorProps {
  color: string;
  size?: number;
}

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
