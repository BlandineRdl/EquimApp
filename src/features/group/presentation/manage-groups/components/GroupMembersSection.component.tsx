import { Edit, Plus, Trash2, Users } from "lucide-react-native";
import { useState } from "react";
import { Pressable } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { SEMANTIC_COLORS } from "../../../../../constants/theme.constants";
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

  // Get initials from pseudo
  const getInitials = (pseudo: string) => {
    return pseudo
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Show only 2 members by default if there are 3 or more
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
        <Pressable onPress={onAddMember}>
          <XStack
            alignItems="center"
            backgroundColor="$backgroundTertiary"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius={8}
            paddingHorizontal="$sm"
            paddingVertical="$xs"
          >
            <Plus size={16} color={iconColor} />
            <Users size={16} color={iconColor} style={{ marginLeft: 4 }} />
          </XStack>
        </Pressable>
      </XStack>

      {/* Member Cards */}
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
              borderColor={isMaxShare ? "$primary" : "$borderColor"}
              alignItems="center"
              gap="$sm"
            >
              {/* Avatar/Initials */}
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

              {/* Center: Name + Info */}
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

                {/* Info Grid */}
                <YStack gap="$1">
                  <XStack alignItems="center" gap="$xs">
                    <Text fontSize={11} color="$colorSecondary" width={90}>
                      Quote-part
                    </Text>
                    <Text
                      fontSize={14}
                      fontWeight="700"
                      color={isMaxShare ? "$primary" : "$color"}
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
                      color="$colorSecondary"
                    >
                      {(member.monthlyCapacity || 0).toLocaleString("fr-FR", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}{" "}
                      €/mois
                    </Text>
                  </XStack>
                </YStack>
              </YStack>

              {/* Actions (Edit/Delete) */}
              {isCreator &&
                (member.isPhantom || member.userId !== groupCreatorId) && (
                  <YStack gap="$xs">
                    {member.isPhantom && (
                      <Pressable
                        onPress={() => onEditMember(member)}
                        style={{
                          padding: 6,
                          backgroundColor: "rgba(14, 165, 233, 0.1)",
                          borderRadius: 6,
                        }}
                      >
                        <Edit size={16} color={SEMANTIC_COLORS.PRIMARY_HOVER} />
                      </Pressable>
                    )}
                    {member.userId !== groupCreatorId && (
                      <Pressable
                        onPress={() => onRemoveMember(member.id)}
                        style={{
                          padding: 6,
                          backgroundColor: "rgba(239, 68, 68, 0.1)",
                          borderRadius: 6,
                        }}
                      >
                        <Trash2 size={16} color={iconError} />
                      </Pressable>
                    )}
                  </YStack>
                )}
            </XStack>
          );
        })}
      </YStack>

      {/* Toggle button for showing more/less members */}
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

      {/* Explication du calcul */}
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
