import { Text, YStack } from "tamagui";

interface LoadingStateProps {
  message?: string;
}

export const LoadingState = ({
  message = "Chargement...",
}: LoadingStateProps) => {
  return (
    <YStack flex={1} justifyContent="center" alignItems="center">
      <Text fontSize={16} color="$colorSecondary">
        {message}
      </Text>
    </YStack>
  );
};
