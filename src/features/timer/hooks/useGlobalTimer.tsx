import { useEffect } from "react";
import { TimelyAction } from "../../../models/TauriAction";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { decrementTime, resetTimer } from "../../../redux/reducers/timerSlice";
import { showSuccessNotification } from "../../../utilities/notificationUtilities";

const useGlobalTimer = () => {
  const dispatch = useAppDispatch();
  const { time, isActive, message } = useAppSelector((state) => state.timer);
  const userSettings = useAppSelector((state) => state.settings.userSettings);

  useEffect(() => {
    if (!isActive) return;

    const intervalId = setInterval(() => {
      dispatch(decrementTime());
    }, 1000);

    if (time === 0) {
      showSuccessNotification(
        TimelyAction.TimerElapsed,
        userSettings,
        message,
        () => dispatch(resetTimer()),
        0
      );

      clearInterval(intervalId);
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [time, isActive]);
};

export default useGlobalTimer;
