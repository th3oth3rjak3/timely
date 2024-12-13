import { z } from "zod";

export const NotificationSetting = z.object({
  id: z.number(),
  userSettingId: z.number(),
  name: z.string(),
  enabled: z.boolean(),
});

export type NotificationSetting = z.infer<typeof NotificationSetting>;

export const UserSettings = z.object({
  homePage: z.string(),
  pageSize: z.number(),
  colorScheme: z.string(),
  buttonVariant: z.string(),
  gradientFrom: z.string(),
  gradientTo: z.string(),
  gradientDegrees: z.number(),
  navbarOpened: z.boolean(),
  notificationSettings: z.array(NotificationSetting),
});

export type UserSettings = z.infer<typeof UserSettings>;
