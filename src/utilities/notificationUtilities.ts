import { notifications } from "@mantine/notifications";

const autoCloseDuration: number = 8000;

export function showSuccessNotification(message: string) {
    notifications.show({
        title: "Success",
        message: message,
        autoClose: autoCloseDuration,
        color: "cyan",
        withBorder: true,
    });
}

export function showErrorNotification(context: string, error: string) {
    notifications.show({
        title: "Failure",
        message: `Error ${context}: '${error}'`,
        autoClose: autoCloseDuration,
        color: "red",
        withBorder: true,
    });
}