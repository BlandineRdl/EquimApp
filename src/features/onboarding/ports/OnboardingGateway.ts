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
  groupName?: string; // Optional: user can skip group creation
  expenses: ExpenseInput[];
}

export interface CompleteOnboardingResult {
  profileId: string;
  groupId?: string; // Optional: only present if group was created
  shares?: Shares; // Optional: only present if group was created
}

export interface OnboardingGateway {
  /**
   * Complete user onboarding in a single atomic transaction
   * - Creates user profile (always)
   * - Creates group (optional - only if groupName is provided)
   * - Adds user as first member (only if group created)
   * - Creates initial expenses (only if group created)
   * - Returns computed shares (only if group created)
   */
  completeOnboarding(
    input: CompleteOnboardingInput,
  ): Promise<CompleteOnboardingResult>;
}
