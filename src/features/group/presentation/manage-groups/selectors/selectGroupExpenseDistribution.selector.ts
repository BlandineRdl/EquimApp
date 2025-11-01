import { createSelector } from "@reduxjs/toolkit";
import type { AppState } from "../../../../../store/appState";
import { selectGroupExpenses } from "../selectGroupDetails.selector";

export interface ExpenseDistributionItem {
  name: string;
  amount: number;
  percentage: number;
  color?: string;
}

export interface GroupExpenseDistribution {
  expenseDistribution: ExpenseDistributionItem[];
  totalExpenses: number;
  expensesCount: number;
}

/**
 * Selector that calculates expense distribution for a group
 * Returns proportional breakdown of expenses with percentages
 */
export const selectGroupExpenseDistribution = createSelector(
  [(state: AppState, groupId: string) => selectGroupExpenses(state, groupId)],
  (expenses): GroupExpenseDistribution => {
    // Calculate total
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );

    // Handle empty case
    if (expenses.length === 0 || totalExpenses === 0) {
      return {
        expenseDistribution: [],
        totalExpenses: 0,
        expensesCount: 0,
      };
    }

    // Calculate distribution with percentages
    const expenseDistribution: ExpenseDistributionItem[] = expenses.map(
      (expense) => ({
        name: expense.name,
        amount: expense.amount,
        percentage: Math.round((expense.amount / totalExpenses) * 100),
      }),
    );

    return {
      expenseDistribution,
      totalExpenses,
      expensesCount: expenses.length,
    };
  },
);
