import { UserPlus, Users } from "lucide-react-native";
import { Modal, Pressable } from "react-native";
import { Text, useTheme, XStack, YStack } from "tamagui";
import { Button } from "../../../../components/Button";

interface MemberTypeChoiceModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectInvite: () => void;
  onSelectPhantom: () => void;
}

export const MemberTypeChoiceModal = ({
  visible,
  onClose,
  onSelectInvite,
  onSelectPhantom,
}: MemberTypeChoiceModalProps) => {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={onClose}
      >
        <YStack width="85%" maxWidth={400}>
          <Pressable>
            <YStack
              backgroundColor="$background"
              borderRadius="$xl"
              padding="$lg"
            >
              <Text
                fontSize={18}
                fontWeight="600"
                color="$color"
                marginBottom="$md"
                textAlign="center"
              >
                Ajouter un membre
              </Text>
              <Text
                fontSize={14}
                color="$colorSecondary"
                marginBottom="$lg"
                textAlign="center"
              >
                Choisissez comment ajouter un membre au groupe
              </Text>

              {}
              <Pressable onPress={onSelectInvite}>
                <XStack
                  alignItems="center"
                  padding="$base"
                  backgroundColor="$backgroundSecondary"
                  borderRadius="$md"
                  marginBottom="$md"
                  borderWidth={1.5}
                  borderColor="$borderColor"
                >
                  <YStack
                    width="$4xl"
                    height="$4xl"
                    borderRadius="$md"
                    backgroundColor="$primary100"
                    justifyContent="center"
                    alignItems="center"
                    marginRight="$base"
                  >
                    <UserPlus size={24} color={theme.primary600.val} />
                  </YStack>
                  <YStack flex={1}>
                    <Text
                      fontSize={16}
                      fontWeight="600"
                      color="$color"
                      marginBottom="$1"
                    >
                      Inviter un membre
                    </Text>
                    <Text fontSize={13} color="$colorSecondary">
                      Envoyer un lien d'invitation
                    </Text>
                  </YStack>
                </XStack>
              </Pressable>

              {}
              <Pressable onPress={onSelectPhantom}>
                <XStack
                  alignItems="center"
                  padding="$base"
                  backgroundColor="$backgroundSecondary"
                  borderRadius="$md"
                  marginBottom="$md"
                  borderWidth={1.5}
                  borderColor="$borderColor"
                >
                  <YStack
                    width="$4xl"
                    height="$4xl"
                    borderRadius="$md"
                    backgroundColor="$purple100"
                    justifyContent="center"
                    alignItems="center"
                    marginRight="$base"
                  >
                    <Users size={24} color={theme.purple500.val} />
                  </YStack>
                  <YStack flex={1}>
                    <Text
                      fontSize={16}
                      fontWeight="600"
                      color="$color"
                      marginBottom="$1"
                    >
                      Membre fantôme
                    </Text>
                    <Text fontSize={13} color="$colorSecondary">
                      Créer un membre sans compte
                    </Text>
                  </YStack>
                </XStack>
              </Pressable>

              {}
              <Button variant="secondary" onPress={onClose} marginTop="$md">
                <Text fontSize={16} fontWeight="600" color="$colorSecondary">
                  Annuler
                </Text>
              </Button>
            </YStack>
          </Pressable>
        </YStack>
      </Pressable>
    </Modal>
  );
};
