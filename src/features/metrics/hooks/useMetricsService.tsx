import useTauri from "../../../hooks/useTauri";
import { TimelyAction } from "../../../models/TauriAction";
import { useAppSelector } from "../../../redux/hooks";
import { MetricsFilterCriteria, MetricsSummaryRead } from "../types";

const useMetricsService = () => {
  const { invoke } = useTauri();
  const userSettings = useAppSelector((state) => state.settings.userSettings);

  const getMetrics = async (
    searchCriteria: MetricsFilterCriteria
  ): Promise<MetricsSummaryRead | undefined> => {
    return await invoke({
      command: "get_metrics",
      params: { searchCriteria },
      successMessage: "Successfully got metrics summary.",
      notificationType: TimelyAction.GetMetrics,
      userSettings: userSettings,
    });
  };

  return { getMetrics };
};

export default useMetricsService;
