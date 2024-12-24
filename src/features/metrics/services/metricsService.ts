import { useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";
import { MetricsSummary, Tag } from "../../../models/ZodModels";
import { tryMap } from "../../../utilities/nullableUtilities";
import { MetricsSearchCriteria } from "../types";

export interface MetricsStore {
  startDate?: Date;
  setStartDate: (startDate?: Date) => void;
  endDate?: Date;
  setEndDate: (endDate?: Date) => void;
  selectedTags?: Tag[];
  setSelectedTags: (selectedTags?: Tag[]) => void;
}

export const useMetricsStore = create<MetricsStore>((set) => ({
  startDate: undefined,
  setStartDate: (startDate) => set({ startDate }),
  endDate: undefined,
  setEndDate: (endDate) => set({ endDate }),
  selectedTags: undefined,
  setSelectedTags: (selectedTags) => set({ selectedTags }),
}));

const emptyData = {
  startDate: new Date(),
  endDate: new Date(),
  selectedTags: [],
  summary: {
    tasksStarted: 0,
    tasksCompleted: 0,
    tasksWorked: 0,
    hoursWorked: 0,
  },
  workHistory: [],
};

export function useGetMetrics(searchCriteria: MetricsSearchCriteria) {
  return useQuery({
    queryKey: ["getMetrics", searchCriteria],
    queryFn: async () => {
      if (
        searchCriteria &&
        searchCriteria.tags.length &&
        searchCriteria.buckets.length
      ) {
        const metricsData = await invoke("get_metrics", { searchCriteria });
        return tryMap(metricsData, MetricsSummary.parse) ?? emptyData;
      }
      return emptyData;
    },
    initialData: emptyData,
  });
}
