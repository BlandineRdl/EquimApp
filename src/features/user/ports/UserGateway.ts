import type { PersonalExpense } from "../domain/manage-personal-expenses/personal-expense";
import type { User } from "../domain/manage-profile/profile";

export type NewPersonalExpense = Omit<PersonalExpense, "id" | "userId">;

export type PersonalExpenseUpdate = Omit<PersonalExpense, "userId">;

export type CreateProfileInput = Omit<User, "personalExpenses" | "capacity">;

export interface UpdateProfileInput {
  pseudo?: string;
  monthlyIncome?: number;
  shareRevenue?: boolean;
}

export interface UserGateway {
  createProfile(input: CreateProfileInput): Promise<void>;

  getProfileById(id: string): Promise<User | null>;

  updateProfile(id: string, patch: UpdateProfileInput): Promise<void>;

  addPersonalExpense(
    userId: string,
    expense: NewPersonalExpense,
  ): Promise<PersonalExpense>;

  updatePersonalExpense(
    userId: string,
    expense: PersonalExpenseUpdate,
  ): Promise<PersonalExpense>;

  deletePersonalExpense(userId: string, expenseId: string): Promise<void>;

  loadPersonalExpenses(userId: string): Promise<PersonalExpense[]>;

  getUserCapacity(userId: string): Promise<number | undefined>;
}
