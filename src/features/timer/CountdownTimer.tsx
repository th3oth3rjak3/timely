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
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  pauseTimer,
  resetTimer,
  resetToDefault,
  setHours,
  setMinutes,
  setSeconds,
  setTimeoutMessage,
  startTimer,
} from "../../redux/reducers/timerSlice";
import { createRange } from "../../utilities/rangeUtilities";

function CountdownTimer() {
  const { time, isActive, isPaused, hours, minutes, seconds } = useAppSelector(
    (state) => state.timer
  );
  const message = useAppSelector((state) => state.timer.message);
  const dispatch = useAppDispatch();

  const displayTime = useMemo(() => {
    return TimeSpan.fromSeconds(time).toString();
  }, [time]);

  const handleTimerToggle = () => {
    if (!isActive || isPaused || time === 0) {
      dispatch(startTimer());
    } else {
      dispatch(pauseTimer());
    }
  };

  const handleTimerReset = () => {
    dispatch(resetTimer());
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
            <StyledButton label="Reset" onClick={handleTimerReset} />
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
                      onChange={(value) => dispatch(setHours(Number(value)))}
                    ></Select>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Select
                      disabled={isActive}
                      label="Minutes"
                      data={createRange(0, 59).map((m) => m.toString())}
                      value={minutes.toString()}
                      onChange={(value) => dispatch(setMinutes(Number(value)))}
                    ></Select>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Select
                      disabled={isActive}
                      label="Seconds"
                      data={createRange(0, 59).map((m) => m.toString())}
                      value={seconds.toString()}
                      onChange={(value) => dispatch(setSeconds(Number(value)))}
                    ></Select>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <TextInput
                      disabled={isActive}
                      label="Notification Message"
                      value={message}
                      onChange={(m) =>
                        dispatch(setTimeoutMessage(m.currentTarget.value))
                      }
                    ></TextInput>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <StyledButton
                      label="Reset To Default"
                      onClick={() => dispatch(resetToDefault())}
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
