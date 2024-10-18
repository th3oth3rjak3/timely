import { configureStore } from '@reduxjs/toolkit';
import settingsReducer from './reducers/settingsSlice';

const store = configureStore({
    reducer: {
        settings: settingsReducer
    },
});

export default store;

// Get the type of our store variable
export type AppStore = typeof store
// Infer the `RootState` and `AppDispatch` types from the store itself
export type AppState = ReturnType<AppStore['getState']>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = AppStore['dispatch']