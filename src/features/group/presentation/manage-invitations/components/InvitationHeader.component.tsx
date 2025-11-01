import { ArrowLeft } from "lucide-react-native";
import { Pressable } from "react-native";
import { Text, useTheme, XStack, YStack } from "tamagui";

interface InvitationHeaderProps {
  onBack: () => void;
}

export const InvitationHeader = ({ onBack }: InvitationHeaderProps) => {
  const theme = useTheme();

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
        <ArrowLeft size={20} color={theme.gray900.val} />
      </Pressable>
      <Text fontSize={18} fontWeight="600" color="$color">
        Invitation
      </Text>
      <YStack width="$9" />
    </XStack>
  );
};
