import { Edit, Plus, Trash2, Users } from "lucide-react-native";
import { useState } from "react";
import { Pressable } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { IconButton } from "../../../../../components/IconButton";
import type { GroupMemberWithShare } from "../selectGroupDetails.selector";

interface GroupMembersSectionProps {
  members: GroupMemberWithShare[];
  groupCreatorId: string;
  maxSharePercentage: number;
  totalIncome: number;
  iconColor: string;
  iconSuccess: string;
  iconError: string;
  isCreator: boolean;
  onAddMember: () => void;
  onEditMember: (member: GroupMemberWithShare) => void;
  onRemoveMember: (memberId: string) => void;
}

export const GroupMembersSection = ({
  members,
  groupCreatorId,
  maxSharePercentage,
  totalIncome,
  iconColor,
  iconSuccess,
  iconError,
  isCreator,
  onAddMember,
  onEditMember,
  onRemoveMember,
}: GroupMembersSectionProps) => {
  const [showAllMembers, setShowAllMembers] = useState(false);

  const getInitials = (pseudo: string) => {
    return pseudo
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const shouldShowToggle = members.length >= 3;
  const displayedMembers =
    shouldShowToggle && !showAllMembers ? members.slice(0, 2) : members;

  return (
    <YStack
      backgroundColor="$backgroundSecondary"
      borderRadius="$md"
      padding="$lg"
      marginBottom="$lg"
      borderWidth={1}
      borderColor="$borderColor"
    >
      <XStack
        justifyContent="space-between"
        alignItems="center"
        marginBottom="$base"
      >
        <XStack alignItems="center">
          <Users size={16} color={iconColor} />
          <Text fontSize={16} fontWeight="600" color="$color" marginLeft="$xs">
            Membres et quotes-parts
          </Text>
        </XStack>
        <IconButton
          icon={Plus}
          variant="success"
          size={32}
          iconSize={16}
          onPress={onAddMember}
        />
      </XStack>

      {}
      <YStack gap="$sm">
        {displayedMembers.map((member) => {
          const isMaxShare = member.sharePercentage === maxSharePercentage;
          const isCreatorMember = member.userId === groupCreatorId;

          return (
            <XStack
              key={member.id}
              backgroundColor="$background"
              borderRadius="$md"
              padding="$base"
              borderWidth={1}
              borderColor={isMaxShare ? "$purple500" : "$borderColor"}
              alignItems="center"
              gap="$sm"
            >
              {}
              <YStack
                width={44}
                height={44}
                borderRadius={22}
                backgroundColor={isCreatorMember ? "$success600" : "$primary"}
                alignItems="center"
                justifyContent="center"
              >
                <Text
                  fontSize={16}
                  fontWeight="700"
                  color="$white"
                  textTransform="uppercase"
                >
                  {getInitials(member.pseudo)}
                </Text>
              </YStack>

              {}
              <YStack flex={1} gap="$2">
                <XStack alignItems="center" gap="$xs">
                  <Text fontSize={15} fontWeight="600" color="$color">
                    {member.pseudo}
                  </Text>
                  {isCreatorMember && (
                    <YStack
                      backgroundColor="$success600"
                      paddingHorizontal={6}
                      paddingVertical={2}
                      borderRadius="$sm"
                    >
                      <Text color="$white" fontSize={10} fontWeight="600">
                        Créateur
                      </Text>
                    </YStack>
                  )}
                </XStack>

                {}
                <YStack gap="$1">
                  <XStack alignItems="center" gap="$xs">
                    <Text fontSize={11} color="$colorSecondary" width={90}>
                      Quote-part
                    </Text>
                    <Text
                      fontSize={14}
                      fontWeight="700"
                      color={isMaxShare ? "$purple500" : "$color"}
                    >
                      {member.sharePercentage}%
                    </Text>
                  </XStack>

                  <XStack alignItems="center" gap="$xs">
                    <Text fontSize={11} color="$colorSecondary" width={90}>
                      Participation €
                    </Text>
                    <Text fontSize={14} fontWeight="600" color={iconSuccess}>
                      {member.shareAmount.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      €
                    </Text>
                  </XStack>

                  <XStack alignItems="center" gap="$xs">
                    <Text fontSize={11} color="$colorSecondary" width={90}>
                      Reste à vivre
                    </Text>
                    <Text
                      fontSize={14}
                      fontWeight="500"
                      color={
                        member.remainingAfterShare < 0
                          ? iconError
                          : "$colorSecondary"
                      }
                    >
                      {member.remainingAfterShare.toLocaleString("fr-FR", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}{" "}
                      €/mois
                    </Text>
                  </XStack>
                </YStack>
              </YStack>

              {}
              {isCreator &&
                (member.isPhantom || member.userId !== groupCreatorId) && (
                  <YStack gap="$xs">
                    {member.isPhantom && (
                      <IconButton
                        icon={Edit}
                        variant="success"
                        size={28}
                        iconSize={14}
                        onPress={() => onEditMember(member)}
                      />
                    )}
                    {member.userId !== groupCreatorId && (
                      <IconButton
                        icon={Trash2}
                        variant="error"
                        size={28}
                        iconSize={14}
                        onPress={() => onRemoveMember(member.id)}
                      />
                    )}
                  </YStack>
                )}
            </XStack>
          );
        })}
      </YStack>

      {}
      {shouldShowToggle && !showAllMembers && (
        <Pressable onPress={() => setShowAllMembers(true)}>
          <YStack
            paddingVertical="$base"
            alignItems="center"
            borderTopWidth={1}
            borderTopColor="$borderColor"
            marginTop="$xs"
          >
            <Text fontSize={14} color="$colorSecondary" fontWeight="500">
              Voir plus ({members.length - 2} autres)
            </Text>
          </YStack>
        </Pressable>
      )}

      {shouldShowToggle && showAllMembers && (
        <Pressable onPress={() => setShowAllMembers(false)}>
          <YStack
            paddingVertical="$base"
            alignItems="center"
            borderTopWidth={1}
            borderTopColor="$borderColor"
            marginTop="$xs"
          >
            <Text fontSize={14} color="$colorSecondary" fontWeight="500">
              Voir moins
            </Text>
          </YStack>
        </Pressable>
      )}

      {}
      <XStack
        alignItems="flex-start"
        marginTop="$base"
        paddingTop="$base"
        borderTopWidth={1}
        borderTopColor="$borderColor"
      >
        <Text
          fontSize={16}
          color="$colorSecondary"
          marginRight="$xs"
          marginTop={1}
        >
          •
        </Text>
        <Text fontSize={14} color="$colorSecondary" lineHeight={20} flex={1}>
          <Text fontWeight="600" color="$color">
            Calcul équitable
          </Text>
          {"\n"}Les quotes-parts sont calculées proportionnellement aux revenus
          de chaque membre. Total des revenus du groupe :{" "}
          {totalIncome.toLocaleString("fr-FR")} €/mois.
        </Text>
      </XStack>
    </YStack>
  );
};
