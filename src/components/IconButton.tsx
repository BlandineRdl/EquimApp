import type { ComponentType } from "react";
import { Pressable, type PressableProps } from "react-native";

interface LucideIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

interface IconButtonProps extends Omit<PressableProps, "style"> {
  icon: ComponentType<LucideIconProps>;
  variant?: "success" | "error" | "neutral" | "check" | "cancel";
  size?: number;
  iconSize?: number;
  disabled?: boolean;
  strokeWidth?: number;
}

const COLORS = {
  gray100: "#f3f4f6",
  gray300: "#d1d5db",
  gray500: "#6b7280",
  gray600: "#4b5563",
  success100: "#dcfce7",
  success600: "#16a34a",
  error100: "#fee2e2",
  error500: "#ef4444",
};

export function IconButton({
  icon: Icon,
  variant = "neutral",
  size = 36,
  iconSize = 18,
  disabled = false,
  strokeWidth = 2,
  ...props
}: IconButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          backgroundColor: disabled ? COLORS.gray100 : COLORS.success100,
          iconColor: disabled ? COLORS.gray300 : COLORS.success600,
          borderColor: disabled ? COLORS.gray300 : COLORS.success600,
        };
      case "error":
        return {
          backgroundColor: disabled ? COLORS.gray100 : COLORS.error100,
          iconColor: disabled ? COLORS.gray300 : COLORS.error500,
          borderColor: disabled ? COLORS.gray300 : COLORS.error500,
        };
      case "check":
        return {
          backgroundColor: COLORS.gray100,
          iconColor: disabled ? COLORS.gray300 : COLORS.success600,
          borderColor: disabled ? COLORS.gray300 : COLORS.success600,
        };
      case "cancel":
        return {
          backgroundColor: COLORS.gray100,
          iconColor: disabled ? COLORS.gray300 : COLORS.gray500,
          borderColor: disabled ? COLORS.gray300 : COLORS.gray500,
        };
      default:
        return {
          backgroundColor: COLORS.gray100,
          iconColor: disabled ? COLORS.gray300 : COLORS.gray600,
          borderColor: disabled ? COLORS.gray300 : COLORS.gray600,
        };
    }
  };

  const { backgroundColor, iconColor, borderColor } = getVariantStyles();

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor,
        borderWidth: 1,
        borderColor,
        justifyContent: "center",
        alignItems: "center",
        opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        transform: pressed && !disabled ? [{ scale: 0.95 }] : [{ scale: 1 }],
      })}
      {...props}
    >
      <Icon size={iconSize} color={iconColor} strokeWidth={strokeWidth} />
    </Pressable>
  );
}
