import { useRouter, useFocusEffect } from "expo-router";
import {
    BarChart3,
    ChevronRight,
    Home,
    Link2,
    Lightbulb,
    Plus,
    Settings,
    Users,
} from "lucide-react-native";
import React, { useState, useEffect, useCallback } from "react";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { GroupsHome } from "../src/features/group/presentation/groupsHome.component";
import { InviteModal } from "../src/features/group/presentation/InviteModal.component";
import { JoinGroupModal } from "../src/features/group/presentation/JoinGroupModal.component";
import { selectAllGroups } from "../src/features/group/presentation/selectGroup.selector";
import { selectUserProfile } from "../src/features/user/presentation/selectUser.selector";
import { loadUserGroups } from "../src/features/group/usecases/load-groups/loadGroups.usecase";
import { logger } from "../src/lib/logger";
import { useAppDispatch } from "../src/store/buildReduxStore";



export default function HomeScreen() {
    const dispatch = useAppDispatch();
    const user = useSelector(selectUserProfile);
    const groups = useSelector(selectAllGroups);
    const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
    const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    // Load user groups on mount and when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            logger.debug("Home screen focused, loading groups");
            dispatch(loadUserGroups());
        }, [dispatch])
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

    const handleJoinGroup = (inviteLink: string) => {
        // Extract token from link (equimapp://invite/TOKEN)
        const token = inviteLink.split("/").pop();
        if (token) {
            // Navigate to accept invitation screen with token
            router.push(`/group/accept-invitation?token=${token}`);
            closeJoinModal();
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        logger.debug("Refreshing groups");
        await dispatch(loadUserGroups()).unwrap().catch((err) => {
            logger.error("Error refreshing groups", err);
        });
        setRefreshing(false);
    }, [dispatch]);

    const navigateToGroupDetails = (groupId: string) => {
        router.push({ pathname: "/group/[groupId]" as "/group/[groupId]", params: { groupId } });
    };

    // Loading state
    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loading}>
                    <Text>Chargement...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
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
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Accueil</Text>
                        <Text style={styles.userName}>Bonjour, {user.pseudo}</Text>
                    </View>
                    <TouchableOpacity style={styles.settingsButton}>
                        <Settings size={20} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* Mon groupe Section */}
                <Text style={styles.sectionTitle}>Mon groupe</Text>

                <GroupsHome
                    onNavigateToGroupDetails={navigateToGroupDetails}
                    onOpenInviteModal={openInviteModal}
                />

                {/* Quick Actions */}
                <View style={styles.quickActionsGrid}>
                    <TouchableOpacity style={styles.gridActionButton}>
                        <Plus size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.gridActionButtonText}>Créer un groupe</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.gridActionButtonSecondary} onPress={openJoinModal}>
                        <Link2 size={20} color="#374151" style={{ marginRight: 8 }} />
                        <Text style={styles.gridActionButtonSecondaryText}>Rejoindre un groupe</Text>
                    </TouchableOpacity>
                </View>

                {/* Info Card */}
                {groups.length > 0 && (
                    <View style={styles.infoCard}>
                        <Lightbulb size={16} color="#92400e" style={{ marginRight: 8, marginTop: 2 }} />
                        <Text style={styles.infoText}>
                            Votre groupe "{groups[0]?.name}" est configuré avec des dépenses totales de {groups[0]?.shares?.totalExpenses?.toLocaleString('fr-FR') || 0} €. Vous pouvez maintenant inviter d'autres membres et ajouter des dépenses ponctuelles.
                        </Text>
                    </View>
                )}

                {/* Expenses Section */}
                <Text style={styles.sectionTitle}>Vos dépenses configurées</Text>

                <View style={styles.expensesContainer}>
                    {/* TODO: Load full group details to display expenses */}
                    <Text style={styles.noExpensesText}>
                        Cliquez sur votre groupe pour voir les dépenses détaillées.
                    </Text>
                </View>

                {/* Bottom spacing for navigation */}
                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNavigation}>
                <TouchableOpacity style={styles.navItem}>
                    <Home size={20} color="#000" style={{ marginBottom: 4 }} />
                    <Text style={styles.navTextActive}>Accueil</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem}>
                    <Users size={20} color="#666" style={{ marginBottom: 4 }} />
                    <Text style={styles.navText}>Groupes</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem}>
                    <Plus size={20} color="#666" style={{ marginBottom: 4 }} />
                    <Text style={styles.navText}>Ajouter</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem}>
                    <BarChart3 size={20} color="#666" style={{ marginBottom: 4 }} />
                    <Text style={styles.navText}>Balance</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem}>
                    <Settings size={20} color="#666" style={{ marginBottom: 4 }} />
                    <Text style={styles.navText}>Réglages</Text>
                </TouchableOpacity>
            </View>

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
                onJoin={handleJoinGroup}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    loading: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingTop: 8,
        paddingBottom: 20,
    },
    greeting: {
        fontSize: 16,
        color: "#000",
        fontWeight: "400",
    },
    userName: {
        fontSize: 18,
        fontWeight: "600",
        color: "#000",
        marginTop: 2,
    },
    settingsButton: {
        padding: 8,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#000",
        marginBottom: 12,
        marginTop: 8,
    },
    groupCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: "#10b981",
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    groupHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    groupIconContainer: {
        backgroundColor: "#f0f9ff",
        borderRadius: 6,
        padding: 4,
        marginRight: 8,
    },

    groupName: {
        fontSize: 18,
        fontWeight: "600",
        color: "#000",
    },
    membersContainer: {
        marginBottom: 16,
    },
    membersText: {
        fontSize: 12,
        color: "#6b7280",
        fontWeight: "600",
    },
    memberNames: {
        fontSize: 11,
        color: "#9ca3af",
        fontStyle: "italic",
        marginTop: 2,
    },
    budgetSection: {
        marginBottom: 16,
    },
    budgetLabel: {
        fontSize: 14,
        color: "#666",
        marginBottom: 4,
    },
    budgetAmount: {
        fontSize: 28,
        fontWeight: "700",
        color: "#000",
        marginBottom: 4,
    },
    expensesCount: {
        fontSize: 14,
        color: "#666",
    },
    viewButton: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-end",
        backgroundColor: "#fff",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        marginBottom: 16,
    },
    viewButtonText: {
        fontSize: 14,
        color: "#374151",
        fontWeight: "500",
    },
    inviteSection: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
    },
    inviteText: {
        fontSize: 14,
        color: "#666",
        flex: 1,
    },
    inviteButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#10b981",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    inviteButtonText: {
        fontSize: 14,
        color: "#fff",
        fontWeight: "500",
    },
    quickActionsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 20,
    },
    gridActionButton: {
        width: "48%",
        backgroundColor: "#000",
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        minHeight: 50,
    },
    gridActionButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
        flex: 1,
    },
    gridActionButtonSecondary: {
        width: "48%",
        backgroundColor: "#fff",
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        minHeight: 50,
    },
    gridActionButtonSecondaryText: {
        color: "#374151",
        fontSize: 14,
        fontWeight: "500",
        flex: 1,
    },
    infoCard: {
        flexDirection: "row",
        backgroundColor: "#fef3c7",
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
        alignItems: "flex-start",
    },

    infoText: {
        fontSize: 14,
        color: "#92400e",
        lineHeight: 20,
        flex: 1,
    },
    expensesContainer: {
        marginBottom: 20,
    },
    expenseItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#f9fafb",
        borderRadius: 8,
        padding: 16,
        marginBottom: 8,
    },
    expenseLabel: {
        fontSize: 16,
        fontWeight: "500",
        color: "#000",
        marginBottom: 2,
    },
    expenseDetails: {
        fontSize: 14,
        color: "#666",
    },
    expenseAmountContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    expenseAmount: {
        fontSize: 16,
        fontWeight: "600",
        color: "#000",
        marginRight: 8,
    },

    noExpensesText: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        fontStyle: "italic",
        paddingVertical: 20,
    },
    bottomSpacing: {
        height: 100,
    },
    bottomNavigation: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        paddingVertical: 8,
        paddingHorizontal: 8,
    },
    navItem: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 8,
    },
    navText: {
        fontSize: 12,
        color: "#666",
    },
    navTextActive: {
        fontSize: 12,
        color: "#000",
        fontWeight: "500",
    },
});
