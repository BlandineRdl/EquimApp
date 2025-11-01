import { PieChart } from "react-native-gifted-charts";
import { Text, useTheme, YStack } from "tamagui";
import { Card } from "../../../../../components/Card";

interface ExpenseRatioCardProps {
  expenseRatio: number;
  hasValidCapacity: boolean;
}

export function ExpenseRatioCard({
  expenseRatio,
  hasValidCapacity,
}: ExpenseRatioCardProps) {
  const theme = useTheme();

  // Prepare data for donut chart using theme colors
  const pieData = [
    {
      value: expenseRatio,
      color: theme.primary.val,
    },
    {
      value: 100 - expenseRatio,
      color: theme.borderColor.val,
    },
  ];

  return (
    <Card
      width={280}
      minHeight={180}
      marginRight="$base"
      backgroundColor="$background"
    >
      <YStack gap="$sm" flex={1} alignItems="center">
        <Text fontSize={18} fontWeight="700" color="$color">
          Répartition dépenses/recettes
        </Text>

        {!hasValidCapacity ? (
          <YStack flex={1} justifyContent="center" alignItems="center">
            <Text fontSize={16} color="$colorSecondary">
              N/A
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
                      fontSize={24}
                      fontWeight="700"
                      color={theme.color.val}
                    >
                      {expenseRatio}%
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
