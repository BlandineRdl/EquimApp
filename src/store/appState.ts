import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import type { Group } from "../features/group/domain/manage-group/group.model";
import type { InvitationPreview } from "../features/group/ports/GroupGateway";
import type { User } from "../features/user/domain/manage-profile/profile";

interface AddMemberForm {
  groupId: string;
  pseudo: string;
  monthlyIncome: string;
}

interface AddExpenseForm {
  groupId: string;
  name: string;
  amount: string;
}

// Type formulaire onboarding (amount en string pour les inputs)
interface OnboardingExpense {
  id: string;
  label: string;
  amount: string;
  isCustom: boolean;
}

interface PersonalExpenseInput {
  label: string;
  amount: number;
}

export interface AppState {
  auth: {
    user: SupabaseUser | null;
    userId: string | null;
    session: Session | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    hydrated: boolean;
    profileDeleted: boolean;
    error: string | null;
  };
  onboarding: {
    pseudo: string;
    pseudoBlurred: boolean;
    monthlyIncome: string;
    incomeBlurred: boolean;
    groupName: string;
    groupNameBlurred: boolean;
    expenses: OnboardingExpense[];
    personalExpenses: PersonalExpenseInput[];
    skipGroupCreation: boolean;
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
    addMemberForm: AddMemberForm | null;
    addExpenseForm: AddExpenseForm | null;
    invitation: {
      generateLink: {
        loading: boolean;
        link: string | null;
        error: string | null;
      };
      details: {
        loading: boolean;
        data: InvitationPreview | null;
        error: string | null;
      };
    };
  };
}
