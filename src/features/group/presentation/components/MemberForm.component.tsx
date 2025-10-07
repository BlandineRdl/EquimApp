import { StyleSheet, Text, TextInput, View } from "react-native";

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
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>Vos informations</Text>

      <TextInput
        style={styles.input}
        placeholder="Votre pseudo"
        value={pseudo}
        onChangeText={onPseudoChange}
      />

      <TextInput
        style={styles.input}
        placeholder="Revenu mensuel (€)"
        value={monthlyIncome}
        onChangeText={onIncomeChange}
        keyboardType="numeric"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    marginBottom: 32,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
});
