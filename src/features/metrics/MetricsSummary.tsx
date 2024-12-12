import { Card, Grid, Stack, Text } from "@mantine/core";
import { StatisticalSummary } from "./types";

type MetricsSummaryProps = {
  summary: StatisticalSummary;
};

const MetricsSummaryComponent = ({ summary }: MetricsSummaryProps) => {
  return (
    <Grid align="center" justify="center">
      <Grid.Col span={3}>
        <Card withBorder>
          <Stack align="center" justify="center">
            <Text fw={500} td="underline" ta="center">
              Tasks
              <br />
              Started
            </Text>
            <Text>{summary.tasksStarted}</Text>
          </Stack>
        </Card>
      </Grid.Col>
      <Grid.Col span={3}>
        <Card withBorder>
          <Stack align="center">
            <Text fw={500} td="underline" ta="center">
              Tasks
              <br />
              Completed
            </Text>
            <Text>{summary.tasksCompleted}</Text>
          </Stack>
        </Card>
      </Grid.Col>
      <Grid.Col span={3}>
        <Card withBorder>
          <Stack align="center">
            <Text fw={500} td="underline" ta="center">
              Tasks
              <br />
              Worked
            </Text>
            <Text>{summary.tasksWorked}</Text>
          </Stack>
        </Card>
      </Grid.Col>
      <Grid.Col span={3}>
        <Card withBorder>
          <Stack align="center">
            <Text fw={500} td="underline" ta="center">
              Hours
              <br />
              Worked
            </Text>
            <Text>{summary.hoursWorked.toFixed(1)}</Text>
          </Stack>
        </Card>
      </Grid.Col>
    </Grid>
  );
};

export default MetricsSummaryComponent;
