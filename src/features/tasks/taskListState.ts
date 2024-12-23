import { atom } from "jotai";
import { DataTableSortStatus } from "mantine-datatable";
import { DateRangeFilter } from "../../models/DateRangeFilter";
import { TaskStatus } from "../../models/TaskStatus";
import { Task } from "../../models/ZodModels";
import { QuickFilter } from "./types/TaskSearchParams";

export const taskListPageAtom = atom(1);
export const taskListPageSizeAtom = atom(5);
export const taskListSortStatusAtom = atom<DataTableSortStatus<Task>>({
  columnAccessor: "scheduledCompleteDate",
  direction: "asc",
});
export const taskListQueryAtom = atom<string | null>(null);
export const taskListSelectedStatusAtom = atom<TaskStatus[]>([
  TaskStatus.Todo,
  TaskStatus.Doing,
  TaskStatus.Paused,
]);
export const taskListStartByFilterAtom = atom<DateRangeFilter | null>(null);
export const taskListDueByFilterAtom = atom<DateRangeFilter | null>(null);
export const taskListQuickFilterAtom = atom<QuickFilter | null>(null);
export const taskListSelectedRecordsAtom = atom<Task[]>([]);
