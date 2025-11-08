import type React from "react";
import Toast from "react-native-toast-message";
import { Text, YStack } from "tamagui";
import { Button } from "../../../../../components/Button";
import { Input } from "../../../../../components/Input";
import { useAppDispatch } from "../../../../../store/buildReduxStore";
import {
  closeAddMemberForm,
  updateAddMemberForm,
} from "../../../store/group.slice";
import { addMemberToGroup } from "../../../usecases/add-member/addMember.usecase";

interface AddMemberForm {
  groupId: string;
  pseudo: string;
  monthlyIncome: string;
}

interface AddMemberModalProps {
  visible: boolean;
  form: AddMemberForm | null;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  visible,
  form,
}) => {
  const dispatch = useAppDispatch();

  if (!visible || !form) return null;

  const handleAddMember = async () => {
    const pseudo = form.pseudo?.trim() || "";
    const income = form.monthlyIncome ? parseFloat(form.monthlyIncome) : 0;

    if (!pseudo) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Le nom est obligatoire",
      });
      return;
    }

    await dispatch(
      addMemberToGroup({
        groupId: form.groupId,
        memberData: {
          pseudo,
          monthlyIncome: income,
        },
      }),
    );
  };

  const onPseudoChange = (text: string) =>
    dispatch(updateAddMemberForm({ pseudo: text }));

  const onIncomeChange = (text: string) =>
    dispatch(updateAddMemberForm({ monthlyIncome: text }));

  const closeModal = () => dispatch(closeAddMemberForm());

  return (
    <YStack
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      backgroundColor="rgba(0, 0, 0, 0.5)"
      justifyContent="center"
      alignItems="center"
      padding="$lg"
    >
      <YStack
        backgroundColor="$background"
        borderRadius="$lg"
        padding="$xl"
        width="85%"
        maxWidth={400}
      >
        <Text fontSize={20} fontWeight="700" marginBottom="$sm" color="$color">
          Ajouter un membre fantôme
        </Text>
        <Text
          fontSize={14}
          color="$colorSecondary"
          marginBottom="$base"
          lineHeight={20}
        >
          💡 Le préfixe "Membre-" sera ajouté automatiquement
        </Text>
        <Input
          placeholder="Nom (ex: Bob)"
          value={form.pseudo}
          onChangeText={onPseudoChange}
          maxLength={50}
          marginBottom="$sm"
        />
        <Input
          placeholder="Revenu mensuel (€) - optionnel"
          keyboardType="numeric"
          value={form.monthlyIncome}
          onChangeText={onIncomeChange}
          marginBottom="$sm"
        />
        <Button variant="success" onPress={handleAddMember} marginBottom="$xs">
          Ajouter
        </Button>
        <Button variant="secondary" onPress={closeModal}>
          Annuler
        </Button>
      </YStack>
    </YStack>
  );
};
