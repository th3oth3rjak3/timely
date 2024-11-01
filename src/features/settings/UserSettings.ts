/** 
 * Settings that the user would like to persist between work sessions.
 */
export type UserSettings = {
    /** The page they would like displayed when the app launches. */
    homePage: string;
    /** The number of items they would like shown in a list by default. */
    pageSize: number;
    /** The string representation of the color scheme: e.g. 'blue' or 'cyan' */
    colorScheme: string;
};