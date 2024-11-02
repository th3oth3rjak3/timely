import { parseISO, toDate } from "date-fns";
import { toZonedTime } from "date-fns-tz";
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

export function convertUtcToLocal(utcDateString: string): Date {
    console.log("input: ", utcDateString);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log("timezone: ", timezone);
    const dateUtc = parseISO(utcDateString);
    const localDate = toZonedTime(dateUtc, timezone);
    console.log(`Local Attempt: ${toDate(dateUtc).toLocaleTimeString()}`)
    return toDate(dateUtc);
}

export function tryConvertUtcToLocal(utcDateString: string | null): Date | null {
    if (utcDateString === null) return null;
    const dateUtc = parseISO(utcDateString);
    return toDate(dateUtc);
} 