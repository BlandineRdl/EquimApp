interface SupabaseError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

export function mapSupabaseError(error: unknown): string {
  if (!error) {
    return "An unexpected error occurred";
  }

  const err = error as SupabaseError;
  const code = err.code;
  const message = err.message?.toLowerCase() || "";

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

  if (code) {
    switch (code) {
      case "PGRST116":
        return "Requête invalide. Veuillez vérifier vos données.";

      case "PGRST204":
        return "Aucune donnée trouvée";

      case "42P01":
        return `Table inexistante en base de données. Veuillez exécuter les migrations Supabase. (${err.message})`;

      case "23503":
        return "Cette opération violerait l'intégrité des données";

      case "23505":
        return "Cet enregistrement existe déjà";

      default:
        break;
    }
  }

  if (
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("connection")
  ) {
    return "Vérifiez votre connexion internet et réessayez";
  }

  if (message.includes("invalid email") || message.includes("email")) {
    return "Veuillez entrer une adresse email valide";
  }

  if (message.includes("password")) {
    return "Mot de passe invalide. Veuillez réessayer.";
  }

  if (message.includes("not authorized") || message.includes("unauthorized")) {
    return "Vous n'avez pas la permission d'effectuer cette action";
  }

  if (message.includes("validation") || message.includes("invalid")) {
    return "Veuillez vérifier vos données et réessayer";
  }

  return err.message || "Une erreur est survenue. Veuillez réessayer.";
}

export function createUserFriendlyError(error: unknown): Error {
  const friendlyMessage = mapSupabaseError(error);
  const err = new Error(friendlyMessage);

  if (error instanceof Error) {
    err.cause = error;
  }

  return err;
}
