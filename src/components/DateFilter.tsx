import {Group, Stack} from "@mantine/core";
import {DatePicker} from "@mantine/dates";
import dayjs from "dayjs";
import {useEffect, useMemo, useState} from "react";
import useColorPalette from "../hooks/useColorPalette";
import {DateRange, toDateFilter as toDateRangeFilter,} from "../models/DateRange";
import {DateRangeFilter} from "../models/DateRangeFilter";
import {getDayRangeProps} from "../utilities/dateUtilities";
import StyledButton from "./StyledButton";

export interface DateFilterProps {
  filter: DateRangeFilter | null;
  onRangeChanged: (value: DateRangeFilter | null) => void;
  showButtons?: boolean;
}

function DateFilter({onRangeChanged, filter, showButtons}: DateFilterProps) {
  const colorPalette = useColorPalette();

  const startDate = useMemo(() => {
    if (filter?.start === null || filter?.start === undefined) {
      return null;
    }

    return dayjs(filter.start).startOf("day").toDate();
  }, [filter]);

  const endDate = useMemo(() => {
    if (filter?.end === null || filter?.end === undefined) {
      return null;
    }

    return dayjs(filter.end).startOf("day").toDate();
  }, [filter]);

  const [dateRange, setDateRange] = useState<DateRange>([startDate, endDate]);

  useEffect(() => {
    setDateRange([startDate, endDate]);
  }, [startDate, endDate]);

  function isEmptyRange(range: DateRange): boolean {
    return range[0] === null && range[1] === null;
  }

  function isFullRange(range: DateRange): boolean {
    return range[0] !== null && range[1] !== null;
  }

  function updateDateRange(dates: DateRange) {
    setDateRange(dates);
    if (isEmptyRange(dates)) {
      onRangeChanged(null);
    }

    if (isFullRange(dates)) {
      onRangeChanged(toDateRangeFilter(dates));
    }
  }

  return (
    <Stack>
      <DatePicker
        type="range"
        value={dateRange}
        getDayProps={getDayRangeProps(dateRange, colorPalette)}
        onChange={(dates) => updateDateRange(dates)}
        highlightToday
        allowSingleDateInRange
      />
      {showButtons === undefined || showButtons === true ? (
        <Group justify="center">
          <StyledButton
            label="Today"
            onClick={() =>
              updateDateRange([
                dayjs().startOf("day").toDate(),
                dayjs().endOf("day").toDate(),
              ])
            }
          />
          <StyledButton
            label="Clear"
            onClick={() => updateDateRange([null, null])}
          />
        </Group>
      ) : null}
    </Stack>
  );
}

export default DateFilter;
