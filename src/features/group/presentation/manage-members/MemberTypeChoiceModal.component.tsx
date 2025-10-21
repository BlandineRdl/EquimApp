import { UserPlus, Users } from "lucide-react-native";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface MemberTypeChoiceModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectInvite: () => void;
  onSelectPhantom: () => void;
}

export const MemberTypeChoiceModal = ({
  visible,
  onClose,
  onSelectInvite,
  onSelectPhantom,
}: MemberTypeChoiceModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Ajouter un membre</Text>
              <Text style={styles.modalSubtitle}>
                Choisissez comment ajouter un membre au groupe
              </Text>

              {/* Option 1: Inviter un membre */}
              <TouchableOpacity
                style={styles.optionButton}
                onPress={onSelectInvite}
              >
                <View style={styles.optionIcon}>
                  <UserPlus size={24} color="#0284c7" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Inviter un membre</Text>
                  <Text style={styles.optionDescription}>
                    Envoyer un lien d'invitation
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 2: Membre fantôme */}
              <TouchableOpacity
                style={styles.optionButton}
                onPress={onSelectPhantom}
              >
                <View style={[styles.optionIcon, styles.optionIconPhantom]}>
                  <Users size={24} color="#8b5cf6" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Membre fantôme</Text>
                  <Text style={styles.optionDescription}>
                    Créer un membre sans compte
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Bouton Annuler */}
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionIconPhantom: {
    backgroundColor: "#ede9fe",
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: "#666",
  },
  cancelButton: {
    marginTop: 12,
    padding: 14,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
});
