import { Text, YStack } from "tamagui";
import { Input } from "../../../../../components/Input";

interface MemberFormProps {
  pseudo: string;
  monthlyIncome: string;
  onPseudoChange: (text: string) => void;
  onIncomeChange: (text: string) => void;
}

export const MemberForm = ({
  pseudo,
  monthlyIncome,
  onPseudoChange,
  onIncomeChange,
}: MemberFormProps) => {
  return (
    <YStack marginBottom="$xl">
      <Text fontSize={18} fontWeight="600" color="$color" marginBottom="$base">
        Vos informations
      </Text>

      <Input
        placeholder="Votre pseudo"
        value={pseudo}
        onChangeText={onPseudoChange}
        marginBottom="$base"
      />

      <Input
        placeholder="Revenu mensuel (€)"
        value={monthlyIncome}
        onChangeText={onIncomeChange}
        keyboardType="numeric"
      />
    </YStack>
  );
};
