import { router } from "expo-router";
import React, { useState } from "react";
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { useSelector } from "react-redux";

import type { AppState } from "../../src/store/appState";
import { useAppDispatch } from "../../src/store/buildReduxStore";
import { signInWithEmail } from "../../src/features/auth/usecases/signInWithEmail.usecase";
import { verifyOtp } from "../../src/features/auth/usecases/verifyOtp.usecase";

export default function SignInScreen() {
	const dispatch = useAppDispatch();
	const { isLoading, error } = useSelector((state: AppState) => state.auth);

	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [emailSent, setEmailSent] = useState(false);
	const [resendTimer, setResendTimer] = useState(0);

	// Countdown timer for resend button
	React.useEffect(() => {
		if (resendTimer > 0) {
			const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
			return () => clearTimeout(timer);
		}
	}, [resendTimer]);

	const handleSignIn = async () => {
		try {
			await dispatch(signInWithEmail(email)).unwrap();
			setEmailSent(true);
			setResendTimer(30); // 30 seconds cooldown
		} catch (err) {
			// Error is handled by Redux slice and displayed in UI
		}
	};

	const handleResendCode = async () => {
		try {
			await dispatch(signInWithEmail(email)).unwrap();
			setOtp(""); // Clear current OTP input
			setResendTimer(30); // Reset timer
		} catch (err) {
			// Error is handled by Redux slice
		}
	};

	const handleVerifyOtp = async () => {
		try {
			await dispatch(verifyOtp({ email, token: otp })).unwrap();
			// Session will be set by onAuthStateChange listener
			router.replace("/");
		} catch (err) {
			// Error is handled by Redux slice
		}
	};

	const isButtonDisabled = !email.trim() || isLoading;
	const isOtpButtonDisabled = otp.length !== 6 || isLoading;

	// Success state: email sent - show OTP input
	if (emailSent) {
		return (
			<SafeAreaView style={styles.container}>
				<KeyboardAvoidingView
					style={styles.content}
					behavior={Platform.OS === "ios" ? "padding" : "height"}
				>
					<ScrollView
						style={styles.scrollView}
						contentContainerStyle={styles.scrollContent}
					>
						<View style={styles.header}>
							<View style={styles.logoContainer}>
								<Text style={styles.logo}>🔐</Text>
							</View>

							<Text style={styles.title}>Entrez le code</Text>
							<Text style={styles.subtitle}>
								Nous avons envoyé un code à 6 chiffres à{" "}
								<Text style={styles.emailText}>{email}</Text>
							</Text>
						</View>

						<View style={styles.form}>
							<Text style={styles.label}>Code de vérification</Text>
							<TextInput
								value={otp}
								onChangeText={setOtp}
								style={styles.input}
								placeholder="000000"
								keyboardType="number-pad"
								maxLength={6}
								autoFocus
							/>

							{error && <Text style={styles.errorText}>{error}</Text>}

							<View style={styles.infoBox}>
								<Text style={styles.infoTitle}>💡 Code non reçu ?</Text>
								<Text style={styles.infoText}>
									Vérifiez vos spams ou attendez quelques secondes. Le code expire après 60 minutes.
								</Text>
							</View>
						</View>

						<View style={styles.actions}>
							<TouchableOpacity
								style={[styles.button, isOtpButtonDisabled && styles.buttonDisabled]}
								onPress={handleVerifyOtp}
								disabled={isOtpButtonDisabled}
							>
								{isLoading ? (
									<ActivityIndicator color="#fff" />
								) : (
									<Text style={[styles.buttonText, isOtpButtonDisabled && styles.buttonTextDisabled]}>
										Vérifier
									</Text>
								)}
							</TouchableOpacity>

							<TouchableOpacity
								style={[
									styles.buttonSecondary,
									resendTimer > 0 && styles.buttonDisabled,
								]}
								onPress={handleResendCode}
								disabled={resendTimer > 0 || isLoading}
							>
								<Text style={styles.buttonSecondaryText}>
									{resendTimer > 0
										? `Renvoyer le code (${resendTimer}s)`
										: "Renvoyer le code"}
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={styles.buttonSecondary}
								onPress={() => {
									setEmailSent(false);
									setOtp("");
									setResendTimer(0);
								}}
							>
								<Text style={styles.buttonSecondaryText}>
									← Modifier l'email
								</Text>
							</TouchableOpacity>
						</View>
					</ScrollView>
				</KeyboardAvoidingView>
			</SafeAreaView>
		);
	}

	// Sign in form
	return (
		<SafeAreaView style={styles.container}>
			<KeyboardAvoidingView
				style={styles.content}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
				>
					{/* Header */}
					<View style={styles.header}>
						<View style={styles.logoContainer}>
							<Text style={styles.logo}>🌱</Text>
						</View>

						<Text style={styles.title}>Bienvenue sur Equim</Text>
						<Text style={styles.subtitle}>
							Partagez équitablement vos dépenses en fonction de vos revenus
						</Text>
					</View>

					{/* Form */}
					<View style={styles.form}>
						<Text style={styles.label}>Adresse email</Text>
						<TextInput
							value={email}
							onChangeText={setEmail}
							style={[styles.input, error && styles.inputError]}
							placeholder="vous@exemple.com"
							placeholderTextColor="#9ca3af"
							keyboardType="email-address"
							autoCapitalize="none"
							autoCorrect={false}
							editable={!isLoading}
						/>

						{error && <Text style={styles.errorText}>{error}</Text>}

						{/* Info box */}
						<View style={styles.infoBox}>
							<Text style={styles.infoTitle}>🔒 Connexion sécurisée</Text>
							<Text style={styles.infoText}>
								Pas de mot de passe à retenir ! Nous vous enverrons un lien
								magique pour vous connecter en toute sécurité.
							</Text>
						</View>
					</View>

					{/* Actions */}
					<View style={styles.actions}>
						<TouchableOpacity
							style={[styles.button, isButtonDisabled && styles.buttonDisabled]}
							onPress={handleSignIn}
							disabled={isButtonDisabled}
						>
							{isLoading ? (
								<ActivityIndicator color="#fff" />
							) : (
								<Text
									style={[
										styles.buttonText,
										isButtonDisabled && styles.buttonTextDisabled,
									]}
								>
									Continuer →
								</Text>
							)}
						</TouchableOpacity>

						<Text style={styles.legalText}>
							En continuant, vous acceptez nos conditions d'utilisation et notre
							politique de confidentialité.
						</Text>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
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
		paddingHorizontal: 24,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		paddingTop: 48,
	},
	header: {
		alignItems: "center",
		marginBottom: 48,
	},
	logoContainer: {
		width: 64,
		height: 64,
		backgroundColor: "#d1fae5",
		borderRadius: 32,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 24,
	},
	logo: {
		fontSize: 32,
	},
	title: {
		fontSize: 24,
		fontWeight: "700",
		color: "#111827",
		textAlign: "center",
		marginBottom: 12,
	},
	subtitle: {
		fontSize: 16,
		color: "#6b7280",
		textAlign: "center",
		lineHeight: 24,
		paddingHorizontal: 8,
	},
	emailText: {
		fontWeight: "600",
		color: "#111827",
	},
	form: {
		flex: 1,
	},
	label: {
		fontSize: 16,
		fontWeight: "600",
		color: "#374151",
		marginBottom: 8,
	},
	input: {
		borderWidth: 1,
		borderColor: "#d1d5db",
		borderRadius: 8,
		paddingHorizontal: 16,
		paddingVertical: 12,
		fontSize: 16,
		backgroundColor: "#fff",
	},
	inputError: {
		borderColor: "#ef4444",
	},
	errorText: {
		color: "#ef4444",
		fontSize: 14,
		marginTop: 8,
	},
	infoBox: {
		backgroundColor: "#f9fafb",
		borderRadius: 8,
		padding: 16,
		marginTop: 24,
	},
	infoTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#374151",
		marginBottom: 4,
	},
	infoText: {
		fontSize: 14,
		color: "#6b7280",
		lineHeight: 20,
	},
	actions: {
		paddingBottom: 32,
	},
	button: {
		backgroundColor: "#111827",
		borderRadius: 8,
		paddingVertical: 16,
		alignItems: "center",
		marginBottom: 16,
	},
	buttonDisabled: {
		backgroundColor: "#9ca3af",
	},
	buttonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
	buttonTextDisabled: {
		color: "#d1d5db",
	},
	buttonSecondary: {
		borderWidth: 1,
		borderColor: "#d1d5db",
		borderRadius: 8,
		paddingVertical: 16,
		alignItems: "center",
	},
	buttonSecondaryText: {
		color: "#374151",
		fontSize: 16,
		fontWeight: "600",
	},
	legalText: {
		fontSize: 12,
		color: "#9ca3af",
		textAlign: "center",
		lineHeight: 18,
	},
});
