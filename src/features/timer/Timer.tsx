import * as Mantine from "../../mantine";
import CountdownTimer from "./CountdownTimer";

function Timer() {


  return (
    <Mantine.Stack m={25}>
      <Mantine.Group justify="space-between">
        <Mantine.Text size="xl">Timer</Mantine.Text>
      </Mantine.Group>
      <CountdownTimer />
    </Mantine.Stack>
  );
}

export default Timer;
