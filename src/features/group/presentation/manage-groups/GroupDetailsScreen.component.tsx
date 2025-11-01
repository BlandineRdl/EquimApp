import { useLocalSearchParams, useRouter } from "expo-router";
import { AlertTriangle, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Modal, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useSelector } from "react-redux";
import { ScrollView, Text, XStack, YStack } from "tamagui";
import { Button } from "../../../../components/Button";
import { ExpenseManager } from "../../../../components/expense/ExpenseManager.component";
import { Input } from "../../../../components/Input";
import {
  getSafeAreaBackgroundColor,
  getTextColor,
  getTextColorTertiary,
  SEMANTIC_COLORS,
} from "../../../../constants/theme.constants";
import { logger } from "../../../../lib/logger";
import { useThemeControl } from "../../../../lib/tamagui/theme-provider";
import type { AppState } from "../../../../store/appState";
import { useAppDispatch } from "../../../../store/buildReduxStore";
import type { GroupMember } from "../../ports/GroupGateway";
import {
  closeAddExpenseForm,
  closeAddMemberForm,
  openAddExpenseForm,
  openAddMemberForm,
  updateAddMemberForm,
} from "../../store/group.slice";
import { addMemberToGroup } from "../../usecases/add-member/addMember.usecase";
import { deleteGroup } from "../../usecases/delete-group/deleteGroup.usecase";
import { addExpenseToGroup } from "../../usecases/expense/addExpense.usecase";
import { deleteExpense } from "../../usecases/expense/deleteExpense.usecase";
import { updateExpense } from "../../usecases/expense/updateExpense.usecase";
import { leaveGroup } from "../../usecases/leave-group/leaveGroup.usecase";
import { loadGroupById } from "../../usecases/load-group/loadGroup.usecase";
import { InviteModal } from "../manage-invitations/InviteModal.component";
import { EditPhantomMemberModal } from "../manage-members/EditPhantomMemberModal.component";
import { MemberTypeChoiceModal } from "../manage-members/MemberTypeChoiceModal.component";
import { RemoveMemberConfirmModal } from "../manage-members/RemoveMemberConfirmModal.component";
import { GroupDetailsHeader } from "./components/GroupDetailsHeader.component";
import { GroupExpensesSection } from "./components/GroupExpensesSection.component";
import { GroupMembersSection } from "./components/GroupMembersSection.component";
import { GroupStatsSection } from "./components/GroupStatsSection.component";
import { selectGroupDetailsUIViewModel } from "./selectGroupDetailsUI.selector";

