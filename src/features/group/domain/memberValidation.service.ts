import { MIN_INCOME, MIN_PSEUDO_LENGTH } from "./group.constants";

export interface MemberData {
  pseudo: string;
  monthlyIncome: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate member data for adding to group
 */
export function validateMemberData(data: MemberData): ValidationResult {
  const errors: string[] = [];

  // Validate pseudo
  const trimmedPseudo = data.pseudo.trim();
  if (!trimmedPseudo) {
    errors.push("Le pseudo ne peut pas être vide");
  } else if (trimmedPseudo.length < MIN_PSEUDO_LENGTH) {
    errors.push(
      `Le pseudo doit contenir au moins ${MIN_PSEUDO_LENGTH} caractères`,
    );
  }

  // Validate income
  if (data.monthlyIncome <= 0) {
    errors.push("Le revenu mensuel doit être positif");
  } else if (data.monthlyIncome < MIN_INCOME) {
    errors.push(`Le revenu mensuel doit être au moins ${MIN_INCOME}€`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Normalize member data (trim, etc.)
 */
export function normalizeMemberData(data: MemberData): MemberData {
  return {
    pseudo: data.pseudo.trim(),
    monthlyIncome: Number(data.monthlyIncome),
  };
}
