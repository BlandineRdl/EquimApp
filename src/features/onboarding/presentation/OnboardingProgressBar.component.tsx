import { usePathname } from "expo-router";
import type React from "react";
import { useSelector } from "react-redux";
import { YStack } from "tamagui";
import { selectOnboardingProgressByRoute } from "./onboarding.selectors";

export const OnboardingProgressBar: React.FC = () => {
  const pathname = usePathname();
  const { progressPercentage } = useSelector((state) =>
    selectOnboardingProgressByRoute(state, pathname),
  );

  return (
    <YStack paddingTop="$base" paddingBottom="$xl">
      <YStack
        height="$1"
        backgroundColor="$gray700"
        borderRadius={2}
        overflow="hidden"
      >
        <YStack
          height="100%"
          width={`${progressPercentage}%`}
          backgroundColor="$success"
          borderRadius={2}
        />
      </YStack>
    </YStack>
  );
};
