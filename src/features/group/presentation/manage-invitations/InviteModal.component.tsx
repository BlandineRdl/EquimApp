import { Copy, Share, UserPlus, X } from "lucide-react-native";
import React from "react";
import { Clipboard, Modal, Pressable, Share as ShareAPI } from "react-native";
import Toast from "react-native-toast-message";
import { useSelector } from "react-redux";
import { Text, useTheme, XStack, YStack } from "tamagui";
import { Button } from "../../../../components/Button";
import { Input } from "../../../../components/Input";
import { useAppDispatch } from "../../../../store/buildReduxStore";
import { generateInviteLink } from "../../usecases/invitation/generateInviteLink.usecase";
import {
  selectGeneratedInviteLink,
  selectInviteLinkError,
  selectInviteLinkLoading,
} from "./selectInvitation.selector";

export interface InviteModalProps {
  isVisible: boolean;
  onClose: () => void;
  groupId?: string;
  groupName?: string;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isVisible,
  onClose,
  groupId,
  groupName = "Foyer",
}) => {
  const dispatch = useAppDispatch();
  const theme = useTheme();

  const inviteLink = useSelector(selectGeneratedInviteLink);
  const isLoading = useSelector(selectInviteLinkLoading);
  const error = useSelector(selectInviteLinkError);

  const handleCopyLink = async () => {
    if (!inviteLink) {
      Toast.show({
        type: "error",
        text1: "Aucun lien généré",
      });
      return;
    }

    try {
      await Clipboard.setString(inviteLink);
      // Success: show toast directly (clipboard is not a Redux action)
      Toast.show({
        type: "success",
        text1: "Lien copié !",
        text2: "Collez-le dans WhatsApp ou SMS",
      });
    } catch (_error) {
      // Clipboard error: show toast directly (not a Redux action)
      Toast.show({
        type: "error",
        text1: "Impossible de copier",
      });
    }
  };

  const handleShareLink = async () => {
    if (!inviteLink) {
      Toast.show({
        type: "error",
        text1: "Aucun lien généré",
      });
      return;
    }

    const message =
      `🎉 Rejoins mon groupe "${groupName}" sur EquimApp !\n\n` +
      `👉 Clique ici pour accepter l'invitation :\n${inviteLink}\n\n` +
      `📱 Si le lien ne fonctionne pas :\n` +
      `1. Télécharge EquimApp sur ton app store\n` +
      `2. Ouvre l'app et utilise ce lien pour rejoindre le groupe`;

    try {
      await ShareAPI.share({
        message: message,
        title: `Invitation au groupe ${groupName}`,
      });
    } catch (_error) {
      // Share API error: show toast directly (not a Redux action)
      Toast.show({
        type: "error",
        text1: "Impossible de partager",
      });
    }
  };

  const handleModalOpen = React.useCallback(async () => {
    if (groupId) {
      try {
        await dispatch(generateInviteLink({ groupId })).unwrap();
        // Success toast handled by listener
      } catch (_error) {
        // Error toast handled by listener
      }
    }
  }, [dispatch, groupId]);

  React.useEffect(() => {
    if (isVisible && groupId) {
      handleModalOpen();
    }
  }, [isVisible, groupId, handleModalOpen]);

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <YStack
        flex={1}
        backgroundColor="rgba(0, 0, 0, 0.5)"
        justifyContent="center"
        alignItems="center"
        padding="$lg"
      >
        <YStack
          width="100%"
          maxWidth={400}
          backgroundColor="$background"
          borderRadius="$xl"
          padding="$lg"
        >
          {/* Header de la modal */}
          <XStack alignItems="center" marginBottom="$lg">
            <YStack
              width="$3xl"
              height="$3xl"
              borderRadius="$base"
              backgroundColor="$primary100"
              justifyContent="center"
              alignItems="center"
              marginRight="$md"
            >
              <UserPlus size={20} color={theme.primary600.val} />
            </YStack>
            <Text flex={1} fontSize={18} fontWeight="600" color="$color">
              Inviter au groupe {groupName}
            </Text>
            <Pressable onPress={onClose} style={{ padding: 4 }}>
              <X size={20} color={theme.colorSecondary.val} />
            </Pressable>
          </XStack>

          {/* Lien d'invitation */}
          <YStack marginBottom="$lg">
            <Text
              fontSize={14}
              fontWeight="500"
              color="$gray700"
              marginBottom="$md"
            >
              Lien d'invitation
            </Text>
            {isLoading ? (
              <YStack
                padding="$base"
                alignItems="center"
                backgroundColor="$backgroundSecondary"
                borderRadius="$base"
                borderWidth={1}
                borderColor="$borderColor"
              >
                <Text fontSize={14} color="$colorSecondary">
                  Génération du lien...
                </Text>
              </YStack>
            ) : error ? (
              <YStack
                padding="$base"
                alignItems="center"
                backgroundColor="$errorBackground"
                borderRadius="$base"
                borderWidth={1}
                borderColor="$error"
              >
                <Text fontSize={14} color="$error">
                  {error}
                </Text>
              </YStack>
            ) : inviteLink ? (
              <XStack
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$base"
                overflow="hidden"
              >
                <Input
                  flex={1}
                  value={inviteLink}
                  editable={false}
                  selectTextOnFocus={true}
                  borderWidth={0}
                  borderRadius={0}
                />
                <Pressable onPress={handleCopyLink}>
                  <XStack
                    alignItems="center"
                    backgroundColor="$background"
                    paddingHorizontal="$md"
                    paddingVertical="$md"
                    borderLeftWidth={1}
                    borderLeftColor="$borderColor"
                  >
                    <Copy size={16} color={theme.colorSecondary.val} />
                    <Text
                      fontSize={14}
                      color="$colorSecondary"
                      marginLeft="$1"
                      fontWeight="500"
                    >
                      Copier
                    </Text>
                  </XStack>
                </Pressable>
              </XStack>
            ) : (
              <YStack
                padding="$base"
                alignItems="center"
                backgroundColor="$errorBackground"
                borderRadius="$base"
                borderWidth={1}
                borderColor="$error"
              >
                <Text fontSize={14} color="$error">
                  Aucun lien généré
                </Text>
              </YStack>
            )}
          </YStack>

          {/* Boutons d'action */}
          <Button
            variant="primary"
            onPress={handleShareLink}
            disabled={!inviteLink || isLoading}
            marginBottom="$md"
          >
            <XStack alignItems="center" gap="$md">
              <Share size={16} color={theme.white.val} />
              <Text fontSize={16} fontWeight="600" color="$white">
                Partager le lien
              </Text>
            </XStack>
          </Button>

          <Button variant="secondary" onPress={onClose}>
            <Text fontSize={16} fontWeight="500" color="$colorSecondary">
              Fermer
            </Text>
          </Button>
        </YStack>
      </YStack>
    </Modal>
  );
};
