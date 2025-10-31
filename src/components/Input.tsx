import { type InputProps, Input as TamaguiInput } from "tamagui";

interface AppInputProps extends InputProps {
  error?: boolean;
}

export function Input({ error = false, ...props }: AppInputProps) {
  return (
    <TamaguiInput
      backgroundColor="$background"
      borderColor={error ? "$error" : "$borderColor"}
      borderWidth={1}
      borderRadius="$base"
      paddingHorizontal="$base"
      paddingVertical="$md"
      fontSize="$base"
      color="$color"
      placeholderTextColor="$colorTertiary"
      focusStyle={{
        borderColor: error ? "$error" : "$gray900",
        borderWidth: 2,
      }}
      {...props}
    />
  );
}
