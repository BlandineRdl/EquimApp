import { router } from "expo-router";
import { Users } from "lucide-react-native";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OnboardingProgressBar } from "../../../src/features/onboarding/presentation/OnboardingProgressBar.component";
import { setSkipGroupCreation } from "../../../src/features/onboarding/store/onboarding.slice";
import { useAppDispatch } from "../../../src/store/buildReduxStore";

export default function GroupChoiceScreen() {
  const dispatch = useAppDispatch();

  const handleCreateGroup = () => {
    dispatch(setSkipGroupCreation(false));
    router.push("/onboarding/create-group");
  };

  const handleSkipGroup = () => {
    dispatch(setSkipGroupCreation(true));
    router.push("/onboarding/summary");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <OnboardingProgressBar />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Users size={48} color="#10b981" />
          </View>
          <Text style={styles.title}>Créer un groupe ?</Text>
          <Text style={styles.subtitle}>
            Les groupes vous permettent de partager des dépenses avec d'autres
            personnes (foyer, colocation, vacances...)
          </Text>
        </View>

        {/* Options */}
        <View style={styles.options}>
          {/* Create Group Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={handleCreateGroup}
          >
            <View style={styles.optionHeader}>
              <Text style={styles.optionTitle}>Créer un groupe</Text>
              <Text style={styles.optionBadge}>Recommandé</Text>
            </View>
            <Text style={styles.optionDescription}>
              Partagez vos dépenses équitablement selon les revenus de chacun.
              Idéal pour les couples, colocations ou projets communs.
            </Text>
            <View style={styles.optionFeatures}>
              <Text style={styles.featureItem}>
                ✓ Calcul automatique des parts
              </Text>
              <Text style={styles.featureItem}>✓ Invitations par lien</Text>
              <Text style={styles.featureItem}>
                ✓ Ajustement selon les revenus
              </Text>
            </View>
          </TouchableOpacity>

          {/* Skip Option */}
          <TouchableOpacity
            style={styles.optionCardSecondary}
            onPress={handleSkipGroup}
          >
            <View style={styles.optionHeader}>
              <Text style={styles.optionTitleSecondary}>
                Continuer sans groupe
              </Text>
            </View>
            <Text style={styles.optionDescriptionSecondary}>
              Vous pourrez créer un groupe plus tard depuis l'application si
              vous en avez besoin.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 Bon à savoir</Text>
          <Text style={styles.infoText}>
            Vous pouvez créer plusieurs groupes et gérer différentes catégories
            de dépenses partagées (foyer, vacances, projets...).
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
  },
  options: {
    flex: 1,
    gap: 16,
  },
  optionCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: "#10b981",
  },
  optionCardSecondary: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  optionTitleSecondary: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  optionBadge: {
    backgroundColor: "#10b981",
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  optionDescription: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 16,
  },
  optionDescriptionSecondary: {
    fontSize: 15,
    color: "#6b7280",
    lineHeight: 22,
  },
  optionFeatures: {
    gap: 8,
  },
  featureItem: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "500",
  },
  infoBox: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
});
