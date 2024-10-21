import { notifications } from "@mantine/notifications";
import { Stringer } from "./formUtilities";

export function showSuccessNotification<T extends Stringer>(message: T, duration: number = 4000) {
    notifications.show({
        title: "Success",
        message: message.toString(),
        autoClose: duration,
        color: "cyan",
        withBorder: true,
    });
}

export function showErrorNotification<T extends Stringer>(error: T, duration: number = 8000) {
    notifications.show({
        title: "Failure",
        message: `Error: '${error.toString()}'`,
        autoClose: duration,
        color: "red",
        withBorder: true,
    });
}