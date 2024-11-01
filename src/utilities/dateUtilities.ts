import dayjs from "dayjs";

export function maybeDate(date: Date | null): Date | null {
    if (date === null) {
        return null;
    }
    console.log(JSON.stringify(date, undefined, 2));

    const ret = dayjs(date).toDate();
    console.log(JSON.stringify(ret, undefined, 2));
    return ret;
}

export function maybeFormattedDate(date: Date | null, format: string): string | null {
    if (date === null) {
        return null;
    }

    return dayjs(date).format(format);
}