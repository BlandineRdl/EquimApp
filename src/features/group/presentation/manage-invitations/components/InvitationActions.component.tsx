import { YStack } from "tamagui";
import { Button } from "../../../../../components/Button";

interface InvitationActionsProps {
  onAccept: () => void;
  onRefuse: () => void;
  isLoading: boolean;
  canSubmit: boolean;
}

export const InvitationActions = ({
  onAccept,
  onRefuse,
  isLoading,
  canSubmit,
}: InvitationActionsProps) => {
  return (
    <YStack gap="$base">
      <Button
        variant="success"
        onPress={onAccept}
        disabled={isLoading || !canSubmit}
        height="$14"
      >
        Accepter l'invitation
      </Button>

      <Button
        variant="secondary"
        onPress={onRefuse}
        disabled={isLoading}
        height="$14"
      >
        Refuser
      </Button>
    </YStack>
  );
};
