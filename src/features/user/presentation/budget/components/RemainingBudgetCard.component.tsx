import { Text, YStack } from "tamagui";
import { Card } from "../../../../../components/Card";

interface RemainingBudgetCardProps {
  remainingBudget: number;
  isHealthy: boolean;
}

export function RemainingBudgetCard({
  remainingBudget,
  isHealthy,
}: RemainingBudgetCardProps) {
  const displayAmount = Math.abs(remainingBudget).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const formattedAmount =
    remainingBudget < 0 ? `-${displayAmount}€` : `${displayAmount}€`;

  return (
    <Card
      width={280}
      minHeight={180}
      marginRight="$base"
      backgroundColor="$background"
    >
      <YStack gap="$sm" flex={1}>
        <Text fontSize={18} fontWeight="700" color="$color">
          Mon reste à vivre
        </Text>

        <YStack flex={1} justifyContent="center" alignItems="center">
          <Text
            fontSize={36}
            fontWeight="700"
            color={isHealthy ? "$color" : "$error"}
          >
            {formattedAmount}
          </Text>
        </YStack>
      </YStack>
    </Card>
  );
}
