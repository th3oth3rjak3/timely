import dayjs from "dayjs";
import { Tag } from "../tags/types/Tag";

// This is just a high-level summary
export type StatisticalSummary = {
  tasksStarted: number;
  tasksCompleted: number;
  tasksWorked: number;
  hoursWorked: number;
};

// This should contain enough information to construct a graph
// that shows hours worked per day.
export type DailyWorkHistory = {
  taskId: number;
  dayWorked: Date;
  hoursWorked: number;
};

export type DailyWorkHistoryRead = {
  taskId: number;
  dayWorked: string;
  hoursWorked: number;
};

export type MetricsSummary = {
  startDate: Date;
  endDate: Date;
  selectedTags: Tag[];
  summary: StatisticalSummary;
  workHistory: DailyWorkHistory[];
};

export type MetricsSummaryRead = {
  startDate: string;
  endDate: string;
  selectedTags: Tag[];
  summary: StatisticalSummary;
  workHistory: DailyWorkHistoryRead[];
};

export type FilterFormInputs = {
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
};

export type MetricsFilterCriteria = {
  startDate: Date;
  endDate: Date;
  tags: Tag[];
};

export const toMetricsSummary = (
  readDto: MetricsSummaryRead
): MetricsSummary => {
  return {
    startDate: dayjs(readDto.startDate).toDate(),
    endDate: dayjs(readDto.endDate).toDate(),
    selectedTags: readDto.selectedTags,
    summary: readDto.summary,
    workHistory: readDto.workHistory.map(toDailyWorkHistory),
  };
};

export const toDailyWorkHistory = (
  readDto: DailyWorkHistoryRead
): DailyWorkHistory => {
  return {
    taskId: readDto.taskId,
    dayWorked: dayjs(readDto.dayWorked).toDate(),
    hoursWorked: readDto.hoursWorked,
  };
};
