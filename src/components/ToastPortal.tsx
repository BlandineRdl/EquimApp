import { Portal } from "@gorhom/portal";
import Toast from "react-native-toast-message";

export function ToastPortal() {
	return (
		<Portal hostName="toast">
			<Toast />
		</Portal>
	);
}
