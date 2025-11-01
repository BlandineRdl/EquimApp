import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Edit,
  LogOut,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { Modal, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useSelector } from "react-redux";
import { ScrollView, Text, XStack, YStack } from "tamagui";
import { Button } from "../../../../components/Button";
import { ExpenseManager } from "../../../../components/ExpenseManager.component";
import { Input } from "../../../../components/Input";
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
import { removeMemberFromGroup } from "../../usecases/remove-member/removeMember.usecase";
import { InviteModal } from "../manage-invitations/InviteModal.component";
import { EditPhantomMemberModal } from "../manage-members/EditPhantomMemberModal.component";
import { MemberTypeChoiceModal } from "../manage-members/MemberTypeChoiceModal.component";
import { selectAddExpenseUI, selectAddMemberUI } from "./selectGroup.selector";
import {
  selectGroupDetails,
  selectGroupExpenses,
  selectGroupStats,
} from "./selectGroupDetails.selector";

export const GroupDetailsScreen = () => {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingMember, setEditingMember] = useState<GroupMember | null>(null);
  const [showMemberTypeChoice, setShowMemberTypeChoice] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { theme } = useThemeControl();

  // Theme-aware colors for icons
  const iconColor = theme === "light" ? "#111827" : "#ffffff";
  const iconSecondary = theme === "light" ? "#6b7280" : "#9ca3af";
  const iconSuccess = "#16a34a"; // success600 - always green
  const _iconError = "#ef4444"; // error - always red

  const addMemberUI = useSelector(selectAddMemberUI);
  const addExpenseUI = useSelector(selectAddExpenseUI);
  const currentUserId = useSelector((state: AppState) => state.auth.user?.id);

  const groupDetails = useSelector((state: AppState) =>
    groupId ? selectGroupDetails(state, groupId) : null,
  );
  const groupStats = useSelector((state: AppState) =>
    groupId ? selectGroupStats(state, groupId) : null,
  );
  const expenses = useSelector((state: AppState) =>
    groupId ? selectGroupExpenses(state, groupId) : [],
  );

  // Load group on mount
  useEffect(() => {
    if (groupId) {
      logger.debug("[GroupDetails] Loading group", { groupId });
      dispatch(loadGroupById(groupId));
    }
  }, [groupId, dispatch]);

  // Loading state
  if (!groupDetails || !groupStats) {
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

      try {
        const result = await dispatch(
          addMemberToGroup({
            groupId: addMemberUI.form.groupId,
            memberData: {
              pseudo,
              monthlyIncome: income,
            },
          }),
        ).unwrap();

        // Show success toast with generated pseudo
        Toast.show({
          type: "success",
          text1: "Membre ajouté !",
          text2: `${result.newMember.pseudo} a été ajouté au groupe`,
        });
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2:
            error instanceof Error
              ? error.message
              : "Impossible d'ajouter le membre",
        });
      }
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

  const handleRemoveMember = async (memberId: string) => {
    if (!groupId) return;
    try {
      await dispatch(removeMemberFromGroup({ groupId, memberId })).unwrap();
    } catch (error: unknown) {
      logger.error("Error removing member", error);
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

  // Check if current user is the group creator
  const isCreator = groupDetails?.group.creatorId === currentUserId;

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
    <SafeAreaView style={{ flex: 1 }}>
      <YStack flex={1} backgroundColor="$background">
        {/* Header */}
        <XStack
          paddingHorizontal="$base"
          paddingVertical="$sm"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
          alignItems="center"
          backgroundColor="$background"
        >
          <Pressable
            style={{ padding: 8, marginRight: 8 }}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color={iconColor} />
          </Pressable>
          <YStack flex={1}>
            <Text fontSize={14} color="$colorSecondary" fontWeight="400">
              Groupe
            </Text>
            <Text fontSize={20} color="$color" fontWeight="600">
              {group.name}
            </Text>
          </YStack>
          {isCreator ? (
            <Pressable
              style={{ padding: 8, marginLeft: 8 }}
              onPress={openDeleteConfirmModal}
            >
              <Trash2 size={20} color="#ef4444" />
            </Pressable>
          ) : (
            <Pressable
              style={{ padding: 8, marginLeft: 8 }}
              onPress={handleLeaveGroup}
            >
              <LogOut size={20} color="#ef4444" />
            </Pressable>
          )}
        </XStack>

        <ScrollView
          flex={1}
          paddingHorizontal="$base"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Total mensuel */}
          <YStack
            backgroundColor="$backgroundSecondary"
            borderRadius="$md"
            padding="$lg"
            marginTop="$base"
            marginBottom="$lg"
            borderWidth={1}
            borderColor="$borderColor"
          >
            <XStack justifyContent="space-between" alignItems="center">
              <XStack alignItems="center">
                <Calendar size={16} color={iconSecondary} />
                <Text
                  fontSize={16}
                  fontWeight="500"
                  color="$color"
                  marginLeft="$xs"
                >
                  Total mensuel
                </Text>
              </XStack>
              <YStack alignItems="flex-end">
                <Text
                  fontSize={24}
                  fontWeight="700"
                  color="$color"
                  marginBottom={2}
                >
                  {groupStats.totalBudget.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  €
                </Text>
                <Text fontSize={14} color="$colorSecondary">
                  {groupStats.expensesCount} dépenses
                </Text>
              </YStack>
            </XStack>
          </YStack>

          {/* Dépenses configurées */}
          <YStack
            backgroundColor="$backgroundSecondary"
            borderRadius="$md"
            padding="$lg"
            marginBottom="$lg"
            borderWidth={1}
            borderColor="$borderColor"
          >
            <XStack
              justifyContent="space-between"
              alignItems="center"
              marginBottom="$base"
            >
              <Text fontSize={16} fontWeight="600" color="$color">
                Dépenses configurées ({groupStats.expensesCount})
              </Text>
              <Pressable onPress={openExpenseModal}>
                <YStack
                  backgroundColor="#f3f4f6"
                  borderWidth={1}
                  borderColor="#d1d5db"
                  borderRadius={8}
                  padding="$xs"
                >
                  <Plus size={16} color="#374151" />
                </YStack>
              </Pressable>
            </XStack>

            {(showAllExpenses ? expenses : expenses.slice(0, 1)).map(
              (expense, index, displayedExpenses) => (
                <YStack
                  key={expense.id}
                  paddingVertical="$sm"
                  borderBottomWidth={
                    index < displayedExpenses.length - 1 ? 1 : 0
                  }
                  borderBottomColor="$borderColor"
                  marginBottom={
                    index < displayedExpenses.length - 1 ? "$sm" : 0
                  }
                >
                  <XStack justifyContent="space-between" alignItems="center">
                    <YStack flex={1}>
                      <Text fontSize={16} fontWeight="500" color="$color">
                        {expense.name}
                      </Text>
                    </YStack>
                    <XStack alignItems="center">
                      <Text
                        fontSize={16}
                        fontWeight="600"
                        color="$color"
                        marginRight="$xs"
                      >
                        {expense.amount.toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        €
                      </Text>
                      <Pressable
                        onPress={() => handleDeleteExpense(expense.id)}
                        style={{ padding: 4 }}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </Pressable>
                    </XStack>
                  </XStack>
                </YStack>
              ),
            )}

            {expenses.length > 1 && !showAllExpenses && (
              <Pressable onPress={() => setShowAllExpenses(true)}>
                <YStack
                  paddingVertical="$base"
                  alignItems="center"
                  borderTopWidth={1}
                  borderTopColor="$borderColor"
                  marginTop="$xs"
                >
                  <Text fontSize={14} color="$colorSecondary" fontWeight="500">
                    Voir plus ({expenses.length - 1} autres)
                  </Text>
                </YStack>
              </Pressable>
            )}

            {expenses.length > 1 && showAllExpenses && (
              <Pressable onPress={() => setShowAllExpenses(false)}>
                <YStack
                  paddingVertical="$base"
                  alignItems="center"
                  borderTopWidth={1}
                  borderTopColor="$borderColor"
                  marginTop="$xs"
                >
                  <Text fontSize={14} color="$colorSecondary" fontWeight="500">
                    Voir moins
                  </Text>
                </YStack>
              </Pressable>
            )}
          </YStack>

          {/* Membres et quotes-parts */}
          <YStack
            backgroundColor="$backgroundSecondary"
            borderRadius="$md"
            padding="$lg"
            marginBottom="$lg"
            borderWidth={1}
            borderColor="$borderColor"
          >
            <XStack
              justifyContent="space-between"
              alignItems="center"
              marginBottom="$base"
            >
              <XStack alignItems="center">
                <Users size={16} color={iconColor} />
                <Text
                  fontSize={16}
                  fontWeight="600"
                  color="$color"
                  marginLeft="$xs"
                >
                  Membres et quotes-parts
                </Text>
              </XStack>
              <Pressable onPress={openMemberTypeChoice}>
                <XStack
                  alignItems="center"
                  backgroundColor="#f3f4f6"
                  borderWidth={1}
                  borderColor="#d1d5db"
                  borderRadius={8}
                  paddingHorizontal="$sm"
                  paddingVertical="$xs"
                >
                  <Plus size={16} color="#374151" />
                  <Users size={16} color="#374151" style={{ marginLeft: 4 }} />
                </XStack>
              </Pressable>
            </XStack>

            {members.map((member, index) => (
              <YStack
                key={member.id}
                paddingVertical={10}
                paddingHorizontal="$sm"
                borderBottomWidth={index < members.length - 1 ? 1 : 0}
                borderBottomColor="$borderColor"
              >
                {/* Ligne 1: Nom + Badge + Actions */}
                <XStack
                  justifyContent="space-between"
                  alignItems="center"
                  marginBottom="$1"
                >
                  <XStack alignItems="center" gap="$xs" flex={1}>
                    <Text
                      fontSize={15}
                      fontWeight="600"
                      color="$color"
                      flexShrink={1}
                    >
                      {member.pseudo}
                    </Text>
                    {member.userId === group.creatorId && (
                      <YStack
                        backgroundColor="$success600"
                        paddingHorizontal={6}
                        paddingVertical={2}
                        borderRadius="$sm"
                      >
                        <Text color="$white" fontSize={10} fontWeight="600">
                          Créateur
                        </Text>
                      </YStack>
                    )}
                  </XStack>
                  {isCreator &&
                    (member.isPhantom || member.userId !== group.creatorId) && (
                      <XStack gap="$xs">
                        {member.isPhantom && (
                          <Pressable
                            onPress={() => setEditingMember(member)}
                            style={{ padding: 4 }}
                          >
                            <Edit size={16} color="#0284c7" />
                          </Pressable>
                        )}
                        {member.userId !== group.creatorId && (
                          <Pressable
                            onPress={() => handleRemoveMember(member.id)}
                            style={{ padding: 4 }}
                          >
                            <Trash2 size={16} color="#ef4444" />
                          </Pressable>
                        )}
                      </XStack>
                    )}
                </XStack>

                {/* Ligne 2: Valeurs uniquement */}
                <XStack alignItems="center" gap="$xs" flexWrap="wrap">
                  <Text fontSize={14} color="$colorSecondary" fontWeight="500">
                    {(member.monthlyCapacity || 0).toLocaleString("fr-FR", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                    €/mois
                  </Text>
                  <Text fontSize={14} color="$gray300" marginHorizontal={2}>
                    •
                  </Text>
                  <Text fontSize={14} fontWeight="700" color="$color">
                    {member.sharePercentage}%
                  </Text>
                  <Text
                    fontSize={14}
                    fontWeight="600"
                    color={iconSuccess}
                    marginLeft="$1"
                  >
                    (
                    {member.shareAmount.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    €)
                  </Text>
                </XStack>
              </YStack>
            ))}

            {/* Explication du calcul */}
            <XStack
              alignItems="flex-start"
              marginTop="$base"
              paddingTop="$base"
              borderTopWidth={1}
              borderTopColor="$borderColor"
            >
              <Text
                fontSize={16}
                color="$colorSecondary"
                marginRight="$xs"
                marginTop={1}
              >
                •
              </Text>
              <Text
                fontSize={14}
                color="$colorSecondary"
                lineHeight={20}
                flex={1}
              >
                <Text fontWeight="600" color="$color">
                  Calcul équitable
                </Text>
                {"\n"}Les quotes-parts sont calculées proportionnellement aux
                revenus de chaque membre. Total des revenus du groupe :{" "}
                {groupDetails.totalIncome.toLocaleString("fr-FR")} €/mois.
              </Text>
            </XStack>
          </YStack>

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
                <AlertTriangle size={64} color="#ef4444" />
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
      </YStack>
    </SafeAreaView>
  );
};
