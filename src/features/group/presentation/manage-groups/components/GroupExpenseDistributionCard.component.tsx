import { PieChart } from "react-native-gifted-charts";
import { Text, useTheme, YStack } from "tamagui";
import { Card } from "../../../../../components/Card";
import type { ExpenseDistributionItem } from "../selectors/selectGroupExpenseDistribution.selector";
import { getExpenseColorByIndex } from "../utils/expenseColors.utils";

interface GroupExpenseDistributionCardProps {
  expenseDistribution: ExpenseDistributionItem[];
  expensesCount: number;
}

export function GroupExpenseDistributionCard({
  expenseDistribution,
  expensesCount,
}: GroupExpenseDistributionCardProps) {
  const theme = useTheme();

  // Prepare data for donut chart using consistent color palette
  const pieData = expenseDistribution.map((expense, index) => ({
    value: expense.percentage,
    color: getExpenseColorByIndex(index),
  }));

  return (
    <Card
      width={280}
      minHeight={180}
      marginRight="$base"
      backgroundColor="$background"
    >
      <YStack gap="$sm" flex={1} alignItems="center">
        <Text fontSize={18} fontWeight="700" color="$color">
          Répartition dépenses du foyer /mois
        </Text>

        {expensesCount === 0 ? (
          <YStack flex={1} justifyContent="center" alignItems="center">
            <Text fontSize={16} color="$colorSecondary">
              0 dépenses
            </Text>
          </YStack>
        ) : (
          <YStack flex={1} justifyContent="center" alignItems="center">
            <PieChart
              data={pieData}
              donut
              radius={60}
              innerRadius={45}
              innerCircleColor={theme.background.val}
              centerLabelComponent={() => {
                return (
                  <YStack alignItems="center" justifyContent="center">
                    <Text
                      fontSize={20}
                      fontWeight="700"
                      color={theme.color.val}
                    >
                      {expensesCount}
                    </Text>
                    <Text fontSize={12} color={theme.colorSecondary.val}>
                      dépense{expensesCount > 1 ? "s" : ""}
                    </Text>
                  </YStack>
                );
              }}
            />
          </YStack>
        )}
      </YStack>
    </Card>
  );
}
