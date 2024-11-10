import dayjs from "dayjs";
import { ColorPalette } from "../features/settings/hooks/useColorService";
import { DateRange } from "../models/DateRange";

export function maybeDate(date: Date | null): Date | null {
  if (date === null) {
    return null;
  }

  return dayjs(date).toDate();
}

export function maybeFormattedDate(
  date: Date | null,
  format: string
): string | null {
  if (date === null) {
    return null;
  }

  return dayjs(date).format(format);
}

export const getDayRangeProps =
  (range: DateRange, colorPalette: ColorPalette) => (day?: Date) => {
    if (
      !!range &&
      (dayjs(range[0]).isSame(day) || dayjs(range[1]).isSame(day))
    ) {
      return {
        style: {
          background: colorPalette?.background,
          color: colorPalette?.color,
        },
      };
    }
    return {};
  };

export const getDayProps =
  (existing: Date | null, colorPalette: ColorPalette) => (day?: Date) => {
    if (dayjs(existing).isSame(day)) {
      return {
        style: {
          background: colorPalette?.background,
          color: colorPalette?.color,
        },
      };
    }

    return {};
  };