export const GroupDetailsScreen = () => {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
  const iconSecondary = getTextColorTertiary(theme);
  const iconSuccess = SEMANTIC_COLORS.SUCCESS;
  const iconError = SEMANTIC_COLORS.ERROR;

  // Use consolidated view model selector
  const viewModel = useSelector((state: AppState) =>
    selectGroupDetailsUIViewModel(state, groupId || ""),
  );

  const {
    groupDetails,
    groupStats,
    expenses,
    maxSharePercentage,
    addMemberUI,
    addExpenseUI,
    isLoading,
    isCreator,
  } = viewModel;

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

  const closeAddMemberModal = () => {
    dispatch(closeAddMemberForm());
  };

  const handleAddMember = async () => {
    if (addMemberUI.form) {
      const pseudo = addMemberUI.form.pseudo?.trim() || "";
      const income = addMemberUI.form.monthlyIncome
        ? parseFloat(addMemberUI.form.monthlyIncome)
        : 0;

      // Validate pseudo is not empty
      if (!pseudo) {
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: "Le nom est obligatoire",
        });
        return;
      }

      // Toast notifications (success and error) are handled by listener
      await dispatch(
        addMemberToGroup({
          groupId: addMemberUI.form.groupId,
          memberData: {
            pseudo,
            monthlyIncome: income,
          },
        }),
      );
    }
  };

  const onPseudoChange = (text: string) =>
    dispatch(updateAddMemberForm({ pseudo: text }));

  const onIncomeChange = (text: string) =>
    dispatch(updateAddMemberForm({ monthlyIncome: text }));

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

  const handleDeleteExpense = async (expenseId: string) => {
    if (!groupId) return;
    try {
      await dispatch(deleteExpense({ groupId, expenseId })).unwrap();
    } catch (error: unknown) {
      logger.error("Error deleting expense", error);
    }
  };

  const handleLeaveGroup = async () => {
    if (!groupId) return;
    try {
      await dispatch(leaveGroup({ groupId })).unwrap();
      // Navigate to home after successfully leaving
      router.replace("/home");
    } catch (error: unknown) {
      logger.error("Error leaving group", error);
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupId) return;
    try {
      await dispatch(deleteGroup({ groupId })).unwrap();
      // Navigate to home after successfully deleting
      router.replace("/home");
    } catch (error: unknown) {
      logger.error("Error deleting group", error);
    }
  };

  const openDeleteConfirmModal = () => {
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirmModal = () => {
    setShowDeleteConfirm(false);
  };

  const confirmDeleteGroup = async () => {
    closeDeleteConfirmModal();
    await handleDeleteGroup();
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

  const handleDeleteExpenseClick = (expenseId: string) => {
    handleDeleteExpense(expenseId);
  };

  const handleRemoveMemberClick = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
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
          onLeave={handleLeaveGroup}
        />

        <ScrollView
          flex={1}
          paddingHorizontal="$base"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Total mensuel */}
          <GroupStatsSection
            totalBudget={groupStats.totalBudget}
            expensesCount={groupStats.expensesCount}
            iconSecondary={iconSecondary}
          />

          {/* Dépenses configurées */}
          <GroupExpensesSection
            expenses={expenses}
            expensesCount={groupStats.expensesCount}
            showAllExpenses={showAllExpenses}
            iconColor={iconColor}
            iconError={iconError}
            onAddExpense={openExpenseModal}
            onDeleteExpense={handleDeleteExpenseClick}
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
        {addMemberUI.isOpen && (
          <YStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            backgroundColor="rgba(0, 0, 0, 0.5)"
            justifyContent="center"
            alignItems="center"
            padding="$lg"
          >
            <YStack
              backgroundColor="$background"
              borderRadius="$lg"
              padding="$xl"
              width="85%"
              maxWidth={400}
            >
              <Text
                fontSize={20}
                fontWeight="700"
                marginBottom="$sm"
                color="$color"
              >
                Ajouter un membre fantôme
              </Text>
              <Text
                fontSize={14}
                color="$colorSecondary"
                marginBottom="$base"
                lineHeight={20}
              >
                💡 Le préfixe "Membre-" sera ajouté automatiquement
              </Text>
              <Input
                placeholder="Nom (ex: Bob)"
                value={addMemberUI.form?.pseudo}
                onChangeText={onPseudoChange}
                maxLength={50}
                marginBottom="$sm"
              />
              <Input
                placeholder="Revenu mensuel (€) - optionnel"
                keyboardType="numeric"
                value={addMemberUI.form?.monthlyIncome}
                onChangeText={onIncomeChange}
                marginBottom="$sm"
              />
              <Button
                variant="success"
                onPress={handleAddMember}
                marginBottom="$xs"
              >
                Ajouter
              </Button>
              <Button variant="secondary" onPress={closeAddMemberModal}>
                Annuler
              </Button>
            </YStack>
          </YStack>
        )}

        {/* Modal d'ajout de dépense */}
        <Modal
          visible={addExpenseUI.isOpen}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={closeAddExpenseModal}
        >
          <YStack flex={1} backgroundColor="$background">
            {/* Header */}
            <XStack
              alignItems="center"
              justifyContent="space-between"
              paddingHorizontal="$base"
              paddingVertical="$base"
              borderBottomWidth={1}
              borderBottomColor="$borderColor"
            >
              <Text fontSize={18} fontWeight="600" color="$color">
                Dépenses du groupe
              </Text>
              <Pressable onPress={closeAddExpenseModal}>
                <X size={24} color={iconColor} />
              </Pressable>
            </XStack>

            {/* Content */}
            <YStack flex={1} padding="$base">
              <ExpenseManager
                expenses={expenses.map((exp) => ({
                  id: exp.id,
                  label: exp.name,
                  amount: exp.amount,
                }))}
                onAdd={handleAddExpense}
                onEdit={handleEditExpense}
                onDelete={handleDeleteExpense}
                minExpenses={0}
                title="Dépenses du groupe"
                addSectionTitle="Ajouter une dépense"
              />
            </YStack>
          </YStack>
        </Modal>

        {/* Modal de confirmation de suppression du groupe */}
        <Modal
          visible={showDeleteConfirm}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={closeDeleteConfirmModal}
        >
          <YStack flex={1} backgroundColor="$background">
            {/* Header */}
            <XStack
              alignItems="center"
              justifyContent="space-between"
              paddingHorizontal="$base"
              paddingVertical="$base"
              borderBottomWidth={1}
              borderBottomColor="$borderColor"
            >
              <Text fontSize={18} fontWeight="600" color="$color">
                Supprimer le groupe ?
              </Text>
              <Pressable onPress={closeDeleteConfirmModal}>
                <X size={24} color={iconColor} />
              </Pressable>
            </XStack>

            {/* Content */}
            <YStack
              flex={1}
              padding="$xl"
              alignItems="center"
              justifyContent="center"
            >
              <YStack marginBottom="$xl">
                <AlertTriangle size={64} color={iconError} />
              </YStack>
              <Text
                fontSize={16}
                color="$gray500"
                textAlign="center"
                marginBottom="$2xl"
                lineHeight={24}
              >
                Cette action est irréversible. Tous les membres, dépenses et
                données du groupe seront définitivement supprimés.
              </Text>

              <Button
                variant="error"
                onPress={confirmDeleteGroup}
                marginBottom="$sm"
                width="100%"
              >
                Supprimer définitivement
              </Button>

              <Button
                variant="secondary"
                onPress={closeDeleteConfirmModal}
                width="100%"
              >
                Annuler
              </Button>
            </YStack>
          </YStack>
        </Modal>

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
      </YStack>
    </SafeAreaView>
  );
};
