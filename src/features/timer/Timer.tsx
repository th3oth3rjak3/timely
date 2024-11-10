import { Group, Stack, Text } from "@mantine/core";
import CountdownTimer from "./CountdownTimer";

function Timer() {
  return (
    <Stack m={25}>
      <Group justify="space-between">
        <Text size="xl">Timer</Text>
      </Group>
      <CountdownTimer />
    </Stack>
  );
}

export default Timer;
