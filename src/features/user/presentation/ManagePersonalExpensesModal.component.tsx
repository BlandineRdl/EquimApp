import { X } from "lucide-react-native";
import { KeyboardAvoidingView, Modal, Platform } from "react-native";
import { useSelector } from "react-redux";
import { Text, XStack, YStack } from "tamagui";
import { Button } from "../../../components/Button";
import { ExpenseManager } from "../../../components/expense/ExpenseManager.component";
import { useThemeControl } from "../../../lib/tamagui/theme-provider";
import { useAppDispatch } from "../../../store/buildReduxStore";
import { addPersonalExpense } from "../usecases/addPersonalExpense.usecase";
import { deletePersonalExpense } from "../usecases/deletePersonalExpense.usecase";
import { updatePersonalExpense } from "../usecases/updatePersonalExpense.usecase";
import { selectPersonalExpenses } from "./selectors/selectPersonalExpenses.selector";

interface ManagePersonalExpensesModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export function ManagePersonalExpensesModal({
  isVisible,
  onClose,
}: ManagePersonalExpensesModalProps) {
  const dispatch = useAppDispatch();
  const expenses = useSelector(selectPersonalExpenses);
  const { theme } = useThemeControl();
  const iconColor = theme === "light" ? "#111827" : "#ffffff";

  const handleAddExpense = async (label: string, amount: number) => {
    await dispatch(
      addPersonalExpense({
        label,
        amount,
      }),
    ).unwrap();
  };

  const handleEditExpense = async (
    id: string,
    label: string,
    amount: number,
  ) => {
    await dispatch(
      updatePersonalExpense({
        id,
        label,
        amount,
      }),
    ).unwrap();
  };

  const handleDeleteExpense = async (id: string) => {
    await dispatch(deletePersonalExpense(id)).unwrap();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <YStack flex={1} backgroundColor="$background">
          {/* Header */}
          <XStack
            alignItems="center"
            justifyContent="space-between"
            paddingHorizontal="$base"
            paddingVertical="$base"
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
          >
            <Text fontSize={18} fontWeight="600" color="$color">
              Gérer mes charges
            </Text>
            <Button
              variant="secondary"
              width="$2xl"
              height="$2xl"
              padding={0}
              borderRadius="$base"
              onPress={onClose}
            >
              <X size={24} color={iconColor} />
            </Button>
          </XStack>

          {/* Content */}
          <YStack flex={1} padding="$base">
            <ExpenseManager
              expenses={expenses.map((exp) => ({
                id: exp.id,
                label: exp.label,
                amount: exp.amount,
              }))}
              onAdd={handleAddExpense}
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
              minExpenses={1}
              title="Mes charges"
              addSectionTitle="Ajouter une charge"
            />
          </YStack>
        </YStack>
      </KeyboardAvoidingView>
    </Modal>
  );
}
