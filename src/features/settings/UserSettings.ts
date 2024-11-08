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
    /** The type of button to show: 'light', 'default', 'outlined', etc. */
    buttonVariant: string;
    /** The color gradient on the left when 0 degrees.*/
    gradientFrom: string;
    /** The color gradient on the right when 0 degrees. */
    gradientTo: string;
    /** The number of degrees to transform the gradient. */
    gradientDegrees: number;
    /** Whether to start the application with the navbar opened or not. */
    navbarOpened: boolean;
    /** The settings that enable notifications of certain types. */
    notificationSettings: NotificationSetting[];
};

export type NotificationSetting = {
    id: number,
    userSettingId: number,
    name: string,
    enabled: boolean,
};