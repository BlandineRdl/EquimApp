import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { ScrollView, Text, YStack } from "tamagui";
import {
  getSafeAreaBackgroundColor,
  getTextColor,
  SEMANTIC_COLORS,
} from "../../../../constants/theme.constants";
import { logger } from "../../../../lib/logger";
import { useThemeControl } from "../../../../lib/tamagui/theme-provider";
import type { AppState } from "../../../../store/appState";
import { useAppDispatch } from "../../../../store/buildReduxStore";
import type { GroupMember } from "../../ports/GroupGateway";
import {
  closeAddExpenseForm,
  openAddExpenseForm,
  openAddMemberForm,
} from "../../store/group.slice";
import { addExpenseToGroup } from "../../usecases/expense/addExpense.usecase";
import { deleteExpense } from "../../usecases/expense/deleteExpense.usecase";
import { updateExpense } from "../../usecases/expense/updateExpense.usecase";
import { loadGroupById } from "../../usecases/load-group/loadGroup.usecase";
import { InviteModal } from "../manage-invitations/InviteModal.component";
import { EditPhantomMemberModal } from "../manage-members/EditPhantomMemberModal.component";
import { MemberTypeChoiceModal } from "../manage-members/MemberTypeChoiceModal.component";
import { RemoveMemberConfirmModal } from "../manage-members/RemoveMemberConfirmModal.component";
import { AddExpenseModal } from "./components/AddExpenseModal.component";
import { AddMemberModal } from "./components/AddMemberModal.component";
import { DeleteGroupConfirmModal } from "./components/DeleteGroupConfirmModal.component";
import { GroupDetailsHeader } from "./components/GroupDetailsHeader.component";
import { GroupExpenseDistributionCard } from "./components/GroupExpenseDistributionCard.component";
import { GroupExpensesSection } from "./components/GroupExpensesSection.component";
import { GroupMembersSection } from "./components/GroupMembersSection.component";
import { GroupTotalExpenseCard } from "./components/GroupTotalExpenseCard.component";
import { LeaveGroupConfirmModal } from "./components/LeaveGroupConfirmModal.component";
import { selectAddExpenseUI, selectAddMemberUI } from "./selectGroup.selector";
import {
  selectGroupDetails,
  selectGroupExpenses,
  selectGroupStats,
  selectMaxSharePercentage,
} from "./selectGroupDetails.selector";
import { selectGroupExpenseDistribution } from "./selectors/selectGroupExpenseDistribution.selector";

