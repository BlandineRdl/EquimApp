import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, useTheme, YStack } from "tamagui";

/**
 * Splash screen shown during app initialization
 */
export function SplashScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.white.val }}>
      <YStack flex={1} alignItems="center" justifyContent="center">
        <YStack
          width="$6xl"
          height="$6xl"
          backgroundColor="$success100"
          borderRadius={40}
          alignItems="center"
          justifyContent="center"
          marginBottom="$xl"
        >
          <Text fontSize={40}>🌱</Text>
        </YStack>
        <Text
          fontSize={32}
          fontWeight="700"
          color="$gray900"
          marginBottom="$2xl"
        >
          Equim
        </Text>
        <ActivityIndicator
          size="large"
          color={theme.success600.val}
          style={{ marginTop: 16 }}
        />
      </YStack>
    </SafeAreaView>
  );
}
