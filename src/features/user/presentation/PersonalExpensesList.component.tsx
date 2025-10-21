import { Plus } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { PersonalExpense } from "../domain/manage-personal-expenses/personal-expense";

interface PersonalExpensesListProps {
  expenses: PersonalExpense[];
  onManagePress: () => void;
}

export function PersonalExpensesList({
  expenses,
  onManagePress,
}: PersonalExpensesListProps) {
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardLabel}>Charges personnelles</Text>
          {expenses.length === 0 ? (
            <Text style={styles.noExpensesText}>Aucune charge définie</Text>
          ) : (
            <>
              {expenses.map((expense) => (
                <View key={expense.id} style={styles.expenseItem}>
                  <Text style={styles.expenseLabel}>{expense.label}</Text>
                  <Text style={styles.expenseAmount}>
                    {expense.amount.toLocaleString("fr-FR")} €
                  </Text>
                </View>
              ))}
              <View style={styles.expensesTotal}>
                <Text style={styles.expensesTotalLabel}>Total</Text>
                <Text style={styles.expensesTotalAmount}>
                  - {totalExpenses.toLocaleString("fr-FR")} €
                </Text>
              </View>
            </>
          )}
        </View>
        <TouchableOpacity style={styles.editButton} onPress={onManagePress}>
          <Plus size={20} color="#10b981" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  noExpensesText: {
    fontSize: 14,
    color: "#9ca3af",
    fontStyle: "italic",
    marginTop: 4,
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  expenseLabel: {
    fontSize: 14,
    color: "#374151",
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  expensesTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  expensesTotalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  expensesTotalAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ef4444",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#d1fae5",
    justifyContent: "center",
    alignItems: "center",
  },
});
