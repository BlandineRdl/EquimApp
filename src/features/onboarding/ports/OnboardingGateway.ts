/**
 * Onboarding Gateway Interface (Phase 5 spec)
 * Handles complete user onboarding in a single transaction
 */

import type { Shares } from "../../group/ports/GroupGateway";
import type { Expense } from "../domain/manage-predefined-expenses/predefined-expense";

// Gateway input type - uses domain vocabulary (label, not name)
export type ExpenseInput = Pick<Expense, "label" | "amount"> & {
  isPredefined?: boolean;
};

export interface CompleteOnboardingInput {
  pseudo: string;
  income: number;
  groupName: string;
  expenses: ExpenseInput[];
}

export interface CompleteOnboardingResult {
  profileId: string;
  groupId: string;
  shares: Shares;
}

export interface OnboardingGateway {
  /**
   * Complete user onboarding in a single atomic transaction
   * - Creates user profile
   * - Creates group
   * - Adds user as first member
   * - Creates initial expenses
   * - Returns computed shares
   */
  completeOnboarding(
    input: CompleteOnboardingInput,
  ): Promise<CompleteOnboardingResult>;
}
