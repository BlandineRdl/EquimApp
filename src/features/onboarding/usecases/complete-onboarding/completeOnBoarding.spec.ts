import {
  loadOnboardingDsl,
  type OnboardingDsl,
} from "./completeOnBoarding.dsl";

describe("Feature: Complete Onboarding", () => {
  let onboardingDsl: OnboardingDsl;

  beforeEach(() => {
    onboardingDsl = loadOnboardingDsl();
  });

  afterEach(async () => {
    await onboardingDsl.teardown();
  });

  describe("Scenario: User completes basic onboarding", () => {
    it("should create user profile and group successfully", async () => {
      await onboardingDsl.givenUserFillsOnboarding({
        pseudo: "Anaïs",
        monthlyIncome: "2500",
        groupName: "Foyer",
      });

      await onboardingDsl.andUserAddsExpense({
        id: "rent",
        amount: "800",
      });

      await onboardingDsl.andUserAddsExpense({
        id: "groceries",
        amount: "300",
      });

      await onboardingDsl.whenCompletingOnboarding();

      await onboardingDsl.thenOnboardingIsCompleted();

      await onboardingDsl.thenUserProfileIsCreated({
        pseudo: "Anaïs",
        monthlyIncome: 2500,
      });

      await onboardingDsl.thenGroupIsCreated({
        name: "Foyer",
        totalBudget: 1100,
      });
    });
  });

  describe("Scenario: User adds custom expenses", () => {
    it("should include custom expenses in the created group", async () => {
      await onboardingDsl.givenUserFillsOnboarding({
        pseudo: "Bob",
        monthlyIncome: "3000",
        groupName: "Solo",
      });

      await onboardingDsl.andUserAddsExpense({
        id: "rent",
        amount: "1200",
      });

      await onboardingDsl.andUserAddsCustomExpense({
        label: "Netflix",
        amount: "15",
        category: "personal",
      });

      await onboardingDsl.whenCompletingOnboarding();

      await onboardingDsl.thenOnboardingIsCompleted();

      await onboardingDsl.thenUserProfileIsCreated({
        pseudo: "Bob",
        monthlyIncome: 3000,
      });

      await onboardingDsl.thenGroupIsCreated({
        name: "Solo",
        totalBudget: 1215,
      });
    });
  });

  describe("Scenario: User leaves some expenses empty", () => {
    it("should filter out empty expenses", async () => {
      await onboardingDsl.givenUserFillsOnboarding({
        pseudo: "Charlie",
        monthlyIncome: "1800",
        groupName: "Budget Strict",
      });

      await onboardingDsl.andUserAddsExpense({
        id: "rent",
        amount: "600",
      });

      // Leave groceries empty
      await onboardingDsl.andUserAddsExpense({
        id: "groceries",
        amount: "",
      });

      await onboardingDsl.whenCompletingOnboarding();

      await onboardingDsl.thenOnboardingIsCompleted();

      await onboardingDsl.thenGroupIsCreated({
        name: "Budget Strict",
        totalBudget: 600,
      });
    });
  });
});
