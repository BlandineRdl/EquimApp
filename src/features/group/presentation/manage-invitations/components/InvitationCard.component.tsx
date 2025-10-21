import { StyleSheet, Text, View } from "react-native";
import type { InvitationPreview } from "../../../ports/GroupGateway";

interface InvitationCardProps {
  invitationDetails: InvitationPreview;
}

export const InvitationCard = ({ invitationDetails }: InvitationCardProps) => {
  return (
    <View style={styles.invitationCard}>
      <Text style={styles.title}>Rejoindre le groupe</Text>
      <Text style={styles.groupName}>"{invitationDetails.groupName}"</Text>
      <Text style={styles.invitedBy}>
        Invité par {invitationDetails.creatorPseudo}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  invitationCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
    textAlign: "center",
  },
  groupName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#10b981",
    marginBottom: 16,
    textAlign: "center",
  },
  invitedBy: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
