import { Stack, Text, useMantineTheme } from "@mantine/core";
import dayjs from "dayjs";
import {
  CartesianGrid,
  Label,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import useColorPalette from "../../hooks/useColorPalette";
import { MetricsBucket } from "../../models/ZodModels";

export interface MetricsChartProps {
  workHistory: MetricsBucket[];
}

function MetricsChart({ workHistory }: MetricsChartProps) {
  // Helper function to aggregate data by day
  const aggregateWorkByDay = (workHistory: MetricsBucket[]) => {
    const aggregatedData: { [key: string]: number | null } = {};

    workHistory.forEach(({ startDate, hours }) => {
      const date = startDate.toISOString().split("T")[0]; // Format the date as YYYY-MM-DD
      if (!aggregatedData[date]) {
        aggregatedData[date] = 0;
      }
      aggregatedData[date] += hours;
      // Remove data points in the future, but keep the dates on the axis.
      if (dayjs(startDate).isAfter(dayjs())) {
        aggregatedData[date] = null;
      }
    });

    return aggregatedData;
  };

  // Prepare chart data
  const prepareChartData = (workHistory: MetricsBucket[]) => {
    const aggregatedData = aggregateWorkByDay(workHistory);

    const labels = Object.keys(aggregatedData); // Array of dates (x-axis)
    const data = Object.values(aggregatedData); // Array of hours worked (y-axis)

    // Return the data format that Recharts expects
    return labels.map((label, index) => ({
      date: label,
      hours: data[index]?.toFixed(1),
    }));
  };

  // Prepare the chart data using the metricsSummary
  const chartData = prepareChartData(workHistory);

  const colorPalette = useColorPalette();
  const theme = useMantineTheme();
  const date = dayjs().startOf("day").toDate().toISOString().split("T")[0];
  return (
    <Stack align="center">
      <Text size="xl" fw={500}>
        Hours Worked per Day
      </Text>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ bottom: 60, right: 50, top: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" angle={-60} textAnchor="end" />
          <YAxis />
          <Tooltip
            contentStyle={{
              backgroundColor: "#333",
            }}
          />
          <Line
            type="monotone"
            dataKey="hours"
            name="Hours Worked"
            stroke={theme.colors[colorPalette.colorName][5]}
            strokeWidth={3}
            fill={theme.colors[colorPalette.colorName][5]}
          />
          <ReferenceLine
            x={date}
            stroke={theme.colors[colorPalette.colorName][5]}
            strokeDasharray={10}
            strokeWidth={2}
          >
            <Label
              value="Today"
              position={"insideTopRight"}
              style={{
                fill: theme.colors[colorPalette.colorName][2],
                padding: "5px 10px",
                borderRadius: "5px",
                textAlign: "center",
              }}
            />
          </ReferenceLine>
        </LineChart>
      </ResponsiveContainer>
    </Stack>
  );
}

export default MetricsChart;
