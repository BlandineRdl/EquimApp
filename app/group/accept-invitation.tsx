import { router, useLocalSearchParams } from "expo-router";
import { Check } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, Text, XStack, YStack } from "tamagui";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { Input } from "../../src/components/Input";
import { acceptInvitation } from "../../src/features/group/usecases/invitation/acceptInvitation.usecase";
import { loadUserGroups } from "../../src/features/group/usecases/load-groups/loadGroups.usecase";
import { loadUserProfile } from "../../src/features/user/usecases/loadUserProfile.usecase";
import { logger } from "../../src/lib/logger";
import { useThemeControl } from "../../src/lib/tamagui/theme-provider";
import { useAppDispatch } from "../../src/store/buildReduxStore";

export default function AcceptInvitationScreen() {
  const dispatch = useAppDispatch();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { theme } = useThemeControl();

  // Theme-aware colors for icons
  const iconSuccess = "#16a34a";

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
            pathname: "/onboarding/income",
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
            monthlyIncome: profileResult.monthlyIncome,
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
      const result = await dispatch(
        acceptInvitation({
          token,
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
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme === "light" ? "#ffffff" : "#111827",
        }}
        edges={["top"]}
      >
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          paddingHorizontal="$lg"
        >
          <ActivityIndicator size="large" color={iconSuccess} />
          <Text fontSize={16} color="$colorSecondary" marginTop="$base">
            Chargement de l'invitation...
          </Text>
        </YStack>
      </SafeAreaView>
    );
  }

  if (error && !invitationDetails) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme === "light" ? "#ffffff" : "#111827",
        }}
        edges={["top"]}
      >
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          paddingHorizontal="$lg"
        >
          <Text
            fontSize={24}
            fontWeight="700"
            color="#dc2626"
            marginBottom="$sm"
            textAlign="center"
          >
            Invitation invalide
          </Text>
          <Text
            fontSize={16}
            color="$colorSecondary"
            textAlign="center"
            marginBottom="$xl"
          >
            {error}
          </Text>
          <Button variant="success" onPress={() => router.back()}>
            Retour
          </Button>
        </YStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme === "light" ? "#ffffff" : "#111827",
      }}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          flex={1}
          showsVerticalScrollIndicator={false}
          paddingHorizontal="$lg"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <YStack marginBottom="$xl">
            <Text
              fontSize={28}
              fontWeight="700"
              color="$color"
              marginBottom="$sm"
            >
              Rejoindre un groupe
            </Text>
            <Text fontSize={16} color="$colorSecondary" marginBottom="$1">
              Vous avez été invité à rejoindre{" "}
              <Text fontWeight="600" color="#16a34a">
                {invitationDetails?.groupName}
              </Text>
            </Text>
            <Text fontSize={14} color="$colorTertiary">
              par {invitationDetails?.inviterName}
            </Text>
          </YStack>

          {/* Form */}
          <YStack flex={1}>
            {hasProfile && (
              <Card
                backgroundColor="$primary100"
                padding="$md"
                marginBottom="$base"
              >
                <Text color="$primary700" fontSize={14}>
                  ℹ️ Vos informations de profil seront utilisées pour rejoindre
                  ce groupe. Vous pouvez les modifier si nécessaire.
                </Text>
              </Card>
            )}

            <YStack gap="$xl">
              <YStack>
                <Text
                  fontSize={14}
                  fontWeight="600"
                  color="$gray700"
                  marginBottom="$sm"
                >
                  Votre pseudo
                </Text>
                <Input
                  placeholder="Comment voulez-vous être appelé ?"
                  value={pseudo}
                  onChangeText={setPseudo}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </YStack>

              <YStack>
                <Text
                  fontSize={14}
                  fontWeight="600"
                  color="$gray700"
                  marginBottom="$sm"
                >
                  Revenu mensuel (€)
                </Text>
                <Input
                  placeholder="1500"
                  value={monthlyIncome}
                  onChangeText={setMonthlyIncome}
                  keyboardType="numeric"
                />
                <Text fontSize={12} color="$colorTertiary" marginTop="$1">
                  Cette information permet de calculer équitablement la
                  répartition des dépenses
                </Text>
              </YStack>

              {error && (
                <Card backgroundColor="$error100" padding="$md">
                  <Text color="#dc2626" fontSize={14}>
                    {error}
                  </Text>
                </Card>
              )}

              <YStack gap="$md">
                <Button
                  variant="success"
                  onPress={handleAccept}
                  disabled={!pseudo.trim() || !monthlyIncome || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <XStack alignItems="center" gap="$sm">
                      <Check size={20} color="#ffffff" />
                      <Text fontSize={16} fontWeight="600" color="#ffffff">
                        Rejoindre le groupe
                      </Text>
                    </XStack>
                  )}
                </Button>

                <Button
                  variant="secondary"
                  onPress={() => router.back()}
                  disabled={isSubmitting}
                >
                  <Text fontSize={16} color="$colorSecondary">
                    Annuler
                  </Text>
                </Button>
              </YStack>
            </YStack>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
