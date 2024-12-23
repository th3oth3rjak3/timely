import useTauri from "../../../hooks/useTauri";
import { TimelyAction } from "../../../models/TauriAction";
import { MetricsSummary } from "../../../models/ZodModels";
import { tryMap } from "../../../utilities/nullableUtilities";
import { useUserSettings } from "../../settings/settingsService";
import { MetricsFilterCriteria } from "../types";

const useMetricsService = () => {
  const { invoke } = useTauri();
  const { data: userSettings } = useUserSettings();

  const getMetrics = async (
    searchCriteria: MetricsFilterCriteria
  ): Promise<MetricsSummary | null> => {
    const result = await invoke({
      command: "get_metrics",
      params: { searchCriteria },
      successMessage: "Successfully got metrics summary.",
      notificationType: TimelyAction.GetMetrics,
      userSettings: userSettings,
    });

    return tryMap(result, MetricsSummary.parse);
  };

  return { getMetrics };
};

export default useMetricsService;