export const GroupDetailsScreen = () => {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [editingMember, setEditingMember] = useState<GroupMember | null>(null);
  const [showMemberTypeChoice, setShowMemberTypeChoice] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{
    id: string;
    pseudo: string;
  } | null>(null);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { theme } = useThemeControl();

  // Theme-aware colors for icons
  const iconColor = getTextColor(theme);
  const iconSuccess = SEMANTIC_COLORS.SUCCESS;
  const iconError = SEMANTIC_COLORS.ERROR;

  // Select data from store
  const currentUserId = useSelector((state: AppState) => state.auth.user?.id);
  const groupDetails = useSelector((state: AppState) =>
    selectGroupDetails(state, groupId || ""),
  );
  const groupStats = useSelector((state: AppState) =>
    selectGroupStats(state, groupId || ""),
  );
  const expenses = useSelector((state: AppState) =>
    selectGroupExpenses(state, groupId || ""),
  );
  const maxSharePercentage = useSelector((state: AppState) =>
    selectMaxSharePercentage(state, groupId || ""),
  );
  const addMemberUI = useSelector(selectAddMemberUI);
  const addExpenseUI = useSelector(selectAddExpenseUI);
  const expenseDistribution = useSelector((state: AppState) =>
    selectGroupExpenseDistribution(state, groupId || ""),
  );

  // Computed values
  const isLoading = !groupDetails || !groupStats;
  const isCreator = groupDetails?.group.creatorId === currentUserId;

  // Load group on mount
  useEffect(() => {
    if (groupId) {
      logger.debug("[GroupDetails] Loading group", { groupId });
      dispatch(loadGroupById(groupId));
    }
  }, [groupId, dispatch]);

  // Loading state
  if (isLoading || !groupDetails || !groupStats) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          backgroundColor="$background"
        >
          <Text color="$color">Chargement...</Text>
        </YStack>
      </SafeAreaView>
    );
  }

  const { group, members } = groupDetails;

  // Fonctions pour gérer les modales
  const openMemberTypeChoice = () => {
    setShowMemberTypeChoice(true);
  };

  const handleSelectInvite = () => {
    setShowMemberTypeChoice(false);
    setShowInviteModal(true);
  };

  const handleSelectPhantom = () => {
    setShowMemberTypeChoice(false);
    dispatch(openAddMemberForm(groupId));
  };

  const onRefresh = async () => {
    if (!groupId) return;
    setRefreshing(true);
    try {
      await dispatch(loadGroupById(groupId)).unwrap();
    } catch (error) {
      logger.error("Error refreshing group", error);
    } finally {
      setRefreshing(false);
    }
  };

  const openLeaveConfirmModal = () => {
    setShowLeaveConfirm(true);
  };

  const closeLeaveConfirmModal = () => {
    setShowLeaveConfirm(false);
  };

  const handleLeaveSuccess = () => {
    // Navigate to home after successfully leaving
    router.replace("/home");
  };

  const handleDeleteSuccess = () => {
    // Navigate to home after successfully deleting
    router.replace("/home");
  };

  const openDeleteConfirmModal = () => {
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirmModal = () => {
    setShowDeleteConfirm(false);
  };

  // Navigation handlers
  const handleBackToHome = () => {
    router.back();
  };

  // Toggle handlers
  const handleShowAllExpenses = () => {
    setShowAllExpenses(true);
  };

  const handleHideExpenses = () => {
    setShowAllExpenses(false);
  };

  // Member management handlers
  const handleEditMemberClick = (member: GroupMember) => {
    setEditingMember(member);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!groupId) return;
    try {
      await dispatch(deleteExpense({ groupId, expenseId })).unwrap();
    } catch (error: unknown) {
      logger.error("Error deleting expense", error);
    }
  };

  const handleRemoveMemberClick = (memberId: string) => {
    const member = members.find((m: GroupMember) => m.id === memberId);
    if (member) {
      setMemberToRemove({ id: memberId, pseudo: member.pseudo });
    }
  };

  // Fonctions pour gérer la modal d'ajout de dépense
  const openExpenseModal = () => {
    dispatch(openAddExpenseForm(groupId));
  };

  const closeAddExpenseModal = () => {
    dispatch(closeAddExpenseForm());
  };

  const handleAddExpense = async (name: string, amount: number) => {
    if (!groupId) return;

    await dispatch(
      addExpenseToGroup({
        groupId,
        name,
        amount,
      }),
    ).unwrap();
  };

  const handleEditExpense = async (
    expenseId: string,
    name: string,
    amount: number,
  ) => {
    if (!groupId) return;

    await dispatch(
      updateExpense({
        groupId,
        expenseId,
        name,
        amount,
      }),
    ).unwrap();
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: getSafeAreaBackgroundColor(theme),
      }}
      edges={["top"]}
    >
      <YStack flex={1} backgroundColor="$background">
        {/* Header */}
        <GroupDetailsHeader
          groupName={group.name}
          isCreator={isCreator}
          iconColor={iconColor}
          iconError={iconError}
          onBack={handleBackToHome}
          onDelete={openDeleteConfirmModal}
          onLeave={openLeaveConfirmModal}
        />

        <ScrollView
          flex={1}
          paddingHorizontal="$base"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Cartes de répartition et total des dépenses */}
          <YStack gap="$base" marginTop="$base" marginBottom="$lg">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <GroupExpenseDistributionCard
                expenseDistribution={expenseDistribution.expenseDistribution}
                expensesCount={expenseDistribution.expensesCount}
              />
              <GroupTotalExpenseCard
                totalExpenses={expenseDistribution.totalExpenses}
              />
            </ScrollView>
          </YStack>

          {/* Dépenses configurées */}
          <GroupExpensesSection
            expenses={expenses}
            expensesCount={groupStats.expensesCount}
            showAllExpenses={showAllExpenses}
            onAddExpense={openExpenseModal}
            onShowAll={handleShowAllExpenses}
            onShowLess={handleHideExpenses}
          />

          {/* Membres et quotes-parts */}
          <GroupMembersSection
            members={members}
            groupCreatorId={group.creatorId}
            maxSharePercentage={maxSharePercentage}
            totalIncome={groupDetails.totalIncome}
            iconColor={iconColor}
            iconSuccess={iconSuccess}
            iconError={iconError}
            isCreator={isCreator}
            onAddMember={openMemberTypeChoice}
            onEditMember={handleEditMemberClick}
            onRemoveMember={handleRemoveMemberClick}
          />

          {/* Bottom spacing */}
          <YStack height="$3xl" />
        </ScrollView>

        {/* Modal d'ajout de membre */}
        <AddMemberModal visible={addMemberUI.isOpen} form={addMemberUI.form} />

        {/* Modal d'ajout de dépense */}
        <AddExpenseModal
          visible={addExpenseUI.isOpen}
          onClose={closeAddExpenseModal}
          expenses={expenses}
          onAdd={handleAddExpense}
          onEdit={handleEditExpense}
          onDelete={handleDeleteExpense}
        />

        {/* Modal de confirmation de suppression du groupe */}
        {groupId && (
          <DeleteGroupConfirmModal
            visible={showDeleteConfirm}
            onClose={closeDeleteConfirmModal}
            groupId={groupId}
            onDeleteSuccess={handleDeleteSuccess}
          />
        )}

        {/* Modal de choix du type de membre */}
        <MemberTypeChoiceModal
          visible={showMemberTypeChoice}
          onClose={() => setShowMemberTypeChoice(false)}
          onSelectInvite={handleSelectInvite}
          onSelectPhantom={handleSelectPhantom}
        />

        {/* Modal d'invitation */}
        {groupId && (
          <InviteModal
            isVisible={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            groupId={groupId}
          />
        )}

        {/* Modal de modification de membre fantôme */}
        {editingMember && groupId && (
          <EditPhantomMemberModal
            visible={editingMember !== null}
            onClose={() => setEditingMember(null)}
            member={editingMember}
            groupId={groupId}
          />
        )}

        {/* Modal de confirmation de suppression de membre */}
        {memberToRemove && groupId && (
          <RemoveMemberConfirmModal
            visible={memberToRemove !== null}
            onClose={() => setMemberToRemove(null)}
            memberId={memberToRemove.id}
            memberPseudo={memberToRemove.pseudo}
            groupId={groupId}
          />
        )}

        {/* Modal de confirmation pour quitter le groupe */}
        {groupId && (
          <LeaveGroupConfirmModal
            visible={showLeaveConfirm}
            onClose={closeLeaveConfirmModal}
            groupId={groupId}
            onLeaveSuccess={handleLeaveSuccess}
          />
        )}
      </YStack>
    </SafeAreaView>
  );
};
