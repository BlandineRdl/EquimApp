import { DollarSign, X } from "lucide-react-native";
import type React from "react";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../../store/buildReduxStore";
import { IncomeValidationService } from "../domain/incomeValidation.service";
import { MAX_INCOME, MIN_INCOME } from "../domain/user.constants";
import { updateUserIncome } from "../usecases/updateUserIncome.usecase";
import { selectPersonalExpenses } from "./selectPersonalExpenses.selector";
import { selectUserProfile } from "./selectUser.selector";

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

    const validation = IncomeValidationService.validateIncome(numericValue);
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
    const validation = IncomeValidationService.validateIncome(numericIncome);
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
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalIconContainer}>
              <DollarSign size={24} color="#10b981" />
            </View>
            <Text style={styles.modalTitle}>Modifier mon revenu</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              disabled={isUpdating}
            >
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.modalBody}>
            <Text style={styles.label}>Revenu mensuel net (€)</Text>
            <Text style={styles.hint}>
              Entre {MIN_INCOME.toLocaleString("fr-FR")}€ et{" "}
              {MAX_INCOME.toLocaleString("fr-FR")}€
            </Text>

            <TextInput
              style={[styles.input, validationError && styles.inputError]}
              value={income}
              onChangeText={handleIncomeChange}
              placeholder="Ex: 2500"
              keyboardType="numeric"
              editable={!isUpdating}
              autoFocus
            />

            {validationError && (
              <Text style={styles.errorText}>{validationError}</Text>
            )}
          </View>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isUpdating}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                (!isValid || isUpdating) && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!isValid || isUpdating}
            >
              <Text style={styles.saveButtonText}>
                {isUpdating ? "Enregistrement..." : "Enregistrer"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#d1fae5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#10b981",
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#d1d5db",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
