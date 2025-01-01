import { Card, Group, Modal, ScrollArea, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconFilter, IconFilterFilled } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

import dayjs from "dayjs";
import StyledActionIcon from "../../components/StyledActionIcon";
import { MetricsBucket } from "../../models/ZodModels";
import { showErrorNotification } from "../../utilities/notificationUtilities";
import { useGetAllTags } from "../tags/services/tagService";
import MetricsChart from "./MetricsChart";
import MetricsFilter from "./MetricsFilter";
import MetricsSummaryComponent from "./MetricsSummary";
import { useGetMetrics, useMetricsStore } from "./services/metricsService";
import {
  FilterFormInputs,
  MetricsFilterCriteria,
  MetricsSearchCriteria,
} from "./types";

function Metrics() {
  const [filterOpened, filterActions] = useDisclosure(false);

  const startDate = useMetricsStore((store) => store.startDate);
  const setStartDate = useMetricsStore((store) => store.setStartDate);
  const endDate = useMetricsStore((store) => store.endDate);
  const setEndDate = useMetricsStore((store) => store.setEndDate);
  const selectedTags = useMetricsStore((store) => store.selectedTags);
  const setSelectedTags = useMetricsStore((store) => store.setSelectedTags);

  const [filterInputs, setFilterInputs] = useState<FilterFormInputs>({
    startDate: undefined,
    endDate: undefined,
    tags: undefined,
  });

  const isFiltered = useMemo(() => {
    return (
      filterInputs.startDate !== undefined &&
      filterInputs.endDate !== undefined &&
      filterInputs.tags !== undefined
    );
  }, [filterInputs]);

  useEffect(() => {
    setFilterInputs({
      startDate,
      endDate,
      tags: selectedTags?.map((t) => t.value),
    });
  }, [startDate, endDate, selectedTags]);

  const metricsFilterCriteria = useMemo(() => {
    return {
      startDate: startDate ?? new Date(),
      endDate: endDate ?? new Date(),
      tags: selectedTags ?? [],
    };
  }, [startDate, endDate, selectedTags]);

  function generateSearchCriteria(
    filterCriteria: MetricsFilterCriteria
  ): MetricsSearchCriteria {
    const start = dayjs(filterCriteria.startDate).startOf("day");
    const end = dayjs(filterCriteria.endDate).startOf("day");

    const buckets: MetricsBucket[] = [];

    let currentDay = start;

    while (currentDay.isBefore(end, "day") || currentDay.isSame(end, "day")) {
      const endDate = currentDay.add(1, "day");

      const bucket = {
        startDate: currentDay.toISOString(),
        endDate: endDate.toISOString(),
        hours: 0,
      };

      buckets.push(MetricsBucket.parse(bucket));

      currentDay = endDate;
    }

    return {
      tags: filterCriteria.tags,
      buckets,
    };
  }

  const metricsSearchCriteria = useMemo(() => {
    return generateSearchCriteria(metricsFilterCriteria);
  }, [metricsFilterCriteria]);

  const { data: tagOptions } = useGetAllTags();

  const { data: metricsSummary, error } = useGetMetrics(metricsSearchCriteria);

  useEffect(() => {
    if (error) {
      showErrorNotification(error);
    }
  }, [error]);

  const applyFilter = async (inputs: MetricsFilterCriteria) => {
    setStartDate(inputs.startDate);
    setEndDate(inputs.endDate);
    setSelectedTags([...inputs.tags]);
    filterActions.close();
  };
  const clearFilter = () => {
    setFilterInputs({
      startDate: undefined,
      endDate: undefined,
      tags: undefined,
    });
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedTags(undefined);
    filterActions.close();
  };

  const graphSection = isFiltered ? (
    <div>
      <Card withBorder>
        <MetricsSummaryComponent summary={metricsSummary.summary} />
      </Card>
      <Card withBorder>
        <MetricsChart workHistory={metricsSummary.workHistory} />
      </Card>
    </div>
  ) : (
    <Stack gap="sm">
      <Text size="md">
        Let&apos;s get started! Pick some filter options to view your data.
      </Text>
    </Stack>
  );

  return (
    <Stack m={25}>
      <Card>
        <Stack h="100%">
          <Group justify="space-between">
            <Text size="xl">Metrics</Text>
            <Group>
              <StyledActionIcon
                onClick={filterActions.open}
                tooltipLabel="Filter Data"
                tooltipPosition="left"
              >
                {isFiltered ? <IconFilterFilled /> : <IconFilter />}
              </StyledActionIcon>
            </Group>
          </Group>
          {graphSection}
          <Modal
            closeOnClickOutside={false}
            closeOnEscape={false}
            opened={filterOpened}
            onClose={filterActions.close}
            title="Filters"
            scrollAreaComponent={ScrollArea.Autosize}
          >
            <MetricsFilter
              filterInputs={filterInputs}
              tagOptions={tagOptions}
              onFilterCleared={clearFilter}
              onFilterApplied={applyFilter}
            />
          </Modal>
        </Stack>
      </Card>
    </Stack>
  );
}

export default Metrics;
