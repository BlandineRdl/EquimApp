import { router } from "expo-router";
import React from "react";
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
import { OnboardingProgressBar } from "../src/features/onboarding/presentation/OnboardingProgressBar.component";
import { selectOnboardingUI } from "../src/features/onboarding/presentation/onboarding.selectors";
import {
  blurPseudo,
  setPseudo,
} from "../src/features/onboarding/store/onboarding.slice";
import { useAppDispatch } from "../src/store/buildReduxStore";

export default function WelcomeScreen() {
  const dispatch = useAppDispatch();

  const { pseudo, error, canContinue, hasError } =
    useSelector(selectOnboardingUI);

  const handlePseudoChange = (text: string) => {
    dispatch(setPseudo(text));
  };

  const handleContinue = () => {
    if (canContinue) {
      router.push("/onboarding/income");
    }
  };

  const isButtonDisabled = !pseudo.trim();

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
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>🌱</Text>
            </View>

            <Text style={styles.title}>Bienvenue sur Equim</Text>
            <Text style={styles.subtitle}>
              Commençons par créer votre profil. Comment souhaitez-vous être
              appelé dans l'application ?
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Votre pseudo</Text>
            <TextInput
              value={pseudo}
              onChangeText={handlePseudoChange}
              onBlur={() => dispatch(blurPseudo())}
              style={[styles.input, hasError && styles.inputError]}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Info box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>
                💡 Votre identité, vos règles
              </Text>
              <Text style={styles.infoText}>
                Utilisez le prénom, surnom ou pseudo de votre choix. Vous
                pourrez le modifier à tout moment.
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, isButtonDisabled && styles.buttonDisabled]}
              onPress={handleContinue}
              disabled={isButtonDisabled}
            >
              <Text
                style={[
                  styles.buttonText,
                  isButtonDisabled && styles.buttonTextDisabled,
                ]}
              >
                Ajouter mon revenu →
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
    marginBottom: 48,
  },
  logoContainer: {
    width: 64,
    height: 64,
    backgroundColor: "#d1fae5",
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  logo: {
    fontSize: 32,
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
    paddingHorizontal: 8,
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
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    marginTop: 8,
  },
  infoBox: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
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
