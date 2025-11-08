import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { YStack } from "tamagui";
import type { AppState } from "../../../../store/appState";
import { useAppDispatch } from "../../../../store/buildReduxStore";
import { acceptInvitation } from "../../usecases/invitation/acceptInvitation.usecase";
import { getInvitationDetails } from "../../usecases/invitation/getInvitationDetails.usecase";
import { ErrorState } from "../common/ErrorState.component";
import { LoadingState } from "../common/LoadingState.component";
import { InvitationActions } from "./components/InvitationActions.component";
import { InvitationCard } from "./components/InvitationCard.component";
import { InvitationHeader } from "./components/InvitationHeader.component";
import { MemberForm } from "./components/MemberForm.component";
import {
  INVITATION_BACKGROUND_COLOR,
  INVITATION_MESSAGES,
} from "./invitation.constants";

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
      Alert.alert(
        INVITATION_MESSAGES.INVALID_TOKEN.title,
        INVITATION_MESSAGES.INVALID_TOKEN.message,
      );
      router.back();
      return;
    }

    dispatch(getInvitationDetails({ token })).catch(() => {
      Alert.alert(
        INVITATION_MESSAGES.FETCH_ERROR.title,
        INVITATION_MESSAGES.FETCH_ERROR.message,
      );
      router.back();
    });
  }, [token, router, dispatch]);

  const handleAccept = async () => {
    if (!token || !memberForm.pseudo.trim() || !memberForm.monthlyIncome)
      return;

    const monthlyIncomeNumber = parseFloat(memberForm.monthlyIncome);
    if (Number.isNaN(monthlyIncomeNumber) || monthlyIncomeNumber <= 0) {
      Alert.alert(
        INVITATION_MESSAGES.INVALID_INCOME.title,
        INVITATION_MESSAGES.INVALID_INCOME.message,
      );
      return;
    }

    try {
      await dispatch(
        acceptInvitation({
          token,
          pseudo: memberForm.pseudo.trim(),
          monthlyIncome: monthlyIncomeNumber,
        }),
      ).unwrap();

      Alert.alert(
        INVITATION_MESSAGES.SUCCESS.title,
        INVITATION_MESSAGES.SUCCESS.message,
        [
          {
            text: INVITATION_MESSAGES.SUCCESS.buttonText,
            onPress: () => router.push("/home"),
          },
        ],
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Impossible d'accepter l'invitation";
      Alert.alert("Erreur", errorMessage);
    }
  };

  const handleRefuse = () => {
    Alert.alert(
      INVITATION_MESSAGES.REFUSE_CONFIRMATION.title,
      INVITATION_MESSAGES.REFUSE_CONFIRMATION.message,
      [
        {
          text: INVITATION_MESSAGES.REFUSE_CONFIRMATION.cancelText,
          style: "cancel",
        },
        {
          text: INVITATION_MESSAGES.REFUSE_CONFIRMATION.confirmText,
          style: "destructive",
          onPress: () => router.back(),
        },
      ],
    );
  };

  const handlePseudoChange = (text: string) => {
    setMemberForm((prev) => ({ ...prev, pseudo: text }));
  };

  const handleIncomeChange = (text: string) => {
    setMemberForm((prev) => ({ ...prev, monthlyIncome: text }));
  };

  const handleBack = () => {
    router.back();
  };

  const canSubmit = !!memberForm.pseudo.trim() && !!memberForm.monthlyIncome;

  if (invitationState.details.loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: INVITATION_BACKGROUND_COLOR }}
      >
        <InvitationHeader onBack={handleBack} />
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (invitationState.details.error || !invitationState.details.data) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: INVITATION_BACKGROUND_COLOR }}
      >
        <InvitationHeader onBack={handleBack} />
        <ErrorState
          message={
            invitationState.details.error?.message ||
            INVITATION_MESSAGES.NOT_FOUND
          }
        />
      </SafeAreaView>
    );
  }

  const invitationDetails = invitationState.details.data;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: INVITATION_BACKGROUND_COLOR }}
    >
      <InvitationHeader onBack={handleBack} />

      <YStack flex={1} paddingHorizontal="$xl" paddingTop="$lg">
        <InvitationCard invitationDetails={invitationDetails} />

        <MemberForm
          pseudo={memberForm.pseudo}
          monthlyIncome={memberForm.monthlyIncome}
          onPseudoChange={handlePseudoChange}
          onIncomeChange={handleIncomeChange}
        />

        <InvitationActions
          onAccept={handleAccept}
          onRefuse={handleRefuse}
          isLoading={isLoading}
          canSubmit={canSubmit}
        />
      </YStack>
    </SafeAreaView>
  );
};
