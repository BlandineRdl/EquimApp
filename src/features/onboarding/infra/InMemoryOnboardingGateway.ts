import type { GroupGateway } from "../../group/ports/GroupGateway";
import type {
  CompleteOnboardingInput,
  CompleteOnboardingResult,
  OnboardingGateway,
} from "../ports/OnboardingGateway";

export class InMemoryOnboardingGateway implements OnboardingGateway {
  private storedResult: CompleteOnboardingResult | null = null;

  constructor(private groupGateway: GroupGateway) {}

  async completeOnboarding(
    input: CompleteOnboardingInput,
  ): Promise<CompleteOnboardingResult> {
    if (this.storedResult) {
      return { ...this.storedResult };
    }

    const profileId = "user-1";

    // Group creation is optional
    if (!input.groupName) {
      // No group - return only profile info
      return {
        profileId,
      };
    }

    // Create group
    const { groupId } = await this.groupGateway.createGroup(
      input.groupName,
      "EUR",
    );

    // Add member (current user)
    await this.groupGateway.addMember(groupId, profileId);

    // Create expenses (map domain label → group expense name)
    for (const expense of input.expenses) {
      await this.groupGateway.createExpense({
        groupId,
        name: expense.label, // ✅ Infra maps domain → group
        amount: expense.amount,
        currency: "EUR",
        isPredefined: expense.isPredefined ?? false,
      });
    }

    // Get shares
    const { shares } = await this.groupGateway.refreshGroupShares(groupId);

    const result: CompleteOnboardingResult = {
      profileId,
      groupId,
      shares,
    };

    return result;
  }

  seed(result: CompleteOnboardingResult): void {
    this.storedResult = result;
  }

  reset(): void {
    this.storedResult = null;
  }
}
