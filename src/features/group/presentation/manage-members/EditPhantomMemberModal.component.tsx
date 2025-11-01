import { X } from "lucide-react-native";
import type React from "react";
import { useState } from "react";
import { Modal, Pressable } from "react-native";
import Toast from "react-native-toast-message";
import { Text, XStack, YStack } from "tamagui";
import { Button } from "../../../../components/Button";
import { Input } from "../../../../components/Input";
import { useThemeControl } from "../../../../lib/tamagui/theme-provider";
import { useAppDispatch } from "../../../../store/buildReduxStore";
import type { GroupMember } from "../../ports/GroupGateway";
import { updatePhantomMember } from "../../usecases/update-phantom-member/updatePhantomMember.usecase";

interface EditPhantomMemberModalProps {
  visible: boolean;
  onClose: () => void;
  member: GroupMember;
  groupId: string;
}

export const EditPhantomMemberModal: React.FC<EditPhantomMemberModalProps> = ({
  visible,
  onClose,
  member,
  groupId,
}) => {
  const dispatch = useAppDispatch();
  const { theme } = useThemeControl();
  const iconSecondary = theme === "light" ? "#6b7280" : "#9ca3af";

  // Extract suffix after "Membre-"
  const initialSuffix = member.pseudo.startsWith("Membre-")
    ? member.pseudo.substring(7)
    : member.pseudo;

  const [suffix, setSuffix] = useState(initialSuffix);
  const [income, setIncome] = useState(
    member.incomeOrWeight?.toString() || "0",
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const newPseudo = `Membre-${suffix.trim()}`;
    const newIncome = parseFloat(income);

    if (suffix.trim().length < 1) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Le pseudo ne peut pas être vide",
      });
      return;
    }

    if (Number.isNaN(newIncome) || newIncome < 0) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Le revenu doit être un nombre positif",
      });
      return;
    }

    try {
      setLoading(true);
      await dispatch(
        updatePhantomMember({
          memberId: member.id,
          groupId,
          newPseudo,
          newIncome,
        }),
      ).unwrap();

      onClose();
    } catch (_error) {
      // Error toast handled by listener
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
          padding="$lg"
        >
          {/* Header */}
          <XStack
            justifyContent="space-between"
            alignItems="center"
            marginBottom="$lg"
          >
            <Text fontSize={18} fontWeight="600" color="$color">
              Modifier le membre
            </Text>
            <Pressable onPress={onClose} style={{ padding: 4 }}>
              <X size={20} color={iconSecondary} />
            </Pressable>
          </XStack>

          {/* Pseudo */}
          <YStack marginBottom="$lg">
            <Text
              fontSize={14}
              fontWeight="500"
              color="$gray700"
              marginBottom="$md"
            >
              Pseudo
            </Text>
            <XStack
              alignItems="center"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$base"
              paddingHorizontal="$md"
            >
              <Text fontSize={16} color="$colorSecondary" marginRight="$1">
                Membre-
              </Text>
              <Input
                flex={1}
                value={suffix}
                onChangeText={setSuffix}
                placeholder="Bob"
                maxLength={50}
                borderWidth={0}
                height="$4xl"
                paddingHorizontal={0}
              />
            </XStack>
            <Text fontSize={12} color="$colorSecondary" marginTop="$1">
              Lettres, chiffres, tirets et espaces uniquement (max 50 car.)
            </Text>
          </YStack>

          {/* Revenu */}
          <YStack marginBottom="$lg">
            <Text
              fontSize={14}
              fontWeight="500"
              color="$gray700"
              marginBottom="$md"
            >
              Revenu mensuel
            </Text>
            <Input
              value={income}
              onChangeText={setIncome}
              keyboardType="numeric"
              placeholder="0"
            />
          </YStack>

          {/* Actions */}
          <XStack gap="$md">
            <Button variant="secondary" flex={1} onPress={onClose}>
              <Text fontSize={16} fontWeight="600" color="$colorSecondary">
                Annuler
              </Text>
            </Button>

            <Button
              variant="primary"
              flex={1}
              onPress={handleSave}
              disabled={loading}
            >
              <Text fontSize={16} fontWeight="600" color="$white">
                {loading ? "Enregistrement..." : "Sauvegarder"}
              </Text>
            </Button>
          </XStack>
        </YStack>
      </YStack>
    </Modal>
  );
};
