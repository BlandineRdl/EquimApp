import { logger } from "../../../lib/logger";
import { supabase } from "../../../lib/supabase/client";
import { createUserFriendlyError } from "../../../lib/supabase/errors";
import type {
  CompleteOnboardingInput,
  CompleteOnboardingResult,
  OnboardingGateway,
} from "../ports/OnboardingGateway";

// Type local pour le mapping des données de la RPC
interface RpcMemberShare {
  member_id: string;
  user_id: string | null;
  pseudo: string;
  share_percentage: number;
  share_amount: number;
}

export class SupabaseOnboardingGateway implements OnboardingGateway {
  async completeOnboarding(
    input: CompleteOnboardingInput,
  ): Promise<CompleteOnboardingResult> {
    try {
      // Map domain (label) to RPC (name) + snake_case
      const expenses = input.expenses.map((e) => ({
        name: e.label, // ✅ Infra maps domain → DB
        amount: e.amount,
        is_predefined: e.isPredefined ?? false,
      }));

      // Call complete_onboarding RPC (atomic transaction)
      const { data, error } = await supabase.rpc("complete_onboarding", {
        p_pseudo: input.pseudo,
        p_income: input.income,
        p_group_name: input.groupName,
        p_expenses: expenses,
      });

      if (error) {
        logger.error("Supabase RPC error", error);
        throw createUserFriendlyError(error);
      }

      if (!data) {
        throw new Error("Aucune donnée retournée par complete_onboarding");
      }

      logger.debug("Raw data received", { dataType: typeof data, data });

      // Parse JSON if it's a string
      const result = typeof data === "string" ? JSON.parse(data) : data;

      logger.debug("Parsed result", { result });

      // Validate result structure
      if (!result.profile_id || !result.group_id || !result.shares) {
        throw new Error(
          `Structure de réponse invalide: ${JSON.stringify(result)}`,
        );
      }

      return {
        profileId: result.profile_id,
        groupId: result.group_id,
        shares: {
          totalExpenses: result.shares.total_expenses || 0,
          shares: Array.isArray(result.shares.shares)
            ? result.shares.shares.map((s: RpcMemberShare) => ({
                memberId: s.member_id,
                userId: s.user_id,
                pseudo: s.pseudo || "",
                sharePercentage: s.share_percentage || 0,
                shareAmount: s.share_amount || 0,
              }))
            : [],
        },
      };
    } catch (error) {
      throw createUserFriendlyError(error);
    }
  }
}
