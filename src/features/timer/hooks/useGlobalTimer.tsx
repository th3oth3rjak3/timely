import { useMantineTheme } from "@mantine/core";
import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import {
  decrementTime,
  resetTimer,
  setIsPlaying,
} from "../../../redux/reducers/timerSlice";
import { showTimerNotification } from "../../../utilities/notificationUtilities";
import useColorService from "../../settings/hooks/useColorService";

const useGlobalTimer = () => {
  const dispatch = useAppDispatch();
  const { time, isActive, message } = useAppSelector((state) => state.timer);
  const userSettings = useAppSelector((state) => state.settings.userSettings);
  const playing = useAppSelector((state) => state.timer.playingSound);
  const theme = useMantineTheme();
  const { colorPalette } = useColorService(theme, userSettings);

  // Reference to persist the Audio object across renders
  const sound = useRef(new Audio("/beep.mp3")).current;

  useEffect(() => {
    let beepInterval: number | undefined;

    if (playing) {
      beepInterval = setInterval(() => {
        sound.play().catch((error) => {
          console.error("Error playing beep sound:", error);
        });
      }, 1000);
    }

    return () => {
      if (beepInterval) clearInterval(beepInterval);
    };
  }, [playing, sound]);

  useEffect(() => {
    if (!isActive) return;

    const intervalId = setInterval(() => {
      dispatch(decrementTime());
    }, 1000);

    if (time === 0) {
      dispatch(setIsPlaying(true));
      showTimerNotification(colorPalette, message, () =>
        dispatch(resetTimer())
      );

      clearInterval(intervalId);
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [time, isActive, dispatch, userSettings]);
};

export default useGlobalTimer;
