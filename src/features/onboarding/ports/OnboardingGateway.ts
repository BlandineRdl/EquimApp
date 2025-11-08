import type { Shares } from "../../group/ports/GroupGateway";
import type { Expense } from "../domain/manage-predefined-expenses/predefined-expense";

export type ExpenseInput = Pick<Expense, "label" | "amount"> & {
  isPredefined?: boolean;
};

export interface CompleteOnboardingInput {
  pseudo: string;
  income: number;
  groupName?: string;
  expenses: ExpenseInput[];
}

export interface CompleteOnboardingResult {
  profileId: string;
  groupId?: string;
  shares?: Shares;
}

export interface OnboardingGateway {
  completeOnboarding(
    input: CompleteOnboardingInput,
  ): Promise<CompleteOnboardingResult>;
}
