import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DataTableSortStatus } from "mantine-datatable";
import { UserSettings } from "../../features/settings/UserSettings";
import { Task } from "../../features/tasks/types/Task";
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
}

export type TaskListSettings = {
    /** The number of items to be shown in a list on each page. */
    pageSize: number;
    /** The choices that should be shown in a list for number of items per page. */
    pageSizeOptions: number[];
    /** The page that the user is currently on. */
    currentPage: number;
    sortStatus: DataTableSortStatus<Task>;
}

const initialState: SettingsState = {
    navbarOpen: false,
    taskListSettings: {
        sortStatus: {
            columnAccessor: 'scheduledCompleteDate',
            direction: 'asc',
        },
        currentPage: 1,
        pageSize: 5,
        pageSizeOptions: [5, 10, 25, 50, 100],
    },
    homePage: "",
    homePageOptions: [
        { label: "Settings", value: "/settings" },
        { label: "Tasks List", value: "/tasks" },
        { label: "Timer", value: "/timer" }],
    userSettings: {
        homePage: "",
        pageSize: 5,
    }
};

export const settingsSlice = createSlice({
    name: "settings",
    initialState,
    reducers: {
        /** Set the current page that the user is looking at. */
        setCurrentPage: (state, action: PayloadAction<number>) => {
            state.taskListSettings.currentPage = action.payload;
        },
        /** Set the number of list items to be shown per page. */
        setPageSize: (state, action: PayloadAction<number>) => {
            state.taskListSettings.pageSize = action.payload;
        },
        setSortStatus: (state, action: PayloadAction<DataTableSortStatus<Task>>) => {
            state.taskListSettings.sortStatus = action.payload;
        },
        setUserSettings: (state, action: PayloadAction<UserSettings>) => {
            state.userSettings = action.payload;
            state.homePage = action.payload.homePage;
            state.taskListSettings.pageSize = action.payload.pageSize;
        },
        openNavbar: (state) => {
            state.navbarOpen = true;
        },
        closeNavbar: (state) => {
            state.navbarOpen = false;
        },
        toggleNavbar: (state) => {
            state.navbarOpen = !state.navbarOpen;
        }
    }
});

export const {
    setPageSize,
    setCurrentPage,
    setSortStatus,
    setUserSettings,
    openNavbar,
    closeNavbar,
    toggleNavbar,
} = settingsSlice.actions;

export default settingsSlice.reducer;