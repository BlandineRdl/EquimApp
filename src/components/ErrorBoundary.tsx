import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface Props {
	children: ReactNode;
	fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 */
export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
		};
	}

	static getDerivedStateFromError(error: Error): State {
		return {
			hasError: true,
			error,
		};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		// Log error to console in development
		console.error("ErrorBoundary caught an error:", error, errorInfo);

		// TODO: Log to error reporting service (e.g., Sentry)
		// logErrorToService(error, errorInfo);
	}

	resetError = (): void => {
		this.setState({
			hasError: false,
			error: null,
		});
	};

	render(): ReactNode {
		if (this.state.hasError && this.state.error) {
			// Custom fallback UI
			if (this.props.fallback) {
				return this.props.fallback(this.state.error, this.resetError);
			}

			// Default fallback UI
			return (
				<View style={styles.container}>
					<View style={styles.content}>
						<Text style={styles.emoji}>⚠️</Text>
						<Text style={styles.title}>Oups, une erreur est survenue</Text>
						<Text style={styles.message}>
							{this.state.error.message || "Une erreur inattendue s'est produite"}
						</Text>
						{__DEV__ && (
							<View style={styles.debugContainer}>
								<Text style={styles.debugTitle}>Détails (dev):</Text>
								<Text style={styles.debugText}>{this.state.error.stack}</Text>
							</View>
						)}
						<TouchableOpacity
							style={styles.button}
							onPress={this.resetError}
							accessibilityLabel="Réessayer"
							accessibilityRole="button"
						>
							<Text style={styles.buttonText}>Réessayer</Text>
						</TouchableOpacity>
					</View>
				</View>
			);
		}

		return this.props.children;
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f8f9fa",
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	content: {
		maxWidth: 400,
		width: "100%",
		backgroundColor: "#ffffff",
		borderRadius: 12,
		padding: 24,
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 3,
	},
	emoji: {
		fontSize: 64,
		marginBottom: 16,
	},
	title: {
		fontSize: 20,
		fontWeight: "600",
		color: "#1f2937",
		marginBottom: 8,
		textAlign: "center",
	},
	message: {
		fontSize: 16,
		color: "#6b7280",
		marginBottom: 24,
		textAlign: "center",
		lineHeight: 24,
	},
	debugContainer: {
		width: "100%",
		backgroundColor: "#f3f4f6",
		borderRadius: 8,
		padding: 12,
		marginBottom: 24,
		maxHeight: 200,
	},
	debugTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#374151",
		marginBottom: 8,
	},
	debugText: {
		fontSize: 12,
		color: "#6b7280",
		fontFamily: "monospace",
	},
	button: {
		backgroundColor: "#3b82f6",
		paddingHorizontal: 32,
		paddingVertical: 12,
		borderRadius: 8,
		minWidth: 120,
	},
	buttonText: {
		color: "#ffffff",
		fontSize: 16,
		fontWeight: "600",
		textAlign: "center",
	},
});
