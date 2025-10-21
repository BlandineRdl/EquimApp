import { useRouter } from "expo-router";
import { ArrowLeft, Edit2, LogOut, User } from "lucide-react-native";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { signOut } from "../../src/features/auth/usecases/manage-session/signOut.usecase";
import { ManagePersonalExpensesModal } from "../../src/features/user/presentation/ManagePersonalExpensesModal.component";
import { PersonalExpensesList } from "../../src/features/user/presentation/PersonalExpensesList.component";
import { selectPersonalExpenses } from "../../src/features/user/presentation/selectors/selectPersonalExpenses.selector";
import { selectUserProfile } from "../../src/features/user/presentation/selectors/selectUser.selector";
import { selectUserCapacity } from "../../src/features/user/presentation/selectors/selectUserCapacity.selector";
import { UpdateIncomeModal } from "../../src/features/user/presentation/UpdateIncomeModal.component";
import { useAppDispatch } from "../../src/store/buildReduxStore";

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useSelector(selectUserProfile);
  const capacity = useSelector(selectUserCapacity);
  const personalExpenses = useSelector(selectPersonalExpenses);
  const [isIncomeModalVisible, setIsIncomeModalVisible] = useState(false);
  const [isExpensesModalVisible, setIsExpensesModalVisible] = useState(false);

  const handleSignOut = async () => {
    await dispatch(signOut());
    // User will be redirected to sign-in by the layout
  };

  const totalExpenses = personalExpenses.reduce(
    (sum, exp) => sum + exp.amount,
    0,
  );

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
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mon profil</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Profile Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.avatarContainer}>
              <User size={32} color="#10b981" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileLabel}>Pseudo</Text>
              <Text style={styles.profileValue}>{user.pseudo}</Text>
            </View>
          </View>
        </View>

        {/* Income Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardLabel}>Revenu mensuel</Text>
              <Text style={styles.cardValue}>
                {user.monthlyIncome.toLocaleString("fr-FR")} €
              </Text>
              <Text style={styles.cardHint}>
                Utilisé pour le calcul équitable des parts
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsIncomeModalVisible(true)}
            >
              <Edit2 size={20} color="#10b981" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Personal Expenses Card */}
        <PersonalExpensesList
          expenses={personalExpenses}
          onManagePress={() => setIsExpensesModalVisible(true)}
        />

        {/* Capacity Card */}
        {capacity !== undefined && (
          <View style={styles.card}>
            <View style={styles.capacityBox}>
              <Text style={styles.capacityLabel}>💰 Capacité de dépense</Text>
              <Text
                style={[
                  styles.capacityValue,
                  capacity < 0 && styles.negativeCapacity,
                ]}
              >
                {capacity.toLocaleString("fr-FR")} €
              </Text>
              <Text style={styles.capacityHint}>
                Revenu ({user.monthlyIncome.toLocaleString("fr-FR")} €) -
                Charges ({totalExpenses.toLocaleString("fr-FR")} €)
              </Text>
            </View>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>À propos du revenu</Text>
          <Text style={styles.infoText}>
            Votre revenu mensuel est utilisé pour calculer votre part équitable
            dans chaque groupe. Plus votre revenu est élevé, plus votre
            contribution est importante.
          </Text>
          <Text style={styles.infoText}>
            Vous pouvez modifier votre revenu à tout moment. Les parts de tous
            vos groupes seront automatiquement recalculées.
          </Text>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
            <LogOut size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Update Income Modal */}
      <UpdateIncomeModal
        isVisible={isIncomeModalVisible}
        onClose={() => setIsIncomeModalVisible(false)}
        onSuccess={() => {
          // Modal will close automatically, shares will update via listeners
        }}
      />

      {/* Manage Personal Expenses Modal */}
      <ManagePersonalExpensesModal
        isVisible={isExpensesModalVisible}
        onClose={() => setIsExpensesModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginRight: 32, // Balance the back button
  },
  headerSpacer: {
    width: 32,
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#d1fae5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  cardHint: {
    fontSize: 12,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#d1fae5",
    justifyContent: "center",
    alignItems: "center",
  },
  infoSection: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 12,
  },
  logoutSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
  },
  capacityBox: {
    alignItems: "center",
    paddingVertical: 8,
  },
  capacityLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  capacityValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#10b981",
    marginBottom: 4,
  },
  negativeCapacity: {
    color: "#ef4444",
  },
  capacityHint: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
});
