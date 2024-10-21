import { InvokeArgs, invoke as tauriInvoke } from "@tauri-apps/api/core";
import { showErrorNotification, showSuccessNotification } from "../utilities/notificationUtilities";

const useTauri = () => {
    type Props = {
        command: string,
        params?: InvokeArgs,
        successMessage?: string,
        callback?: () => void | Promise<void>
    }

    async function invoke<T>({
        command,
        params,
        successMessage,
        callback }: Props
    ): Promise<T | undefined> {

        try {
            const result = await tauriInvoke<T>(command, params);
            if (callback) {
                await callback();
            }
            if (successMessage) {
                showSuccessNotification(successMessage);
            }

            return result;
        }
        catch (error: any) {
            showErrorNotification(error);
        }
    }

    return { invoke };

}

export default useTauri;