import dayjs from "dayjs";

export function maybeDate(date: Date | null): Date | null {
    if (date === null) {
        return null;
    }

    return dayjs(date).toDate();
}

export function maybeFormattedDate(date: Date | null, format: string): string | null {
    if (date === null) {
        return null;
    }

    return dayjs(date).format(format);
}