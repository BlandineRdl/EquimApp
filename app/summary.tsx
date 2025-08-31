import { router } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import { OnboardingProgressBar } from "../src/features/onboarding/presentation/OnboardingProgressBar.component";
import { selectOnboardingSummary } from "../src/features/onboarding/presentation/onboarding.selectors";

export default function SummaryScreen() {
  const {
    pseudo,
    monthlyIncome,
    groupName,
    expensesCount,
    totalExpenses,
    isComplete,
  } = useSelector(selectOnboardingSummary);

  const handleCreateAccount = () => {
    router.push("/home");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <OnboardingProgressBar />

        {/* Success Icon */}
        <View style={styles.header}>
          <View style={styles.successIcon}>
            <View style={styles.checkIcon}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
          </View>

          <Text style={styles.title}>Tout est prêt !</Text>
          <Text style={styles.subtitle}>
            Votre profil et votre groupe "{groupName}" sont configurés.
          </Text>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pseudo</Text>
            <Text style={styles.summaryValue}>{pseudo}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Revenu</Text>
            <Text style={styles.summaryValue}>
              {monthlyIncome.toLocaleString()}€/mois
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Groupe créé</Text>
            <Text style={styles.summaryValue}>{groupName}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Dépenses ajoutées</Text>
            <Text style={styles.summaryValue}>{expensesCount}</Text>
          </View>

          {totalExpenses > 0 && (
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.summaryLabel}>Total mensuel</Text>
              <Text style={styles.totalValue}>
                {totalExpenses.toLocaleString()}€
              </Text>
            </View>
          )}
        </View>

        {/* Action */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, !isComplete && styles.buttonDisabled]}
            onPress={handleCreateAccount}
            disabled={!isComplete}
          >
            <Text
              style={[
                styles.buttonText,
                !isComplete && styles.buttonTextDisabled,
              ]}
            >
              Créer mon compte →
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
  successIcon: {
    marginBottom: 24,
  },
  checkIcon: {
    width: 64,
    height: 64,
    backgroundColor: "#d1fae5",
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    fontSize: 32,
    color: "#10b981",
    fontWeight: "bold",
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
  summaryCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    marginTop: 8,
    paddingTop: 16,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 18,
    color: "#10b981",
    fontWeight: "700",
  },
  actions: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 32,
  },
  button: {
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
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
