import { router, usePathname } from "expo-router";
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
import {
  selectGroupUI,
  selectOnboardingProgressByRoute,
} from "../src/features/onboarding/adapters/primary/onboarding.selectors";
import { OnboardingProgressBar } from "../src/features/onboarding/adapters/primary/OnboardingProgressBar.component";
import {
  blurGroupName,
  setGroupName,
} from "../src/features/onboarding/store/onboarding.slice";
import { useAppDispatch } from "../src/store/buildReduxStore";

export default function CreateGroupScreen() {
  const dispatch = useAppDispatch();
  const pathname = usePathname();

  const { groupName, error, canContinue, hasError } =
    useSelector(selectGroupUI);

  const { progressPercentage } = useSelector((state) =>
    selectOnboardingProgressByRoute(state, pathname)
  );

  const handleGroupNameChange = (text: string) => {
    dispatch(setGroupName(text));
  };

  const handleContinue = () => {
    if (canContinue) {
      router.push("/expenses");
    }
  };

  const suggestedNames = [
    "Foyer",
    "Coloc",
    "Vacances été",
    "Sorties",
    "Courses",
    "Restaurant",
  ];

  const handleSuggestionPress = (suggestion: string) => {
    dispatch(setGroupName(suggestion));
    dispatch(blurGroupName());
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
            <Text style={styles.title}>Créer votre premier groupe</Text>
            <Text style={styles.subtitle}>
              Donnez un nom à votre groupe de dépenses partagées
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Nom du groupe</Text>
            <TextInput
              style={[styles.input, hasError && styles.inputError]}
              placeholder="Ex: Foyer, Coloc, Quotidien..."
              value={groupName}
              onChangeText={handleGroupNameChange}
              onBlur={() => dispatch(blurGroupName())}
              maxLength={30}
              autoCapitalize="words"
              autoCorrect={false}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Suggestions */}
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>
                💡 Exemples de groupes
              </Text>
              <Text style={styles.suggestionsSubtitle}>
                Foyer, Coloc, Vacances été, Sorties, Courses, Restaurant... Vous
                pourrez créer d'autres groupes plus tard.
              </Text>

              <View style={styles.suggestionsList}>
                {suggestedNames.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.suggestionChip,
                      groupName === suggestion && styles.suggestionChipSelected,
                    ]}
                    onPress={() => handleSuggestionPress(suggestion)}
                  >
                    <Text
                      style={[
                        styles.suggestionText,
                        groupName === suggestion &&
                          styles.suggestionTextSelected,
                      ]}
                    >
                      {suggestion}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
                Ajouter des dépenses →
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
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    marginTop: 8,
  },
  suggestionsContainer: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  suggestionsSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 16,
  },
  suggestionsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  suggestionChipSelected: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  suggestionText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  suggestionTextSelected: {
    color: "#ffffff",
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
