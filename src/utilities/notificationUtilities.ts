import { notifications } from "@mantine/notifications";

export function showSuccessNotification(message: string, duration: number = 4000) {
    notifications.show({
        title: "Success",
        message: message,
        autoClose: duration,
        color: "cyan",
        withBorder: true,
    });
}

export function showErrorNotification(context: string, error: string, duration: number = 8000) {
    notifications.show({
        title: "Failure",
        message: `Error ${context}: '${error}'`,
        autoClose: duration,
        color: "red",
        withBorder: true,
    });
}