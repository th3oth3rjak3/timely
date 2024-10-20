import { createSlice } from "@reduxjs/toolkit";

/** State that is used to manage application details. */
export type GlobalState = {
    navbarOpen: boolean;
}

const initialState: GlobalState = {
    navbarOpen: false
};

export const globalSlice = createSlice({
    name: "global",
    initialState,
    reducers: {
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

export const { openNavbar, closeNavbar, toggleNavbar } = globalSlice.actions;

export default globalSlice.reducer;