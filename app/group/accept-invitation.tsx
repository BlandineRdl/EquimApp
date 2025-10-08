import { router, useLocalSearchParams } from "expo-router";
import { Check } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { INVITATION_TOKEN_PREFIX } from "../../src/features/group/domain/group.constants";
import { acceptInvitation } from "../../src/features/group/usecases/invitation/acceptInvitation.usecase";
import { loadUserGroups } from "../../src/features/group/usecases/load-groups/loadGroups.usecase";
import { loadUserProfile } from "../../src/features/user/usecases/loadUserProfile.usecase";
import { logger } from "../../src/lib/logger";
import { useAppDispatch } from "../../src/store/buildReduxStore";

export default function AcceptInvitationScreen() {
  const dispatch = useAppDispatch();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [pseudo, setPseudo] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasProfile, _setHasProfile] = useState(false);
  const [invitationDetails, _setInvitationDetails] = useState<{
    groupName: string;
    inviterName: string;
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      logger.debug("[AcceptInvitation] Starting", { token });

      if (!token) {
        logger.error("[AcceptInvitation] No token provided");
        setError("Token d'invitation manquant");
        setIsLoading(false);
        return;
      }

      try {
        logger.debug("[AcceptInvitation] Loading user profile");
        const profileResult = await dispatch(loadUserProfile()).unwrap();
        logger.debug("[AcceptInvitation] Profile loaded", {
          profile: profileResult,
        });

        // If no profile, redirect to onboarding with return URL
        if (!profileResult) {
          logger.info(
            "[AcceptInvitation] No profile, redirecting to onboarding",
          );
          router.replace({
            pathname: "/onboarding",
            params: { returnTo: `/group/accept-invitation?token=${token}` },
          });
          return;
        }

        logger.debug("[AcceptInvitation] Accepting invitation", { token });
        // If profile exists, accept invitation directly
        const _result = await dispatch(
          acceptInvitation({
            token,
            pseudo: profileResult.pseudo,
            monthlyIncome: profileResult.income,
          }),
        ).unwrap();

        logger.info("[AcceptInvitation] Invitation accepted, reloading groups");
        // Reload groups before navigating
        await dispatch(loadUserGroups()).unwrap();
        logger.info("[AcceptInvitation] Groups reloaded, redirecting to home");
        // Navigate to home to see the group in the list
        router.replace("/home");
      } catch (err) {
        logger.error("[AcceptInvitation] Error", err);
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors de l'acceptation de l'invitation",
        );
        setIsLoading(false);
      }
    };

    loadData();
  }, [token, dispatch]);

  const handleAccept = async () => {
    if (!token) return;

    const income = parseFloat(monthlyIncome);
    if (Number.isNaN(income) || income <= 0) {
      setError("Le revenu mensuel doit être un nombre positif");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const fullToken = `${INVITATION_TOKEN_PREFIX}${token}`;
      const result = await dispatch(
        acceptInvitation({
          token: fullToken,
          pseudo: pseudo.trim(),
          monthlyIncome: income,
        }),
      ).unwrap();

      // Navigate to the group
      router.replace(`/group/${result.groupId}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'acceptation de l'invitation",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Chargement de l'invitation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !invitationDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorTitle}>Invitation invalide</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Rejoindre un groupe</Text>
            <Text style={styles.subtitle}>
              Vous avez été invité à rejoindre{" "}
              <Text style={styles.groupName}>
                {invitationDetails?.groupName}
              </Text>
            </Text>
            <Text style={styles.inviterText}>
              par {invitationDetails?.inviterName}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {hasProfile && (
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxText}>
                  ℹ️ Vos informations de profil seront utilisées pour rejoindre
                  ce groupe. Vous pouvez les modifier si nécessaire.
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Votre pseudo</Text>
              <TextInput
                style={styles.input}
                placeholder="Comment voulez-vous être appelé ?"
                value={pseudo}
                onChangeText={setPseudo}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Revenu mensuel (€)</Text>
              <TextInput
                style={styles.input}
                placeholder="1500"
                value={monthlyIncome}
                onChangeText={setMonthlyIncome}
                keyboardType="numeric"
              />
              <Text style={styles.hint}>
                Cette information permet de calculer équitablement la
                répartition des dépenses
              </Text>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!pseudo.trim() || !monthlyIncome || isSubmitting) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleAccept}
              disabled={!pseudo.trim() || !monthlyIncome || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Check size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.submitButtonText}>
                    Rejoindre le groupe
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
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
    backgroundColor: "#f9fafb",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 4,
  },
  groupName: {
    fontWeight: "600",
    color: "#10b981",
  },
  inviterText: {
    fontSize: 14,
    color: "#9ca3af",
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111827",
  },
  hint: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: "#dbeafe",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoBoxText: {
    color: "#1e40af",
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBoxText: {
    color: "#dc2626",
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#dc2626",
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: "#10b981",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#10b981",
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#6b7280",
    fontSize: 16,
  },
});
