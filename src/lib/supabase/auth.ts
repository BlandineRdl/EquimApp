import type { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";

import { logger } from "../logger";
import { supabase } from "./client";

/**
 * Get current auth session
 */
export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    logger.error("Error getting session", error);
    return null;
  }

  return data.session;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (session: Session | null) => void) {
  const { data: subscription } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      callback(session);
    },
  );

  return subscription;
}

/**
 * Setup deep linking for magic link authentication
 * Handles the redirect from email magic links
 */
export function setupAuthDeepLinking() {
  // Handle initial URL (cold start)
  Linking.getInitialURL().then((url) => {
    if (url) {
      handleAuthRedirect(url);
    }
  });

  // Handle URLs when app is already open
  const subscription = Linking.addEventListener("url", ({ url }) => {
    handleAuthRedirect(url);
  });

  return () => {
    subscription.remove();
  };
}

/**
 * Handle auth redirect URL from magic link
 */
async function handleAuthRedirect(url: string) {
  // Check if this is an auth redirect
  if (!url.includes("equimapp://auth")) {
    return;
  }

  // Extract tokens from URL
  const parsed = Linking.parse(url);
  const params = parsed.queryParams;

  // Supabase magic link includes access_token and refresh_token
  if (params?.access_token && params?.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token as string,
      refresh_token: params.refresh_token as string,
    });

    if (error) {
      logger.error("Error setting session from deep link", error);
    }
  }
}
