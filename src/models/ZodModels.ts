import { z } from "zod";
import { maybeDate, toDate } from "../utilities/dateUtilities";

/* Zod Types */
export const Tag = z.object({
  id: z.number(),
  value: z.string(),
});
export type Tag = z.infer<typeof Tag>;
export const TagArray = z.array(Tag);
export type TagArray = z.infer<typeof TagArray>;
export const PagedTagData = pagedDataSchema(Tag);
export type PagedTagData = z.infer<typeof PagedTagData>;

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

export const Comment = z.object({
  id: z.number(),
  taskId: z.number(),
  message: z.string(),
  created: z.string().transform((isoStr) => new Date(isoStr)),
  modified: z
    .string()
    .nullable()
    .transform((isoStr) => (isoStr === null ? null : new Date(isoStr))),
});

export type Comment = z.infer<typeof Comment>;

export const TaskWorkHistory = z.object({
  id: z.number(),
  taskId: z.number(),
  startDate: z.string().transform(toDate),
  endDate: z.string().transform(toDate),
  elapsedDuration: z.number(),
});

export type TaskWorkHistory = z.infer<typeof TaskWorkHistory>;

export const Task = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  status: z.string(),
  scheduledStartDate: z.string().nullable().transform(maybeDate),
  scheduledCompleteDate: z.string().nullable().transform(maybeDate),
  actualStartDate: z.string().nullable().transform(maybeDate),
  actualCompleteDate: z.string().nullable().transform(maybeDate),
  estimatedDuration: z.number().nullable(),
  elapsedDuration: z.number(),
  comments: z.array(Comment),
  tags: z.array(Tag),
  workHistory: z.array(TaskWorkHistory),
});

export type Task = z.infer<typeof Task>;

export function pagedDataSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    page: z.number(),
    pageSize: z.number(),
    totalItemCount: z.number(),
    data: z.array(itemSchema),
  });
}

export const PagedTaskData = pagedDataSchema(Task);
export type PagedTaskData = z.infer<typeof PagedTaskData>;

export const NotificationSetting = z.object({
  id: z.number(),
  userSettingId: z.number(),
  name: z.string(),
  enabled: z.boolean(),
});

export type NotificationSetting = z.infer<typeof NotificationSetting>;

export const UserSettings = z.object({
  homePage: z.string(),
  pageSize: z.number(),
  colorScheme: z.string(),
  buttonVariant: z.string(),
  gradientFrom: z.string(),
  gradientTo: z.string(),
  gradientDegrees: z.number(),
  navbarOpened: z.boolean(),
  notificationSettings: z.array(NotificationSetting),
});

export type UserSettings = z.infer<typeof UserSettings>;



