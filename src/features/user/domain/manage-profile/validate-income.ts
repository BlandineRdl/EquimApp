import { MAX_INCOME, MIN_INCOME } from "./profile.constants";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate income value
 */
export function validateIncome(income: number): ValidationResult {
  const errors: string[] = [];

  // Check if income is a valid number
  if (Number.isNaN(income)) {
    errors.push("Le revenu doit être un nombre valide");
    return { isValid: false, errors };
  }

  // Check minimum income
  if (income < MIN_INCOME) {
    errors.push(`Le revenu mensuel doit être au moins ${MIN_INCOME}€`);
  }

  // Check maximum income
  if (income > MAX_INCOME) {
    errors.push(
      `Le revenu mensuel doit être inférieur à ${MAX_INCOME.toLocaleString("fr-FR")}€`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
