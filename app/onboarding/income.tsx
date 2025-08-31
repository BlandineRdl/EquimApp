import { router } from "expo-router";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import { OnboardingProgressBar } from "../../src/features/onboarding/presentation/OnboardingProgressBar.component";
import {
  selectIncomeUI,
} from "../../src/features/onboarding/presentation/onboarding.selectors";
import {
  blurIncome,
  setMonthlyIncome,
} from "../../src/features/onboarding/store/onboarding.slice";
import { useAppDispatch } from "../../src/store/buildReduxStore";

export default function IncomeScreen() {
  const dispatch = useAppDispatch();

  const { monthlyIncome, error, canContinue, hasError } =
    useSelector(selectIncomeUI);

  const handleIncomeChange = (text: string) => {
    const cleanText = text.replace(/[^0-9.]/g, "");
    dispatch(setMonthlyIncome(cleanText));
  };

  const handleContinue = () => {
    if (canContinue) {
      router.push("/onboarding/create-group");
    }
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
            <Text style={styles.title}>Votre revenu mensuel</Text>
            <Text style={styles.subtitle}>
              Montant net après impôts et cotisations
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Montant en euros (€)</Text>
            <TextInput
              style={[styles.input, hasError && styles.inputError]}
              placeholder="Ex: 2400"
              value={monthlyIncome}
              onChangeText={handleIncomeChange}
              onBlur={() => dispatch(blurIncome())}
              keyboardType="decimal-pad"
              maxLength={10}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Info boxes */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>
                💡 Pourquoi cette information ?
              </Text>
              <Text style={styles.infoText}>
                Equim calcule des parts équitables basées sur les revenus. Cette
                donnée reste confidentielle et vous contrôlez qui peut la voir.
              </Text>
            </View>

            <View style={[styles.infoBox, styles.equityBox]}>
              <Text style={styles.infoTitle}>⚖️ L'équité avant tout :</Text>
              <Text style={styles.infoText}>
                Les écarts de revenus reflètent souvent des inégalités
                systémiques. Partager selon ses moyens, c'est plus juste.
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, !canContinue && styles.buttonDisabled]}
              onPress={handleContinue}
              disabled={!canContinue}
            >
              <Text
                style={[
                  styles.buttonText,
                  !canContinue && styles.buttonTextDisabled,
                ]}
              >
                Créer mon groupe →
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
  progressContainer: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#f3f4f6",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 2,
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
  form: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    textAlign: "center", // Centrer le montant
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  infoBox: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
  },
  equityBox: {
    backgroundColor: "#fef3c7", // Couleur différente pour highlight
    marginTop: 16,
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
    paddingTop: 24,
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
