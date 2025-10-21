import { X } from "lucide-react-native";
import type React from "react";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import type { AppState } from "../../../../store/appState";
import { useAppDispatch } from "../../../../store/buildReduxStore";
import { acceptInvitation } from "../../usecases/invitation/acceptInvitation.usecase";
import { loadUserGroups } from "../../usecases/load-groups/loadGroups.usecase";

export interface JoinGroupModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess: (groupId: string) => void;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  isVisible,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const profile = useSelector((state: AppState) => state.user.profile);

  const [inviteLink, setInviteLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!inviteLink.trim() || !profile) return;

    setIsLoading(true);
    setError(null);

    try {
      // Extract token from link (equimapp://invite/TOKEN)
      const token = inviteLink.trim().split("/").pop();

      if (!token) {
        setError("Lien d'invitation invalide");
        setIsLoading(false);
        return;
      }

      // Accept invitation
      const result = await dispatch(
        acceptInvitation({
          token,
          pseudo: profile.pseudo,
          monthlyIncome: profile.monthlyIncome,
        }),
      ).unwrap();

      // Reload groups
      await dispatch(loadUserGroups()).unwrap();

      // Reset and close
      setInviteLink("");
      setError(null);
      onSuccess(result.groupId);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'acceptation de l'invitation",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setInviteLink("");
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Rejoindre un groupe</Text>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                >
                  <X size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Lien d'invitation</Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="equimapp://invite/..."
                value={inviteLink}
                onChangeText={(text) => {
                  setInviteLink(text);
                  setError(null); // Clear error on input change
                }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                editable={!isLoading}
              />

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  💡 Collez le lien d'invitation que vous avez reçu pour
                  rejoindre un groupe existant.
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.joinButton,
                  (!inviteLink.trim() || isLoading) &&
                    styles.joinButtonDisabled,
                ]}
                onPress={handleJoin}
                disabled={!inviteLink.trim() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={[
                      styles.joinButtonText,
                      !inviteLink.trim() && styles.joinButtonTextDisabled,
                    ]}
                  >
                    Rejoindre
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderLeftWidth: 3,
    borderLeftColor: "#ef4444",
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: "#991b1b",
    fontSize: 13,
    lineHeight: 18,
  },
  infoBox: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
  joinButton: {
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  joinButtonDisabled: {
    backgroundColor: "#d1d5db",
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  joinButtonTextDisabled: {
    color: "#9ca3af",
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
});
