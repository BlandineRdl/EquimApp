import { StyleSheet, Text, View } from "react-native";

interface LoadingStateProps {
  message?: string;
}

export const LoadingState = ({
  message = "Chargement...",
}: LoadingStateProps) => {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
});
