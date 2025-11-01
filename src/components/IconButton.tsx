import type { ComponentType } from "react";
import { Pressable, type PressableProps } from "react-native";
import { useTheme } from "tamagui";

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

export function IconButton({
  icon: Icon,
  variant = "neutral",
  size = 36,
  iconSize = 18,
  disabled = false,
  strokeWidth = 2,
  ...props
}: IconButtonProps) {
  const theme = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          backgroundColor: disabled ? theme.gray100.val : theme.success100.val,
          iconColor: disabled ? theme.gray300.val : theme.success600.val,
          borderColor: disabled ? theme.gray300.val : theme.success600.val,
        };
      case "error":
        return {
          backgroundColor: disabled ? theme.gray100.val : theme.error100.val,
          iconColor: disabled ? theme.gray300.val : theme.error500.val,
          borderColor: disabled ? theme.gray300.val : theme.error500.val,
        };
      case "check":
        return {
          backgroundColor: theme.gray100.val,
          iconColor: disabled ? theme.gray300.val : theme.success600.val,
          borderColor: disabled ? theme.gray300.val : theme.success600.val,
        };
      case "cancel":
        return {
          backgroundColor: theme.gray100.val,
          iconColor: disabled ? theme.gray300.val : theme.gray500.val,
          borderColor: disabled ? theme.gray300.val : theme.gray500.val,
        };
      default:
        return {
          backgroundColor: theme.gray100.val,
          iconColor: disabled ? theme.gray300.val : theme.gray600.val,
          borderColor: disabled ? theme.gray300.val : theme.gray600.val,
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
