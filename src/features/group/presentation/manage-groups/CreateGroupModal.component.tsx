import { Users, X } from "lucide-react-native";
import type React from "react";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppDispatch } from "../../../../store/buildReduxStore";
import { SUGGESTED_GROUP_NAMES } from "../../domain/manage-group/group.constants";
import { createGroup } from "../../usecases/create-group/createGroup.usecase";
import { loadUserGroups } from "../../usecases/load-groups/loadGroups.usecase";

export interface CreateGroupModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess?: (groupId: string) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isVisible,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const [groupName, setGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!isVisible) {
      setGroupName("");
    }
  }, [isVisible]);

  const handleCreate = async () => {
    const trimmedName = groupName.trim();

    if (!trimmedName) {
      Alert.alert("Erreur", "Veuillez entrer un nom de groupe");
      return;
    }

    if (trimmedName.length < 2) {
      Alert.alert("Erreur", "Le nom doit contenir au moins 2 caractères");
      return;
    }

    setIsCreating(true);

    try {
      const result = await dispatch(
        createGroup({ name: trimmedName }),
      ).unwrap();

      // Reload groups to include the new one
      await dispatch(loadUserGroups());

      onClose();

      if (onSuccess) {
        onSuccess(result.groupId);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Impossible de créer le groupe";
      Alert.alert("Erreur", errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const suggestedNames = SUGGESTED_GROUP_NAMES;

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
              <Users size={24} color="#0284c7" />
            </View>
            <Text style={styles.modalTitle}>Créer un groupe</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              disabled={isCreating}
            >
              <X size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.label}>Nom du groupe</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Foyer, Coloc, Quotidien..."
              value={groupName}
              onChangeText={setGroupName}
              maxLength={50}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isCreating}
              autoFocus
            />

            {/* Suggestions */}
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>💡 Suggestions</Text>
              <View style={styles.suggestionsGrid}>
                {suggestedNames.map((suggestion) => {
                  const isSelected = groupName.trim() === suggestion;
                  return (
                    <TouchableOpacity
                      key={suggestion}
                      style={[
                        styles.suggestionChip,
                        isSelected && styles.suggestionChipActive,
                      ]}
                      onPress={() => setGroupName(suggestion)}
                      disabled={isCreating}
                    >
                      <Text
                        style={[
                          styles.suggestionText,
                          isSelected && styles.suggestionTextActive,
                        ]}
                      >
                        {suggestion}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity
            style={[
              styles.createButton,
              (isCreating || !groupName.trim()) && styles.createButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={isCreating || !groupName.trim()}
          >
            <Text style={styles.createButtonText}>
              {isCreating ? "Création..." : "Créer le groupe"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={isCreating}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
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
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  modalIconContainer: {
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    padding: 8,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#000",
    backgroundColor: "#fff",
  },
  suggestionsContainer: {
    marginTop: 16,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
    marginBottom: 8,
  },
  suggestionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  suggestionChipActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  suggestionText: {
    fontSize: 13,
    color: "#374151",
  },
  suggestionTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  createButton: {
    backgroundColor: "#000",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  createButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  createButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
});
