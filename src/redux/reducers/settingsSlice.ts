import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/** Settings that are applied to the application. */
export type SettingsState = {
    /** The number of items to be shown in a list on each page. */
    listItemsPerPage: number;
    /** The choices that should be shown in a list for number of items per page. */
    listItemsPerPageChoices: number[];
    /** The initial route to be shown when the application launches. 
     * This will allow the user to specify their preferred start page. 
     * */
    rootRoute: string;
}

const initialState: SettingsState = {
    listItemsPerPage: 5,
    listItemsPerPageChoices: [5, 10, 25, 50, 100],
    rootRoute: "/tasks",
};

export const settingsSlice = createSlice({
    name: "settings",
    initialState,
    reducers: {
        /** Set the number of list items to be shown per page. */
        setListItemsPerPage: (settings, action: PayloadAction<number>) => {
            settings.listItemsPerPage = action.payload;
        },
        /** Set the user's preferred root route to be shown on application load. */
        setRootRoute: (settings, action: PayloadAction<string>) => {
            settings.rootRoute = action.payload;
        }
    }
});

export const { setListItemsPerPage, setRootRoute } = settingsSlice.actions;

export default settingsSlice.reducer;