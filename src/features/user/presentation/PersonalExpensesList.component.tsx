import { Plus } from "lucide-react-native";
import { Pressable } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { Card } from "../../../components/Card";
import type { PersonalExpense } from "../domain/manage-personal-expenses/personal-expense";

interface PersonalExpensesListProps {
  expenses: PersonalExpense[];
  onManagePress: () => void;
}

export function PersonalExpensesList({
  expenses,
  onManagePress,
}: PersonalExpensesListProps) {
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <Card marginBottom="$base" backgroundColor="$backgroundSecondary">
      <XStack justifyContent="space-between" alignItems="flex-start">
        <YStack flex={1}>
          <Text fontSize={12} color="$colorSecondary" marginBottom="$xs">
            Charges personnelles
          </Text>
          {expenses.length === 0 ? (
            <Text
              fontSize={14}
              color="$colorSecondary"
              fontStyle="italic"
              marginTop="$xs"
            >
              Aucune charge définie
            </Text>
          ) : (
            <>
              {expenses.map((expense) => (
                <XStack
                  key={expense.id}
                  justifyContent="space-between"
                  alignItems="center"
                  paddingVertical="$xs"
                  borderBottomWidth={1}
                  borderBottomColor="$borderColor"
                >
                  <Text fontSize={14} color="$color">
                    {expense.label}
                  </Text>
                  <Text fontSize={14} fontWeight="600" color="$color">
                    {expense.amount.toLocaleString("fr-FR")} €
                  </Text>
                </XStack>
              ))}
              <XStack
                justifyContent="space-between"
                alignItems="center"
                paddingTop="$sm"
                marginTop="$xs"
                borderTopWidth={1}
                borderTopColor="$borderColor"
              >
                <Text fontSize={14} fontWeight="600" color="$color">
                  Total
                </Text>
                <Text fontSize={16} fontWeight="700" color="$error">
                  - {totalExpenses.toLocaleString("fr-FR")} €
                </Text>
              </XStack>
            </>
          )}
        </YStack>
        <Pressable onPress={onManagePress} style={{ marginLeft: 12 }}>
          <YStack
            width="$3xl"
            height="$3xl"
            borderRadius={20}
            backgroundColor="$success100"
            justifyContent="center"
            alignItems="center"
          >
            <Plus size={20} color="#16a34a" />
          </YStack>
        </Pressable>
      </XStack>
    </Card>
  );
}
