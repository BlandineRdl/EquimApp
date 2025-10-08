import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Calendar, Plus, Trash2, Users } from "lucide-react-native";
import { useState, useEffect } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { logger } from "../../../lib/logger";
import type { AppState } from "../../../store/appState";
import { useAppDispatch } from "../../../store/buildReduxStore";
import {
  closeAddMemberForm,
  openAddMemberForm,
  updateAddMemberForm,
  closeAddExpenseForm,
  openAddExpenseForm,
  updateAddExpenseForm,
} from "../store/group.slice";
import { addMemberToGroup } from "../usecases/add-member/addMember.usecase";
import { addExpenseToGroup } from "../usecases/expense/addExpense.usecase";
import { loadGroupById } from "../usecases/load-group/loadGroup.usecase";
import { removeMemberFromGroup } from "../usecases/remove-member/removeMember.usecase";
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
  const router = useRouter();
  const dispatch = useAppDispatch();

  const addMemberUI = useSelector(selectAddMemberUI);
  const addExpenseUI = useSelector(selectAddExpenseUI);

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

  // Fonctions pour gérer la modal
  const openModal = () => {
    dispatch(openAddMemberForm(groupId));
  };

  const closeAddMemberModal = () => {
    dispatch(closeAddMemberForm());
  };

  const handleAddMember = () => {
    if (addMemberUI.form && addMemberUI.canSubmit) {
      dispatch(
        addMemberToGroup({
          groupId: addMemberUI.form.groupId,
          memberData: {
            pseudo: addMemberUI.form.pseudo.trim(),
            monthlyIncome: parseFloat(addMemberUI.form.monthlyIncome),
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

  const handleRemoveMember = async (memberId: string) => {
    if (!groupId) return;
    try {
      await dispatch(removeMemberFromGroup({ groupId, memberId })).unwrap();
    } catch (error: any) {
      logger.error("Error removing member", error);
    }
  };

  // Fonctions pour gérer la modal d'ajout de dépense
  const openExpenseModal = () => {
    dispatch(openAddExpenseForm(groupId));
  };

  const closeAddExpenseModal = () => {
    dispatch(closeAddExpenseForm());
  };

  const handleAddExpense = () => {
    if (addExpenseUI.form && addExpenseUI.canSubmit) {
      dispatch(
        addExpenseToGroup({
          groupId: addExpenseUI.form.groupId,
          name: addExpenseUI.form.name.trim(),
          amount: parseFloat(addExpenseUI.form.amount),
        }),
      );
    }
  };

  const onExpenseNameChange = (text: string) =>
    dispatch(updateAddExpenseForm({ name: text }));

  const onExpenseAmountChange = (text: string) =>
    dispatch(updateAddExpenseForm({ amount: text }));

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

          {(showAllExpenses ? expenses : expenses.slice(0, 1)).map((expense, index, displayedExpenses) => (
            <View
              key={expense.id}
              style={[
                styles.expenseItem,
                index < displayedExpenses.length - 1 && styles.expenseItemWithBorder,
              ]}
            >
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseLabel}>{expense.label}</Text>
                <Text style={styles.expenseFrequency}>{expense.frequency}</Text>
              </View>
              <Text style={styles.expenseAmount}>
                {parseFloat(expense.amount).toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                €
              </Text>
            </View>
          ))}

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
              <Text style={styles.showMoreText}>
                Voir moins
              </Text>
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
              onPress={openModal}
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
              <View style={styles.memberInfo}>
                <View style={styles.memberFirstRow}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName}>{member.pseudo}</Text>
                    {member.userId === group.creatorId && (
                      <View style={styles.creatorBadge}>
                        <Text style={styles.creatorBadgeText}>Créateur</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.memberFirstRowRight}>
                    <Text style={styles.revenueLabel}>
                      Revenu:{" "}
                      {(member.incomeOrWeight || 0).toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      €/mois
                    </Text>
                    {member.userId !== group.creatorId && (
                      <TouchableOpacity
                        onPress={() => handleRemoveMember(member.id)}
                        style={styles.removeMemberButton}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <View style={styles.quotePart}>
                  <Text style={styles.quotePartLabel}>Quote-part</Text>
                  <View style={styles.quotePartValues}>
                    <Text style={styles.sharePercentage}>
                      {member.sharePercentage}%
                    </Text>
                    <Text style={styles.shareAmount}>
                      {member.shareAmount.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      €
                    </Text>
                  </View>
                </View>
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
            <Text style={styles.modalTitle}>Ajouter un membre</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Pseudo"
              value={addMemberUI.form?.pseudo}
              onChangeText={onPseudoChange}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Revenu mensuel (€)"
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
      {addExpenseUI.isOpen && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter une dépense</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nom de la dépense"
              value={addExpenseUI.form?.name}
              onChangeText={onExpenseNameChange}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Montant (€)"
              keyboardType="numeric"
              value={addExpenseUI.form?.amount}
              onChangeText={onExpenseAmountChange}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleAddExpense}
            >
              <Text style={styles.modalButtonText}>Ajouter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButtonCancel}
              onPress={closeAddExpenseModal}
            >
              <Text style={styles.modalButtonTextCancel}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingVertical: 16,
  },
  memberItemWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 16,
    marginBottom: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberFirstRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  memberFirstRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  creatorBadge: {
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  creatorBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  removeMemberButton: {
    padding: 4,
    marginLeft: 8,
  },
  memberRevenue: {
    marginBottom: 4,
  },
  revenueLabel: {
    fontSize: 14,
    color: "#666",
  },
  quotePart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quotePartLabel: {
    fontSize: 14,
    color: "#666",
  },
  quotePartValues: {
    alignItems: "flex-end",
  },
  memberShare: {
    alignItems: "flex-end",
  },
  sharePercentage: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 2,
  },
  shareAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10b981",
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#000",
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
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalButtonCancel: {
    backgroundColor: "#e0e0e0",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  modalButtonTextCancel: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
});
