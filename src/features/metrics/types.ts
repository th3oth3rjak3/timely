import { z } from "zod";
import { toDate } from "../../utilities/dateUtilities";
import { Tag } from "../tags/types/Tag";

export const DailyWorkHistory = z.object({
  taskId: z.number(),
  dayWorked: z.string().transform(toDate),
  hoursWorked: z.number(),
});

export type DailyWorkHistory = z.infer<typeof DailyWorkHistory>;

export const StatisticalSummary = z.object({
  tasksStarted: z.number(),
  tasksCompleted: z.number(),
  tasksWorked: z.number(),
  hoursWorked: z.number(),
});

export type StatisticalSummary = z.infer<typeof StatisticalSummary>;

export const MetricsSummary = z.object({
  startDate: z.string().transform(toDate),
  endDate: z.string().transform(toDate),
  selectedTags: z.array(Tag),
  summary: StatisticalSummary,
  workHistory: z.array(DailyWorkHistory),
});

export type MetricsSummary = z.infer<typeof MetricsSummary>;

export interface FilterFormInputs {
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
}

export interface MetricsFilterCriteria {
  startDate: Date;
  endDate: Date;
  tags: Tag[];
}
