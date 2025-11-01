import { Text, YStack } from "tamagui";
import { Card } from "../../../../../components/Card";

interface GroupTotalExpenseCardProps {
  totalExpenses: number;
}

export function GroupTotalExpenseCard({
  totalExpenses,
}: GroupTotalExpenseCardProps) {
  const displayAmount = totalExpenses.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedAmount = `${displayAmount}€`;

  return (
    <Card
      width={280}
      minHeight={180}
      marginRight="$base"
      backgroundColor="$background"
    >
      <YStack gap="$sm" flex={1}>
        <Text fontSize={18} fontWeight="700" color="$color">
          Montant dépense total du foyer /mois
        </Text>

        <YStack flex={1} justifyContent="center" alignItems="center">
          <Text fontSize={36} fontWeight="700" color="$color">
            {formattedAmount}
          </Text>
        </YStack>
      </YStack>
    </Card>
  );
}
