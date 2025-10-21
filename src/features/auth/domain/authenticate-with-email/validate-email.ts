/**
 * Email Validation
 * Domain logic for validating and normalizing email addresses
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalized)) {
    throw new Error("Please enter a valid email address");
  }
  return normalized;
}
