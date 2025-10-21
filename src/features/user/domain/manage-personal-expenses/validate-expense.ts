import {
  MAX_EXPENSE_AMOUNT,
  MAX_LABEL_LENGTH,
  MIN_EXPENSE_AMOUNT,
} from "./personal-expense.constants";

export class ExpenseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExpenseValidationError";
  }
}

export function validateExpenseAmount(amount: number): void {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    throw new ExpenseValidationError("Amount must be a valid number");
  }

  if (amount < MIN_EXPENSE_AMOUNT) {
    throw new ExpenseValidationError(
      `Amount must be at least ${MIN_EXPENSE_AMOUNT}`,
    );
  }

  if (amount > MAX_EXPENSE_AMOUNT) {
    throw new ExpenseValidationError(
      `Amount must not exceed ${MAX_EXPENSE_AMOUNT}`,
    );
  }
}

export function validateExpenseLabel(label: string): void {
  if (typeof label !== "string") {
    throw new ExpenseValidationError("Label must be a string");
  }

  const trimmedLabel = label.trim();

  if (trimmedLabel.length === 0) {
    throw new ExpenseValidationError("Label cannot be empty");
  }

  if (trimmedLabel.length > MAX_LABEL_LENGTH) {
    throw new ExpenseValidationError(
      `Label must not exceed ${MAX_LABEL_LENGTH} characters`,
    );
  }
}

export function validateExpense(label: string, amount: number): void {
  validateExpenseLabel(label);
  validateExpenseAmount(amount);
}
