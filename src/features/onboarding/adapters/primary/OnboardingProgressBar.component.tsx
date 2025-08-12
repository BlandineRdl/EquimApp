import { usePathname } from "expo-router";
import type React from "react";
import { StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import { selectOnboardingProgressByRoute } from "./onboarding.selectors";

export const OnboardingProgressBar: React.FC = () => {
  const pathname = usePathname();
  const { progressPercentage } = useSelector((state) =>
    selectOnboardingProgressByRoute(state, pathname),
  );

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View
          style={[styles.progressFill, { width: `${progressPercentage}%` }]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  progressContainer: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#f3f4f6",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 2,
  },
});
