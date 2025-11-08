import { Plus } from "lucide-react-native";
import { Pressable } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { ColorIndicator } from "../../../../../components/ColorIndicator";
import { IconButton } from "../../../../../components/IconButton";
import { getExpenseColorByIndex } from "../utils/expenseColors.utils";

interface Expense {
  id: string;
  name: string;
  amount: number;
}

interface GroupExpensesSectionProps {
  expenses: Expense[];
  expensesCount: number;
  showAllExpenses: boolean;
  onAddExpense: () => void;
  onShowAll: () => void;
  onShowLess: () => void;
}

export const GroupExpensesSection = ({
  expenses,
  expensesCount,
  showAllExpenses,
  onAddExpense,
  onShowAll,
  onShowLess,
}: GroupExpensesSectionProps) => {
  const displayedExpenses = showAllExpenses ? expenses : expenses.slice(0, 1);

  return (
    <YStack
      backgroundColor="$backgroundSecondary"
      borderRadius="$md"
      padding="$lg"
      marginBottom="$lg"
      borderWidth={1}
      borderColor="$borderColor"
    >
      <XStack
        justifyContent="space-between"
        alignItems="center"
        marginBottom="$base"
      >
        <Text fontSize={16} fontWeight="600" color="$color">
          Dépenses configurées ({expensesCount})
        </Text>
        <IconButton
          icon={Plus}
          variant="success"
          size={32}
          iconSize={16}
          onPress={onAddExpense}
        />
      </XStack>

      {displayedExpenses.map((expense, index) => {
        const originalIndex = expenses.findIndex((e) => e.id === expense.id);
        const expenseColor = getExpenseColorByIndex(originalIndex);

        return (
          <YStack
            key={expense.id}
            paddingVertical="$sm"
            borderBottomWidth={index < displayedExpenses.length - 1 ? 1 : 0}
            borderBottomColor="$borderColor"
            marginBottom={index < displayedExpenses.length - 1 ? "$sm" : 0}
          >
            <XStack justifyContent="space-between" alignItems="center">
              <XStack flex={1} alignItems="center" gap="$xs">
                <ColorIndicator color={expenseColor} size={12} />
                <Text fontSize={16} fontWeight="500" color="$color">
                  {expense.name}
                </Text>
              </XStack>
              <Text fontSize={16} fontWeight="600" color="$color">
                {expense.amount.toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                €
              </Text>
            </XStack>
          </YStack>
        );
      })}

      {expenses.length > 1 && !showAllExpenses && (
        <Pressable onPress={onShowAll}>
          <YStack
            paddingVertical="$base"
            alignItems="center"
            borderTopWidth={1}
            borderTopColor="$borderColor"
            marginTop="$xs"
          >
            <Text fontSize={14} color="$colorSecondary" fontWeight="500">
              Voir plus ({expenses.length - 1} autres)
            </Text>
          </YStack>
        </Pressable>
      )}

      {expenses.length > 1 && showAllExpenses && (
        <Pressable onPress={onShowLess}>
          <YStack
            paddingVertical="$base"
            alignItems="center"
            borderTopWidth={1}
            borderTopColor="$borderColor"
            marginTop="$xs"
          >
            <Text fontSize={14} color="$colorSecondary" fontWeight="500">
              Voir moins
            </Text>
          </YStack>
        </Pressable>
      )}
    </YStack>
  );
};
