import { X } from "lucide-react-native";
import type React from "react";
import { Modal, Pressable } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { ExpenseManager } from "../../../../../components/expense/ExpenseManager.component";
import { getTextColor } from "../../../../../constants/theme.constants";
import { useThemeControl } from "../../../../../lib/tamagui/theme-provider";
import type { Expense } from "../../../domain/manage-group/group.model";

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  expenses: Expense[];
  onAdd: (name: string, amount: number) => Promise<void>;
  onEdit: (expenseId: string, name: string, amount: number) => Promise<void>;
  onDelete: (expenseId: string) => Promise<void>;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  visible,
  onClose,
  expenses,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const { theme } = useThemeControl();
  const iconColor = getTextColor(theme);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
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
            Dépenses du groupe
          </Text>
          <Pressable onPress={onClose}>
            <X size={24} color={iconColor} />
          </Pressable>
        </XStack>

        {/* Content */}
        <YStack flex={1} padding="$base">
          <ExpenseManager
            expenses={expenses.map((exp) => ({
              id: exp.id,
              label: exp.name,
              amount: exp.amount,
            }))}
            onAdd={onAdd}
            onEdit={onEdit}
            onDelete={onDelete}
            minExpenses={0}
            title="Dépenses du groupe"
            addSectionTitle="Ajouter une dépense"
            requireConfirmation={true}
            confirmationMessage="Cette dépense sera définitivement supprimée. Les quotes-parts seront recalculées automatiquement pour tous les membres du groupe."
          />
        </YStack>
      </YStack>
    </Modal>
  );
};
