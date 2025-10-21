import { X } from "lucide-react-native";
import type React from "react";
import { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useAppDispatch } from "../../../../store/buildReduxStore";
import type { GroupMember } from "../../ports/GroupGateway";
import { updatePhantomMember } from "../../usecases/update-phantom-member/updatePhantomMember.usecase";

interface EditPhantomMemberModalProps {
  visible: boolean;
  onClose: () => void;
  member: GroupMember;
  groupId: string;
}

export const EditPhantomMemberModal: React.FC<EditPhantomMemberModalProps> = ({
  visible,
  onClose,
  member,
  groupId,
}) => {
  const dispatch = useAppDispatch();

  // Extract suffix after "Membre-"
  const initialSuffix = member.pseudo.startsWith("Membre-")
    ? member.pseudo.substring(7)
    : member.pseudo;

  const [suffix, setSuffix] = useState(initialSuffix);
  const [income, setIncome] = useState(
    member.incomeOrWeight?.toString() || "0",
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const newPseudo = `Membre-${suffix.trim()}`;
    const newIncome = parseFloat(income);

    if (suffix.trim().length < 1) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Le pseudo ne peut pas être vide",
      });
      return;
    }

    if (Number.isNaN(newIncome) || newIncome < 0) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Le revenu doit être un nombre positif",
      });
      return;
    }

    try {
      setLoading(true);
      await dispatch(
        updatePhantomMember({
          memberId: member.id,
          groupId,
          newPseudo,
          newIncome,
        }),
      ).unwrap();

      Toast.show({
        type: "success",
        text1: "Membre modifié",
        text2: `${newPseudo} a été mis à jour`,
      });

      onClose();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2:
          error instanceof Error
            ? error.message
            : "Impossible de modifier le membre",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Modifier le membre</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Pseudo */}
          <View style={styles.field}>
            <Text style={styles.label}>Pseudo</Text>
            <View style={styles.pseudoContainer}>
              <Text style={styles.prefix}>Membre-</Text>
              <TextInput
                style={styles.pseudoInput}
                value={suffix}
                onChangeText={setSuffix}
                placeholder="Bob"
                maxLength={50}
              />
            </View>
            <Text style={styles.hint}>
              Lettres, chiffres, tirets et espaces uniquement (max 50 car.)
            </Text>
          </View>

          {/* Revenu */}
          <View style={styles.field}>
            <Text style={styles.label}>Revenu mensuel</Text>
            <TextInput
              style={styles.input}
              value={income}
              onChangeText={setIncome}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveText}>
                {loading ? "Enregistrement..." : "Sauvegarder"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  closeButton: {
    padding: 4,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#374151",
  },
  pseudoContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  prefix: {
    fontSize: 16,
    color: "#9ca3af",
    marginRight: 4,
  },
  pseudoInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
  },
  saveButton: {
    backgroundColor: "#000",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
