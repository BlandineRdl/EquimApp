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
import {
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useSelector } from "react-redux";
import { ExpenseManager } from "../../../../components/ExpenseManager.component";
import { logger } from "../../../../lib/logger";
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text>Chargement...</Text>
        </View>
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerLabel}>Groupe</Text>
          <Text style={styles.headerTitle}>{group.name}</Text>
        </View>
        {isCreator ? (
          <TouchableOpacity
            style={styles.deleteGroupButton}
            onPress={openDeleteConfirmModal}
          >
            <Trash2 size={20} color="#ef4444" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.leaveGroupButton}
            onPress={handleLeaveGroup}
          >
            <LogOut size={20} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Total mensuel */}
        <View style={styles.totalCard}>
          <View style={styles.totalCardContent}>
            <View style={styles.totalHeader}>
              <Calendar size={16} color="#666" />
              <Text style={styles.totalLabel}>Total mensuel</Text>
            </View>
            <View style={styles.totalRight}>
              <Text style={styles.totalAmount}>
                {groupStats.totalBudget.toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                €
              </Text>
              <Text style={styles.totalSubtext}>
                {groupStats.expensesCount} dépenses
              </Text>
            </View>
          </View>
        </View>

        {/* Dépenses configurées */}
        <View style={styles.expensesCard}>
          <View style={styles.expensesHeader}>
            <Text style={styles.expensesCardTitle}>
              Dépenses configurées ({groupStats.expensesCount})
            </Text>
            <TouchableOpacity
              style={styles.addExpenseButton}
              onPress={openExpenseModal}
            >
              <Plus size={16} color="#666" />
            </TouchableOpacity>
          </View>

          {(showAllExpenses ? expenses : expenses.slice(0, 1)).map(
            (expense, index, displayedExpenses) => (
              <View
                key={expense.id}
                style={[
                  styles.expenseItem,
                  index < displayedExpenses.length - 1 &&
                    styles.expenseItemWithBorder,
                ]}
              >
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseLabel}>{expense.name}</Text>
                </View>
                <View style={styles.expenseActions}>
                  <Text style={styles.expenseAmount}>
                    {expense.amount.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    €
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteExpense(expense.id)}
                    style={styles.deleteExpenseButton}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ),
          )}

          {expenses.length > 1 && !showAllExpenses && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => setShowAllExpenses(true)}
            >
              <Text style={styles.showMoreText}>
                Voir plus ({expenses.length - 1} autres)
              </Text>
            </TouchableOpacity>
          )}

          {expenses.length > 1 && showAllExpenses && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => setShowAllExpenses(false)}
            >
              <Text style={styles.showMoreText}>Voir moins</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Membres et quotes-parts */}
        <View style={styles.membersCard}>
          <View style={styles.membersHeader}>
            <View style={styles.membersTitle}>
              <Users size={16} color="#000" />
              <Text style={styles.membersCardTitle}>
                Membres et quotes-parts
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addMemberButton}
              onPress={openMemberTypeChoice}
            >
              <Plus size={16} color="#666" />
              <Users size={16} color="#666" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          {members.map((member, index) => (
            <View
              key={member.id}
              style={[
                styles.memberItem,
                index < members.length - 1 && styles.memberItemWithBorder,
              ]}
            >
              {/* Ligne 1: Nom + Badge + Actions */}
              <View style={styles.memberHeaderRow}>
                <View style={styles.memberNameRow}>
                  <Text style={styles.memberName} numberOfLines={1}>
                    {member.pseudo}
                  </Text>
                  {member.userId === group.creatorId && (
                    <View style={styles.creatorBadge}>
                      <Text style={styles.creatorBadgeText}>Créateur</Text>
                    </View>
                  )}
                </View>
                {isCreator &&
                  (member.isPhantom || member.userId !== group.creatorId) && (
                    <View style={styles.memberActions}>
                      {member.isPhantom && (
                        <TouchableOpacity
                          onPress={() => setEditingMember(member)}
                          style={styles.editMemberButton}
                        >
                          <Edit size={16} color="#0284c7" />
                        </TouchableOpacity>
                      )}
                      {member.userId !== group.creatorId && (
                        <TouchableOpacity
                          onPress={() => handleRemoveMember(member.id)}
                          style={styles.removeMemberButton}
                        >
                          <Trash2 size={16} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
              </View>

              {/* Ligne 2: Valeurs uniquement */}
              <View style={styles.memberDetailsRow}>
                <Text style={styles.memberCapacity}>
                  {(member.monthlyCapacity || 0).toLocaleString("fr-FR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                  €/mois
                </Text>
                <Text style={styles.memberDetailsSeparator}>•</Text>
                <Text style={styles.sharePercentageBold}>
                  {member.sharePercentage}%
                </Text>
                <Text style={styles.shareAmountGreen}>
                  (
                  {member.shareAmount.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  €)
                </Text>
              </View>
            </View>
          ))}

          {/* Explication du calcul */}
          <View style={styles.calculationNote}>
            <Text style={styles.calculationBullet}>•</Text>
            <Text style={styles.calculationText}>
              <Text style={styles.calculationBold}>Calcul équitable</Text>
              {"\n"}Les quotes-parts sont calculées proportionnellement aux
              revenus de chaque membre. Total des revenus du groupe :{" "}
              {groupDetails.totalIncome.toLocaleString("fr-FR")} €/mois.
            </Text>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modal d'ajout de membre */}
      {addMemberUI.isOpen && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter un membre fantôme</Text>
            <Text style={styles.infoText}>
              💡 Le préfixe "Membre-" sera ajouté automatiquement
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nom (ex: Bob)"
              value={addMemberUI.form?.pseudo}
              onChangeText={onPseudoChange}
              maxLength={50}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Revenu mensuel (€) - optionnel"
              keyboardType="numeric"
              value={addMemberUI.form?.monthlyIncome}
              onChangeText={onIncomeChange}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleAddMember}
            >
              <Text style={styles.modalButtonText}>Ajouter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButtonCancel}
              onPress={closeAddMemberModal}
            >
              <Text style={styles.modalButtonTextCancel}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modal d'ajout de dépense */}
      <Modal
        visible={addExpenseUI.isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeAddExpenseModal}
      >
        <View style={styles.bottomSheetContainer}>
          {/* Header */}
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle}>Dépenses du groupe</Text>
            <TouchableOpacity onPress={closeAddExpenseModal}>
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.bottomSheetContent}>
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
          </View>
        </View>
      </Modal>

      {/* Modal de confirmation de suppression du groupe */}
      <Modal
        visible={showDeleteConfirm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeDeleteConfirmModal}
      >
        <View style={styles.bottomSheetContainer}>
          {/* Header */}
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle}>Supprimer le groupe ?</Text>
            <TouchableOpacity onPress={closeDeleteConfirmModal}>
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.deleteContent}>
            <View style={styles.deleteIconContainer}>
              <AlertTriangle size={64} color="#ef4444" />
            </View>
            <Text style={styles.deleteWarningText}>
              Cette action est irréversible. Tous les membres, dépenses et
              données du groupe seront définitivement supprimés.
            </Text>

            <TouchableOpacity
              style={styles.deleteDangerButton}
              onPress={confirmDeleteGroup}
            >
              <Text style={styles.deleteDangerButtonText}>
                Supprimer définitivement
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={closeDeleteConfirmModal}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    </SafeAreaView>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  leaveGroupButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteGroupButton: {
    padding: 8,
    marginLeft: 8,
  },
  headerLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "400",
  },
  headerTitle: {
    fontSize: 20,
    color: "#000",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  totalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  totalCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginLeft: 8,
  },
  totalRight: {
    alignItems: "flex-end",
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 2,
  },
  totalSubtext: {
    fontSize: 14,
    color: "#666",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  expensesCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  expensesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  expensesCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  addExpenseButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 8,
  },
  expensesContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  expenseItemWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 12,
    marginBottom: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 2,
  },
  expenseFrequency: {
    fontSize: 14,
    color: "#666",
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginRight: 8,
  },
  expenseActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteExpenseButton: {
    padding: 4,
  },
  showMoreButton: {
    paddingVertical: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  membersCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  membersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  membersTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  membersCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginLeft: 8,
  },
  addMemberButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  membersContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    marginBottom: 16,
  },
  memberItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  memberItemWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  memberHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    flexShrink: 1,
  },
  creatorBadge: {
    backgroundColor: "#10b981",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  creatorBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  memberActions: {
    flexDirection: "row",
    gap: 8,
  },
  editMemberButton: {
    padding: 4,
  },
  removeMemberButton: {
    padding: 4,
  },
  memberDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  memberCapacity: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  memberDetailsSeparator: {
    fontSize: 14,
    color: "#d1d5db",
    marginHorizontal: 2,
  },
  sharePercentageBold: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
  shareAmountGreen: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10b981",
    marginLeft: 4,
  },
  calculationNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  calculationBullet: {
    fontSize: 16,
    color: "#666",
    marginRight: 8,
    marginTop: 1,
  },
  calculationText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    flex: 1,
  },
  calculationBold: {
    fontWeight: "600",
    color: "#000",
  },
  bottomSpacing: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomSheetContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  bottomSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  bottomSheetContent: {
    flex: 1,
    padding: 16,
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
    fontWeight: "bold",
    marginBottom: 12,
    color: "#000",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
  },
  modalInput: {
    width: "100%",
    height: 50,
    borderColor: "#e0e0e0",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    fontSize: 16,
    color: "#000",
  },
  modalButton: {
    backgroundColor: "#10b981",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  modalButtonDisabled: {
    backgroundColor: "#9ca3af",
    opacity: 0.6,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalButtonCancel: {
    backgroundColor: "#f3f4f6",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  modalButtonTextCancel: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteContent: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteIconContainer: {
    marginBottom: 24,
  },
  deleteWarningText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  deleteDangerButton: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    paddingVertical: 16,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  deleteDangerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingVertical: 16,
    width: "100%",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
});
