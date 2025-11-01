import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, ScrollView } from "react-native";
import { Text, YStack } from "tamagui";
import { logger } from "../lib/logger";

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
    // Log error
    logger.error("ErrorBoundary caught an error", error, { errorInfo });

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
        <YStack
          flex={1}
          backgroundColor="$backgroundSecondary"
          justifyContent="center"
          alignItems="center"
          padding="$lg"
          accessibilityLiveRegion="assertive"
          accessible={true}
          accessibilityLabel="Erreur survenue"
        >
          <YStack
            maxWidth={400}
            width="100%"
            backgroundColor="$background"
            borderRadius="$md"
            padding="$lg"
            alignItems="center"
            shadowColor="$black"
            shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={0.1}
            shadowRadius={8}
            elevation={3}
          >
            <Text fontSize={64} marginBottom="$base">
              ⚠️
            </Text>
            <Text
              fontSize={20}
              fontWeight="600"
              color="$gray900"
              marginBottom="$xs"
              textAlign="center"
              accessibilityRole="header"
            >
              Oups, une erreur est survenue
            </Text>
            <Text
              fontSize={16}
              color="$colorSecondary"
              marginBottom="$lg"
              textAlign="center"
              lineHeight={24}
              accessibilityLiveRegion="polite"
            >
              {this.state.error.message ||
                "Une erreur inattendue s'est produite"}
            </Text>
            {__DEV__ && (
              <YStack
                width="100%"
                backgroundColor="$backgroundSecondary"
                borderRadius="$sm"
                padding="$sm"
                marginBottom="$lg"
                maxHeight={200}
              >
                <Text
                  fontSize={14}
                  fontWeight="600"
                  color="$gray900"
                  marginBottom="$sm"
                >
                  Détails (dev):
                </Text>
                <ScrollView style={{ maxHeight: 150 }}>
                  <Text fontSize={12} color="$colorSecondary">
                    {this.state.error.stack}
                  </Text>
                </ScrollView>
              </YStack>
            )}
            <Pressable
              onPress={this.resetError}
              accessibilityLabel="Réessayer"
              accessibilityRole="button"
              style={{
                backgroundColor: "$primary500",
                paddingHorizontal: 32,
                paddingVertical: 12,
                borderRadius: 8,
                minWidth: 120,
              }}
            >
              <Text
                color="$white"
                fontSize={16}
                fontWeight="600"
                textAlign="center"
              >
                Réessayer
              </Text>
            </Pressable>
          </YStack>
        </YStack>
      );
    }

    return this.props.children;
  }
}
