import { Text, YStack } from "tamagui";
import { Card } from "../../../../../components/Card";
import type { GroupShareInfo } from "../selectors/selectUserBudgetSummary.selector";

interface GroupSharesCardProps {
  groupShares: GroupShareInfo[];
  hasGroups: boolean;
}

export function GroupSharesCard({
  groupShares,
  hasGroups,
}: GroupSharesCardProps) {
  return (
    <Card
      width={280}
      minHeight={180}
      marginRight="$base"
      backgroundColor="$background"
    >
      <YStack gap="$sm">
        <Text fontSize={18} fontWeight="700" color="$color">
          Ma quote-part par groupe
        </Text>

        {!hasGroups ? (
          <YStack flex={1} justifyContent="center" alignItems="center">
            <Text fontSize={16} color="$colorSecondary">
              N/A
            </Text>
          </YStack>
        ) : (
          <YStack gap="$xs" marginTop="$sm">
            {groupShares.map((share) => (
              <YStack
                key={share.groupId}
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text fontSize={14} color="$color" flexShrink={1}>
                  {share.groupName}
                </Text>
                <Text fontSize={14} fontWeight="600" color="$color">
                  {Math.round(share.sharePercentage)}%
                </Text>
              </YStack>
            ))}
          </YStack>
        )}
      </YStack>
    </Card>
  );
}
