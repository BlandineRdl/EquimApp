import { type ButtonProps, Button as TamaguiButton } from "tamagui";

interface AppButtonProps extends Omit<ButtonProps, "variant"> {
  variant?: "primary" | "secondary" | "success" | "error";
}

export function Button({ variant = "primary", ...props }: AppButtonProps) {
  const getVariantProps = () => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: "$success",
          color: "$white",
          hoverStyle: {
            backgroundColor: "$successHover",
          },
          pressStyle: {
            backgroundColor: "$successHover",
            scale: 0.98,
          },
          disabledStyle: {
            backgroundColor: "$gray400",
            color: "$gray200",
          },
        };
      case "secondary":
        return {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: "$borderColor",
          color: "$color",
          hoverStyle: {
            backgroundColor: "$backgroundSecondary",
            borderColor: "$borderColorHover",
          },
          pressStyle: {
            backgroundColor: "$backgroundTertiary",
            scale: 0.98,
          },
          disabledStyle: {
            borderColor: "$borderColor",
            color: "$colorTertiary",
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
            backgroundColor: "$successHover",
            scale: 0.98,
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
            backgroundColor: "$errorHover",
            scale: 0.98,
          },
        };
    }
  };

  return (
    <TamaguiButton
      height="$14"
      borderRadius="$base"
      fontWeight="$semibold"
      fontSize="$base"
      paddingHorizontal="$lg"
      {...getVariantProps()}
      {...props}
    />
  );
}
