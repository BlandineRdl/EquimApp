import { useFocusEffect, useRouter } from "expo-router";
import {
  Home,
  Lightbulb,
  Link2,
  Moon,
  Plus,
  Sun,
  User,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import { RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { ScrollView, Text, XStack, YStack } from "tamagui";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { CreateGroupModal } from "../../src/features/group/presentation/manage-groups/CreateGroupModal.component";
import { GroupsHome } from "../../src/features/group/presentation/manage-groups/groupsHome.component";
import { selectAllGroups } from "../../src/features/group/presentation/manage-groups/selectGroup.selector";
import { InviteModal } from "../../src/features/group/presentation/manage-invitations/InviteModal.component";
import { JoinGroupModal } from "../../src/features/group/presentation/manage-invitations/JoinGroupModal.component";
import { loadUserGroups } from "../../src/features/group/usecases/load-groups/loadGroups.usecase";
import { BudgetSection } from "../../src/features/user/presentation/budget/BudgetSection.component";
import { selectUserProfile } from "../../src/features/user/presentation/selectors/selectUser.selector";
import { logger } from "../../src/lib/logger";
import { useThemeControl } from "../../src/lib/tamagui/theme-provider";
import { useAppDispatch } from "../../src/store/buildReduxStore";

export default function HomeScreen() {
  const dispatch = useAppDispatch();
  const user = useSelector(selectUserProfile);
  const groups = useSelector(selectAllGroups);
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { theme, toggleTheme } = useThemeControl();

  // Load user groups on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      logger.debug("Home screen focused, loading groups");
      dispatch(loadUserGroups());
    }, [dispatch]),
  );

  const openInviteModal = () => {
    setIsInviteModalVisible(true);
  };

  const closeInviteModal = () => {
    setIsInviteModalVisible(false);
  };

  const openJoinModal = () => {
    setIsJoinModalVisible(true);
  };

  const closeJoinModal = () => {
    setIsJoinModalVisible(false);
  };

  const openCreateModal = () => {
    setIsCreateModalVisible(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalVisible(false);
  };

  const handleCreateSuccess = (groupId: string) => {
    router.push({
      pathname: "/group/[groupId]" as "/group/[groupId]",
      params: { groupId },
    });
  };

  const handleJoinSuccess = (groupId: string) => {
    router.push({
      pathname: "/group/[groupId]" as "/group/[groupId]",
      params: { groupId },
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    logger.debug("Refreshing groups");
    await dispatch(loadUserGroups())
      .unwrap()
      .catch((err) => {
        logger.error("Error refreshing groups", err);
      });
    setRefreshing(false);
  }, [dispatch]);

  const navigateToGroupDetails = (groupId: string) => {
    router.push({
      pathname: "/group/[groupId]" as "/group/[groupId]",
      params: { groupId },
    });
  };

  // Loading state
  if (!user) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme === "light" ? "#ffffff" : "#111827",
        }}
        edges={["top"]}
      >
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          backgroundColor="$background"
        >
          <Text fontSize="$base" color="$colorSecondary">
            Chargement...
          </Text>
        </YStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme === "light" ? "#ffffff" : "#111827",
      }}
      edges={["top"]}
    >
      <YStack flex={1} backgroundColor="$background">
        <ScrollView
          flex={1}
          showsVerticalScrollIndicator={false}
          paddingHorizontal="$base"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#10b981"
              colors={["#10b981"]}
            />
          }
        >
          {/* Header */}
          <XStack alignItems="center" paddingTop="$sm" paddingBottom="$lg">
            <YStack flex={1}>
              <Text fontSize={24} fontWeight="600" color="$color">
                Bonjour, {user.pseudo}
              </Text>
            </YStack>
            <Button
              variant="secondary"
              width="$3xl"
              height="$3xl"
              borderRadius="$full"
              backgroundColor="$warning100"
              padding={0}
              onPress={toggleTheme}
            >
              {theme === "light" ? (
                <Moon size={20} color="#92400e" />
              ) : (
                <Sun size={20} color="#92400e" />
              )}
            </Button>
          </XStack>

          {/* Mon budget Section */}
          <BudgetSection />

          {/* Mon groupe Section */}
          <Text
            fontSize={18}
            fontWeight="600"
            color="$color"
            marginBottom="$md"
            marginTop="$sm"
          >
            Mon groupe
          </Text>

          <GroupsHome
            onNavigateToGroupDetails={navigateToGroupDetails}
            onOpenInviteModal={openInviteModal}
            onCreateGroup={openCreateModal}
            onJoinGroup={openJoinModal}
          />

          {/* Info Card */}
          {groups.length > 0 && (
            <Card backgroundColor="$warning100" marginBottom="$xl">
              <XStack gap="$sm" alignItems="flex-start">
                <Lightbulb size={16} color="#92400e" style={{ marginTop: 2 }} />
                <Text
                  fontSize={14}
                  color="$warning800"
                  lineHeight={20}
                  flex={1}
                >
                  Votre groupe "{groups[0]?.name}" est configuré avec des
                  dépenses totales de{" "}
                  {groups[0]?.shares?.totalExpenses?.toLocaleString("fr-FR") ||
                    0}{" "}
                  €. Vous pouvez maintenant inviter d'autres membres et ajouter
                  des dépenses ponctuelles.
                </Text>
              </XStack>
            </Card>
          )}

          {/* Bottom spacing for navigation */}
          <YStack height={100} />
        </ScrollView>

        {/* Bottom Navigation */}
        <XStack
          backgroundColor="$backgroundSecondary"
          borderTopWidth={1}
          borderTopColor="$borderColor"
          paddingVertical="$sm"
          paddingHorizontal="$sm"
          paddingBottom="$xl"
        >
          <YStack
            flex={1}
            alignItems="center"
            justifyContent="center"
            paddingVertical="$sm"
          >
            <Home
              size={20}
              color={theme === "light" ? "#111827" : "#ffffff"}
              style={{ marginBottom: 2 }}
            />
            <Text fontSize={12} color="$color" fontWeight="500">
              Accueil
            </Text>
          </YStack>

          <YStack
            flex={1}
            alignItems="center"
            justifyContent="center"
            paddingVertical="$sm"
            onPress={openCreateModal}
            cursor="pointer"
          >
            <Plus
              size={20}
              color={theme === "light" ? "#374151" : "#9ca3af"}
              style={{ marginBottom: 2 }}
            />
            <Text fontSize={12} color="$colorSecondary">
              Créer
            </Text>
          </YStack>

          <YStack
            flex={1}
            alignItems="center"
            justifyContent="center"
            paddingVertical="$sm"
            onPress={openJoinModal}
            cursor="pointer"
          >
            <Link2
              size={20}
              color={theme === "light" ? "#374151" : "#9ca3af"}
              style={{ marginBottom: 2 }}
            />
            <Text fontSize={12} color="$colorSecondary">
              Rejoindre
            </Text>
          </YStack>

          <YStack
            flex={1}
            alignItems="center"
            justifyContent="center"
            paddingVertical="$sm"
            onPress={() => router.push("/(app)/profile")}
            cursor="pointer"
          >
            <User
              size={20}
              color={theme === "light" ? "#374151" : "#9ca3af"}
              style={{ marginBottom: 2 }}
            />
            <Text fontSize={12} color="$colorSecondary">
              Profil
            </Text>
          </YStack>
        </XStack>
      </YStack>

      {/* Modal d'invitation */}
      <InviteModal
        isVisible={isInviteModalVisible}
        onClose={closeInviteModal}
        groupId={groups[0]?.id}
        groupName={groups[0]?.name}
      />

      {/* Modal pour rejoindre un groupe */}
      <JoinGroupModal
        isVisible={isJoinModalVisible}
        onClose={closeJoinModal}
        onSuccess={handleJoinSuccess}
      />

      {/* Modal pour créer un groupe */}
      <CreateGroupModal
        isVisible={isCreateModalVisible}
        onClose={closeCreateModal}
        onSuccess={handleCreateSuccess}
      />
    </SafeAreaView>
  );
}
