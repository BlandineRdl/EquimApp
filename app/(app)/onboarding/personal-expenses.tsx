import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import type { Expense } from "../../../src/components/ExpenseManager.component";
import { ExpenseManager } from "../../../src/components/ExpenseManager.component";
import { OnboardingProgressBar } from "../../../src/features/onboarding/presentation/OnboardingProgressBar.component";
import { selectIncomeUI } from "../../../src/features/onboarding/presentation/onboarding.selectors";
import { setPersonalExpenses } from "../../../src/features/onboarding/store/onboarding.slice";
import { useAppDispatch } from "../../../src/store/buildReduxStore";

export default function PersonalExpensesScreen() {
  const dispatch = useAppDispatch();
  const { numericValue: income } = useSelector(selectIncomeUI);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isSubmitting, _setIsSubmitting] = useState(false);

  const handleAddExpense = async (label: string, amount: number) => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      label,
      amount,
    };
    setExpenses((prev) => [...prev, newExpense]);
  };

  const handleEditExpense = async (
    id: string,
    label: string,
    amount: number,
  ) => {
    setExpenses((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, label, amount } : exp)),
    );
  };

  const handleDeleteExpense = async (id: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
  };

  const calculateSubtotal = (): number => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  };

  const calculateCapacity = (): number => {
    return income - calculateSubtotal();
  };

  const canContinue = (): boolean => {
    return expenses.length > 0 && !isSubmitting;
  };

  const handleContinue = () => {
    if (!canContinue()) return;

    // Store expenses in onboarding state (will be created after profile creation)
    dispatch(
      setPersonalExpenses(
        expenses.map((exp) => ({
          label: exp.label,
          amount: exp.amount,
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

          {/* Expense Manager */}
          <View style={styles.form}>
            <ExpenseManager
              expenses={expenses}
              onAdd={handleAddExpense}
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
              minExpenses={0}
              title="Mes charges personnelles"
              addSectionTitle="Ajouter une charge"
            />
          </View>

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
              crédit immobilier non partagé, crédit voiture, abonnement salle de
              sport... Vous pourrez modifier ces informations plus tard depuis
              votre profil.
            </Text>
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
    marginBottom: 24,
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
