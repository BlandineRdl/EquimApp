import { type ButtonProps, Button as TamaguiButton } from "tamagui";

interface AppButtonProps extends Omit<ButtonProps, "variant"> {
  variant?: "primary" | "secondary" | "success" | "error";
}

export function Button({ variant = "primary", ...props }: AppButtonProps) {
  const getVariantProps = () => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: "$primary",
          color: "$white",
          hoverStyle: {
            backgroundColor: "$primaryHover",
          },
          pressStyle: {
            backgroundColor: "$primaryPress",
          },
        };
      case "secondary":
        return {
          backgroundColor: "$backgroundTertiary",
          color: "$color",
          hoverStyle: {
            backgroundColor: "$borderColorHover",
          },
          pressStyle: {
            opacity: 0.7,
          },
        };
      case "success":
        return {
          backgroundColor: "$success",
          color: "$white",
          hoverStyle: {
            backgroundColor: "$successHover",
          },
          pressStyle: {
            opacity: 0.8,
          },
        };
      case "error":
        return {
          backgroundColor: "$error",
          color: "$white",
          hoverStyle: {
            backgroundColor: "$errorHover",
          },
          pressStyle: {
            opacity: 0.8,
          },
        };
    }
  };

  return (
    <TamaguiButton
      size="$4"
      borderRadius="$base"
      fontWeight="$medium"
      {...getVariantProps()}
      {...props}
    />
  );
}
