import { ArrowLeft, LogOut, Trash2 } from "lucide-react-native";
import { Pressable } from "react-native";
import { Text, XStack, YStack } from "tamagui";

interface GroupDetailsHeaderProps {
  groupName: string;
  isCreator: boolean;
  iconColor: string;
  iconError: string;
  onBack: () => void;
  onDelete: () => void;
  onLeave: () => void;
}

export const GroupDetailsHeader = ({
  groupName,
  isCreator,
  iconColor,
  iconError,
  onBack,
  onDelete,
  onLeave,
}: GroupDetailsHeaderProps) => {
  return (
    <XStack
      paddingHorizontal="$base"
      paddingVertical="$sm"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      alignItems="center"
      backgroundColor="$background"
    >
      <Pressable style={{ padding: 8, marginRight: 8 }} onPress={onBack}>
        <ArrowLeft size={20} color={iconColor} />
      </Pressable>
      <YStack flex={1}>
        <Text fontSize={14} color="$colorSecondary" fontWeight="400">
          Groupe
        </Text>
        <Text fontSize={20} color="$color" fontWeight="600">
          {groupName}
        </Text>
      </YStack>
      {isCreator ? (
        <Pressable style={{ padding: 8, marginLeft: 8 }} onPress={onDelete}>
          <Trash2 size={20} color={iconError} />
        </Pressable>
      ) : (
        <Pressable style={{ padding: 8, marginLeft: 8 }} onPress={onLeave}>
          <LogOut size={20} color={iconError} />
        </Pressable>
      )}
    </XStack>
  );
};
