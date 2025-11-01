import { type InputProps, Input as TamaguiInput } from "tamagui";

interface AppInputProps extends InputProps {
  error?: boolean;
}

export function Input({ error = false, ...props }: AppInputProps) {
  return (
    <TamaguiInput
      backgroundColor="$backgroundSecondary"
      borderColor={error ? "$error" : "$borderColor"}
      borderWidth={1.5}
      borderRadius="$base"
      paddingHorizontal="$base"
      paddingVertical="$md"
      fontSize="$base"
      color="$color"
      placeholderTextColor="$colorSecondary"
      height="$4xl"
      focusStyle={{
        borderColor: error ? "$error" : "$color",
        borderWidth: 2,
      }}
      {...props}
    />
  );
}
