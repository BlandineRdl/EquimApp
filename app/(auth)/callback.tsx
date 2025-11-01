import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";
import { logger } from "../../src/lib/logger";
import { supabase } from "../../src/lib/supabase/client";
import { useThemeControl } from "../../src/lib/tamagui/theme-provider";

/**
 * Auth callback screen
 * Handles deep link authentication from magic link
 */
export default function AuthCallbackScreen() {
  const { theme } = useThemeControl();
  const iconSuccess = "#16a34a";

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Authentification en cours...");

  const handleAuthCallback = useCallback(async () => {
    try {
      // Get session (should be set by deep link handler)
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        setStatus("success");
        setMessage("Connexion réussie !");

        // Redirect to home after 1 second
        setTimeout(() => {
          router.replace("/");
        }, 1000);
      } else {
        setStatus("error");
        setMessage("Session introuvable. Veuillez réessayer.");
      }
    } catch (error) {
      logger.error("Auth callback error", error);
      setStatus("error");
      setMessage("Une erreur est survenue lors de la connexion.");
    }
  }, []);

  useEffect(() => {
    handleAuthCallback();
  }, [handleAuthCallback]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme === "light" ? "#ffffff" : "#111827",
      }}
      edges={["top"]}
    >
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        paddingHorizontal="$xl"
      >
        <YStack
          width="$6xl"
          height="$6xl"
          backgroundColor="$backgroundSecondary"
          borderRadius="$full"
          alignItems="center"
          justifyContent="center"
          marginBottom="$xl"
        >
          <Text fontSize={40}>
            {status === "loading" ? "⏳" : status === "success" ? "✅" : "❌"}
          </Text>
        </YStack>

        <Text
          fontSize={24}
          fontWeight="700"
          color="$color"
          textAlign="center"
          marginBottom="$md"
        >
          {status === "loading"
            ? "Connexion en cours..."
            : status === "success"
              ? "Bienvenue !"
              : "Erreur"}
        </Text>

        <Text
          fontSize={16}
          color="$colorSecondary"
          textAlign="center"
          marginBottom="$xl"
        >
          {message}
        </Text>

        {status === "loading" && (
          <ActivityIndicator size="large" color={iconSuccess} />
        )}
      </YStack>
    </SafeAreaView>
  );
}
