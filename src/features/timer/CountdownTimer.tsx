import {
  Accordion,
  Card,
  Grid,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconClock } from "@tabler/icons-react";
import { useMemo } from "react";
import StyledButton from "../../components/StyledButton";
import { TimeSpan } from "../../models/TimeSpan";
import { createRange } from "../../utilities/rangeUtilities";
import { useTimerStore } from "./services/timerService";

function CountdownTimer() {
  const message = useTimerStore((store) => store.message);
  const time = useTimerStore((store) => store.time);
  const isActive = useTimerStore((store) => store.isActive);
  const isPaused = useTimerStore((store) => store.isPaused);
  const hours = useTimerStore((store) => store.hours);
  const setHours = useTimerStore((store) => store.setHours);
  const minutes = useTimerStore((store) => store.minutes);
  const setMinutes = useTimerStore((store) => store.setMinutes);
  const seconds = useTimerStore((store) => store.seconds);
  const setSeconds = useTimerStore((store) => store.setSeconds);
  const startTimer = useTimerStore((store) => store.startTimer);
  const pauseTimer = useTimerStore((store) => store.pauseTimer);
  const resetTimer = useTimerStore((store) => store.resetTimer);
  const setTimeoutMessage = useTimerStore((store) => store.setTimeoutMessage);
  const resetToDefault = useTimerStore((store) => store.resetToDefault);

  const displayTime = useMemo(() => {
    return TimeSpan.fromSeconds(time).toString();
  }, [time]);

  const handleTimerToggle = () => {
    if (!isActive || isPaused || time === 0) {
      startTimer();
    } else {
      pauseTimer();
    }
  };

  return (
    <Card shadow="lg" padding="lg">
      <Card.Section>
        <Stack align="center">
          <Text size="40px" fw={800} my="md">
            {displayTime}
          </Text>
          <Group mb="sm">
            <StyledButton
              label={isActive ? "Pause" : "Start"}
              onClick={handleTimerToggle}
            />
            <StyledButton label="Reset" onClick={resetTimer} />
          </Group>
          <Accordion variant="contained" w="100%" p="sm">
            <Accordion.Item value="time">
              <Accordion.Control icon={<IconClock />}>
                Settings
              </Accordion.Control>
              <Accordion.Panel>
                <Grid>
                  <Grid.Col span={4}>
                    <Select
                      disabled={isActive}
                      label="Hours"
                      data={createRange(0, 23).map((v) => v.toString())}
                      value={hours.toString()}
                      onChange={(value) => setHours(Number(value))}
                    ></Select>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Select
                      disabled={isActive}
                      label="Minutes"
                      data={createRange(0, 59).map((m) => m.toString())}
                      value={minutes.toString()}
                      onChange={(value) => setMinutes(Number(value))}
                    ></Select>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Select
                      disabled={isActive}
                      label="Seconds"
                      data={createRange(0, 59).map((m) => m.toString())}
                      value={seconds.toString()}
                      onChange={(value) => setSeconds(Number(value))}
                    ></Select>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <TextInput
                      disabled={isActive}
                      label="Notification Message"
                      value={message}
                      onChange={(m) => setTimeoutMessage(m.currentTarget.value)}
                    ></TextInput>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <StyledButton
                      label="Reset To Default"
                      onClick={resetToDefault}
                      disabled={isActive}
                    />
                  </Grid.Col>
                </Grid>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Stack>
      </Card.Section>
    </Card>
  );
}

export default CountdownTimer;
