import { router } from "expo-router";
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
import { OnboardingProgressBar } from "../../src/features/onboarding/presentation/OnboardingProgressBar.component";
import { selectExpensesUI } from "../../src/features/onboarding/presentation/onboarding.selectors";
import {
  addCustomExpense,
  removeCustomExpense,
  updateExpenseAmount,
} from "../../src/features/onboarding/store/onboarding.slice";
import { useAppDispatch } from "../../src/store/buildReduxStore";

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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dépenses courantes</Text>

            {expenses
              .filter((expense) => !expense.isCustom)
              .map((expense) => (
                <View key={expense.id} style={styles.expenseRow}>
                  <Text style={styles.expenseLabel}>{expense.label}</Text>
                  <View style={styles.expenseInputContainer}>
                    <TextInput
                      style={styles.expenseInput}
                      placeholder="Ex: 800"
                      value={expense.amount}
                      onChangeText={(text) =>
                        handleExpenseAmountChange(expense.id, text)
                      }
                      keyboardType="decimal-pad"
                      maxLength={8}
                    />
                    <Text style={styles.currencySymbol}>€</Text>
                  </View>
                </View>
              ))}
          </View>

          {/* Dépenses personnalisées */}
          <View style={styles.section}>
            {/* Afficher les dépenses personnalisées ajoutées */}
            {expenses
              .filter((expense) => expense.isCustom)
              .map((expense) => (
                <View key={expense.id} style={styles.customExpenseRow}>
                  <Text style={styles.expenseLabel}>{expense.label}</Text>
                  <View style={styles.expenseInputContainer}>
                    <Text style={styles.expenseAmount}>{expense.amount}€</Text>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveExpense(expense.id)}
                    >
                      <Text style={styles.removeButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

            {/* Formulaire pour ajouter une nouvelle dépense */}
            <View style={styles.addExpenseForm}>
              <View style={styles.addExpenseRow}>
                <TextInput
                  style={[styles.expenseInput, styles.newExpenseInput]}
                  placeholder="Nom de la dépense"
                  value={newExpenseLabel}
                  onChangeText={setNewExpenseLabel}
                  maxLength={20}
                />
                <View style={styles.expenseInputContainer}>
                  <TextInput
                    style={styles.expenseInput}
                    placeholder="Montant"
                    value={newExpenseAmount}
                    onChangeText={(text) =>
                      setNewExpenseAmount(text.replace(/[^0-9.]/g, ""))
                    }
                    keyboardType="decimal-pad"
                    maxLength={8}
                  />
                  <Text style={styles.currencySymbol}>€</Text>
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
                <Text style={styles.addButtonText}>+ Ajouter une dépense</Text>
              </TouchableOpacity>
            </View>
          </View>

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
    marginBottom: 48,
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
  section: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
  },
  expenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  customExpenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  expenseLabel: {
    fontSize: 16,
    color: "#374151",
    flex: 1,
  },
  expenseInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  expenseInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: "#fff",
    minWidth: 80,
    textAlign: "right",
  },
  newExpenseInput: {
    flex: 1,
    marginRight: 12,
    textAlign: "left",
  },
  currencySymbol: {
    fontSize: 16,
    color: "#6b7280",
    marginLeft: 8,
  },
  expenseAmount: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  removeButton: {
    marginLeft: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  removeButtonText: {
    fontSize: 16,
    color: "#dc2626",
    fontWeight: "bold",
  },
  addExpenseForm: {
    marginTop: 16,
  },
  addExpenseRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: "#10b981",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  addButtonDisabled: {
    backgroundColor: "#d1d5db",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
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
