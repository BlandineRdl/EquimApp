import { AlertTriangle, X } from "lucide-react-native";
import type React from "react";
import { useState } from "react";
import { Modal, Pressable } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { Button } from "../../../../../components/Button";
import {
  getTextColor,
  SEMANTIC_COLORS,
} from "../../../../../constants/theme.constants";
import { useThemeControl } from "../../../../../lib/tamagui/theme-provider";
import { useAppDispatch } from "../../../../../store/buildReduxStore";
import { leaveGroup } from "../../../usecases/leave-group/leaveGroup.usecase";

interface LeaveGroupConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  onLeaveSuccess: () => void;
}

export const LeaveGroupConfirmModal: React.FC<LeaveGroupConfirmModalProps> = ({
  visible,
  onClose,
  groupId,
  onLeaveSuccess,
}) => {
  const dispatch = useAppDispatch();
  const { theme } = useThemeControl();
  const iconColor = getTextColor(theme);
  const iconError = SEMANTIC_COLORS.ERROR;
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await dispatch(leaveGroup({ groupId })).unwrap();
      onClose();
      onLeaveSuccess();
    } catch (_error) {
      // Error toast handled by listener
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
              Quitter le groupe ?
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
            fontSize={16}
            color="$colorSecondary"
            textAlign="center"
            marginBottom="$xl"
            lineHeight={24}
          >
            Vous allez quitter ce groupe. Vous ne pourrez plus voir les dépenses
            et devrez être réinvité pour y accéder à nouveau.
          </Text>

          {/* Actions */}
          <YStack gap="$md">
            <Button variant="error" onPress={handleConfirm} disabled={loading}>
              <Text fontSize={16} fontWeight="600" color="$white">
                {loading ? "En cours..." : "Quitter le groupe"}
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
