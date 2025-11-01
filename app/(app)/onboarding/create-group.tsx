import { router } from "expo-router";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { ScrollView, Text, XStack, YStack } from "tamagui";
import { Button } from "../../../src/components/Button";
import { Card } from "../../../src/components/Card";
import { Input } from "../../../src/components/Input";
import { SUGGESTED_GROUP_NAMES } from "../../../src/features/group/domain/manage-group/group.constants";
import { OnboardingProgressBar } from "../../../src/features/onboarding/presentation/OnboardingProgressBar.component";
import { selectGroupUI } from "../../../src/features/onboarding/presentation/onboarding.selectors";
import {
  blurGroupName,
  setGroupName,
} from "../../../src/features/onboarding/store/onboarding.slice";
import { useThemeControl } from "../../../src/lib/tamagui/theme-provider";
import { useAppDispatch } from "../../../src/store/buildReduxStore";

export default function CreateGroupScreen() {
  const dispatch = useAppDispatch();
  const { theme } = useThemeControl();

  const { groupName, error, canContinue, hasError } =
    useSelector(selectGroupUI);

  const handleGroupNameChange = (text: string) => {
    dispatch(setGroupName(text));
  };

  const handleContinue = () => {
    if (canContinue) {
      router.push("/onboarding/expenses");
    }
  };

  const suggestedNames = SUGGESTED_GROUP_NAMES;

  const handleSuggestionPress = (suggestion: string) => {
    dispatch(setGroupName(suggestion));
    dispatch(blurGroupName());
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
                Créer votre premier groupe
              </Text>
              <Text
                fontSize={16}
                color="$colorSecondary"
                textAlign="center"
                lineHeight={24}
              >
                Donnez un nom à votre groupe de dépenses partagées
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
                Nom du groupe
              </Text>
              <Input
                placeholder="Ex: Foyer, Coloc, Quotidien..."
                value={groupName}
                onChangeText={handleGroupNameChange}
                onBlur={() => dispatch(blurGroupName())}
                maxLength={30}
                autoCapitalize="words"
                autoCorrect={false}
                error={hasError}
              />

              {error && (
                <Text fontSize={14} color="#ef4444" marginTop="$sm">
                  {error}
                </Text>
              )}

              {/* Suggestions */}
              <Card backgroundColor="$backgroundSecondary" marginTop="$xl">
                <YStack gap="$sm">
                  <Text fontSize={14} fontWeight="600" color="$gray700">
                    💡 Exemples de groupes
                  </Text>
                  <Text
                    fontSize={14}
                    color="$colorSecondary"
                    lineHeight={20}
                    marginBottom="$base"
                  >
                    Foyer, Coloc, Vacances été, Sorties, Courses, Restaurant...
                    Vous pourrez créer d'autres groupes plus tard.
                  </Text>

                  <XStack flexWrap="wrap" gap="$sm">
                    {suggestedNames.map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant={
                          groupName === suggestion ? "primary" : "secondary"
                        }
                        backgroundColor={
                          groupName === suggestion ? "$success" : "$background"
                        }
                        borderWidth={1}
                        borderColor={
                          groupName === suggestion ? "$success" : "$borderColor"
                        }
                        borderRadius="$lg"
                        paddingHorizontal="$md"
                        paddingVertical={6}
                        height="auto"
                        onPress={() => handleSuggestionPress(suggestion)}
                      >
                        <Text
                          fontSize={14}
                          fontWeight="500"
                          color={
                            groupName === suggestion ? "$white" : "$gray700"
                          }
                        >
                          {suggestion}
                        </Text>
                      </Button>
                    ))}
                  </XStack>
                </YStack>
              </Card>
            </YStack>
          </ScrollView>

          {/* Actions - Sticky at bottom */}
          <YStack
            paddingHorizontal="$xl"
            paddingTop="$lg"
            paddingBottom="$base"
            gap="$md"
          >
            <Button
              variant="primary"
              onPress={handleContinue}
              disabled={!canContinue}
            >
              Ajouter des dépenses →
            </Button>
            <Button variant="secondary" onPress={() => router.back()}>
              ← Retour
            </Button>
          </YStack>
        </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
