import { ArrowLeft } from "lucide-react-native";
import { Pressable } from "react-native";
import { Text, XStack, YStack } from "tamagui";

interface InvitationHeaderProps {
  onBack: () => void;
}

export const InvitationHeader = ({ onBack }: InvitationHeaderProps) => {
  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      paddingHorizontal="$base"
      paddingVertical="$sm"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
    >
      <Pressable onPress={onBack} style={{ padding: 8 }}>
        <ArrowLeft size={20} color="#111827" />
      </Pressable>
      <Text fontSize={18} fontWeight="600" color="$color">
        Invitation
      </Text>
      <YStack width="$9" />
    </XStack>
  );
};
