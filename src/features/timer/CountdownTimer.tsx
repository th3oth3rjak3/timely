import { useMantineTheme } from "@mantine/core";
import { IconClock } from "@tabler/icons-react";
import { useMemo } from "react";
import StyledButton from "../../components/StyledButton";
import * as Mantine from "../../mantine";
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
import useColorService from "../settings/hooks/useColorService";

function CountdownTimer() {
  const { time, isActive, isPaused, hours, minutes, seconds } = useAppSelector(
    (state) => state.timer
  );
  const message = useAppSelector((state) => state.timer.message);
  const dispatch = useAppDispatch();

  const userSettings = useAppSelector((state) => state.settings.userSettings);
  const theme = useMantineTheme();
  const { colorPalette } = useColorService(theme, userSettings);

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
    <Mantine.Card shadow="lg" padding="lg">
      <Mantine.Card.Section>
        <Mantine.Stack align="center">
          <Mantine.Text size="40px" fw={800} my="md">
            {displayTime}
          </Mantine.Text>
          <Mantine.Group mb="sm">
            <StyledButton
              label={isActive ? "Pause" : "Start"}
              colorPalette={colorPalette}
              onClick={handleTimerToggle}
            />
            <StyledButton
              label="Reset"
              colorPalette={colorPalette}
              onClick={handleTimerReset}
            />
          </Mantine.Group>
          <Mantine.Accordion variant="contained" w="100%" p="sm">
            <Mantine.Accordion.Item value="time">
              <Mantine.Accordion.Control icon={<IconClock />}>
                Settings
              </Mantine.Accordion.Control>
              <Mantine.Accordion.Panel>
                <Mantine.Grid>
                  <Mantine.Grid.Col span={4}>
                    <Mantine.Select
                      disabled={isActive}
                      label="Hours"
                      data={createRange(0, 23).map((v) => v.toString())}
                      value={hours.toString()}
                      onChange={(value) => dispatch(setHours(Number(value)))}
                    ></Mantine.Select>
                  </Mantine.Grid.Col>
                  <Mantine.Grid.Col span={4}>
                    <Mantine.Select
                      disabled={isActive}
                      label="Minutes"
                      data={createRange(0, 59).map((m) => m.toString())}
                      value={minutes.toString()}
                      onChange={(value) => dispatch(setMinutes(Number(value)))}
                    ></Mantine.Select>
                  </Mantine.Grid.Col>
                  <Mantine.Grid.Col span={4}>
                    <Mantine.Select
                      disabled={isActive}
                      label="Seconds"
                      data={createRange(0, 59).map((m) => m.toString())}
                      value={seconds.toString()}
                      onChange={(value) => dispatch(setSeconds(Number(value)))}
                    ></Mantine.Select>
                  </Mantine.Grid.Col>
                  <Mantine.Grid.Col span={12}>
                    <Mantine.TextInput
                      disabled={isActive}
                      label="Notification Message"
                      value={message}
                      onChange={(m) =>
                        dispatch(setTimeoutMessage(m.currentTarget.value))
                      }
                    ></Mantine.TextInput>
                  </Mantine.Grid.Col>
                  <Mantine.Grid.Col span={12}>
                    <StyledButton
                      label="Reset To Default"
                      colorPalette={colorPalette}
                      onClick={() => dispatch(resetToDefault())}
                      disabled={isActive}
                    />
                  </Mantine.Grid.Col>
                </Mantine.Grid>
              </Mantine.Accordion.Panel>
            </Mantine.Accordion.Item>
          </Mantine.Accordion>
        </Mantine.Stack>
      </Mantine.Card.Section>
    </Mantine.Card>
  );
}

export default CountdownTimer;
