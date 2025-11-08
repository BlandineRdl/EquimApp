import { ArrowRightLeft, UserPlus, Users } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Pressable } from "react-native";
import { useSelector } from "react-redux";
import { Text, useTheme, XStack, YStack } from "tamagui";

import type { AppState } from "../../../../store/appState";
import { selectAllGroups } from "./selectGroup.selector";
import {
  selectGroupMemberNamesFormatted,
  selectGroupMembersCount,
} from "./selectGroupMembers.selector";

function GroupCardSkeleton() {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const _opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <YStack
      backgroundColor="$backgroundSecondary"
      borderRadius="$md"
      padding="$base"
      borderWidth={1}
      borderColor="$borderColor"
      marginBottom="$lg"
    >
      <XStack alignItems="center" marginBottom="$xs">
        <YStack
          width={24}
          height={24}
          backgroundColor="$gray300"
          borderRadius={6}
          marginRight="$xs"
        />
        <YStack
          width={120}
          height={18}
          backgroundColor="$gray300"
          borderRadius={4}
        />
      </XStack>

      <YStack marginBottom="$base" gap="$1">
        <YStack
          width={80}
          height={12}
          backgroundColor="$gray300"
          borderRadius={4}
        />
        <YStack
          width={120}
          height={12}
          backgroundColor="$gray300"
          borderRadius={4}
        />
      </YStack>

      <YStack marginBottom="$base" gap="$1">
        <YStack
          width={140}
          height={12}
          backgroundColor="$gray300"
          borderRadius={4}
        />
        <YStack
          width={100}
          height={28}
          backgroundColor="$gray300"
          borderRadius={4}
        />
        <YStack
          width={160}
          height={12}
          backgroundColor="$gray300"
          borderRadius={4}
        />
      </YStack>

      <YStack
        width={80}
        height={32}
        backgroundColor="$gray300"
        borderRadius={8}
        alignSelf="flex-end"
        marginBottom="$base"
      />

      <XStack
        paddingTop="$base"
        borderTopWidth={1}
        borderTopColor="$borderColor"
        justifyContent="space-between"
        alignItems="center"
      >
        <YStack
          width={180}
          height={12}
          backgroundColor="$gray300"
          borderRadius={4}
        />
        <YStack
          width={90}
          height={32}
          backgroundColor="$gray300"
          borderRadius={8}
        />
      </XStack>
    </YStack>
  );
}

function EmptyGroupState({
  onCreateGroup,
  onJoinGroup,
}: {
  onCreateGroup: () => void;
  onJoinGroup: () => void;
}) {
  const theme = useTheme();

  return (
    <YStack
      backgroundColor="$backgroundSecondary"
      borderRadius="$md"
      padding="$2xl"
      alignItems="center"
      marginBottom="$lg"
      borderWidth={1}
      borderColor="$borderColor"
      borderStyle="dashed"
    >
      <YStack
        width="$6xl"
        height="$6xl"
        backgroundColor="$gray100"
        borderRadius={40}
        alignItems="center"
        justifyContent="center"
        marginBottom="$base"
      >
        <Users size={48} color={theme.gray400.val} />
      </YStack>
      <Text fontSize={18} fontWeight="600" color="$color" marginBottom="$xs">
        Aucun groupe
      </Text>
      <Text
        fontSize={14}
        color="$colorSecondary"
        textAlign="center"
        lineHeight={20}
        marginBottom="$xl"
      >
        Créez votre premier groupe ou rejoignez-en un pour commencer à partager
        vos dépenses équitablement
      </Text>
      <YStack width="100%" gap="$sm">
        <Pressable
          style={{
            backgroundColor: theme.gray900.val,
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: 8,
            alignItems: "center",
          }}
          onPress={onCreateGroup}
        >
          <Text color={theme.white.val} fontSize={15} fontWeight="600">
            Créer un groupe
          </Text>
        </Pressable>
        <Pressable onPress={onJoinGroup}>
          <YStack
            backgroundColor="$background"
            paddingHorizontal="$lg"
            paddingVertical="$sm"
            borderRadius={8}
            borderWidth={1}
            borderColor="$borderColor"
            alignItems="center"
          >
            <Text color="$color" fontSize={15} fontWeight="600">
              Rejoindre un groupe
            </Text>
          </YStack>
        </Pressable>
      </YStack>
    </YStack>
  );
}

