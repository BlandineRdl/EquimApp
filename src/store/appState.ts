import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import type {
  Group,
  InvitationDetails,
} from "../features/group/domain/group.model";
import type { OnboardingExpense } from "../features/onboarding/domain/onboarding.model";
import type { User } from "../features/user/domain/user.model";

interface AddMemberForm {
  groupId: string;
  pseudo: string;
  monthlyIncome: string;
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
    addMemberForm?: AddMemberForm;
    invitation: {
      generateLink: {
        loading: boolean;
        link: string | null;
        error: string | null;
      };
      details: {
        loading: boolean;
        data: InvitationDetails | null;
        error: string | null;
      };
    };
  };
}
