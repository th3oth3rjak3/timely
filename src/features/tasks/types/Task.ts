import { z } from "zod";
import { maybeDate, toDate } from "../../../utilities/dateUtilities";
import { Tag } from "../../tags/types/Tag";
import { Comment } from "./Comment";

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

export interface NewTaskWorkHistory {
  taskId: number;
  startDate: Date;
  endDate: Date;
}

export interface EditTaskWorkHistory {
  id: number;
  taskId: number;
  startDate: Date;
  endDate: Date;
}

export interface NewTask {
  title: string;
  description: string;
  status: string;
  scheduledStartDate: Date | null;
  scheduledCompleteDate: Date | null;
  estimatedDuration: number | null;
  tags: Tag[];
}

export interface EditTask {
  /** The unique id of the task. */
  id: number;
  title: string;
  /** The descriptive text explaining the work to be done. */
  description: string;
  /** The current working status of the task. */
  status: string;
  /** The date when the task is scheduled to begin. */
  scheduledStartDate: Date | null;
  /** The date when the task is scheduled to end. */
  scheduledCompleteDate: Date | null;
  /** The date the work actually started. */
  actualStartDate: Date | null;
  /** The date the work actually finished. */
  actualCompleteDate: Date | null;
  /** The number of hours the work is estimated to take. */
  estimatedDuration: number | null;
  /** The amount of time in seconds that has been logged against this task. */
  elapsedDuration: number | null;
}
