import { router } from "expo-router";
import { Plus, Trash2 } from "lucide-react-native";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { OnboardingProgressBar } from "../../../src/features/onboarding/presentation/OnboardingProgressBar.component";
import { selectExpensesUI } from "../../../src/features/onboarding/presentation/onboarding.selectors";
import {
  addCustomExpense,
  removeCustomExpense,
  updateExpenseAmount,
} from "../../../src/features/onboarding/store/onboarding.slice";
import { useAppDispatch } from "../../../src/store/buildReduxStore";

export default function ExpensesScreen() {
  const dispatch = useAppDispatch();
  const [newExpenseLabel, setNewExpenseLabel] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");

  const { expenses, groupName, totalAmount, canContinue } =
    useSelector(selectExpensesUI);

  const handleExpenseAmountChange = (id: string, amount: string) => {
    // Nettoyer l'input (seulement chiffres et point décimal)
    const cleanAmount = amount.replace(/[^0-9.]/g, "");
    dispatch(updateExpenseAmount({ id, amount: cleanAmount }));
  };

  const handleAddCustomExpense = () => {
    if (newExpenseLabel.trim() && newExpenseAmount.trim()) {
      dispatch(
        addCustomExpense({
          label: newExpenseLabel.trim(),
          amount: newExpenseAmount,
        }),
      );
      setNewExpenseLabel("");
      setNewExpenseAmount("");
    }
  };

  const handleRemoveExpense = (id: string) => {
    dispatch(removeCustomExpense(id));
  };

  const handleFinalize = () => {
    router.push("/onboarding/summary");
  };

  const handleSkip = () => {
    router.push("/onboarding/summary");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <OnboardingProgressBar />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Ajouter des dépenses</Text>
            <Text style={styles.subtitle}>
              Quelles sont vos principales dépenses mensuelles pour "{groupName}
              " ?
            </Text>
          </View>

          {/* Dépenses courantes */}
          <View style={styles.predefinedSection}>
            <Text style={styles.sectionTitle}>Dépenses courantes</Text>

            {expenses
              .filter((expense) => !expense.isCustom)
              .map((expense) => (
                <View key={expense.id} style={styles.predefinedRow}>
                  <Text style={styles.predefinedLabel}>{expense.label}</Text>
                  <View style={styles.predefinedInputContainer}>
                    <TextInput
                      style={styles.predefinedInput}
                      placeholder="0"
                      value={expense.amount}
                      onChangeText={(text) =>
                        handleExpenseAmountChange(expense.id, text)
                      }
                      keyboardType="decimal-pad"
                      maxLength={8}
                    />
                    <Text style={styles.currencyText}>€</Text>
                  </View>
                </View>
              ))}
          </View>

          {/* Dépenses personnalisées */}
          <View style={styles.customSection}>
            <Text style={styles.sectionTitle}>Ajouter une dépense</Text>

            {/* Formulaire pour ajouter une nouvelle dépense */}
            <View style={styles.formRow}>
              <View style={styles.labelInput}>
                <Text style={styles.inputLabel}>Libellé</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Loyer"
                  value={newExpenseLabel}
                  onChangeText={setNewExpenseLabel}
                  maxLength={20}
                />
              </View>
              <View style={styles.amountInput}>
                <Text style={styles.inputLabel}>Montant (€)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={newExpenseAmount}
                  onChangeText={(text) =>
                    setNewExpenseAmount(text.replace(/[^0-9.]/g, ""))
                  }
                  keyboardType="decimal-pad"
                  maxLength={8}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.addButton,
                (!newExpenseLabel.trim() || !newExpenseAmount.trim()) &&
                  styles.addButtonDisabled,
              ]}
              onPress={handleAddCustomExpense}
              disabled={!newExpenseLabel.trim() || !newExpenseAmount.trim()}
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.addButtonText}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          {/* Liste des dépenses personnalisées ajoutées */}
          {expenses.filter((expense) => expense.isCustom).length > 0 && (
            <View style={styles.customListSection}>
              <Text style={styles.sectionTitle}>
                Mes dépenses ({expenses.filter((e) => e.isCustom).length})
              </Text>
              {expenses
                .filter((expense) => expense.isCustom)
                .map((expense) => (
                  <View key={expense.id} style={styles.customExpenseRow}>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseLabel}>{expense.label}</Text>
                      <Text style={styles.expenseAmount}>
                        {expense.amount} €
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleRemoveExpense(expense.id)}
                    >
                      <Trash2 size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          )}

          {/* Total */}
          {totalAmount > 0 && (
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total mensuel :</Text>
              <Text style={styles.totalAmount}>{totalAmount.toFixed(2)}€</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, !canContinue && styles.buttonDisabled]}
              onPress={handleFinalize}
              disabled={!canContinue}
            >
              <Text
                style={[
                  styles.buttonText,
                  !canContinue && styles.buttonTextDisabled,
                ]}
              >
                Finaliser →
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Passer cette étape</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
  },
  // Dépenses prédéfinies
  predefinedSection: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  predefinedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  predefinedLabel: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
    flex: 1,
  },
  predefinedInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  predefinedInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#000",
    minWidth: 80,
    textAlign: "right",
  },
  currencyText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 8,
    fontWeight: "500",
  },
  // Section ajout dépense personnalisée
  customSection: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  addButtonDisabled: {
    backgroundColor: "#9ca3af",
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  // Liste des dépenses personnalisées
  customListSection: {
    marginBottom: 16,
  },
  customExpenseRow: {
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
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
  },
  // Total
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#10b981",
  },
  // Actions
  actions: {
    paddingBottom: 32,
    paddingTop: 24,
  },
  button: {
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: "#9ca3af",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonTextDisabled: {
    color: "#d1d5db",
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  skipButtonText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "500",
  },
});
