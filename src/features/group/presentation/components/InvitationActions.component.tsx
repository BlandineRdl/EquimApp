import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface InvitationActionsProps {
  onAccept: () => void;
  onRefuse: () => void;
  isLoading: boolean;
  canSubmit: boolean;
}

export const InvitationActions = ({
  onAccept,
  onRefuse,
  isLoading,
  canSubmit,
}: InvitationActionsProps) => {
  return (
    <View style={styles.buttonsContainer}>
      <TouchableOpacity
        style={[styles.button, styles.acceptButton]}
        onPress={onAccept}
        disabled={isLoading || !canSubmit}
      >
        <Text style={styles.acceptButtonText}>Accepter l'invitation</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.refuseButton]}
        onPress={onRefuse}
        disabled={isLoading}
      >
        <Text style={styles.refuseButtonText}>Refuser</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonsContainer: {
    gap: 16,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  acceptButton: {
    backgroundColor: "#10b981",
  },
  acceptButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  refuseButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  refuseButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
});
