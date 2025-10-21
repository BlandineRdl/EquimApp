import type { PersonalExpense } from "../domain/manage-personal-expenses/personal-expense";
import type { User } from "../domain/manage-profile/profile";
import type {
  CreateProfileInput,
  NewPersonalExpense,
  PersonalExpenseUpdate,
  UpdateProfileInput,
  UserGateway,
} from "../ports/UserGateway";

export class InMemoryUserGateway implements UserGateway {
  private profiles: Map<string, User> = new Map();
  private expenses: Map<string, PersonalExpense> = new Map();
  private expenseCounter = 0;

  async createProfile(input: CreateProfileInput): Promise<void> {
    this.profiles.set(input.id, {
      id: input.id,
      pseudo: input.pseudo,
      monthlyIncome: input.monthlyIncome,
      shareRevenue: input.shareRevenue,
      currency: input.currency,
      personalExpenses: [],
      capacity: input.monthlyIncome,
    });
  }

  async getProfileById(id: string): Promise<User | null> {
    return this.profiles.get(id) || null;
  }

  async updateProfile(id: string, patch: UpdateProfileInput): Promise<void> {
    const profile = this.profiles.get(id);
    if (!profile) {
      throw new Error("Profile not found");
    }

    this.profiles.set(id, {
      ...profile,
      ...(patch.pseudo !== undefined && { pseudo: patch.pseudo }),
      ...(patch.monthlyIncome !== undefined && {
        monthlyIncome: patch.monthlyIncome,
      }),
      ...(patch.shareRevenue !== undefined && {
        shareRevenue: patch.shareRevenue,
      }),
    });

    // Recalculate capacity if income changed
    if (patch.monthlyIncome !== undefined) {
      await this.recalculateCapacity(id);
    }
  }

  async addPersonalExpense(
    userId: string,
    expense: NewPersonalExpense,
  ): Promise<PersonalExpense> {
    const expenseId = `expense-${++this.expenseCounter}`;
    const newExpense: PersonalExpense = {
      id: expenseId,
      userId,
      label: expense.label,
      amount: expense.amount,
    };

    this.expenses.set(expenseId, newExpense);
    await this.recalculateCapacity(userId);
    return newExpense;
  }

  async updatePersonalExpense(
    userId: string,
    expense: PersonalExpenseUpdate,
  ): Promise<PersonalExpense> {
    const existing = this.expenses.get(expense.id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Personal expense not found");
    }

    const updated: PersonalExpense = {
      ...existing,
      label: expense.label,
      amount: expense.amount,
    };

    this.expenses.set(expense.id, updated);
    await this.recalculateCapacity(userId);
    return updated;
  }

  async deletePersonalExpense(
    userId: string,
    expenseId: string,
  ): Promise<void> {
    const expense = this.expenses.get(expenseId);
    if (!expense || expense.userId !== userId) {
      throw new Error("Personal expense not found");
    }

    this.expenses.delete(expenseId);
    await this.recalculateCapacity(userId);
  }

  async loadPersonalExpenses(userId: string): Promise<PersonalExpense[]> {
    return Array.from(this.expenses.values()).filter(
      (expense) => expense.userId === userId,
    );
  }

  private async recalculateCapacity(userId: string): Promise<void> {
    const profile = this.profiles.get(userId);
    if (!profile) {
      return;
    }

    const userExpenses = await this.loadPersonalExpenses(userId);
    const totalExpenses = userExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );
    const capacity = profile.monthlyIncome - totalExpenses;

    this.profiles.set(userId, {
      ...profile,
      capacity,
    });
  }

  async getUserCapacity(userId: string): Promise<number | undefined> {
    const profile = this.profiles.get(userId);
    return profile?.capacity;
  }

  // Helper for tests
  reset(): void {
    this.profiles.clear();
    this.expenses.clear();
    this.expenseCounter = 0;
  }
}
