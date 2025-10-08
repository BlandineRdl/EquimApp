import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	SafeAreaView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { logger } from "../../src/lib/logger";
import { supabase } from "../../src/lib/supabase/client";

/**
 * Auth callback screen
 * Handles deep link authentication from magic link
 */
export default function AuthCallbackScreen() {
	const [status, setStatus] = useState<"loading" | "success" | "error">(
		"loading",
	);
	const [message, setMessage] = useState("Authentification en cours...");

	useEffect(() => {
		handleAuthCallback();
	}, []);

	const handleAuthCallback = async () => {
		try {
			// Get session (should be set by deep link handler)
			const { data } = await supabase.auth.getSession();

			if (data.session) {
				setStatus("success");
				setMessage("Connexion réussie !");

				// Redirect to home after 1 second
				setTimeout(() => {
					router.replace("/");
				}, 1000);
			} else {
				setStatus("error");
				setMessage("Session introuvable. Veuillez réessayer.");
			}
		} catch (error) {
			logger.error("Auth callback error", error);
			setStatus("error");
			setMessage("Une erreur est survenue lors de la connexion.");
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<View style={styles.logoContainer}>
					<Text style={styles.logo}>
						{status === "loading"
							? "⏳"
							: status === "success"
								? "✅"
								: "❌"}
					</Text>
				</View>

				<Text style={styles.title}>
					{status === "loading"
						? "Connexion en cours..."
						: status === "success"
							? "Bienvenue !"
							: "Erreur"}
				</Text>

				<Text style={styles.message}>{message}</Text>

				{status === "loading" && (
					<ActivityIndicator size="large" color="#667eea" />
				)}
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	content: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 24,
	},
	logoContainer: {
		width: 80,
		height: 80,
		backgroundColor: "#f3f4f6",
		borderRadius: 40,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 24,
	},
	logo: {
		fontSize: 40,
	},
	title: {
		fontSize: 24,
		fontWeight: "700",
		color: "#111827",
		textAlign: "center",
		marginBottom: 12,
	},
	message: {
		fontSize: 16,
		color: "#6b7280",
		textAlign: "center",
		marginBottom: 24,
	},
});
