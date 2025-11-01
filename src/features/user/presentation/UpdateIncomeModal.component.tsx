import { DollarSign, X } from "lucide-react-native";
import type React from "react";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform } from "react-native";
import Toast from "react-native-toast-message";
import { useSelector } from "react-redux";
import { Text, XStack, YStack } from "tamagui";
import { Button } from "../../../components/Button";
import { Input } from "../../../components/Input";
import { useThemeControl } from "../../../lib/tamagui/theme-provider";
import { useAppDispatch } from "../../../store/buildReduxStore";
import {
  MAX_INCOME,
  MIN_INCOME,
} from "../domain/manage-profile/profile.constants";
import { validateIncome } from "../domain/manage-profile/validate-income";
import { updateUserIncome } from "../usecases/updateUserIncome.usecase";
import { selectPersonalExpenses } from "./selectors/selectPersonalExpenses.selector";
import { selectUserProfile } from "./selectors/selectUser.selector";

export interface UpdateIncomeModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UpdateIncomeModal: React.FC<UpdateIncomeModalProps> = ({
  isVisible,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const user = useSelector(selectUserProfile);
  const personalExpenses = useSelector(selectPersonalExpenses);
  const { theme } = useThemeControl();
  const iconSecondary = theme === "light" ? "#6b7280" : "#9ca3af";
  const iconSuccess = "#16a34a";

  const [income, setIncome] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize with current income when modal opens
  useEffect(() => {
    if (isVisible && user) {
      setIncome(user.monthlyIncome.toString());
      setValidationError(null);
    }
  }, [isVisible, user]);

  // Validate on change
  const handleIncomeChange = (text: string) => {
    setIncome(text);

    // Clear validation if empty
    if (!text.trim()) {
      setValidationError(null);
      return;
    }

    // Parse and validate
    const numericValue = Number.parseFloat(text);
    if (Number.isNaN(numericValue)) {
      setValidationError("Valeur invalide");
      return;
    }

    const validation = validateIncome(numericValue);
    setValidationError(
      validation.isValid ? null : validation.errors.join(", "),
    );
  };

  const handleSave = async () => {
    if (!user) {
      return;
    }

    const trimmedIncome = income.trim();
    if (!trimmedIncome) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Veuillez entrer un revenu",
      });
      return;
    }

    const numericIncome = Number.parseFloat(trimmedIncome);
    if (Number.isNaN(numericIncome)) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Le revenu doit être un nombre valide",
      });
      return;
    }

    // Validate
    const validation = validateIncome(numericIncome);
    if (!validation.isValid) {
      Toast.show({
        type: "error",
        text1: "Validation échouée",
        text2: validation.errors.join(", "),
      });
      return;
    }

    setIsUpdating(true);

    try {
      // Update income (capacity will be recalculated automatically in the reducer)
      await dispatch(
        updateUserIncome({ userId: user.id, newIncome: numericIncome }),
      ).unwrap();

      // Calculate new capacity for display
      const totalExpenses = personalExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0,
      );
      const newCapacity = numericIncome - totalExpenses;

      Toast.show({
        type: "success",
        text1: "Revenu mis à jour",
        text2: `Nouvelle capacité : ${newCapacity.toLocaleString("fr-FR")}€`,
      });

      onClose();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      Toast.show({
        type: "error",
        text1: "Échec de la mise à jour",
        text2: errorMessage,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const isValid = !validationError && income.trim() !== "";

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
        }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <YStack
          width="90%"
          maxWidth={400}
          backgroundColor="$background"
          borderRadius="$xl"
        >
          {/* Header */}
          <XStack
            alignItems="center"
            padding="$lg"
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
          >
            <YStack
              width="$3xl"
              height="$3xl"
              borderRadius="$base"
              backgroundColor="$success100"
              justifyContent="center"
              alignItems="center"
              marginRight="$md"
            >
              <DollarSign size={24} color={iconSuccess} />
            </YStack>
            <Text flex={1} fontSize={18} fontWeight="600" color="$color">
              Modifier mon revenu
            </Text>
            <Button
              variant="secondary"
              width="$2xl"
              height="$2xl"
              padding={0}
              borderRadius="$base"
              onPress={onClose}
              disabled={isUpdating}
            >
              <X size={24} color={iconSecondary} />
            </Button>
          </XStack>

          {/* Body */}
          <YStack padding="$lg">
            <Text
              fontSize={14}
              fontWeight="500"
              color="$gray700"
              marginBottom="$1"
            >
              Revenu mensuel net (€)
            </Text>
            <Text fontSize={12} color="$colorSecondary" marginBottom="$md">
              Entre {MIN_INCOME.toLocaleString("fr-FR")}€ et{" "}
              {MAX_INCOME.toLocaleString("fr-FR")}€
            </Text>

            <Input
              value={income}
              onChangeText={handleIncomeChange}
              placeholder="Ex: 2500"
              keyboardType="numeric"
              editable={!isUpdating}
              error={!!validationError}
              autoFocus
            />

            {validationError && (
              <Text fontSize={12} color="$error" marginTop="$1">
                {validationError}
              </Text>
            )}
          </YStack>

          {/* Footer */}
          <XStack
            padding="$lg"
            borderTopWidth={1}
            borderTopColor="$borderColor"
            gap="$md"
          >
            <Button
              variant="secondary"
              flex={1}
              onPress={onClose}
              disabled={isUpdating}
            >
              <Text fontSize={16} fontWeight="500" color="$gray700">
                Annuler
              </Text>
            </Button>

            <Button
              variant="success"
              flex={1}
              onPress={handleSave}
              disabled={!isValid || isUpdating}
            >
              <Text fontSize={16} fontWeight="600" color="$white">
                {isUpdating ? "Enregistrement..." : "Enregistrer"}
              </Text>
            </Button>
          </XStack>
        </YStack>
      </KeyboardAvoidingView>
    </Modal>
  );
};
