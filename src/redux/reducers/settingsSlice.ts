import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DataTableSortStatus } from "mantine-datatable";
import { UserSettings } from "../../features/settings/UserSettings";
import { Tag } from "../../features/tags/types/Tag";
import { tagSearchParams, TagSearchParams } from "../../features/tags/types/TagSearchParams";
import { Task } from "../../features/tasks/types/Task";
import { taskSearchParams, TaskSearchParams } from "../../features/tasks/types/TaskSearchParams";
import { Ordering } from "../../models/Ordering";
import { TaskStatus } from "../../models/TaskStatus";
import { SelectOption } from "../../utilities/formUtilities";

/** Settings that are applied to the application. */
export type SettingsState = {
  /** Settings to retain the state of the task list for navigation away from the page and back again. */
  taskListSettings: TaskListSettings;
  /** The initial route to be shown when the application launches.
   * This will allow the user to specify their preferred start page.
   * */
  homePage: string;
  /** The list of pages available to select as the homepage. */
  homePageOptions: SelectOption[];
  /** The user settings from the database. */
  userSettings: UserSettings;
  /** Whether or not the navbar is open. */
  navbarOpen: boolean;
  /** Settings for the tags listing. */
  tagListSettings: TagsListSettings;
};

export type TagsListSettings = {
  pageSizeOptions: number[];
  params: TagSearchParams;
  sortStatus: DataTableSortStatus<Tag>;
};

export type TaskListSettings = {
  /** The choices that should be shown in a list for number of items per page. */
  pageSizeOptions: number[];
  statusOptions: TaskStatus[];
  params: TaskSearchParams;
  sortStatus: DataTableSortStatus<Task>;
};

const pageSizeOptions = [5, 10, 25, 50, 100];

const initialState: SettingsState = {
  navbarOpen: false,
  taskListSettings: {
    pageSizeOptions: pageSizeOptions,
    statusOptions: [
      TaskStatus.Todo,
      TaskStatus.Doing,
      TaskStatus.Done,
      TaskStatus.Paused,
      TaskStatus.Cancelled,
    ],
    params: taskSearchParams(
      1,
      5,
      ["To Do", "Doing", "Paused"],
      undefined,
      "scheduledCompleteDate",
      "asc"
    ),
    sortStatus: {
      sortKey: "tasks",
      columnAccessor: "scheduledCompleteDate",
      direction: "asc",
    },
  },
  tagListSettings: {
    pageSizeOptions: pageSizeOptions,
    params: tagSearchParams(1, 5, undefined, "value", "asc"),
    sortStatus: {
      sortKey: "tags",
      columnAccessor: "value",
      direction: "asc",
    },
  },
  homePage: "",
  homePageOptions: [
    { label: "Timer", value: "/timer" },
    { label: "Tasks List", value: "/tasks" },
    { label: "Tags List", value: "/tags" },
    { label: "Reports", value: "/reports" },
    { label: "Settings", value: "/settings" },
  ],
  userSettings: {
    homePage: "",
    pageSize: 5,
    colorScheme: "blue",
    buttonVariant: "filled",
    gradientFrom: "",
    gradientTo: "",
    gradientDegrees: 0,
    navbarOpened: false,
    notificationSettings: [],
  },
};

export const settingsSlice = createSlice({
    name: "settings",
    initialState,
    reducers: {
        /** Set the current page that the user is looking at. */
        setCurrentTaskPage: (state, action: PayloadAction<number>) => {
            state.taskListSettings.params.page = action.payload;
        },
        /** Set the number of list items to be shown per page. */
        setTaskPageSize: (state, action: PayloadAction<number>) => {
            state.taskListSettings.params.pageSize = action.payload;
        },
        setTaskSortStatus: (state, action: PayloadAction<DataTableSortStatus<Task>>) => {
            state.taskListSettings.sortStatus = action.payload;
            state.taskListSettings.params.ordering = new Ordering(action.payload.columnAccessor, action.payload.direction).serialize();
        },
        setUserSettings: (state, action: PayloadAction<UserSettings>) => {
            state.userSettings = action.payload;
            state.homePage = action.payload.homePage;
            state.taskListSettings.params.pageSize = action.payload.pageSize;
            state.tagListSettings.params.pageSize = action.payload.pageSize;
        },
        setTaskSearchParams: (state, action: PayloadAction<TaskSearchParams>) => {
            state.taskListSettings.params = action.payload;
        },
        openNavbar: (state) => {
            state.navbarOpen = true;
        },
        closeNavbar: (state) => {
            state.navbarOpen = false;
        },
        toggleNavbar: (state) => {
            state.navbarOpen = !state.navbarOpen;
        },
        setNavbar: (state, action: PayloadAction<boolean>) => {
            state.navbarOpen = action.payload;
        },
        setCurrentTagPage: (state, action: PayloadAction<number>) => {
            state.tagListSettings.params.page = action.payload;
        },
        setTagPageSize: (state, action: PayloadAction<number>) => {
            state.tagListSettings.params.pageSize = action.payload;
        },
        setTagSortStatus: (state, action: PayloadAction<DataTableSortStatus<Tag>>) => {
            state.tagListSettings.sortStatus = action.payload;
            state.tagListSettings.params.ordering = new Ordering(action.payload.columnAccessor, action.payload.direction).serialize();
        },
        setTagSearchParams: (state, action: PayloadAction<TagSearchParams>) => {
            state.tagListSettings.params = action.payload;
        }
    }
});

export const {
    setTaskPageSize,
    setCurrentTaskPage,
    setTaskSortStatus,
    setUserSettings,
    openNavbar,
    closeNavbar,
    toggleNavbar,
    setTaskSearchParams,
    setCurrentTagPage,
    setTagPageSize,
    setTagSortStatus,
    setTagSearchParams,
    setNavbar,
} = settingsSlice.actions;

export default settingsSlice.reducer;