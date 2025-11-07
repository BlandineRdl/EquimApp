import { AlertTriangle, X } from "lucide-react-native";
import type React from "react";
import { useState } from "react";
import { Modal, Pressable } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { Button } from "../../../../components/Button";
import {
	SEMANTIC_COLORS,
	getTextColor,
} from "../../../../constants/theme.constants";
import { useThemeControl } from "../../../../lib/tamagui/theme-provider";
import { useAppDispatch } from "../../../../store/buildReduxStore";
import { deleteExpense } from "../../usecases/expense/deleteExpense.usecase";

interface DeleteExpenseConfirmModalProps {
	visible: boolean;
	onClose: () => void;
	expenseId: string;
	expenseName: string;
	expenseAmount: number;
	groupId: string;
}

export const DeleteExpenseConfirmModal: React.FC<
	DeleteExpenseConfirmModalProps
> = ({ visible, onClose, expenseId, expenseName, expenseAmount, groupId }) => {
	const dispatch = useAppDispatch();
	const { theme } = useThemeControl();
	const iconColor = getTextColor(theme);
	const iconError = SEMANTIC_COLORS.ERROR;
	const [loading, setLoading] = useState(false);

	const handleConfirm = async () => {
		try {
			setLoading(true);
			await dispatch(deleteExpense({ groupId, expenseId })).unwrap();
			onClose();
		} catch (_error) {
			// Error toast handled by listener
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onClose}
		>
			<YStack
				flex={1}
				backgroundColor="rgba(0, 0, 0, 0.5)"
				justifyContent="center"
				alignItems="center"
				padding="$lg"
			>
				<YStack
					width="100%"
					maxWidth={400}
					backgroundColor="$background"
					borderRadius="$xl"
					padding="$xl"
				>
					{/* Header */}
					<XStack
						justifyContent="space-between"
						alignItems="center"
						marginBottom="$lg"
					>
						<Text fontSize={18} fontWeight="600" color="$color">
							Supprimer cette dépense ?
						</Text>
						<Pressable onPress={onClose} style={{ padding: 4 }}>
							<X size={20} color={iconColor} />
						</Pressable>
					</XStack>

					{/* Icon */}
					<YStack alignItems="center" marginBottom="$lg">
						<AlertTriangle size={64} color={iconError} />
					</YStack>

					{/* Content */}
					<Text
						fontSize={18}
						fontWeight="600"
						color="$color"
						textAlign="center"
						marginBottom="$sm"
					>
						{expenseName} -{" "}
						{expenseAmount.toLocaleString("fr-FR", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}{" "}
						€
					</Text>
					<Text
						fontSize={16}
						color="$colorSecondary"
						textAlign="center"
						marginBottom="$xl"
						lineHeight={24}
					>
						Cette dépense sera définitivement supprimée. Les quotes-parts seront
						recalculées automatiquement pour tous les membres du groupe.
					</Text>

					{/* Actions */}
					<YStack gap="$md">
						<Button variant="error" onPress={handleConfirm} disabled={loading}>
							<Text fontSize={16} fontWeight="600" color="$white">
								{loading ? "Suppression..." : "Supprimer la dépense"}
							</Text>
						</Button>

						<Button variant="secondary" onPress={onClose} disabled={loading}>
							<Text fontSize={16} fontWeight="600" color="$colorSecondary">
								Annuler
							</Text>
						</Button>
					</YStack>
				</YStack>
			</YStack>
		</Modal>
	);
};
