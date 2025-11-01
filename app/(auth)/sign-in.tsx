import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { ScrollView, Spinner, Text, YStack } from "tamagui";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { Input } from "../../src/components/Input";
import { RESEND_OTP_COOLDOWN_SECONDS } from "../../src/features/auth/domain/authenticate-with-email/otp.constants";
import { signInWithEmail } from "../../src/features/auth/usecases/authenticate-with-email/signInWithEmail.usecase";
import { verifyOtp } from "../../src/features/auth/usecases/authenticate-with-email/verifyOtp.usecase";
import { RateLimiter } from "../../src/lib/rateLimiter";
import { useThemeControl } from "../../src/lib/tamagui/theme-provider";
import type { AppState } from "../../src/store/appState";
import { useAppDispatch } from "../../src/store/buildReduxStore";

const rateLimiter = new RateLimiter("auth-signin", 5, 1000);

export default function SignInScreen() {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useSelector((state: AppState) => state.auth);
  const { theme } = useThemeControl();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSignIn = async () => {
    setRateLimitError(null);

    // Check rate limit
    const { allowed, retryAfter } = await rateLimiter.canAttempt();
    if (!allowed) {
      setRateLimitError(
        `Trop de tentatives. Veuillez réessayer dans ${retryAfter} secondes.`,
      );
      return;
    }

    try {
      await dispatch(signInWithEmail(email)).unwrap();
      await rateLimiter.recordSuccess();
      setEmailSent(true);
      setResendTimer(RESEND_OTP_COOLDOWN_SECONDS);
    } catch (_err) {
      await rateLimiter.recordFailure();
      // Error is handled by Redux slice and displayed in UI
    }
  };

  const handleResendCode = async () => {
    setRateLimitError(null);

    // Check rate limit
    const { allowed, retryAfter } = await rateLimiter.canAttempt();
    if (!allowed) {
      setRateLimitError(
        `Trop de tentatives. Veuillez réessayer dans ${retryAfter} secondes.`,
      );
      return;
    }

    try {
      await dispatch(signInWithEmail(email)).unwrap();
      await rateLimiter.recordSuccess();
      setOtp(""); // Clear current OTP input
      setResendTimer(RESEND_OTP_COOLDOWN_SECONDS);
    } catch (_err) {
      await rateLimiter.recordFailure();
      // Error is handled by Redux slice
    }
  };

  const handleVerifyOtp = async () => {
    await dispatch(verifyOtp({ email, token: otp }));
    // Session will be set by onAuthStateChange listener
    // NavigationGuard will handle the redirect based on profile status
  };

  const isButtonDisabled = !email.trim() || isLoading;
  const isOtpButtonDisabled = otp.length !== 6 || isLoading;

  // Success state: email sent - show OTP input
  if (emailSent) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme === "light" ? "#ffffff" : "#111827",
        }}
        edges={["top"]}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <YStack flex={1} backgroundColor="$background">
            <ScrollView
              flex={1}
              showsVerticalScrollIndicator={false}
              paddingHorizontal="$xl"
            >
              {/* Header */}
              <YStack
                alignItems="center"
                gap="$md"
                marginTop="$4xl"
                marginBottom="$3xl"
              >
                <YStack
                  width="$5xl"
                  height="$5xl"
                  backgroundColor="$success100"
                  borderRadius="$full"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize={32}>🔐</Text>
                </YStack>

                <Text
                  fontSize={24}
                  fontWeight="700"
                  color="$color"
                  textAlign="center"
                >
                  Entrez le code
                </Text>
                <Text fontSize={16} color="$colorSecondary" textAlign="center">
                  Nous avons envoyé un code à 6 chiffres à{" "}
                  <Text fontWeight="600" color="$color">
                    {email}
                  </Text>
                </Text>
              </YStack>

              {/* Form */}
              <YStack gap="$sm">
                <Text fontSize={16} fontWeight="600" color="$gray700">
                  Code de vérification
                </Text>
                <Input
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="000000"
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />

                {error && (
                  <Text fontSize={14} color="#ef4444">
                    {error}
                  </Text>
                )}

                <Card backgroundColor="$backgroundSecondary" marginTop="$lg">
                  <YStack gap="$sm">
                    <Text fontSize={14} fontWeight="600" color="$gray700">
                      💡 Code non reçu ?
                    </Text>
                    <Text fontSize={14} color="$colorSecondary" lineHeight={20}>
                      Vérifiez vos spams ou attendez quelques secondes. Le code
                      expire après 5 minutes.
                    </Text>
                    <Button
                      variant={resendTimer > 0 ? "secondary" : "primary"}
                      onPress={handleResendCode}
                      disabled={resendTimer > 0 || isLoading}
                      marginTop="$sm"
                    >
                      {resendTimer > 0
                        ? `Renvoyer le code (${resendTimer}s)`
                        : "Renvoyer le code"}
                    </Button>
                  </YStack>
                </Card>
              </YStack>
            </ScrollView>

            {/* Actions - Sticky at bottom */}
            <YStack
              gap="$md"
              paddingHorizontal="$xl"
              paddingTop="$lg"
              paddingBottom="$base"
            >
              <Button
                variant="primary"
                onPress={handleVerifyOtp}
                disabled={isOtpButtonDisabled}
              >
                {isLoading ? <Spinner color="#ffffff" /> : "Vérifier"}
              </Button>

              <Button
                variant="secondary"
                onPress={() => {
                  setEmailSent(false);
                  setOtp("");
                  setResendTimer(0);
                }}
              >
                ← Modifier l'email
              </Button>
            </YStack>
          </YStack>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Sign in form
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme === "light" ? "#ffffff" : "#111827",
      }}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <YStack flex={1} backgroundColor="$background">
          <ScrollView
            flex={1}
            showsVerticalScrollIndicator={false}
            paddingHorizontal="$xl"
          >
            {/* Header */}
            <YStack
              alignItems="center"
              gap="$md"
              marginTop="$4xl"
              marginBottom="$3xl"
            >
              <YStack
                width="$5xl"
                height="$5xl"
                backgroundColor="$success100"
                borderRadius="$full"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize={32}>🌱</Text>
              </YStack>

              <Text
                fontSize={24}
                fontWeight="700"
                color="$color"
                textAlign="center"
              >
                Bienvenue sur Equim
              </Text>
              <Text
                fontSize={16}
                color="$colorSecondary"
                textAlign="center"
                lineHeight={24}
                paddingHorizontal="$sm"
              >
                Partagez équitablement vos dépenses en fonction de vos revenus
              </Text>
            </YStack>

            {/* Form */}
            <YStack gap="$sm">
              <Text fontSize={16} fontWeight="600" color="$gray700">
                Adresse email
              </Text>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="vous@exemple.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                error={!!error}
              />

              {error && (
                <Text fontSize={14} color="#ef4444">
                  {error}
                </Text>
              )}
              {rateLimitError && (
                <Text fontSize={14} color="#ef4444">
                  {rateLimitError}
                </Text>
              )}

              {/* Info box */}
              <Card backgroundColor="$backgroundSecondary" marginTop="$lg">
                <YStack gap="$xs">
                  <Text fontSize={14} fontWeight="600" color="$gray700">
                    🔒 Connexion sécurisée
                  </Text>
                  <Text fontSize={14} color="$colorSecondary" lineHeight={20}>
                    Pas de mot de passe à retenir ! Nous vous enverrons un code
                    à 6 chiffres pour vous connecter en toute sécurité.
                  </Text>
                </YStack>
              </Card>
            </YStack>
          </ScrollView>

          {/* Actions - Sticky at bottom */}
          <YStack
            gap="$md"
            paddingHorizontal="$xl"
            paddingTop="$lg"
            paddingBottom="$base"
          >
            <Button
              variant="primary"
              onPress={handleSignIn}
              disabled={isButtonDisabled}
            >
              {isLoading ? <Spinner color="#ffffff" /> : "Continuer →"}
            </Button>

            <Text
              fontSize={14}
              color="$colorTertiary"
              textAlign="center"
              lineHeight={18}
            >
              En continuant, vous acceptez nos conditions d'utilisation et notre
              politique de confidentialité.
            </Text>
          </YStack>
        </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
