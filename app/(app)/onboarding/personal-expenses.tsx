import { router } from "expo-router";
import { X } from "lucide-react-native";
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
import { selectIncomeUI } from "../../../src/features/onboarding/presentation/onboarding.selectors";
import { setPersonalExpenses } from "../../../src/features/onboarding/store/onboarding.slice";
import {
  MAX_EXPENSE_AMOUNT,
  MAX_LABEL_LENGTH,
  MIN_EXPENSE_AMOUNT,
} from "../../../src/features/user/domain/manage-personal-expenses/personal-expense.constants";
import { useAppDispatch } from "../../../src/store/buildReduxStore";

interface ExpenseRow {
  id: string;
  label: string;
  amount: string;
  labelError: string | null;
  amountError: string | null;
}

export default function PersonalExpensesScreen() {
  const dispatch = useAppDispatch();
  const { numericValue: income } = useSelector(selectIncomeUI);

  const [expenses, setExpenses] = useState<ExpenseRow[]>([
    { id: "1", label: "", amount: "", labelError: null, amountError: null },
  ]);
  const [isSubmitting, _setIsSubmitting] = useState(false);

  const validateLabel = (label: string): string | null => {
    if (!label.trim()) {
      return "Le libellé est requis";
    }
    if (label.length > MAX_LABEL_LENGTH) {
      return `Maximum ${MAX_LABEL_LENGTH} caractères`;
    }
    return null;
  };

  const validateAmount = (amount: string): string | null => {
    const numericAmount = parseFloat(amount);
    if (!amount.trim()) {
      return "Le montant est requis";
    }
    if (Number.isNaN(numericAmount)) {
      return "Montant invalide";
    }
    if (numericAmount < MIN_EXPENSE_AMOUNT) {
      return `Minimum ${MIN_EXPENSE_AMOUNT}€`;
    }
    if (numericAmount > MAX_EXPENSE_AMOUNT) {
      return `Maximum ${MAX_EXPENSE_AMOUNT}€`;
    }
    return null;
  };

  const handleLabelChange = (id: string, text: string) => {
    setExpenses((prev) =>
      prev.map((exp) =>
        exp.id === id ? { ...exp, label: text, labelError: null } : exp,
      ),
    );
  };

  const handleAmountChange = (id: string, text: string) => {
    const cleanText = text.replace(/[^0-9.]/g, "");
    setExpenses((prev) =>
      prev.map((exp) =>
        exp.id === id ? { ...exp, amount: cleanText, amountError: null } : exp,
      ),
    );
  };

  const handleBlur = (id: string, field: "label" | "amount") => {
    setExpenses((prev) =>
      prev.map((exp) => {
        if (exp.id !== id) return exp;

        if (field === "label") {
          const labelError = exp.label.trim() ? validateLabel(exp.label) : null;
          return { ...exp, labelError };
        }

        const amountError = exp.amount.trim()
          ? validateAmount(exp.amount)
          : null;
        return { ...exp, amountError };
      }),
    );
  };

  const addExpenseRow = () => {
    const newId = (
      parseInt(expenses[expenses.length - 1].id, 10) + 1
    ).toString();
    setExpenses((prev) => [
      ...prev,
      { id: newId, label: "", amount: "", labelError: null, amountError: null },
    ]);
  };

  const removeExpenseRow = (id: string) => {
    if (expenses.length === 1) return;
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
  };

  const calculateSubtotal = (): number => {
    return expenses.reduce((sum, exp) => {
      const amount = parseFloat(exp.amount) || 0;
      return sum + amount;
    }, 0);
  };

  const calculateCapacity = (): number => {
    return income - calculateSubtotal();
  };

  const getValidExpenses = (): ExpenseRow[] => {
    return expenses.filter(
      (exp) =>
        exp.label.trim() &&
        exp.amount.trim() &&
        !validateLabel(exp.label) &&
        !validateAmount(exp.amount),
    );
  };

  const canContinue = (): boolean => {
    const validExpenses = getValidExpenses();
    return validExpenses.length > 0 && !isSubmitting;
  };

  const handleContinue = () => {
    if (!canContinue()) return;

    const validExpenses = getValidExpenses();

    // Store expenses in onboarding state (will be created after profile creation)
    dispatch(
      setPersonalExpenses(
        validExpenses.map((exp) => ({
          label: exp.label.trim(),
          amount: parseFloat(exp.amount),
        })),
      ),
    );

    router.push("/onboarding/group-choice");
  };

  const subtotal = calculateSubtotal();
  const capacity = calculateCapacity();

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
            <Text style={styles.title}>Vos charges personnelles</Text>
            <Text style={styles.subtitle}>
              Ajoutez au moins une dépense individuelle (non partagée) pour
              calculer votre capacité réelle
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Expense rows */}
            {expenses.map((expense, _index) => (
              <View key={expense.id} style={styles.expenseRow}>
                <View style={styles.expenseInputs}>
                  <View style={styles.labelInputContainer}>
                    <Text style={styles.inputLabel}>Libellé</Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.labelInput,
                        expense.labelError && styles.inputError,
                      ]}
                      placeholder="Ex: Crédit immo"
                      value={expense.label}
                      onChangeText={(text) =>
                        handleLabelChange(expense.id, text)
                      }
                      onBlur={() => handleBlur(expense.id, "label")}
                      maxLength={MAX_LABEL_LENGTH}
                      autoCapitalize="words"
                    />
                    {expense.labelError && (
                      <Text style={styles.errorText}>{expense.labelError}</Text>
                    )}
                  </View>

                  <View style={styles.amountInputContainer}>
                    <Text style={styles.inputLabel}>Montant (€)</Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.amountInput,
                        expense.amountError && styles.inputError,
                      ]}
                      placeholder="0"
                      value={expense.amount}
                      onChangeText={(text) =>
                        handleAmountChange(expense.id, text)
                      }
                      onBlur={() => handleBlur(expense.id, "amount")}
                      keyboardType="decimal-pad"
                      maxLength={10}
                    />
                    {expense.amountError && (
                      <Text style={styles.errorText}>
                        {expense.amountError}
                      </Text>
                    )}
                  </View>

                  {expenses.length > 1 && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => removeExpenseRow(expense.id)}
                    >
                      <X size={20} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            {/* Add expense button */}
            <TouchableOpacity style={styles.addButton} onPress={addExpenseRow}>
              <Text style={styles.addButtonText}>+ Ajouter une dépense</Text>
            </TouchableOpacity>

            {/* Summary */}
            {subtotal > 0 && (
              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Revenu mensuel</Text>
                  <Text style={styles.summaryValue}>{income.toFixed(2)} €</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total des charges</Text>
                  <Text style={styles.summaryValue}>
                    - {subtotal.toFixed(2)} €
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={styles.summaryTotalLabel}>
                    Capacité de dépense
                  </Text>
                  <Text
                    style={[
                      styles.summaryTotalValue,
                      capacity < 0 && styles.negativeCapacity,
                    ]}
                  >
                    {capacity.toFixed(2)} €
                  </Text>
                </View>
              </View>
            )}

            {/* Info box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>
                💡 Pourquoi cette information ?
              </Text>
              <Text style={styles.infoText}>
                Equim calcule votre capacité réelle (revenu - charges
                personnelles) pour des parts de groupe plus justes. Exemples :
                crédit immobilier non partagé, crédit voiture, abonnement salle
                de sport... Vous pourrez modifier ces informations plus tard
                depuis votre profil.
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, !canContinue() && styles.buttonDisabled]}
              onPress={handleContinue}
              disabled={!canContinue()}
            >
              <Text
                style={[
                  styles.buttonText,
                  !canContinue() && styles.buttonTextDisabled,
                ]}
              >
                {isSubmitting ? "Enregistrement..." : "Continuer →"}
              </Text>
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
  form: {
    flex: 1,
  },
  expenseRow: {
    marginBottom: 16,
  },
  expenseInputs: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  labelInputContainer: {
    flex: 2,
  },
  amountInputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#fff",
  },
  labelInput: {
    flex: 1,
  },
  amountInput: {
    textAlign: "right",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
  },
  deleteButton: {
    paddingTop: 28,
    paddingLeft: 8,
  },
  addButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  addButtonText: {
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "500",
  },
  summaryBox: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 0,
  },
  summaryTotalLabel: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "600",
  },
  summaryTotalValue: {
    fontSize: 16,
    color: "#10b981",
    fontWeight: "700",
  },
  negativeCapacity: {
    color: "#ef4444",
  },
  infoBox: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  actions: {
    paddingBottom: 32,
    paddingTop: 16,
  },
  button: {
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
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
});
