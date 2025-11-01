import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { ScrollView, Text, XStack, YStack } from "tamagui";
import { Button } from "../../../src/components/Button";
import { Card } from "../../../src/components/Card";
import { OnboardingProgressBar } from "../../../src/features/onboarding/presentation/OnboardingProgressBar.component";
import { selectOnboardingSummary } from "../../../src/features/onboarding/presentation/onboarding.selectors";
import { completeOnboarding } from "../../../src/features/onboarding/usecases/complete-onboarding/completeOnboarding.usecase";
import { loadUserProfile } from "../../../src/features/user/usecases/loadUserProfile.usecase";
import { logger } from "../../../src/lib/logger";
import { useThemeControl } from "../../../src/lib/tamagui/theme-provider";
import { useAppDispatch } from "../../../src/store/buildReduxStore";

export default function SummaryScreen() {
  const dispatch = useAppDispatch();
  const { theme } = useThemeControl();
  const [isCreating, setIsCreating] = useState(false);

  const {
    pseudo,
    monthlyIncome,
    groupName,
    expensesCount,
    totalExpenses,
    isComplete,
    skipGroupCreation,
  } = useSelector(selectOnboardingSummary);

  const handleCreateAccount = async () => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      logger.info("Starting completeOnboarding");
      const result = await dispatch(completeOnboarding()).unwrap();
      logger.info("completeOnboarding succeeded", { result });

      // Load user profile to trigger navigation via _layout.tsx
      logger.info("Loading user profile after onboarding");
      await dispatch(loadUserProfile()).unwrap();
      logger.info(
        "User profile loaded, navigation should trigger automatically",
      );
      // Navigation automatique vers /home via _layout.tsx qui détecte profile
    } catch (error) {
      logger.error("Erreur lors de la création du compte", error);
      // Garder l'utilisateur sur la page en cas d'erreur
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme === "light" ? "#ffffff" : "#111827",
      }}
      edges={["top"]}
    >
      <YStack flex={1} backgroundColor="$background">
        <ScrollView
          flex={1}
          showsVerticalScrollIndicator={false}
          paddingHorizontal="$xl"
        >
          <OnboardingProgressBar />

          {/* Success Icon */}
          <YStack alignItems="center" marginBottom="$4xl">
            <YStack marginBottom="$xl">
              <YStack
                width="$5xl"
                height="$5xl"
                backgroundColor="$success100"
                borderRadius="$full"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize={32} color="$success" fontWeight="700">
                  ✓
                </Text>
              </YStack>
            </YStack>

            <Text
              fontSize={24}
              fontWeight="700"
              color="$color"
              textAlign="center"
              marginBottom="$md"
            >
              Tout est prêt !
            </Text>
            <Text
              fontSize={16}
              color="$colorSecondary"
              textAlign="center"
              lineHeight={24}
            >
              {skipGroupCreation
                ? "Votre profil est configuré."
                : `Votre profil et votre groupe "${groupName}" sont configurés.`}
            </Text>
          </YStack>

          {/* Summary Card */}
          <Card
            backgroundColor="$backgroundSecondary"
            borderWidth={1}
            borderColor="$borderColor"
            padding="$lg"
            marginBottom="$xl"
          >
            <YStack gap="$sm">
              <XStack
                justifyContent="space-between"
                alignItems="center"
                paddingVertical="$sm"
              >
                <Text fontSize={16} color="$colorSecondary" fontWeight="500">
                  Pseudo
                </Text>
                <Text fontSize={16} color="$color" fontWeight="600">
                  {pseudo}
                </Text>
              </XStack>

              <XStack
                justifyContent="space-between"
                alignItems="center"
                paddingVertical="$sm"
              >
                <Text fontSize={16} color="$colorSecondary" fontWeight="500">
                  Revenu
                </Text>
                <Text fontSize={16} color="$color" fontWeight="600">
                  {monthlyIncome.toLocaleString()}€/mois
                </Text>
              </XStack>

              {!skipGroupCreation && (
                <>
                  <XStack
                    justifyContent="space-between"
                    alignItems="center"
                    paddingVertical="$sm"
                  >
                    <Text
                      fontSize={16}
                      color="$colorSecondary"
                      fontWeight="500"
                    >
                      Groupe créé
                    </Text>
                    <Text fontSize={16} color="$color" fontWeight="600">
                      {groupName}
                    </Text>
                  </XStack>

                  <XStack
                    justifyContent="space-between"
                    alignItems="center"
                    paddingVertical="$sm"
                  >
                    <Text
                      fontSize={16}
                      color="$colorSecondary"
                      fontWeight="500"
                    >
                      Dépenses ajoutées
                    </Text>
                    <Text fontSize={16} color="$color" fontWeight="600">
                      {expensesCount}
                    </Text>
                  </XStack>

                  {totalExpenses > 0 && (
                    <XStack
                      justifyContent="space-between"
                      alignItems="center"
                      paddingVertical="$sm"
                      borderTopWidth={1}
                      borderTopColor="$borderColor"
                      marginTop="$sm"
                      paddingTop="$base"
                    >
                      <Text
                        fontSize={16}
                        color="$colorSecondary"
                        fontWeight="500"
                      >
                        Total mensuel
                      </Text>
                      <Text fontSize={18} color="$success" fontWeight="700">
                        {totalExpenses.toLocaleString()}€
                      </Text>
                    </XStack>
                  )}
                </>
              )}
            </YStack>
          </Card>
        </ScrollView>

        {/* Action - Sticky at bottom */}
        <YStack paddingHorizontal="$xl" paddingTop="$lg" paddingBottom="$base">
          <Button
            variant="primary"
            onPress={handleCreateAccount}
            disabled={!isComplete}
          >
            Finaliser mon profil →
          </Button>
        </YStack>
      </YStack>
    </SafeAreaView>
  );
}
