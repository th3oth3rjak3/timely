import { Stack } from "@mantine/core";
import CountdownTimer from "./CountdownTimer";

function Timer() {
  return (
    <Stack m={25}>
      <CountdownTimer />
    </Stack>
  );
}

export default Timer;
