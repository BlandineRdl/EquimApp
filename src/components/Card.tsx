import { YStack, type YStackProps } from "tamagui";

interface CardProps extends YStackProps {
  elevated?: boolean;
}

export function Card({ elevated = false, children, ...props }: CardProps) {
  return (
    <YStack
      backgroundColor="$background"
      borderRadius="$md"
      padding="$base"
      borderWidth={1}
      borderColor="$borderColor"
      {...(elevated && {
        shadowColor: "$black",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      })}
      {...props}
    >
      {children}
    </YStack>
  );
}
