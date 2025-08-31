import type { Group } from "../features/group/domain/group.model";
import type { OnboardingExpense } from "../features/onboarding/domain/onboarding.model";
import type { User } from "../features/user/domain/user.model";

export interface AppState {
  onboarding: {
    pseudo: string;
    pseudoBlurred: boolean;
    monthlyIncome: string;
    incomeBlurred: boolean;
    groupName: string;
    groupNameBlurred: boolean;
    expenses: OnboardingExpense[];
    completing: boolean;
    completed: boolean;
    error: string | null;
  };
  user: {
    profile: User | null;
    loading: boolean;
    error: string | null;
  };
  groups: {
    entities: Record<string, Group>;
    ids: string[];
    loading: boolean;
    error: string | null;
  };
}