function MembersDisplay({ groupId }: { groupId: string }) {
  const membersCount = useSelector(selectGroupMembersCount(groupId));
  const memberNamesFormatted = useSelector(
    selectGroupMemberNamesFormatted(groupId),
  );

  return (
    <YStack marginBottom="$base">
      <Text fontSize={12} color="$colorSecondary" fontWeight="600">
        {membersCount} membre{membersCount > 1 ? "s" : ""}
      </Text>
      <Text
        fontSize={11}
        color="$colorTertiary"
        fontStyle="italic"
        marginTop={2}
      >
        {memberNamesFormatted}
      </Text>
    </YStack>
  );
}

export interface GroupsHomeProps {
  onNavigateToGroupDetails: (groupId: string) => void;
  onOpenInviteModal: () => void;
  onCreateGroup: () => void;
  onJoinGroup: () => void;
}

export const GroupsHome = ({
  onNavigateToGroupDetails,
  onOpenInviteModal,
  onCreateGroup,
  onJoinGroup,
}: GroupsHomeProps) => {
  const theme = useTheme();
  const groups = useSelector(selectAllGroups);
  const isLoading = useSelector((state: AppState) => state.groups.loading);

  if (isLoading) {
    return <GroupCardSkeleton />;
  }

  if (groups.length === 0) {
    return (
      <EmptyGroupState
        onCreateGroup={onCreateGroup}
        onJoinGroup={onJoinGroup}
      />
    );
  }

  return (
    <>
      {groups.map((group) => (
        <YStack
          key={group.id}
          backgroundColor="$backgroundSecondary"
          borderRadius="$md"
          padding="$base"
          borderWidth={1}
          borderColor="$success600"
          marginBottom="$lg"
        >
          {}
          <XStack alignItems="center" marginBottom="$xs">
            <YStack
              backgroundColor="$primary100"
              borderRadius={6}
              padding="$1"
              marginRight="$xs"
            >
              <Users size={16} color={theme.primary600.val} />
            </YStack>
            <Text fontSize={18} fontWeight="600" color="$color">
              {group.name}
            </Text>
          </XStack>

          <MembersDisplay groupId={group.id} />

          {}
          <YStack marginBottom="$base">
            <Text fontSize={14} color="$colorSecondary" marginBottom="$1">
              Total des dépenses
            </Text>
            <Text
              fontSize={28}
              fontWeight="700"
              color="$color"
              marginBottom="$1"
            >
              {(group.shares?.totalExpenses || 0).toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              €
            </Text>
            <Text fontSize={14} color="$colorSecondary">
              {group.expenses?.length || 0} dépense
              {(group.expenses?.length || 0) > 1 ? "s" : ""} configurée
              {(group.expenses?.length || 0) > 1 ? "s" : ""}
            </Text>
          </YStack>

          {}
          <Pressable onPress={() => onNavigateToGroupDetails(group.id)}>
            <XStack
              alignItems="center"
              alignSelf="flex-end"
              backgroundColor="$background"
              paddingHorizontal="$sm"
              paddingVertical="$xs"
              borderRadius={8}
              borderWidth={1}
              borderColor="$borderColor"
              marginBottom="$base"
            >
              <ArrowRightLeft
                size={14}
                color={theme.gray700.val}
                style={{ marginRight: 6 }}
              />
              <Text fontSize={14} color="$color" fontWeight="500">
                Voir
              </Text>
            </XStack>
          </Pressable>

          {}
          <XStack
            justifyContent="space-between"
            alignItems="center"
            paddingTop="$base"
            borderTopWidth={1}
            borderTopColor="$borderColor"
          >
            <Text fontSize={14} color="$colorSecondary" flex={1}>
              Inviter des membres au groupe
            </Text>
            <Pressable onPress={onOpenInviteModal}>
              <XStack
                alignItems="center"
                backgroundColor="$success600"
                paddingHorizontal="$sm"
                paddingVertical="$xs"
                borderRadius={8}
              >
                <UserPlus
                  size={14}
                  color={theme.white.val}
                  style={{ marginRight: 6 }}
                />
                <Text fontSize={14} color={theme.white.val} fontWeight="500">
                  Inviter
                </Text>
              </XStack>
            </Pressable>
          </XStack>
        </YStack>
      ))}
    </>
  );
};
