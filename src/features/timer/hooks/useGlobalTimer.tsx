import {useEffect, useRef} from "react";
import useColorPalette from "../../../hooks/useColorPalette";
import {showTimerNotification} from "../../../utilities/notificationUtilities";
import {useUserSettings} from "../../settings/settingsService";
import {useTimerStore} from "../services/timerService";

const useGlobalTimer = () => {
  const time = useTimerStore((store) => store.time);
  const isActive = useTimerStore((store) => store.isActive);
  const message = useTimerStore((store) => store.message);
  const playing = useTimerStore((store) => store.playingSound);
  const decrementTime = useTimerStore((store) => store.decrementTime);
  const setIsPlaying = useTimerStore((store) => store.setIsPlaying);
  const resetTimer = useTimerStore((store) => store.resetTimer);
  const {data: userSettings} = useUserSettings();
  const colorPalette = useColorPalette();

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
      decrementTime();
    }, 1000);

    if (time === 0) {
      setIsPlaying(true);
      showTimerNotification(colorPalette, message, resetTimer);
      clearInterval(intervalId);
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [time, isActive, userSettings]);
};

export default useGlobalTimer;
