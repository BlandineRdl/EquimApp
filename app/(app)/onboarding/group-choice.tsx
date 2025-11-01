import { router } from "expo-router";
import { Users } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, Text, XStack, YStack } from "tamagui";
import { Card } from "../../../src/components/Card";
import { OnboardingProgressBar } from "../../../src/features/onboarding/presentation/OnboardingProgressBar.component";
import { setSkipGroupCreation } from "../../../src/features/onboarding/store/onboarding.slice";
import { useThemeControl } from "../../../src/lib/tamagui/theme-provider";
import { useAppDispatch } from "../../../src/store/buildReduxStore";

export default function GroupChoiceScreen() {
  const dispatch = useAppDispatch();
  const { theme } = useThemeControl();

  const handleCreateGroup = () => {
    dispatch(setSkipGroupCreation(false));
    router.push("/onboarding/create-group");
  };

  const handleSkipGroup = () => {
    dispatch(setSkipGroupCreation(true));
    router.push("/onboarding/summary");
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme === "light" ? "#ffffff" : "#111827",
      }}
      edges={["top"]}
    >
      <ScrollView
        flex={1}
        showsVerticalScrollIndicator={false}
        paddingHorizontal="$xl"
      >
        <OnboardingProgressBar />

        {/* Header */}
        <YStack alignItems="center" marginBottom="$xl">
          <YStack
            width="$6xl"
            height="$6xl"
            borderRadius="$full"
            backgroundColor="$success100"
            alignItems="center"
            justifyContent="center"
            marginBottom="$xl"
          >
            <Users size={48} color="#16a34a" />
          </YStack>
          <Text
            fontSize={24}
            fontWeight="700"
            color="$color"
            textAlign="center"
            marginBottom="$md"
          >
            Créer un groupe ?
          </Text>
          <Text
            fontSize={16}
            color="$colorSecondary"
            textAlign="center"
            lineHeight={24}
          >
            Les groupes vous permettent de partager des dépenses avec d'autres
            personnes (foyer, colocation, vacances...)
          </Text>
        </YStack>

        {/* Options */}
        <YStack flex={1} gap="$base">
          {/* Create Group Option */}
          <Card
            backgroundColor="$success100"
            borderWidth={2}
            borderColor="$success"
            padding="$lg"
            pressStyle={{ scale: 0.98 }}
            cursor="pointer"
            onPress={handleCreateGroup}
          >
            <XStack
              alignItems="center"
              justifyContent="space-between"
              marginBottom="$md"
            >
              <Text fontSize={18} fontWeight="700" color="#111827">
                Créer un groupe
              </Text>
              <YStack
                backgroundColor="$success"
                paddingHorizontal="$sm"
                paddingVertical="$1"
                borderRadius="$sm"
              >
                <Text fontSize={12} fontWeight="600" color="$white">
                  Recommandé
                </Text>
              </YStack>
            </XStack>
            <Text
              fontSize={15}
              color="#374151"
              lineHeight={22}
              marginBottom="$base"
            >
              Partagez vos dépenses équitablement selon les revenus de chacun.
              Idéal pour les couples, colocations ou projets communs.
            </Text>
            <YStack gap="$sm">
              <Text fontSize={14} color="#15803d" fontWeight="500">
                ✓ Calcul automatique des parts
              </Text>
              <Text fontSize={14} color="#15803d" fontWeight="500">
                ✓ Invitations par lien
              </Text>
              <Text fontSize={14} color="#15803d" fontWeight="500">
                ✓ Ajustement selon les revenus
              </Text>
            </YStack>
          </Card>

          {/* Skip Option */}
          <Card
            backgroundColor="$background"
            borderWidth={1}
            borderColor="$borderColor"
            padding="$lg"
            pressStyle={{ scale: 0.98 }}
            cursor="pointer"
            onPress={handleSkipGroup}
          >
            <Text
              fontSize={18}
              fontWeight="600"
              color="$gray700"
              marginBottom="$md"
            >
              Continuer sans groupe
            </Text>
            <Text fontSize={15} color="$colorSecondary" lineHeight={22}>
              Vous pourrez créer un groupe plus tard depuis l'application si
              vous en avez besoin.
            </Text>
          </Card>
        </YStack>

        {/* Info box */}
        <Card
          backgroundColor="$backgroundSecondary"
          marginTop="$xl"
          marginBottom="$xl"
        >
          <YStack gap="$xs">
            <Text fontSize={14} fontWeight="600" color="$gray700">
              💡 Bon à savoir
            </Text>
            <Text fontSize={14} color="$colorSecondary" lineHeight={20}>
              Vous pouvez créer plusieurs groupes et gérer différentes
              catégories de dépenses partagées (foyer, vacances, projets...).
            </Text>
          </YStack>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
