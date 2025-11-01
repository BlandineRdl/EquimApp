import { Text } from "tamagui";
import { Card } from "../../../../../components/Card";
import type { InvitationPreview } from "../../../ports/GroupGateway";

interface InvitationCardProps {
  invitationDetails: InvitationPreview;
}

export const InvitationCard = ({ invitationDetails }: InvitationCardProps) => {
  return (
    <Card
      borderRadius="$md"
      padding="$xl"
      alignItems="center"
      marginBottom="$xl"
    >
      <Text
        fontSize={24}
        fontWeight="600"
        color="$color"
        marginBottom="$base"
        textAlign="center"
      >
        Rejoindre le groupe
      </Text>
      <Text
        fontSize={20}
        fontWeight="700"
        color="$success"
        marginBottom="$base"
        textAlign="center"
      >
        "{invitationDetails.groupName}"
      </Text>
      <Text fontSize={16} color="$colorSecondary" textAlign="center">
        Invité par {invitationDetails.creatorPseudo}
      </Text>
    </Card>
  );
};
