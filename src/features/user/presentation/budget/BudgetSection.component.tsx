import { ScrollView } from "react-native";
import { useSelector } from "react-redux";
import { Text, YStack } from "tamagui";
import { ExpenseRatioCard } from "./components/ExpenseRatioCard.component";
import { GroupSharesCard } from "./components/GroupSharesCard.component";
import { RemainingBudgetCard } from "./components/RemainingBudgetCard.component";
import { selectUserBudgetSummary } from "./selectors/selectUserBudgetSummary.selector";

export function BudgetSection() {
  const budgetSummary = useSelector(selectUserBudgetSummary);

  if (!budgetSummary) {
    return null;
  }

  const {
    groupShares,
    remainingBudget,
    expenseRatio,
    isHealthy,
    hasGroups,
    hasValidCapacity,
  } = budgetSummary;

  return (
    <YStack gap="$base" marginBottom="$xl">
      <Text fontSize={20} fontWeight="700" color="$color">
        Mon budget
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 16 }}
      >
        <GroupSharesCard groupShares={groupShares} hasGroups={hasGroups} />
        <RemainingBudgetCard
          remainingBudget={remainingBudget}
          isHealthy={isHealthy}
        />
        <ExpenseRatioCard
          expenseRatio={expenseRatio}
          hasValidCapacity={hasValidCapacity}
        />
      </ScrollView>
    </YStack>
  );
}
