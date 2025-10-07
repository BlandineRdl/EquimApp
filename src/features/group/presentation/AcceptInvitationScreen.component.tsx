import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, SafeAreaView, StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import type { AppState } from "../../../store/appState";
import { useAppDispatch } from "../../../store/buildReduxStore";
import { ErrorState } from "./components/ErrorState.component";
import { InvitationActions } from "./components/InvitationActions.component";
import { InvitationCard } from "./components/InvitationCard.component";
import { InvitationHeader } from "./components/InvitationHeader.component";
import { LoadingState } from "./components/LoadingState.component";
import { MemberForm } from "./components/MemberForm.component";
import { acceptInvitation } from "../usecases/invitation/acceptInvitation.usecase";
import { getInvitationDetails } from "../usecases/invitation/getInvitationDetails.usecase";
import { refuseInvitation } from "../usecases/invitation/refuseInvitation.usecase";

export const AcceptInvitationScreen = () => {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [memberForm, setMemberForm] = useState({
    pseudo: "",
    monthlyIncome: "",
  });

  const invitationState = useSelector(
    (state: AppState) => state.groups.invitation,
  );
  const isLoading = useSelector((state: AppState) => state.groups.loading);

  useEffect(() => {
    if (!token) {
      Alert.alert("Erreur", "Lien d'invitation invalide");
      router.back();
      return;
    }

    dispatch(getInvitationDetails({ token })).catch(() => {
      Alert.alert(
        "Erreur",
        "Impossible de récupérer les détails de l'invitation",
      );
      router.back();
    });
  }, [token, router, dispatch]);

  const handleAccept = async () => {
    if (!token || !memberForm.pseudo.trim() || !memberForm.monthlyIncome)
      return;

    const monthlyIncomeNumber = parseFloat(memberForm.monthlyIncome);
    if (Number.isNaN(monthlyIncomeNumber) || monthlyIncomeNumber <= 0) {
      Alert.alert("Erreur", "Veuillez saisir un revenu mensuel valide");
      return;
    }

    try {
      await dispatch(
        acceptInvitation({
          token,
          memberData: {
            pseudo: memberForm.pseudo.trim(),
            monthlyIncome: monthlyIncomeNumber,
          },
        }),
      ).unwrap();

      Alert.alert("Succès", "Vous avez rejoint le groupe avec succès !", [
        { text: "OK", onPress: () => router.push("/home") },
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Impossible d'accepter l'invitation";
      Alert.alert("Erreur", errorMessage);
    }
  };

  const handleRefuse = async () => {
    if (!token) return;

    try {
      await dispatch(refuseInvitation({ token })).unwrap();
      Alert.alert("Invitation refusée", "Vous avez refusé l'invitation", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Impossible de refuser l'invitation";
      Alert.alert("Erreur", errorMessage);
    }
  };

  const canSubmit = !!memberForm.pseudo.trim() && !!memberForm.monthlyIncome;

  if (invitationState.details.loading) {
    return (
      <SafeAreaView style={styles.container}>
        <InvitationHeader onBack={() => router.back()} />
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (invitationState.details.error || !invitationState.details.data) {
    return (
      <SafeAreaView style={styles.container}>
        <InvitationHeader onBack={() => router.back()} />
        <ErrorState
          message={invitationState.details.error || "Invitation introuvable"}
        />
      </SafeAreaView>
    );
  }

  const invitationDetails = invitationState.details.data;

  return (
    <SafeAreaView style={styles.container}>
      <InvitationHeader onBack={() => router.back()} />

      <View style={styles.content}>
        <InvitationCard invitationDetails={invitationDetails} />

        <MemberForm
          pseudo={memberForm.pseudo}
          monthlyIncome={memberForm.monthlyIncome}
          onPseudoChange={(text) =>
            setMemberForm((prev) => ({ ...prev, pseudo: text }))
          }
          onIncomeChange={(text) =>
            setMemberForm((prev) => ({ ...prev, monthlyIncome: text }))
          }
        />

        <InvitationActions
          onAccept={handleAccept}
          onRefuse={handleRefuse}
          isLoading={isLoading}
          canSubmit={canSubmit}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
});
