import { AlertTriangle, X } from "lucide-react-native";
import type React from "react";
import { useState } from "react";
import { Modal, Pressable } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { Button } from "../../../../components/Button";
import {
  getTextColor,
  SEMANTIC_COLORS,
} from "../../../../constants/theme.constants";
import { useThemeControl } from "../../../../lib/tamagui/theme-provider";
import { useAppDispatch } from "../../../../store/buildReduxStore";
import { removeMemberFromGroup } from "../../usecases/remove-member/removeMember.usecase";

interface RemoveMemberConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  memberId: string;
  memberPseudo: string;
  groupId: string;
}

export const RemoveMemberConfirmModal: React.FC<
  RemoveMemberConfirmModalProps
> = ({ visible, onClose, memberId, memberPseudo, groupId }) => {
  const dispatch = useAppDispatch();
  const { theme } = useThemeControl();
  const iconColor = getTextColor(theme);
  const iconError = SEMANTIC_COLORS.ERROR;
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await dispatch(
        removeMemberFromGroup({
          groupId,
          memberId,
        }),
      ).unwrap();
      // Success toast handled by listener
      onClose();
    } catch (_error) {
      // Error toast handled by listener
      // Keep modal open on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
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
          padding="$xl"
        >
          {/* Header */}
          <XStack
            justifyContent="space-between"
            alignItems="center"
            marginBottom="$lg"
          >
            <Text fontSize={18} fontWeight="600" color="$color">
              Retirer ce membre ?
            </Text>
            <Pressable onPress={onClose} style={{ padding: 4 }}>
              <X size={20} color={iconColor} />
            </Pressable>
          </XStack>

          {/* Icon */}
          <YStack alignItems="center" marginBottom="$lg">
            <AlertTriangle size={64} color={iconError} />
          </YStack>

          {/* Content */}
          <Text
            fontSize={18}
            fontWeight="600"
            color="$color"
            textAlign="center"
            marginBottom="$md"
          >
            Retirer {memberPseudo} ?
          </Text>
          <Text
            fontSize={16}
            color="$colorSecondary"
            textAlign="center"
            marginBottom="$xl"
            lineHeight={24}
          >
            Ce membre sera retiré du groupe. Les quotes-parts seront recalculées
            automatiquement.
          </Text>

          {/* Actions */}
          <YStack gap="$md">
            <Button variant="error" onPress={handleConfirm} disabled={loading}>
              <Text fontSize={16} fontWeight="600" color="$white">
                {loading ? "Suppression..." : "Retirer du groupe"}
              </Text>
            </Button>

            <Button variant="secondary" onPress={onClose} disabled={loading}>
              <Text fontSize={16} fontWeight="600" color="$colorSecondary">
                Annuler
              </Text>
            </Button>
          </YStack>
        </YStack>
      </YStack>
    </Modal>
  );
};
