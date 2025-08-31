import type { Group } from "../../group/domain/group.model";
import type { User } from "../../user/domain/user.model";
import type { OnboardingData } from "../domain/onboarding.model";
import type { OnboardingGateway } from "../ports/onboarding.gateway";
export class InMemoryOnboardingGateway implements OnboardingGateway {
  private storedResult: { user: User; group: Group } | null = null;

  async completeOnboarding(data: OnboardingData): Promise<{
    user: User;
    group: Group;
  }> {
    if (this.storedResult) {
      return { ...this.storedResult };
    }

    const user: User = {
      id: "user-1",
      pseudo: data.userProfile.pseudo,
      monthlyIncome: data.userProfile.monthlyIncome,
      shareRevenue: data.userProfile.shareRevenue,
    };

    const group: Group = {
      id: "group-1",
      name: data.group.name,
      expenses: data.group.expenses.map((expense) => ({
        id: expense.isCustom ? `custom-${expense.label}` : expense.label,
        label: expense.label,
        amount: expense.amount,
        isCustom: expense.isCustom,
      })),
      totalMonthlyBudget: data.group.totalMonthlyBudget,
    };

    return { user, group };
  }

  seed(result: { user: User; group: Group }): void {
    this.storedResult = result;
  }

  reset(): void {
    this.storedResult = null;
  }
}
