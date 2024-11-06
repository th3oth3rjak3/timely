import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { decrementTime, resetTimer } from "../../../redux/reducers/timerSlice";

const useGlobalTimer = () => {
  const dispatch = useAppDispatch();
  const { time, isActive } = useAppSelector((state) => state.timer);

  useEffect(() => {
    if (!isActive || time === 0) return;

    const intervalId = setInterval(() => {
      dispatch(decrementTime());
    }, 1000);

    if (time === 0) {
      clearInterval(intervalId);
      dispatch(resetTimer());
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [dispatch, time, isActive]);
};

export default useGlobalTimer;
