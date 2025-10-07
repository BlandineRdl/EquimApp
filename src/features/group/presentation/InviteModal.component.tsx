import { Copy, Share, UserPlus, X } from "lucide-react-native";
import React from "react";
import {
  Alert,
  Clipboard,
  Modal,
  Share as ShareAPI,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../../store/buildReduxStore";
import { generateInviteLink } from "../usecases/invitation/generateInviteLink.usecase";
import {
  selectGeneratedInviteLink,
  selectInviteLinkError,
  selectInviteLinkLoading,
} from "./selectInvitation.selector";

interface InviteModalProps {
  isVisible: boolean;
  onClose: () => void;
  groupId?: string;
  groupName?: string;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isVisible,
  onClose,
  groupId,
  groupName = "Foyer",
}) => {
  const dispatch = useAppDispatch();

  const inviteLink = useSelector(selectGeneratedInviteLink);
  const isLoading = useSelector(selectInviteLinkLoading);
  const error = useSelector(selectInviteLinkError);

  const handleCopyLink = async () => {
    if (!inviteLink) {
      Alert.alert("Erreur", "Aucun lien d'invitation généré");
      return;
    }

    try {
      await Clipboard.setString(inviteLink);
      Alert.alert(
        "Lien copié",
        "Le lien d'invitation a été copié dans le presse-papiers",
      );
    } catch (_error) {
      Alert.alert("Erreur", "Impossible de copier le lien");
    }
  };

  const handleShareLink = async () => {
    if (!inviteLink) {
      Alert.alert("Erreur", "Aucun lien d'invitation généré");
      return;
    }

    try {
      await ShareAPI.share({
        message: `Rejoignez mon groupe sur Justo: ${inviteLink}`,
        url: inviteLink,
      });
    } catch (_error) {
      Alert.alert("Erreur", "Impossible de partager le lien");
    }
  };

  const handleModalOpen = React.useCallback(async () => {
    if (groupId) {
      try {
        await dispatch(generateInviteLink({ groupId })).unwrap();
      } catch (_error) {
        Alert.alert("Erreur", "Impossible de générer le lien d'invitation");
      }
    }
  }, [dispatch, groupId]);

  React.useEffect(() => {
    if (isVisible && groupId) {
      handleModalOpen();
    }
  }, [isVisible, groupId, handleModalOpen]);

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header de la modal */}
          <View style={styles.modalHeader}>
            <View style={styles.modalIconContainer}>
              <UserPlus size={20} color="#0284c7" />
            </View>
            <Text style={styles.modalTitle}>Inviter au groupe {groupName}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Lien d'invitation */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkLabel}>Lien d'invitation</Text>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Génération du lien...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : inviteLink ? (
              <View style={styles.linkInputContainer}>
                <TextInput
                  style={styles.linkInput}
                  value={inviteLink}
                  editable={false}
                  selectTextOnFocus={true}
                />
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={handleCopyLink}
                >
                  <Copy size={16} color="#666" />
                  <Text style={styles.copyButtonText}>Copier</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Aucun lien généré</Text>
              </View>
            )}
          </View>

          {/* Boutons d'action */}
          <TouchableOpacity
            style={[
              styles.shareButton,
              (!inviteLink || isLoading) && styles.shareButtonDisabled,
            ]}
            onPress={handleShareLink}
            disabled={!inviteLink || isLoading}
          >
            <Share size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.shareButtonText}>Partager le lien</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
            <Text style={styles.closeModalButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    marginBottom: 20,
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
  linkContainer: {
    marginBottom: 24,
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  linkInputContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    overflow: "hidden",
  },
  linkInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: "#374151",
    backgroundColor: "#f9fafb",
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderLeftWidth: 1,
    borderLeftColor: "#e5e7eb",
  },
  copyButtonText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
    fontWeight: "500",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  shareButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  shareButtonDisabled: {
    backgroundColor: "#ccc",
  },
  loadingContainer: {
    padding: 16,
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
  },
  errorContainer: {
    padding: 16,
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  errorText: {
    fontSize: 14,
    color: "#dc2626",
  },
  closeModalButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  closeModalButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
});
