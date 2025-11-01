import { Check, Edit3, Plus, Trash2, X } from "lucide-react-native";
import { useState } from "react";
import Toast from "react-native-toast-message";
import { ScrollView, Text, XStack, YStack } from "tamagui";
import {
  MAX_EXPENSE_AMOUNT,
  MAX_LABEL_LENGTH,
  MIN_EXPENSE_AMOUNT,
} from "../../features/user/domain/manage-personal-expenses/personal-expense.constants";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { Input } from "../Input";

export interface Expense {
  id: string;
  label: string;
  amount: number;
}

interface ExpenseManagerProps {
  expenses: Expense[];
  onAdd: (label: string, amount: number) => Promise<void>;
  onEdit?: (id: string, label: string, amount: number) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  minExpenses?: number;
  title?: string;
  addSectionTitle?: string;
}

export function ExpenseManager({
  expenses,
  onAdd,
  onEdit,
  onDelete,
  minExpenses = 0,
  title = "Mes dépenses",
  addSectionTitle = "Ajouter une dépense",
}: ExpenseManagerProps) {
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit mode state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const handleAddExpense = async () => {
    if (!newLabel.trim() || !newAmount.trim()) {
      Toast.show({
        type: "error",
        text1: "Champs requis",
        text2: "Veuillez remplir tous les champs",
      });
      return;
    }

    const amount = parseFloat(newAmount);
    if (
      Number.isNaN(amount) ||
      amount < MIN_EXPENSE_AMOUNT ||
      amount > MAX_EXPENSE_AMOUNT
    ) {
      Toast.show({
        type: "error",
        text1: "Montant invalide",
        text2: `Entre ${MIN_EXPENSE_AMOUNT}€ et ${MAX_EXPENSE_AMOUNT}€`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd(newLabel.trim(), amount);
      // Success toast handled by listener

      setNewLabel("");
      setNewAmount("");
    } catch (_error) {
      // Error toast handled by listener
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string, _label: string) => {
    if (!onDelete) return;

    if (expenses.length <= minExpenses) {
      Toast.show({
        type: "error",
        text1: "Suppression impossible",
        text2: `Vous devez conserver au moins ${minExpenses} dépense${minExpenses > 1 ? "s" : ""}`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onDelete(expenseId);
      // Success toast handled by listener
    } catch (_error) {
      // Error toast handled by listener
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditExpense = (
    expenseId: string,
    label: string,
    amount: number,
  ) => {
    setEditingId(expenseId);
    setEditLabel(label);
    setEditAmount(amount.toString());
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditLabel("");
    setEditAmount("");
  };

  const handleSaveEdit = async (expenseId: string) => {
    if (!onEdit) return;

    if (!editLabel.trim() || !editAmount.trim()) {
      Toast.show({
        type: "error",
        text1: "Champs requis",
        text2: "Veuillez remplir tous les champs",
      });
      return;
    }

    const amount = parseFloat(editAmount);
    if (
      Number.isNaN(amount) ||
      amount < MIN_EXPENSE_AMOUNT ||
      amount > MAX_EXPENSE_AMOUNT
    ) {
      Toast.show({
        type: "error",
        text1: "Montant invalide",
        text2: `Entre ${MIN_EXPENSE_AMOUNT}€ et ${MAX_EXPENSE_AMOUNT}€`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onEdit(expenseId, editLabel.trim(), amount);
      // Success toast handled by listener

      handleCancelEdit();
    } catch (_error) {
      // Error toast handled by listener
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
      {/* Add New Expense Form */}
      <YStack
        backgroundColor="$backgroundSecondary"
        borderRadius="$md"
        padding="$base"
        marginBottom="$lg"
      >
        <Text fontSize={16} fontWeight="600" color="$color" marginBottom="$sm">
          {addSectionTitle}
        </Text>
        <XStack gap="$sm" marginBottom="$sm">
          <YStack flex={2}>
            <Text
              fontSize={12}
              fontWeight="500"
              color="$colorSecondary"
              marginBottom="$xs"
            >
              Libellé
            </Text>
            <Input
              placeholder="Ex: Loyer"
              value={newLabel}
              onChangeText={setNewLabel}
              maxLength={MAX_LABEL_LENGTH}
              editable={!isSubmitting}
            />
          </YStack>
          <YStack flex={1}>
            <Text
              fontSize={12}
              fontWeight="500"
              color="$colorSecondary"
              marginBottom="$xs"
            >
              Montant (€)
            </Text>
            <Input
              placeholder="0"
              value={newAmount}
              onChangeText={(text) =>
                setNewAmount(text.replace(/[^0-9.]/g, ""))
              }
              keyboardType="decimal-pad"
              editable={!isSubmitting}
            />
          </YStack>
        </XStack>
        <Button
          variant="success"
          onPress={handleAddExpense}
          disabled={isSubmitting}
          icon={<Plus size={20} color="#ffffff" />}
        >
          Ajouter
        </Button>
      </YStack>

      {/* Existing Expenses List */}
      <YStack flex={1}>
        <Text fontSize={16} fontWeight="600" color="$color" marginBottom="$sm">
          {title} ({expenses.length})
        </Text>
        {expenses.length === 0 ? (
          <Text
            fontSize={14}
            color="$colorSecondary"
            fontStyle="italic"
            textAlign="center"
            marginTop="$md"
          >
            Aucune dépense définie
          </Text>
        ) : (
          expenses.map((expense) => {
            const isAtMinimum = expenses.length <= minExpenses;
            const isEditing = editingId === expense.id;

            if (isEditing) {
              // Edit mode - show inline form
              return (
                <XStack
                  key={expense.id}
                  alignItems="center"
                  justifyContent="space-between"
                  backgroundColor="$background"
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$sm"
                  padding="$sm"
                  marginBottom="$sm"
                >
                  <XStack flex={1} gap="$xs" alignItems="center">
                    <XStack flex={1} gap="$xs">
                      <Input
                        flex={2}
                        placeholder="Libellé"
                        value={editLabel}
                        onChangeText={setEditLabel}
                        maxLength={MAX_LABEL_LENGTH}
                        editable={!isSubmitting}
                      />
                      <Input
                        flex={1}
                        placeholder="0"
                        value={editAmount}
                        onChangeText={(text) =>
                          setEditAmount(text.replace(/[^0-9.]/g, ""))
                        }
                        keyboardType="decimal-pad"
                        editable={!isSubmitting}
                      />
                    </XStack>
                    <XStack gap="$xs">
                      <IconButton
                        icon={Check}
                        variant="check"
                        onPress={() => handleSaveEdit(expense.id)}
                        disabled={isSubmitting}
                        iconSize={20}
                      />
                      <IconButton
                        icon={X}
                        variant="cancel"
                        onPress={handleCancelEdit}
                        disabled={isSubmitting}
                        iconSize={20}
                      />
                    </XStack>
                  </XStack>
                </XStack>
              );
            }

            // Read mode - show expense details
            return (
              <XStack
                key={expense.id}
                alignItems="center"
                justifyContent="space-between"
                backgroundColor="$background"
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$sm"
                padding="$sm"
                marginBottom="$sm"
              >
                <YStack flex={1} marginRight="$sm">
                  <Text
                    fontSize={14}
                    fontWeight="500"
                    color="$color"
                    marginBottom="$sm"
                  >
                    {expense.label}
                  </Text>
                  <Text fontSize={16} fontWeight="600" color="$success">
                    {expense.amount.toLocaleString("fr-FR")} €
                  </Text>
                </YStack>
                <XStack gap="$xs">
                  {onEdit && (
                    <IconButton
                      icon={Edit3}
                      variant="success"
                      onPress={() =>
                        handleEditExpense(
                          expense.id,
                          expense.label,
                          expense.amount,
                        )
                      }
                      disabled={isSubmitting}
                    />
                  )}
                  {onDelete && (
                    <IconButton
                      icon={Trash2}
                      variant="error"
                      onPress={() =>
                        handleDeleteExpense(expense.id, expense.label)
                      }
                      disabled={isSubmitting || isAtMinimum}
                    />
                  )}
                </XStack>
              </XStack>
            );
          })
        )}
      </YStack>
    </ScrollView>
  );
}
