import { YStack, type YStackProps } from "tamagui";

interface CardProps extends YStackProps {}

export function Card({ children, ...props }: CardProps) {
  return (
    <YStack
      backgroundColor="$background"
      borderRadius="$md"
      padding="$base"
      borderWidth={1}
      borderColor="$borderColor"
      {...props}
    >
      {children}
    </YStack>
  );
}
