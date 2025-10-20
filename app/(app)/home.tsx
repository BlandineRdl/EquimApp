import { useFocusEffect, useRouter } from "expo-router";
import { Home, Lightbulb, Link2, Plus, User } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { CreateGroupModal } from "../../src/features/group/presentation/CreateGroupModal.component";
import { GroupsHome } from "../../src/features/group/presentation/groupsHome.component";
import { InviteModal } from "../../src/features/group/presentation/InviteModal.component";
import { JoinGroupModal } from "../../src/features/group/presentation/JoinGroupModal.component";
import { selectAllGroups } from "../../src/features/group/presentation/selectGroup.selector";
import { loadUserGroups } from "../../src/features/group/usecases/load-groups/loadGroups.usecase";
import { selectUserProfile } from "../../src/features/user/presentation/selectUser.selector";
import { selectUserCapacity } from "../../src/features/user/presentation/selectUserCapacity.selector";
import { logger } from "../../src/lib/logger";
import { useAppDispatch } from "../../src/store/buildReduxStore";

export default function HomeScreen() {
  const dispatch = useAppDispatch();
  const user = useSelector(selectUserProfile);
  const capacity = useSelector(selectUserCapacity);
  const groups = useSelector(selectAllGroups);
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Load user groups on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      logger.debug("Home screen focused, loading groups");
      dispatch(loadUserGroups());
    }, [dispatch]),
  );

  const openInviteModal = () => {
    setIsInviteModalVisible(true);
  };

  const closeInviteModal = () => {
    setIsInviteModalVisible(false);
  };

  const openJoinModal = () => {
    setIsJoinModalVisible(true);
  };

  const closeJoinModal = () => {
    setIsJoinModalVisible(false);
  };

  const openCreateModal = () => {
    setIsCreateModalVisible(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalVisible(false);
  };

  const handleCreateSuccess = (groupId: string) => {
    // Navigate to the newly created group
    router.push({
      pathname: "/group/[groupId]" as "/group/[groupId]",
      params: { groupId },
    });
  };

  const handleJoinSuccess = (groupId: string) => {
    // Navigate to the group details after successfully joining
    router.push({
      pathname: "/group/[groupId]" as "/group/[groupId]",
      params: { groupId },
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    logger.debug("Refreshing groups");
    await dispatch(loadUserGroups())
      .unwrap()
      .catch((err) => {
        logger.error("Error refreshing groups", err);
      });
    setRefreshing(false);
  }, [dispatch]);

  const navigateToGroupDetails = (groupId: string) => {
    router.push({
      pathname: "/group/[groupId]" as "/group/[groupId]",
      params: { groupId },
    });
  };

  // Loading state
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
            colors={["#10b981"]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>Bonjour, {user.pseudo}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push("/(app)/profile")}
          >
            <User size={24} color="#10b981" />
          </TouchableOpacity>
        </View>

        {/* Incomplete Personal Expenses Banner */}
        {capacity === undefined && (
          <View style={styles.warningBanner}>
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>
                ⚠️ Charges personnelles manquantes
              </Text>
              <Text style={styles.warningText}>
                Ajoutez vos charges personnelles pour un calcul de capacité
                précis et des parts de groupe plus justes.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.warningButton}
              onPress={() => router.push("/(app)/profile")}
            >
              <Text style={styles.warningButtonText}>Ajouter maintenant</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Mon groupe Section */}
        <Text style={styles.sectionTitle}>Mon groupe</Text>

        <GroupsHome
          onNavigateToGroupDetails={navigateToGroupDetails}
          onOpenInviteModal={openInviteModal}
          onCreateGroup={openCreateModal}
          onJoinGroup={openJoinModal}
        />

        {/* Info Card */}
        {groups.length > 0 && (
          <View style={styles.infoCard}>
            <Lightbulb
              size={16}
              color="#92400e"
              style={{ marginRight: 8, marginTop: 2 }}
            />
            <Text style={styles.infoText}>
              Votre groupe "{groups[0]?.name}" est configuré avec des dépenses
              totales de{" "}
              {groups[0]?.shares?.totalExpenses?.toLocaleString("fr-FR") || 0}{" "}
              €. Vous pouvez maintenant inviter d'autres membres et ajouter des
              dépenses ponctuelles.
            </Text>
          </View>
        )}

        {/* Bottom spacing for navigation */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem}>
          <Home size={20} color="#000" style={{ marginBottom: 2 }} />
          <Text style={styles.navTextActive}>Accueil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={openCreateModal}>
          <Plus size={20} color="#666" style={{ marginBottom: 2 }} />
          <Text style={styles.navText}>Créer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={openJoinModal}>
          <Link2 size={20} color="#666" style={{ marginBottom: 2 }} />
          <Text style={styles.navText}>Rejoindre</Text>
        </TouchableOpacity>
      </View>

      {/* Modal d'invitation */}
      <InviteModal
        isVisible={isInviteModalVisible}
        onClose={closeInviteModal}
        groupId={groups[0]?.id}
        groupName={groups[0]?.name}
      />

      {/* Modal pour rejoindre un groupe */}
      <JoinGroupModal
        isVisible={isJoinModalVisible}
        onClose={closeJoinModal}
        onSuccess={handleJoinSuccess}
      />

      {/* Modal pour créer un groupe */}
      <CreateGroupModal
        isVisible={isCreateModalVisible}
        onClose={closeCreateModal}
        onSuccess={handleCreateSuccess}
      />
    </SafeAreaView>
  );
}

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
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 20,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#d1fae5",
    justifyContent: "center",
    alignItems: "center",
  },
  greeting: {
    fontSize: 16,
    color: "#000",
    fontWeight: "400",
  },
  userName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    marginTop: 2,
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
    justifyContent: "center",
    paddingVertical: 8,
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
  warningBanner: {
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  warningContent: {
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#92400e",
    marginBottom: 6,
  },
  warningText: {
    fontSize: 14,
    color: "#92400e",
    lineHeight: 20,
  },
  warningButton: {
    backgroundColor: "#f59e0b",
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  warningButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
