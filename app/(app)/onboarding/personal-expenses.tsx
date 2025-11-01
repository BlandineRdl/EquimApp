import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { ScrollView, Text, XStack, YStack } from "tamagui";
import { Button } from "../../../src/components/Button";
import { Card } from "../../../src/components/Card";
import type { Expense } from "../../../src/components/expense/ExpenseManager.component";
import { ExpenseManager } from "../../../src/components/expense/ExpenseManager.component";
import { OnboardingProgressBar } from "../../../src/features/onboarding/presentation/OnboardingProgressBar.component";
import { selectIncomeUI } from "../../../src/features/onboarding/presentation/onboarding.selectors";
import { setPersonalExpenses } from "../../../src/features/onboarding/store/onboarding.slice";
import { useThemeControl } from "../../../src/lib/tamagui/theme-provider";
import { useAppDispatch } from "../../../src/store/buildReduxStore";

export default function PersonalExpensesScreen() {
  const dispatch = useAppDispatch();
  const { theme } = useThemeControl();
  const { numericValue: income } = useSelector(selectIncomeUI);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isSubmitting, _setIsSubmitting] = useState(false);

  const handleAddExpense = async (label: string, amount: number) => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      label,
      amount,
    };
    setExpenses((prev) => [...prev, newExpense]);
  };

  const handleEditExpense = async (
    id: string,
    label: string,
    amount: number,
  ) => {
    setExpenses((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, label, amount } : exp)),
    );
  };

  const handleDeleteExpense = async (id: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
  };

  const calculateSubtotal = (): number => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  };

  const calculateCapacity = (): number => {
    return income - calculateSubtotal();
  };

  const canContinue = (): boolean => {
    return expenses.length > 0 && !isSubmitting;
  };

  const handleContinue = () => {
    if (!canContinue()) return;

    // Store expenses in onboarding state (will be created after profile creation)
    dispatch(
      setPersonalExpenses(
        expenses.map((exp) => ({
          label: exp.label,
          amount: exp.amount,
        })),
      ),
    );

    router.push("/onboarding/group-choice");
  };

  const subtotal = calculateSubtotal();
  const capacity = calculateCapacity();

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
            <YStack alignItems="center" marginBottom="$xl">
              <Text
                fontSize={24}
                fontWeight="700"
                color="$color"
                textAlign="center"
                marginBottom="$md"
              >
                Vos charges personnelles
              </Text>
              <Text
                fontSize={16}
                color="$colorSecondary"
                textAlign="center"
                lineHeight={24}
              >
                Ajoutez au moins une dépense individuelle (non partagée) pour
                calculer votre capacité réelle
              </Text>
            </YStack>

            {/* Expense Manager */}
            <YStack flex={1} marginBottom="$xl">
              <ExpenseManager
                expenses={expenses}
                onAdd={handleAddExpense}
                onEdit={handleEditExpense}
                onDelete={handleDeleteExpense}
                minExpenses={0}
                title="Mes charges personnelles"
                addSectionTitle="Ajouter une charge"
              />
            </YStack>

            {/* Summary */}
            {subtotal > 0 && (
              <Card backgroundColor="$backgroundSecondary" marginBottom="$base">
                <YStack gap="$sm">
                  <XStack justifyContent="space-between" marginBottom="$sm">
                    <Text fontSize={14} color="$colorSecondary">
                      Revenu mensuel
                    </Text>
                    <Text fontSize={14} color="$gray700" fontWeight="500">
                      {income.toFixed(2)} €
                    </Text>
                  </XStack>
                  <XStack justifyContent="space-between" marginBottom="$sm">
                    <Text fontSize={14} color="$colorSecondary">
                      Total des charges
                    </Text>
                    <Text fontSize={14} color="$gray700" fontWeight="500">
                      - {subtotal.toFixed(2)} €
                    </Text>
                  </XStack>
                  <YStack
                    borderTopWidth={1}
                    borderTopColor="$borderColor"
                    paddingTop="$md"
                    marginTop="$xs"
                  >
                    <XStack justifyContent="space-between">
                      <Text fontSize={16} color="$color" fontWeight="600">
                        Capacité de dépense
                      </Text>
                      <Text
                        fontSize={16}
                        fontWeight="700"
                        color={capacity < 0 ? "$error" : "$success"}
                      >
                        {capacity.toFixed(2)} €
                      </Text>
                    </XStack>
                  </YStack>
                </YStack>
              </Card>
            )}

            {/* Info box */}
            <Card backgroundColor="$backgroundSecondary" marginBottom="$base">
              <YStack gap="$xs">
                <Text fontSize={14} fontWeight="600" color="$gray700">
                  💡 Pourquoi cette information ?
                </Text>
                <Text fontSize={14} color="$colorSecondary" lineHeight={20}>
                  Equim calcule votre capacité réelle (revenu - charges
                  personnelles) pour des parts de groupe plus justes. Exemples :
                  crédit immobilier non partagé, crédit voiture, abonnement
                  salle de sport... Vous pourrez modifier ces informations plus
                  tard depuis votre profil.
                </Text>
              </YStack>
            </Card>
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
              disabled={!canContinue()}
            >
              {isSubmitting ? "Enregistrement..." : "Continuer →"}
            </Button>
          </YStack>
        </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
