import React from "react";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSelector } from "react-redux";
import { selectOnboardingUI } from "../src/features/onboarding/presentation/onboarding.selectors";

export default function HomeScreen() {
    const { pseudo } = useSelector(selectOnboardingUI);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.greeting}>Accueil</Text>
                    <Text style={styles.userName}>Bonjour, {pseudo}</Text>
                </View>
                <TouchableOpacity style={styles.settingsButton}>
                    <Text style={styles.settingsIcon}>⚙️</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
    },
    headerLeft: {
        flex: 1,
    },
    greeting: {
        fontSize: 16,
        color: "#6b7280",
        marginBottom: 4,
    },
    userName: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
    },
    settingsButton: {
        padding: 8,
    },
    settingsIcon: {
        fontSize: 20,
    },
});
