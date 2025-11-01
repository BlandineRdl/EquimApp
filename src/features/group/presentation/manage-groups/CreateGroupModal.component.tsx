import { Users, X } from "lucide-react-native";
import type React from "react";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
} from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { Button } from "../../../../components/Button";
import { Input } from "../../../../components/Input";
import { useThemeControl } from "../../../../lib/tamagui/theme-provider";
import { useAppDispatch } from "../../../../store/buildReduxStore";
import { SUGGESTED_GROUP_NAMES } from "../../domain/manage-group/group.constants";
import { createGroup } from "../../usecases/create-group/createGroup.usecase";
import { loadUserGroups } from "../../usecases/load-groups/loadGroups.usecase";

export interface CreateGroupModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess?: (groupId: string) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isVisible,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const { theme } = useThemeControl();
  const _iconColor = theme === "light" ? "#111827" : "#ffffff";
  const iconSecondary = theme === "light" ? "#6b7280" : "#9ca3af";
  const iconPrimary = "#0284c7";

  const [groupName, setGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!isVisible) {
      setGroupName("");
    }
  }, [isVisible]);

  const handleCreate = async () => {
    const trimmedName = groupName.trim();

    if (!trimmedName) {
      Alert.alert("Erreur", "Veuillez entrer un nom de groupe");
      return;
    }

    if (trimmedName.length < 2) {
      Alert.alert("Erreur", "Le nom doit contenir au moins 2 caractères");
      return;
    }

    setIsCreating(true);

    try {
      const result = await dispatch(
        createGroup({ name: trimmedName }),
      ).unwrap();

      // Reload groups to include the new one
      await dispatch(loadUserGroups());

      onClose();

      if (onSuccess) {
        onSuccess(result.groupId);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Impossible de créer le groupe";
      Alert.alert("Erreur", errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const suggestedNames = SUGGESTED_GROUP_NAMES;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <YStack
          width="100%"
          maxWidth={400}
          backgroundColor="$background"
          borderRadius="$xl"
          padding="$lg"
        >
          {/* Header */}
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
              <Users size={24} color={iconPrimary} />
            </YStack>
            <Text flex={1} fontSize={18} fontWeight="600" color="$color">
              Créer un groupe
            </Text>
            <Pressable
              onPress={onClose}
              disabled={isCreating}
              style={{ padding: 4 }}
            >
              <X size={20} color={iconSecondary} />
            </Pressable>
          </XStack>

          {/* Form */}
          <YStack marginBottom="$lg">
            <Text
              fontSize={14}
              fontWeight="500"
              color="$gray700"
              marginBottom="$md"
            >
              Nom du groupe
            </Text>
            <Input
              placeholder="Ex: Foyer, Coloc, Quotidien..."
              value={groupName}
              onChangeText={setGroupName}
              maxLength={50}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isCreating}
              autoFocus
            />

            {/* Suggestions */}
            <YStack marginTop="$base">
              <Text
                fontSize={12}
                fontWeight="500"
                color="$colorSecondary"
                marginBottom="$md"
              >
                💡 Suggestions
              </Text>
              <XStack flexWrap="wrap" gap="$md">
                {suggestedNames.map((suggestion) => {
                  const isSelected = groupName.trim() === suggestion;
                  return (
                    <Pressable
                      key={suggestion}
                      onPress={() => setGroupName(suggestion)}
                      disabled={isCreating}
                    >
                      <YStack
                        backgroundColor={
                          isSelected ? "$color" : "$backgroundSecondary"
                        }
                        paddingHorizontal="$md"
                        paddingVertical={6}
                        borderRadius="$lg"
                        borderWidth={1}
                        borderColor={isSelected ? "$color" : "$borderColor"}
                      >
                        <Text
                          fontSize={13}
                          color={isSelected ? "$background" : "$gray700"}
                          fontWeight={isSelected ? "600" : "400"}
                        >
                          {suggestion}
                        </Text>
                      </YStack>
                    </Pressable>
                  );
                })}
              </XStack>
            </YStack>
          </YStack>

          {/* Actions */}
          <Button
            variant="primary"
            onPress={handleCreate}
            disabled={isCreating || !groupName.trim()}
            marginBottom="$md"
          >
            <Text fontSize={16} fontWeight="600" color="$white">
              {isCreating ? "Création..." : "Créer le groupe"}
            </Text>
          </Button>

          <Button variant="secondary" onPress={onClose} disabled={isCreating}>
            <Text fontSize={16} fontWeight="500" color="$colorSecondary">
              Annuler
            </Text>
          </Button>
        </YStack>
      </KeyboardAvoidingView>
    </Modal>
  );
};
