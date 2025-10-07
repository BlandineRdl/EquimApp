import { ArrowRightLeft, UserPlus, Users } from "lucide-react-native";
import { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";

import { useAppDispatch } from "../../../store/buildReduxStore";
import { loadUserGroups } from "../usecases/load-groups/loadGroups.usecase";
import { selectAllGroups } from "./selectGroup.selector";
import {
  selectGroupMemberNamesFormatted,
  selectGroupMembersCount,
} from "./selectGroupMembers.selector";

function MembersDisplay({ groupId }: { groupId: string }) {
  const membersCount = useSelector(selectGroupMembersCount(groupId));
  const memberNamesFormatted = useSelector(
    selectGroupMemberNamesFormatted(groupId),
  );

  return (
    <View style={styles.membersContainer}>
      <Text style={styles.membersText}>
        {membersCount} membre{membersCount > 1 ? "s" : ""}
      </Text>
      <Text style={styles.memberNames}>{memberNamesFormatted}</Text>
    </View>
  );
}

interface GroupsHomeProps {
  onNavigateToGroupDetails: (groupId: string) => void;
  onOpenInviteModal: () => void;
}

export const GroupsHome = ({
  onNavigateToGroupDetails,
  onOpenInviteModal,
}: GroupsHomeProps) => {
  const dispatch = useAppDispatch();

  const groups = useSelector(selectAllGroups);

  useEffect(() => {
    if (groups.length === 0) {
      dispatch(loadUserGroups());
    }
  }, [groups, dispatch]);

  return (
    <>
      {groups.map((group) => (
        <View key={group.id} style={styles.groupCard}>
          {/* Group Header */}
          <View style={styles.groupHeader}>
            <View style={styles.groupIconContainer}>
              <Users size={16} color="#0284c7" />
            </View>
            <Text style={styles.groupName}>{group.name}</Text>
          </View>

          <MembersDisplay groupId={group.id} />

          {/* Budget Section */}
          <View style={styles.budgetSection}>
            <Text style={styles.budgetLabel}>Dépenses mensuelles</Text>
            <Text style={styles.budgetAmount}>
              {group.totalMonthlyBudget.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              €
            </Text>
            <Text style={styles.expensesCount}>
              {group.expenses.length} dépenses configurées
            </Text>
          </View>

          {/* View Button */}
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => onNavigateToGroupDetails(group.id)}
          >
            <ArrowRightLeft
              size={14}
              color="#374151"
              style={{ marginRight: 6 }}
            />

            <Text style={styles.viewButtonText}>Voir</Text>
          </TouchableOpacity>

          {/* Invite Section */}
          <View style={styles.inviteSection}>
            <Text style={styles.inviteText}>Inviter des membres au groupe</Text>
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={onOpenInviteModal}
            >
              <UserPlus size={14} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.inviteButtonText}>Inviter</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 8,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: "#000",
    fontWeight: "400",
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
    marginTop: 8,
  },
  groupCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#10b981",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  groupIconContainer: {
    backgroundColor: "#f0f9ff",
    borderRadius: 6,
    padding: 4,
    marginRight: 8,
  },

  groupName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  membersContainer: {
    marginBottom: 16,
  },
  membersText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },
  memberNames: {
    fontSize: 11,
    color: "#9ca3af",
    fontStyle: "italic",
    marginTop: 2,
  },
  budgetSection: {
    marginBottom: 16,
  },
  budgetLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  budgetAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  expensesCount: {
    fontSize: 14,
    color: "#666",
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
  },
  viewButtonText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  inviteSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  inviteText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  inviteButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  gridActionButton: {
    width: "48%",
    backgroundColor: "#000",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    minHeight: 50,
  },
  gridActionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  gridActionButtonSecondary: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    minHeight: 50,
  },
  gridActionButtonSecondaryText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    alignItems: "flex-start",
  },

  infoText: {
    fontSize: 14,
    color: "#92400e",
    lineHeight: 20,
    flex: 1,
  },
  expensesContainer: {
    marginBottom: 20,
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  expenseLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 2,
  },
  expenseDetails: {
    fontSize: 14,
    color: "#666",
  },
  expenseAmountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginRight: 8,
  },

  noExpensesText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: 20,
  },
  bottomSpacing: {
    height: 100,
  },
  bottomNavigation: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  navItemActive: {
    // Style pour l'élément actif
  },

  navText: {
    fontSize: 12,
    color: "#666",
  },
  navTextActive: {
    fontSize: 12,
    color: "#000",
    fontWeight: "500",
  },

  // Styles pour la modal d'invitation
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
