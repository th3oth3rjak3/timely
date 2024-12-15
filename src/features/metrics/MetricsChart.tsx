import { Stack, Text, useMantineTheme } from "@mantine/core";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import useColorPalette from "../../hooks/useColorPalette";
import { DailyWorkHistory } from "../../models/ZodModels";


export interface MetricsChartProps {
  workHistory: DailyWorkHistory[];
};

function MetricsChart({ workHistory }: MetricsChartProps) {
  // Helper function to aggregate data by day
  const aggregateWorkByDay = (workHistory: DailyWorkHistory[]) => {
    const aggregatedData: { [key: string]: number } = {};

    workHistory.forEach(({ dayWorked, hoursWorked }) => {
      const date = dayWorked.toISOString().split("T")[0]; // Format the date as YYYY-MM-DD
      if (!aggregatedData[date]) {
        aggregatedData[date] = 0;
      }
      aggregatedData[date] += hoursWorked;
    });

    return aggregatedData;
  };

  // Prepare chart data
  const prepareChartData = (workHistory: DailyWorkHistory[]) => {
    const aggregatedData = aggregateWorkByDay(workHistory);

    const labels = Object.keys(aggregatedData); // Array of dates (x-axis)
    const data = Object.values(aggregatedData); // Array of hours worked (y-axis)

    // Return the data format that Recharts expects
    return labels.map((label, index) => ({
      date: label,
      hours: data[index].toFixed(1),
    }));
  };

  // Prepare the chart data using the metricsSummary
  const chartData = prepareChartData(workHistory);

  const colorPalette = useColorPalette();
  const theme = useMantineTheme();
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
            fill="rgba(76, 175, 80, 0.2)"
          />
        </LineChart>
      </ResponsiveContainer>
    </Stack>
  );
}

export default MetricsChart;
