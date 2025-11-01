import { X } from "lucide-react-native";
import type React from "react";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { useSelector } from "react-redux";
import { Text, useTheme, XStack, YStack } from "tamagui";
import { Button } from "../../../../components/Button";
import { Input } from "../../../../components/Input";
import type { AppState } from "../../../../store/appState";
import { useAppDispatch } from "../../../../store/buildReduxStore";
import { acceptInvitation } from "../../usecases/invitation/acceptInvitation.usecase";
import { loadUserGroups } from "../../usecases/load-groups/loadGroups.usecase";

export interface JoinGroupModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess: (groupId: string) => void;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  isVisible,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const profile = useSelector((state: AppState) => state.user.profile);
  const theme = useTheme();

  const [inviteLink, setInviteLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!inviteLink.trim() || !profile) return;

    setIsLoading(true);
    setError(null);

    try {
      // Extract token from link (equimapp://invite/TOKEN)
      const token = inviteLink.trim().split("/").pop();

      if (!token) {
        setError("Lien d'invitation invalide");
        setIsLoading(false);
        return;
      }

      // Accept invitation
      const result = await dispatch(
        acceptInvitation({
          token,
          pseudo: profile.pseudo,
          monthlyIncome: profile.monthlyIncome,
        }),
      ).unwrap();

      // Reload groups
      await dispatch(loadUserGroups()).unwrap();

      // Reset and close
      setInviteLink("");
      setError(null);
      onSuccess(result.groupId);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'acceptation de l'invitation",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setInviteLink("");
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <YStack
          flex={1}
          backgroundColor="rgba(0, 0, 0, 0.5)"
          justifyContent="center"
          alignItems="center"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <YStack
              width="90%"
              maxWidth={400}
              backgroundColor="$background"
              borderRadius="$xl"
              padding="$lg"
            >
              <XStack
                justifyContent="space-between"
                alignItems="center"
                marginBottom="$lg"
              >
                <Text fontSize={18} fontWeight="600" color="$color">
                  Rejoindre un groupe
                </Text>
                <Button
                  variant="secondary"
                  width="$2xl"
                  height="$2xl"
                  padding={0}
                  borderRadius="$base"
                  onPress={handleClose}
                >
                  <X size={24} color={theme.colorSecondary.val} />
                </Button>
              </XStack>

              <Text
                fontSize={14}
                fontWeight="500"
                color="$gray700"
                marginBottom="$md"
              >
                Lien d'invitation
              </Text>
              <Input
                placeholder="equimapp://invite/..."
                value={inviteLink}
                onChangeText={(text) => {
                  setInviteLink(text);
                  setError(null); // Clear error on input change
                }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                editable={!isLoading}
                error={!!error}
                marginBottom="$md"
              />

              {error && (
                <YStack
                  backgroundColor="$errorBackground"
                  borderLeftWidth={3}
                  borderLeftColor="$error"
                  borderRadius="$base"
                  padding="$md"
                  marginBottom="$md"
                >
                  <Text fontSize={13} color="$error" lineHeight={18}>
                    {error}
                  </Text>
                </YStack>
              )}

              <YStack
                backgroundColor="$backgroundSecondary"
                borderRadius="$base"
                padding="$md"
                marginBottom="$lg"
              >
                <Text fontSize={13} color="$colorSecondary" lineHeight={18}>
                  💡 Collez le lien d'invitation que vous avez reçu pour
                  rejoindre un groupe existant. Vous souhaitez rejoindre le
                  groupe d'un.e ami.e ? demandez-lui de passer par la fonction
                  "Inviter" depuis son application Equim et de vous envoyer le
                  lien d'ajout à son groupe.
                </Text>
              </YStack>

              <Button
                variant="primary"
                onPress={handleJoin}
                disabled={!inviteLink.trim() || isLoading}
                marginBottom="$md"
              >
                {isLoading ? (
                  <ActivityIndicator color={theme.white.val} />
                ) : (
                  <Text fontSize={16} fontWeight="600" color="$white">
                    Rejoindre
                  </Text>
                )}
              </Button>

              <Button
                variant="secondary"
                onPress={handleClose}
                disabled={isLoading}
              >
                <Text fontSize={16} fontWeight="600" color="$gray700">
                  Annuler
                </Text>
              </Button>
            </YStack>
          </TouchableWithoutFeedback>
        </YStack>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
