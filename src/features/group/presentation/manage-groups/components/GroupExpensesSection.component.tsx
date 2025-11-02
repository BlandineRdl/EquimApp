import { Plus, Trash2 } from "lucide-react-native";
import { Pressable } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { ColorIndicator } from "../../../../../components/ColorIndicator";
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
  iconColor: string;
  iconError: string;
  onAddExpense: () => void;
  onDeleteExpense: (expenseId: string) => void;
  onShowAll: () => void;
  onShowLess: () => void;
}

export const GroupExpensesSection = ({
  expenses,
  expensesCount,
  showAllExpenses,
  iconColor,
  iconError,
  onAddExpense,
  onDeleteExpense,
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
        <Pressable onPress={onAddExpense}>
          <YStack
            backgroundColor="$backgroundTertiary"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius={8}
            padding="$xs"
          >
            <Plus size={16} color={iconColor} />
          </YStack>
        </Pressable>
      </XStack>

      {displayedExpenses.map((expense, index) => {
        // Get the original index from the full expenses array to maintain color consistency
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
              <XStack alignItems="center">
                <Text
                  fontSize={16}
                  fontWeight="600"
                  color="$color"
                  marginRight="$xs"
                >
                  {expense.amount.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  €
                </Text>
                <Pressable
                  onPress={() => onDeleteExpense(expense.id)}
                  style={{ padding: 4 }}
                >
                  <Trash2 size={16} color={iconError} />
                </Pressable>
              </XStack>
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
