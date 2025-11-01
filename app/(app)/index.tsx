import { router } from "expo-router";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { ScrollView, Text, YStack } from "tamagui";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { Input } from "../../src/components/Input";
import { OnboardingProgressBar } from "../../src/features/onboarding/presentation/OnboardingProgressBar.component";
import { selectOnboardingUI } from "../../src/features/onboarding/presentation/onboarding.selectors";
import {
  blurPseudo,
  setPseudo,
} from "../../src/features/onboarding/store/onboarding.slice";
import { useThemeControl } from "../../src/lib/tamagui/theme-provider";
import { useAppDispatch } from "../../src/store/buildReduxStore";

export default function WelcomeScreen() {
  const dispatch = useAppDispatch();
  const { theme } = useThemeControl();

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
            <YStack
              alignItems="center"
              gap="$md"
              marginTop="$4xl"
              marginBottom="$3xl"
            >
              <YStack
                width="$5xl"
                height="$5xl"
                backgroundColor="$success100"
                borderRadius="$full"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize={32}>🌱</Text>
              </YStack>

              <Text
                fontSize={24}
                fontWeight="700"
                color="$color"
                textAlign="center"
              >
                Choisissez votre pseudo
              </Text>
              <Text
                fontSize={16}
                color="$colorSecondary"
                textAlign="center"
                lineHeight={24}
                paddingHorizontal="$sm"
              >
                Comment souhaitez-vous être appelé dans l'application ?
              </Text>
            </YStack>

            {/* Form */}
            <YStack gap="$sm">
              <Text fontSize={16} fontWeight="600" color="$color">
                Votre pseudo
              </Text>
              <Input
                value={pseudo}
                onChangeText={handlePseudoChange}
                onBlur={() => dispatch(blurPseudo())}
                error={hasError}
              />

              {error && (
                <Text fontSize={14} color="$error">
                  {error}
                </Text>
              )}

              {/* Info box */}
              <Card backgroundColor="$backgroundSecondary" marginTop="$xl">
                <YStack gap="$xs">
                  <Text fontSize={14} fontWeight="600" color="$color">
                    💡 Votre identité, vos règles
                  </Text>
                  <Text fontSize={14} color="$colorSecondary" lineHeight={20}>
                    Utilisez le prénom, surnom ou pseudo de votre choix. Vous
                    pourrez le modifier à tout moment depuis votre espace Profil
                    une fois ce dernier créé.
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
              disabled={isButtonDisabled}
            >
              Ajouter mon revenu →
            </Button>
          </YStack>
        </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
