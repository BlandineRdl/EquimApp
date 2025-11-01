import { Calendar } from "lucide-react-native";
import { Text, XStack, YStack } from "tamagui";

interface GroupStatsSectionProps {
  totalBudget: number;
  expensesCount: number;
  iconSecondary: string;
}

export const GroupStatsSection = ({
  totalBudget,
  expensesCount,
  iconSecondary,
}: GroupStatsSectionProps) => {
  return (
    <YStack
      backgroundColor="$backgroundSecondary"
      borderRadius="$md"
      padding="$lg"
      marginTop="$base"
      marginBottom="$lg"
      borderWidth={1}
      borderColor="$borderColor"
    >
      <XStack justifyContent="space-between" alignItems="center">
        <XStack alignItems="center">
          <Calendar size={16} color={iconSecondary} />
          <Text fontSize={16} fontWeight="500" color="$color" marginLeft="$xs">
            Total mensuel
          </Text>
        </XStack>
        <YStack alignItems="flex-end">
          <Text fontSize={24} fontWeight="700" color="$color" marginBottom={2}>
            {totalBudget.toLocaleString("fr-FR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            €
          </Text>
          <Text fontSize={14} color="$colorSecondary">
            {expensesCount} dépenses
          </Text>
        </YStack>
      </XStack>
    </YStack>
  );
};
