export interface PersonalExpense {
  id: string;
  userId: string;
  label: string;
  amount: number;
}

export interface CreatePersonalExpenseDTO {
  label: string;
  amount: number;
}

export interface UpdatePersonalExpenseDTO {
  id: string;
  label: string;
  amount: number;
}
