import { Tag } from "../tags/types/Tag";

// This is just a high-level summary
export type StatisticalSummary = {
  tasksStarted: number;
  tasksCompleted: number;
  countOfTasksWorked: number;
  hoursWorked: number;
};

// This should contain enough information to construct a graph that shows hours worked per day.
export type DailyWorkHistory = {
  taskId: number;
  dayWorked: Date;
  hoursWorked: number;
};

export type MetricsSummary = {
  startDate: Date;
  endDate: Date;
  selectedTags: Tag[];
  summary: StatisticalSummary;
  workHistory: DailyWorkHistory[];
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
