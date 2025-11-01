import { Edit, Plus, Trash2, Users } from "lucide-react-native";
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

      {members.map((member, index) => (
        <YStack
          key={member.id}
          paddingVertical={10}
          paddingHorizontal="$sm"
          borderBottomWidth={index < members.length - 1 ? 1 : 0}
          borderBottomColor="$borderColor"
        >
          {/* Ligne 1: Nom + Badge + Actions */}
          <XStack
            justifyContent="space-between"
            alignItems="center"
            marginBottom="$1"
          >
            <XStack alignItems="center" gap="$xs" flex={1}>
              <Text
                fontSize={15}
                fontWeight="600"
                color="$color"
                flexShrink={1}
              >
                {member.pseudo}
              </Text>
              {member.userId === groupCreatorId && (
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
            {isCreator &&
              (member.isPhantom || member.userId !== groupCreatorId) && (
                <XStack gap="$xs">
                  {member.isPhantom && (
                    <Pressable
                      onPress={() => onEditMember(member)}
                      style={{ padding: 4 }}
                    >
                      <Edit size={16} color={SEMANTIC_COLORS.PRIMARY_HOVER} />
                    </Pressable>
                  )}
                  {member.userId !== groupCreatorId && (
                    <Pressable
                      onPress={() => onRemoveMember(member.id)}
                      style={{ padding: 4 }}
                    >
                      <Trash2 size={16} color={iconError} />
                    </Pressable>
                  )}
                </XStack>
              )}
          </XStack>

          {/* Ligne 2: Valeurs uniquement */}
          <XStack alignItems="center" gap="$xs" flexWrap="wrap">
            <Text fontSize={14} color="$colorSecondary" fontWeight="500">
              {(member.monthlyCapacity || 0).toLocaleString("fr-FR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
              €/mois
            </Text>
            <Text fontSize={14} color="$gray300" marginHorizontal={2}>
              •
            </Text>
            <Text
              fontSize={14}
              fontWeight="700"
              color={
                member.sharePercentage === maxSharePercentage
                  ? "$highlight"
                  : "$color"
              }
            >
              {member.sharePercentage}%
            </Text>
            <Text
              fontSize={14}
              fontWeight="600"
              color={iconSuccess}
              marginLeft="$1"
            >
              (
              {member.shareAmount.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              €)
            </Text>
          </XStack>
        </YStack>
      ))}

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
