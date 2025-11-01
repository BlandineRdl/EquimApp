import { router } from "expo-router";
import { Plus, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { ScrollView, Text, XStack, YStack } from "tamagui";
import { Button } from "../../../src/components/Button";
import { Card } from "../../../src/components/Card";
import { Input } from "../../../src/components/Input";
import { OnboardingProgressBar } from "../../../src/features/onboarding/presentation/OnboardingProgressBar.component";
import { selectExpensesUI } from "../../../src/features/onboarding/presentation/onboarding.selectors";
import {
  addCustomExpense,
  removeCustomExpense,
  updateExpenseAmount,
} from "../../../src/features/onboarding/store/onboarding.slice";
import { useThemeControl } from "../../../src/lib/tamagui/theme-provider";
import { useAppDispatch } from "../../../src/store/buildReduxStore";

export default function ExpensesScreen() {
  const dispatch = useAppDispatch();
  const { theme } = useThemeControl();

  // Icon colors
  const _iconColor = theme === "light" ? "#111827" : "#ffffff";
  const _iconError = "#ef4444";

  const [newExpenseLabel, setNewExpenseLabel] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");

  const { expenses, groupName, totalAmount, canContinue } =
    useSelector(selectExpensesUI);

  const handleExpenseAmountChange = (id: string, amount: string) => {
    // Nettoyer l'input (seulement chiffres et point décimal)
    const cleanAmount = amount.replace(/[^0-9.]/g, "");
    dispatch(updateExpenseAmount({ id, amount: cleanAmount }));
  };

  const handleAddCustomExpense = () => {
    if (newExpenseLabel.trim() && newExpenseAmount.trim()) {
      dispatch(
        addCustomExpense({
          label: newExpenseLabel.trim(),
          amount: newExpenseAmount,
        }),
      );
      setNewExpenseLabel("");
      setNewExpenseAmount("");
    }
  };

  const handleRemoveExpense = (id: string) => {
    dispatch(removeCustomExpense(id));
  };

  const handleFinalize = () => {
    router.push("/onboarding/summary");
  };

  const handleSkip = () => {
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
                Ajouter des dépenses
              </Text>
              <Text
                fontSize={16}
                color="$colorSecondary"
                textAlign="center"
                lineHeight={24}
              >
                Quelles sont vos principales dépenses mensuelles pour "
                {groupName}" ?
              </Text>
            </YStack>

            {/* Dépenses courantes */}
            <Card backgroundColor="$backgroundSecondary" marginBottom="$base">
              <YStack gap="$sm">
                <Text
                  fontSize={16}
                  fontWeight="600"
                  color="$color"
                  marginBottom="$md"
                >
                  Dépenses courantes
                </Text>

                {expenses
                  .filter((expense) => !expense.isCustom)
                  .map((expense) => (
                    <XStack
                      key={expense.id}
                      justifyContent="space-between"
                      alignItems="center"
                      paddingVertical="$md"
                      borderBottomWidth={1}
                      borderBottomColor="$borderColor"
                    >
                      <Text
                        fontSize={14}
                        color="$color"
                        fontWeight="500"
                        flex={1}
                      >
                        {expense.label}
                      </Text>
                      <XStack alignItems="center">
                        <Input
                          backgroundColor="$background"
                          borderWidth={1}
                          borderColor="$borderColor"
                          borderRadius="$base"
                          paddingHorizontal="$md"
                          paddingVertical={10}
                          fontSize={14}
                          color="$color"
                          width="$6xl"
                          textAlign="right"
                          placeholder="0"
                          value={expense.amount}
                          onChangeText={(text) =>
                            handleExpenseAmountChange(expense.id, text)
                          }
                          keyboardType="decimal-pad"
                          maxLength={8}
                        />
                        <Text
                          fontSize={14}
                          color="$colorSecondary"
                          marginLeft="$sm"
                          fontWeight="500"
                        >
                          €
                        </Text>
                      </XStack>
                    </XStack>
                  ))}
              </YStack>
            </Card>

            {/* Ajouter une dépense personnalisée */}
            <Card backgroundColor="$backgroundSecondary" marginBottom="$base">
              <YStack gap="$sm">
                <Text
                  fontSize={16}
                  fontWeight="600"
                  color="$color"
                  marginBottom="$md"
                >
                  Ajouter une dépense
                </Text>

                {/* Formulaire */}
                <XStack gap="$md" marginBottom="$md">
                  <YStack flex={2}>
                    <Text
                      fontSize={12}
                      fontWeight="500"
                      color="$colorSecondary"
                      marginBottom="$1"
                    >
                      Libellé
                    </Text>
                    <Input
                      placeholder="Ex: Loyer"
                      value={newExpenseLabel}
                      onChangeText={setNewExpenseLabel}
                      maxLength={20}
                    />
                  </YStack>
                  <YStack flex={1}>
                    <Text
                      fontSize={12}
                      fontWeight="500"
                      color="$colorSecondary"
                      marginBottom="$1"
                    >
                      Montant (€)
                    </Text>
                    <Input
                      placeholder="0"
                      value={newExpenseAmount}
                      onChangeText={(text) =>
                        setNewExpenseAmount(text.replace(/[^0-9.]/g, ""))
                      }
                      keyboardType="decimal-pad"
                      maxLength={8}
                    />
                  </YStack>
                </XStack>

                <Button
                  variant="success"
                  onPress={handleAddCustomExpense}
                  disabled={!newExpenseLabel.trim() || !newExpenseAmount.trim()}
                >
                  <XStack alignItems="center" gap="$sm">
                    <Plus size={20} color="#ffffff" />
                    <Text fontSize={14} fontWeight="600" color="$white">
                      Ajouter
                    </Text>
                  </XStack>
                </Button>
              </YStack>
            </Card>

            {/* Liste des dépenses personnalisées */}
            {expenses.filter((expense) => expense.isCustom).length > 0 && (
              <YStack marginBottom="$base">
                <Text
                  fontSize={16}
                  fontWeight="600"
                  color="$color"
                  marginBottom="$md"
                >
                  Mes dépenses ({expenses.filter((e) => e.isCustom).length})
                </Text>
                {expenses
                  .filter((expense) => expense.isCustom)
                  .map((expense) => (
                    <Card
                      key={expense.id}
                      backgroundColor="$background"
                      borderWidth={1}
                      borderColor="$borderColor"
                      padding="$md"
                      marginBottom="$sm"
                    >
                      <XStack
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <YStack flex={1} marginRight="$md">
                          <Text
                            fontSize={14}
                            fontWeight="500"
                            color="$color"
                            marginBottom="$1"
                          >
                            {expense.label}
                          </Text>
                          <Text fontSize={16} fontWeight="600" color="#16a34a">
                            {expense.amount} €
                          </Text>
                        </YStack>
                        <Button
                          variant="secondary"
                          width="$9"
                          height="$9"
                          borderRadius="$full"
                          backgroundColor="$error100"
                          padding={0}
                          onPress={() => handleRemoveExpense(expense.id)}
                        >
                          <Trash2 size={18} color="#ef4444" />
                        </Button>
                      </XStack>
                    </Card>
                  ))}
              </YStack>
            )}

            {/* Total */}
            {totalAmount > 0 && (
              <XStack
                justifyContent="space-between"
                alignItems="center"
                backgroundColor="$success100"
                padding="$base"
                borderRadius="$base"
                marginBottom="$xl"
              >
                <Text fontSize={16} fontWeight="600" color="$gray700">
                  Total mensuel :
                </Text>
                <Text fontSize={18} fontWeight="700" color="#16a34a">
                  {totalAmount.toFixed(2)}€
                </Text>
              </XStack>
            )}
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
              onPress={handleFinalize}
              disabled={!canContinue}
            >
              Finaliser →
            </Button>

            <Button variant="secondary" onPress={handleSkip}>
              <Text fontSize={16} color="$colorSecondary" fontWeight="500">
                Passer cette étape
              </Text>
            </Button>
          </YStack>
        </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
