import { Plus, X } from "lucide-react-native";
import type React from "react";
import { useState } from "react";
import { Pressable } from "react-native";
import { ScrollView, Text, useTheme, XStack, YStack } from "tamagui";
import { Button } from "../../../../components/Button";
import { Input } from "../../../../components/Input";

export interface AddExpenseFormProps {
  onSubmit: (expense: { name: string; amount: number }) => void;
  onCancel: () => void;
}

export const AddExpenseForm: React.FC<AddExpenseFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const theme = useTheme();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  const handleAmountChange = (text: string) => {
    const cleanAmount = text.replace(/[^0-9.]/g, "");
    setAmount(cleanAmount);
  };

  const handleSubmit = () => {
    if (name.trim() && amount.trim()) {
      const numericAmount = parseFloat(amount);
      if (numericAmount > 0) {
        onSubmit({ name: name.trim(), amount: numericAmount });
        setName("");
        setAmount("");
      }
    }
  };

  const canSubmit = name.trim().length > 0 && parseFloat(amount) > 0;

  return (
    <YStack
      backgroundColor="$background"
      borderRadius="$md"
      padding="$md"
      maxHeight="80%"
    >
      <XStack
        justifyContent="space-between"
        alignItems="center"
        marginBottom="$lg"
      >
        <Text fontSize={20} fontWeight="700" color="$color">
          Ajouter une dépense
        </Text>
        <Pressable onPress={onCancel} style={{ padding: 4 }}>
          <X size={24} color={theme.gray700.val} />
        </Pressable>
      </XStack>

      <ScrollView marginBottom="$lg">
        <YStack marginBottom="$md">
          <Text
            fontSize={14}
            fontWeight="600"
            color="$gray900"
            marginBottom="$xs"
          >
            Nom de la dépense
          </Text>
          <Input
            placeholder="Ex: Loyer, Électricité..."
            value={name}
            onChangeText={setName}
            maxLength={50}
          />
        </YStack>

        <YStack marginBottom="$md">
          <Text
            fontSize={14}
            fontWeight="600"
            color="$gray900"
            marginBottom="$xs"
          >
            Montant mensuel
          </Text>
          <XStack alignItems="center" gap="$xs">
            <Input
              flex={1}
              placeholder="0.00"
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              maxLength={10}
            />
            <Text fontSize={16} color="$colorSecondary">
              €
            </Text>
          </XStack>
        </YStack>
      </ScrollView>

      <YStack gap="$sm">
        <Button
          variant="success"
          onPress={handleSubmit}
          disabled={!canSubmit}
          icon={<Plus size={20} color={theme.white.val} />}
        >
          Ajouter
        </Button>
        <Button variant="secondary" onPress={onCancel}>
          Annuler
        </Button>
      </YStack>
    </YStack>
  );
};
