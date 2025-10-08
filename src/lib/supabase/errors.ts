/**
 * Maps Supabase errors to user-friendly messages
 * Handles RPC error codes, network errors, and generic errors
 */

interface SupabaseError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

export function mapSupabaseError(error: unknown): string {
  // Handle null/undefined
  if (!error) {
    return "An unexpected error occurred";
  }

  // Extract error properties
  const err = error as SupabaseError;
  const code = err.code;
  const message = err.message?.toLowerCase() || "";

  // RPC custom errors (P0001 with DETAIL)
  if (code === "P0001" && err.details) {
    switch (err.details) {
      case "invalid_token":
        return "Lien d'invitation invalide";

      case "expired_token":
        return "Cette invitation a expiré";

      case "already_consumed":
        return "Cette invitation a déjà été utilisée";

      case "already_member":
        return "Vous êtes déjà membre de ce groupe";

      case "not_member":
        return "Vous n'êtes pas membre de ce groupe";

      case "expense_currency_mismatch":
        return "La devise de la dépense doit correspondre à celle du groupe";

      default:
        break;
    }
  }

  // PostgreSQL native errors
  if (code) {
    switch (code) {
      case "PGRST116":
        return "Requête invalide. Veuillez vérifier vos données.";

      case "23503":
        return "Cette opération violerait l'intégrité des données";

      case "23505":
        return "Cet enregistrement existe déjà";

      default:
        break;
    }
  }

  // Network errors
  if (
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("connection")
  ) {
    return "Vérifiez votre connexion internet et réessayez";
  }

  // Auth errors
  if (message.includes("invalid email") || message.includes("email")) {
    return "Veuillez entrer une adresse email valide";
  }

  if (message.includes("password")) {
    return "Mot de passe invalide. Veuillez réessayer.";
  }

  if (message.includes("not authorized") || message.includes("unauthorized")) {
    return "Vous n'avez pas la permission d'effectuer cette action";
  }

  // Validation errors
  if (message.includes("validation") || message.includes("invalid")) {
    return "Veuillez vérifier vos données et réessayer";
  }

  // Default error message
  return err.message || "Une erreur est survenue. Veuillez réessayer.";
}

/**
 * Creates an error object with a user-friendly message
 */
export function createUserFriendlyError(error: unknown): Error {
  const friendlyMessage = mapSupabaseError(error);
  const err = new Error(friendlyMessage);

  // Preserve original error for debugging
  if (error instanceof Error) {
    err.cause = error;
  }

  return err;
}
