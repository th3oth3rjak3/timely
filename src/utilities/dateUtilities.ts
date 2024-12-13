import dayjs from "dayjs";
import { ColorPalette } from "../features/settings/hooks/useColorService";
import { DateRange } from "../models/DateRange";

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

export const getDayOnlyProps =
  (existing: Date | null, colorPalette: ColorPalette) => (day?: Date) => {
    if (dayjs(existing).isSame(day, "day")) {
      return {
        style: {
          background: colorPalette?.background,
          color: colorPalette?.color,
        },
      };
    }

    return {};
  };

export const maybeDate = (value: string | null): Date | null => {
  return value === null ? null : new Date(value);
};

export const toDate = (value: string): Date => {
  return new Date(value);
};