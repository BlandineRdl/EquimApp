import type { Group } from "../../group/domain/group.model";
import type { User } from "../../user/domain/user.model";
import type { OnboardingData } from "../domain/onboarding.model";

export type CompleteOnboardingResult = {
  user: User;
  group: Group;
};

export interface OnboardingGateway {
  completeOnboarding(data: OnboardingData): Promise<CompleteOnboardingResult>;
}
