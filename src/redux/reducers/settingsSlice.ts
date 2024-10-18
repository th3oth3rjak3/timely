import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SelectOption } from "../../utilities/formUtilities";

/** Settings that are applied to the application. */
export type SettingsState = {
    /** The number of items to be shown in a list on each page. */
    pageSize: number;
    /** The choices that should be shown in a list for number of items per page. */
    pageSizeOptions: number[];
    /** The initial route to be shown when the application launches. 
     * This will allow the user to specify their preferred start page. 
     * */
    homePage: string;
    homePageOptions: SelectOption[];
}

const initialState: SettingsState = {
    pageSize: 5,
    pageSizeOptions: [5, 10, 25, 50, 100],
    homePage: "",
    homePageOptions: [
        { label: "Settings", value: "/settings" },
        { label: "Tasks List", value: "/tasks" },
        { label: "Timer", value: "/timer" }]
};

export const settingsSlice = createSlice({
    name: "settings",
    initialState,
    reducers: {
        /** Set the number of list items to be shown per page. */
        setPageSize: (settings, action: PayloadAction<number>) => {
            settings.pageSize = action.payload;
        },
        /** Set the user's preferred root route to be shown on application load. */
        setHomePage: (settings, action: PayloadAction<string>) => {
            settings.homePage = action.payload;
        }
    }
});

export const { setPageSize, setHomePage } = settingsSlice.actions;

export default settingsSlice.reducer;