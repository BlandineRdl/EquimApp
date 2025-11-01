import { router } from "expo-router";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { ScrollView, Text, YStack } from "tamagui";
import { Button } from "../../../src/components/Button";
import { Card } from "../../../src/components/Card";
import { Input } from "../../../src/components/Input";
import { OnboardingProgressBar } from "../../../src/features/onboarding/presentation/OnboardingProgressBar.component";
import { selectIncomeUI } from "../../../src/features/onboarding/presentation/onboarding.selectors";
import {
  blurIncome,
  setMonthlyIncome,
} from "../../../src/features/onboarding/store/onboarding.slice";
import { useThemeControl } from "../../../src/lib/tamagui/theme-provider";
import { useAppDispatch } from "../../../src/store/buildReduxStore";

export default function IncomeScreen() {
  const dispatch = useAppDispatch();
  const { theme } = useThemeControl();

  const { monthlyIncome, error, canContinue, hasError } =
    useSelector(selectIncomeUI);

  const handleIncomeChange = (text: string) => {
    const cleanText = text.replace(/[^0-9.]/g, "");
    dispatch(setMonthlyIncome(cleanText));
  };

  const handleContinue = () => {
    if (canContinue) {
      router.push("/onboarding/personal-expenses");
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <YStack flex={1} backgroundColor="$background">
          <ScrollView
            flex={1}
            showsVerticalScrollIndicator={false}
            paddingHorizontal="$xl"
          >
            <OnboardingProgressBar />

            {/* Header */}
            <YStack alignItems="center" marginBottom="$4xl">
              <Text
                fontSize={24}
                fontWeight="700"
                color="$color"
                textAlign="center"
                marginBottom="$md"
              >
                Votre revenu mensuel
              </Text>
              <Text
                fontSize={16}
                color="$colorSecondary"
                textAlign="center"
                lineHeight={24}
              >
                Montant net après impôts et cotisations
              </Text>
            </YStack>

            {/* Form */}
            <YStack flex={1} gap="$sm">
              <Text
                fontSize={16}
                fontWeight="600"
                color="$gray700"
                marginBottom="$sm"
              >
                Montant en euros (€)
              </Text>
              <Input
                placeholder="Ex: 2400"
                value={monthlyIncome}
                onChangeText={handleIncomeChange}
                onBlur={() => dispatch(blurIncome())}
                keyboardType="decimal-pad"
                maxLength={10}
                error={hasError}
                textAlign="center"
              />

              {error && (
                <Text
                  fontSize={14}
                  color="#ef4444"
                  textAlign="center"
                  marginTop="$sm"
                >
                  {error}
                </Text>
              )}

              {/* Info boxes */}
              <Card backgroundColor="$backgroundSecondary" marginTop="$xl">
                <YStack gap="$xs">
                  <Text fontSize={14} fontWeight="600" color="$gray700">
                    💡 Pourquoi cette information ?
                  </Text>
                  <Text fontSize={14} color="$colorSecondary" lineHeight={20}>
                    Equim calcule des parts équitables basées sur les revenus.
                    Cette donnée reste confidentielle et vous contrôlez qui peut
                    la voir.
                  </Text>
                </YStack>
              </Card>

              <Card backgroundColor="$warning100" marginTop="$base">
                <YStack gap="$xs">
                  <Text fontSize={14} fontWeight="600" color="$gray700">
                    ⚖️ L'équité avant tout :
                  </Text>
                  <Text fontSize={14} color="$colorSecondary" lineHeight={20}>
                    Les écarts de revenus reflètent souvent des inégalités
                    systémiques. Partager selon ses moyens, c'est plus juste.
                  </Text>
                </YStack>
              </Card>
            </YStack>
          </ScrollView>

          {/* Actions - Sticky at bottom */}
          <YStack
            paddingHorizontal="$xl"
            paddingTop="$lg"
            paddingBottom="$base"
          >
            <Button
              variant="primary"
              onPress={handleContinue}
              disabled={!canContinue}
            >
              Continuer →
            </Button>
          </YStack>
        </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
