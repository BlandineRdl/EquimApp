import { useRouter } from "expo-router";
import {
  AlertTriangle,
  ArrowLeft,
  Edit2,
  LogOut,
  User,
} from "lucide-react-native";
import { useState } from "react";
import { Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { ScrollView, Text, XStack, YStack } from "tamagui";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { IconButton } from "../../src/components/IconButton";
import { signOut } from "../../src/features/auth/usecases/manage-session/signOut.usecase";
import { resetAccount } from "../../src/features/auth/usecases/reset-account/resetAccount.usecase";
import { ManagePersonalExpensesModal } from "../../src/features/user/presentation/ManagePersonalExpensesModal.component";
import { PersonalExpensesList } from "../../src/features/user/presentation/PersonalExpensesList.component";
import { selectPersonalExpenses } from "../../src/features/user/presentation/selectors/selectPersonalExpenses.selector";
import { selectUserProfile } from "../../src/features/user/presentation/selectors/selectUser.selector";
import { selectUserCapacity } from "../../src/features/user/presentation/selectors/selectUserCapacity.selector";
import { UpdateIncomeModal } from "../../src/features/user/presentation/UpdateIncomeModal.component";
import { useThemeControl } from "../../src/lib/tamagui/theme-provider";
import { useAppDispatch } from "../../src/store/buildReduxStore";

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useSelector(selectUserProfile);
  const capacity = useSelector(selectUserCapacity);
  const personalExpenses = useSelector(selectPersonalExpenses);
  const [isIncomeModalVisible, setIsIncomeModalVisible] = useState(false);
  const [isExpensesModalVisible, setIsExpensesModalVisible] = useState(false);
  const { theme } = useThemeControl();

  // Theme-aware colors for icons
  const iconColor = theme === "light" ? "#111827" : "#ffffff";
  const iconSuccess = "#16a34a"; // success600
  const iconError = "#ef4444"; // error
  const iconErrorDark = "#dc2626"; // error600

  const handleSignOut = async () => {
    await dispatch(signOut());
    // User will be redirected to sign-in by the layout
  };

  const handleReset = () => {
    Alert.alert(
      "⚠️ Réinitialiser le compte",
      "Cette action est IRRÉVERSIBLE. Toutes vos données seront définitivement supprimées :\n\n• Votre profil\n• Tous vos groupes\n• Toutes vos dépenses\n• Toutes vos invitations\n\nÊtes-vous absolument sûr ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Confirmer la suppression",
          style: "destructive",
          onPress: async () => {
            await dispatch(resetAccount());
            // User will be redirected to sign-in by the layout
          },
        },
      ],
    );
  };

  const totalExpenses = personalExpenses.reduce(
    (sum, exp) => sum + exp.amount,
    0,
  );

  if (!user) {
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
          backgroundColor="$background"
        >
          <Text fontSize={16} color="$colorSecondary">
            Chargement...
          </Text>
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
      <YStack flex={1} backgroundColor="$background">
        <ScrollView
          flex={1}
          showsVerticalScrollIndicator={false}
          paddingHorizontal="$base"
        >
          {/* Header */}
          <XStack
            alignItems="center"
            paddingVertical="$base"
            backgroundColor="$backgroundSecondary"
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
            marginHorizontal="-$base"
            paddingHorizontal="$base"
            marginBottom="$base"
          >
            <Button
              variant="secondary"
              width="$2xl"
              height="$2xl"
              padding={0}
              borderRadius="$base"
              onPress={() => router.back()}
              backgroundColor="$background"
            >
              <ArrowLeft size={24} color={iconColor} />
            </Button>
            <Text
              flex={1}
              fontSize={18}
              fontWeight="600"
              color="$color"
              textAlign="center"
              marginRight="$2xl"
            >
              Mon profil
            </Text>
            <YStack width="$2xl" />
          </XStack>

          <YStack paddingTop="$base">
            {/* Profile Info Card */}
            <Card marginBottom="$base" backgroundColor="$backgroundSecondary">
              <XStack alignItems="center">
                <YStack
                  width="$5xl"
                  height="$5xl"
                  borderRadius="$full"
                  backgroundColor="$success100"
                  justifyContent="center"
                  alignItems="center"
                  marginRight="$base"
                >
                  <User size={32} color={iconSuccess} />
                </YStack>
                <YStack flex={1}>
                  <Text fontSize={12} color="$colorSecondary" marginBottom="$1">
                    Pseudo
                  </Text>
                  <Text fontSize={20} fontWeight="600" color="$color">
                    {user.pseudo}
                  </Text>
                </YStack>
              </XStack>
            </Card>

            {/* Income Card */}
            <Card marginBottom="$base" backgroundColor="$backgroundSecondary">
              <XStack justifyContent="space-between" alignItems="flex-start">
                <YStack flex={1}>
                  <Text fontSize={12} color="$colorSecondary" marginBottom="$1">
                    Revenu mensuel
                  </Text>
                  <Text
                    fontSize={28}
                    fontWeight="700"
                    color="$color"
                    marginBottom="$1"
                  >
                    {user.monthlyIncome.toLocaleString("fr-FR")} €
                  </Text>
                  <Text fontSize={12} color="$colorTertiary" fontStyle="italic">
                    Utilisé pour le calcul équitable des parts
                  </Text>
                </YStack>
                <IconButton
                  icon={Edit2}
                  variant="success"
                  size={40}
                  iconSize={20}
                  onPress={() => setIsIncomeModalVisible(true)}
                />
              </XStack>
            </Card>

            {/* Personal Expenses Card */}
            <PersonalExpensesList
              expenses={personalExpenses}
              onManagePress={() => setIsExpensesModalVisible(true)}
            />

            {/* Capacity Card */}
            {capacity !== undefined && (
              <Card marginBottom="$base" backgroundColor="$backgroundSecondary">
                <YStack alignItems="center" paddingVertical="$sm">
                  <Text
                    fontSize={14}
                    fontWeight="600"
                    color="$color"
                    marginBottom="$sm"
                  >
                    💰 Capacité de dépense
                  </Text>
                  <Text
                    fontSize={32}
                    fontWeight="700"
                    color={capacity < 0 ? "$error" : "$success"}
                    marginBottom="$1"
                  >
                    {capacity.toLocaleString("fr-FR")} €
                  </Text>
                  <Text
                    fontSize={12}
                    color="$colorSecondary"
                    textAlign="center"
                  >
                    Revenu ({user.monthlyIncome.toLocaleString("fr-FR")} €) -
                    Charges ({totalExpenses.toLocaleString("fr-FR")} €)
                  </Text>
                </YStack>
              </Card>
            )}

            {/* Info Section */}
            <YStack marginTop="$lg" marginBottom="$xl">
              <Text
                fontSize={16}
                fontWeight="600"
                color="$color"
                marginBottom="$md"
              >
                À propos du revenu
              </Text>
              <Text
                fontSize={14}
                color="$colorSecondary"
                lineHeight={20}
                marginBottom="$md"
              >
                Votre revenu mensuel est utilisé pour calculer votre part
                équitable dans chaque groupe. Plus votre revenu est élevé, plus
                votre contribution est importante.
              </Text>
              <Text fontSize={14} color="$colorSecondary" lineHeight={20}>
                Vous pouvez modifier votre revenu à tout moment. Les parts de
                tous vos groupes seront automatiquement recalculées.
              </Text>
            </YStack>

            {/* Reset Account Button */}
            <YStack marginTop="$base">
              <Button
                variant="secondary"
                backgroundColor="$error100"
                borderWidth={2}
                borderColor="$error600"
                onPress={handleReset}
              >
                <XStack alignItems="center" gap="$sm">
                  <AlertTriangle size={20} color={iconErrorDark} />
                  <Text fontSize={16} fontWeight="700" color="#dc2626">
                    Réinitialiser le compte
                  </Text>
                </XStack>
              </Button>
              <Text
                fontSize={12}
                color="#dc2626"
                textAlign="center"
                marginTop="$sm"
                fontStyle="italic"
              >
                ⚠️ Supprime définitivement toutes vos données
              </Text>
            </YStack>

            {/* Logout Button */}
            <YStack marginTop="$base" marginBottom="$xl">
              <Button
                variant="secondary"
                backgroundColor="$backgroundSecondary"
                borderWidth={1}
                borderColor="$error200"
                onPress={handleSignOut}
              >
                <XStack alignItems="center" gap="$sm">
                  <LogOut size={20} color={iconError} />
                  <Text fontSize={16} fontWeight="600" color="$error">
                    Se déconnecter
                  </Text>
                </XStack>
              </Button>
            </YStack>
          </YStack>
        </ScrollView>

        {/* Update Income Modal */}
        <UpdateIncomeModal
          isVisible={isIncomeModalVisible}
          onClose={() => setIsIncomeModalVisible(false)}
          onSuccess={() => {
            // Modal will close automatically, shares will update via listeners
          }}
        />

        {/* Manage Personal Expenses Modal */}
        <ManagePersonalExpensesModal
          isVisible={isExpensesModalVisible}
          onClose={() => setIsExpensesModalVisible(false)}
        />
      </YStack>
    </SafeAreaView>
  );
}
