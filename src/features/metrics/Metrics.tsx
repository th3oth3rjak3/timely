import { Card, Group, Modal, ScrollArea, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconFileExport,
  IconFilter,
  IconFilterFilled,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Tag } from "../tags/types/Tag";

import StyledActionIcon from "../../components/StyledActionIcon";
import useTagService from "../tags/hooks/useTagService";
import useMetricsService from "./hooks/useMetricsService";
import MetricsChart from "./MetricsChart";
import MetricsFilter from "./MetricsFilter";
import MetricsSummaryComponent from "./MetricsSummary";
import {
  FilterFormInputs,
  MetricsFilterCriteria,
  MetricsSummary,
} from "./types";

function Metrics() {
  const [tagOptions, setTagOptions] = useState<Tag[]>([]);
  const [filterOpened, filterActions] = useDisclosure(false);
  const [filterInputs, setFilterInputs] = useState<FilterFormInputs>({
    startDate: undefined,
    endDate: undefined,
    tags: undefined,
  });
  const { getAllTags } = useTagService(tagOptions.length);
  const { getMetrics } = useMetricsService();
  const emptyData: MetricsSummary = {
    startDate: new Date(),
    endDate: new Date(),
    selectedTags: [],
    summary: {
      tasksStarted: 0,
      tasksCompleted: 0,
      tasksWorked: 0,
      hoursWorked: 0,
    },
    workHistory: [],
  };

  const [metricsSummary, setMetricsSummary] =
    useState<MetricsSummary>(emptyData);

  useEffect(() => {
    getAllTags().then((tags) => setTagOptions(tags ?? []));
  }, []);

  const applyFilter = async (inputs: MetricsFilterCriteria) => {
    setIsFiltered(true);
    setFilterInputs({ ...inputs, tags: inputs.tags.map((tag) => tag.value) });
    filterActions.close();
    const result = await getMetrics(inputs);
    if (result !== null) {
      setMetricsSummary(result);
    }
  };
  const clearFilter = () => {
    setIsFiltered(false);
    setFilterInputs({
      startDate: undefined,
      endDate: undefined,
      tags: undefined,
    });
    filterActions.close();
  };

  const [isFiltered, setIsFiltered] = useState(false);

  const exportMetrics = () => {
    // TODO: figure out how we want to export the metrics.
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
        Let's get started! Pick some filter options to view your data.
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
              {isFiltered ? (
                <StyledActionIcon
                  onClick={exportMetrics}
                  tooltipLabel="Export"
                  tooltipPosition="left"
                >
                  <IconFileExport />
                </StyledActionIcon>
              ) : null}
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
