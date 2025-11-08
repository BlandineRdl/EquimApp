import { MIN_INCOME, MIN_PSEUDO_LENGTH } from "./member.constants";

export interface MemberData {
  pseudo: string;
  monthlyIncome: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateMemberData(data: MemberData): ValidationResult {
  const errors: string[] = [];

  const trimmedPseudo = data.pseudo.trim();
  if (!trimmedPseudo) {
    errors.push("Le pseudo ne peut pas être vide");
  } else if (trimmedPseudo.length < MIN_PSEUDO_LENGTH) {
    errors.push(
      `Le pseudo doit contenir au moins ${MIN_PSEUDO_LENGTH} caractères`,
    );
  }

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

export function normalizeMemberData(data: MemberData): MemberData {
  return {
    pseudo: data.pseudo.trim(),
    monthlyIncome: Number(data.monthlyIncome),
  };
}
