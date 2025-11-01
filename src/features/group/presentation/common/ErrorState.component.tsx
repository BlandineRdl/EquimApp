import { Text, YStack } from "tamagui";

interface ErrorStateProps {
  message: string;
}

export const ErrorState = ({ message }: ErrorStateProps) => {
  return (
    <YStack flex={1} justifyContent="center" alignItems="center">
      <Text fontSize={16} color="$error">
        {message}
      </Text>
    </YStack>
  );
};
