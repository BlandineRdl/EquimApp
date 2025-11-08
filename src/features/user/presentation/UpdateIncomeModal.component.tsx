import { DollarSign, X } from "lucide-react-native";
import type React from "react";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform } from "react-native";
import Toast from "react-native-toast-message";
import { useSelector } from "react-redux";
import { Text, XStack, YStack } from "tamagui";
import { Button } from "../../../components/Button";
import { Input } from "../../../components/Input";
import {
  getTextColorTertiary,
  SEMANTIC_COLORS,
} from "../../../constants/theme.constants";
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
import {
  UPDATE_INCOME_LABELS,
  UPDATE_INCOME_MESSAGES,
} from "./update-income.constants";

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
  const _personalExpenses = useSelector(selectPersonalExpenses);
  const { theme } = useThemeControl();
  const iconSecondary = getTextColorTertiary(theme);
  const iconSuccess = SEMANTIC_COLORS.SUCCESS;

  const [income, setIncome] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible && user) {
      setIncome(user.monthlyIncome.toString());
      setValidationError(null);
    }
  }, [isVisible, user]);

  const handleIncomeChange = (text: string) => {
    setIncome(text);

    if (!text.trim()) {
      setValidationError(null);
      return;
    }

    const numericValue = Number.parseFloat(text);
    if (Number.isNaN(numericValue)) {
      setValidationError(UPDATE_INCOME_LABELS.INVALID_VALUE);
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
      Toast.show(UPDATE_INCOME_MESSAGES.EMPTY_INCOME);
      return;
    }

    const numericIncome = Number.parseFloat(trimmedIncome);
    if (Number.isNaN(numericIncome)) {
      Toast.show(UPDATE_INCOME_MESSAGES.INVALID_NUMBER);
      return;
    }

    const validation = validateIncome(numericIncome);
    if (!validation.isValid) {
      Toast.show(
        UPDATE_INCOME_MESSAGES.VALIDATION_FAILED(validation.errors.join(", ")),
      );
      return;
    }

    setIsUpdating(true);

    try {
      await dispatch(
        updateUserIncome({ userId: user.id, newIncome: numericIncome }),
      ).unwrap();

      onClose();

      if (onSuccess) {
        onSuccess();
      }
    } catch (_error: unknown) {
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
          {}
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
              {UPDATE_INCOME_LABELS.MODAL_TITLE}
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

          {}
          <YStack padding="$lg">
            <Text
              fontSize={14}
              fontWeight="500"
              color="$gray700"
              marginBottom="$1"
            >
              {UPDATE_INCOME_LABELS.FIELD_LABEL}
            </Text>
            <Text fontSize={12} color="$colorSecondary" marginBottom="$md">
              {UPDATE_INCOME_LABELS.FIELD_HINT_PREFIX}{" "}
              {MIN_INCOME.toLocaleString("fr-FR")}€{" "}
              {UPDATE_INCOME_LABELS.FIELD_HINT_SUFFIX}{" "}
              {MAX_INCOME.toLocaleString("fr-FR")}€
            </Text>

            <Input
              value={income}
              onChangeText={handleIncomeChange}
              placeholder={UPDATE_INCOME_LABELS.FIELD_PLACEHOLDER}
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

          {}
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
                {UPDATE_INCOME_LABELS.CANCEL_BUTTON}
              </Text>
            </Button>

            <Button
              variant="success"
              flex={1}
              onPress={handleSave}
              disabled={!isValid || isUpdating}
            >
              <Text fontSize={16} fontWeight="600" color="$white">
                {isUpdating
                  ? UPDATE_INCOME_LABELS.SAVING_TEXT
                  : UPDATE_INCOME_LABELS.SAVE_BUTTON}
              </Text>
            </Button>
          </XStack>
        </YStack>
      </KeyboardAvoidingView>
    </Modal>
  );
};
