import { Check, Edit3, Plus, Trash2, X } from "lucide-react-native";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import {
  MAX_EXPENSE_AMOUNT,
  MAX_LABEL_LENGTH,
  MIN_EXPENSE_AMOUNT,
} from "../features/user/domain/manage-personal-expenses/personal-expense.constants";

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
  minExpenses?: number; // Minimum number of expenses (prevents deletion below this)
  title?: string; // Title for the expenses list section
  addSectionTitle?: string; // Title for the add form section
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

      Toast.show({
        type: "success",
        text1: "Dépense ajoutée",
      });

      setNewLabel("");
      setNewAmount("");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2:
          error instanceof Error
            ? error.message
            : "Impossible d'ajouter la dépense",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string, label: string) => {
    if (!onDelete) return;

    // Prevent deletion if below minimum
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

      Toast.show({
        type: "success",
        text1: "Dépense supprimée",
        text2: label,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2:
          error instanceof Error
            ? error.message
            : "Impossible de supprimer la dépense",
      });
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

      Toast.show({
        type: "success",
        text1: "Dépense modifiée",
      });

      handleCancelEdit();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2:
          error instanceof Error
            ? error.message
            : "Impossible de modifier la dépense",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Add New Expense Form */}
      <View style={styles.addForm}>
        <Text style={styles.sectionTitle}>{addSectionTitle}</Text>
        <View style={styles.formRow}>
          <View style={styles.labelInput}>
            <Text style={styles.inputLabel}>Libellé</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Loyer"
              value={newLabel}
              onChangeText={setNewLabel}
              maxLength={MAX_LABEL_LENGTH}
              editable={!isSubmitting}
            />
          </View>
          <View style={styles.amountInput}>
            <Text style={styles.inputLabel}>Montant (€)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={newAmount}
              onChangeText={(text) =>
                setNewAmount(text.replace(/[^0-9.]/g, ""))
              }
              keyboardType="decimal-pad"
              editable={!isSubmitting}
            />
          </View>
        </View>
        <TouchableOpacity
          style={[styles.addButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleAddExpense}
          disabled={isSubmitting}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Existing Expenses List */}
      <View style={styles.expensesList}>
        <Text style={styles.sectionTitle}>
          {title} ({expenses.length})
        </Text>
        {expenses.length === 0 ? (
          <Text style={styles.emptyText}>Aucune dépense définie</Text>
        ) : (
          expenses.map((expense) => {
            const isAtMinimum = expenses.length <= minExpenses;
            const isEditing = editingId === expense.id;

            if (isEditing) {
              // Edit mode - show inline form
              return (
                <View key={expense.id} style={styles.expenseRow}>
                  <View style={styles.editForm}>
                    <View style={styles.editInputs}>
                      <TextInput
                        style={[styles.input, styles.editLabelInput]}
                        placeholder="Libellé"
                        value={editLabel}
                        onChangeText={setEditLabel}
                        maxLength={MAX_LABEL_LENGTH}
                        editable={!isSubmitting}
                      />
                      <TextInput
                        style={[styles.input, styles.editAmountInput]}
                        placeholder="0"
                        value={editAmount}
                        onChangeText={(text) =>
                          setEditAmount(text.replace(/[^0-9.]/g, ""))
                        }
                        keyboardType="decimal-pad"
                        editable={!isSubmitting}
                      />
                    </View>
                    <View style={styles.editActions}>
                      <TouchableOpacity
                        style={styles.editActionButton}
                        onPress={() => handleSaveEdit(expense.id)}
                        disabled={isSubmitting}
                      >
                        <Check size={20} color="#10b981" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.editActionButton}
                        onPress={handleCancelEdit}
                        disabled={isSubmitting}
                      >
                        <X size={20} color="#6b7280" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            }

            // Read mode - show expense details
            return (
              <View key={expense.id} style={styles.expenseRow}>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseLabel}>{expense.label}</Text>
                  <Text style={styles.expenseAmount}>
                    {expense.amount.toLocaleString("fr-FR")} €
                  </Text>
                </View>
                <View style={styles.expenseActions}>
                  {onEdit && (
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() =>
                        handleEditExpense(
                          expense.id,
                          expense.label,
                          expense.amount,
                        )
                      }
                      disabled={isSubmitting}
                    >
                      <Edit3 size={18} color="#10b981" />
                    </TouchableOpacity>
                  )}
                  {onDelete && (
                    <TouchableOpacity
                      style={[
                        styles.deleteButton,
                        (isSubmitting || isAtMinimum) &&
                          styles.deleteButtonDisabled,
                      ]}
                      onPress={() =>
                        handleDeleteExpense(expense.id, expense.label)
                      }
                      disabled={isSubmitting || isAtMinimum}
                    >
                      <Trash2
                        size={18}
                        color={isAtMinimum ? "#d1d5db" : "#ef4444"}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addForm: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  labelInput: {
    flex: 2,
  },
  amountInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#000",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  buttonDisabled: {
    backgroundColor: "#9ca3af",
    opacity: 0.6,
  },
  expensesList: {
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 20,
  },
  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  expenseInfo: {
    flex: 1,
    marginRight: 12,
  },
  expenseLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
    marginBottom: 4,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10b981",
  },
  expenseActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#d1fae5",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonDisabled: {
    backgroundColor: "#f3f4f6",
    opacity: 0.5,
  },
  // Edit mode styles
  editForm: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  editInputs: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  editLabelInput: {
    flex: 2,
  },
  editAmountInput: {
    flex: 1,
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
  },
  editActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
});
