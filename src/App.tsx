import {
  createTheme,
  DEFAULT_THEME,
  defaultVariantColorsResolver,
  MantineProvider,
  mergeMantineTheme,
} from "@mantine/core";
import { useMemo } from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import "./App.css";

import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { ContextMenuProvider } from "mantine-contextmenu";
import Metrics from "./features/metrics/Metrics";
import Settings from "./features/settings/Settings";
import { useUserSettings } from "./features/settings/settingsService";
import { useTagStore } from "./features/tags/services/tagService";
import TagsList from "./features/tags/TagsList";
import { useTaskStore } from "./features/tasks/services/tasksService";
import TaskList from "./features/tasks/TaskList";
import Timer from "./features/timer/Timer";
import MainLayout from "./layout/MainLayout";
import { showErrorNotification } from "./utilities/notificationUtilities";

function App() {
  const { isPending, error, data: userSettings } = useUserSettings();
  const setTaskPageSize = useTaskStore((store) => store.setPageSize);
  const setTagPageSize = useTagStore((store) => store.setPageSize);
  setTaskPageSize(userSettings.pageSize);
  setTagPageSize(userSettings.pageSize);

  const router = useMemo(() => {
    if (!isPending && userSettings) {
      return createBrowserRouter([
        {
          path: "/",
          element: <MainLayout />,
          children: [
            {
              path: "",
              element: <Navigate to={userSettings.homePage} />,
            },
            {
              path: "/timer",
              element: <Timer />,
            },
            {
              path: "/tasks",
              element: <TaskList />,
            },
            {
              path: "/tags",
              element: <TagsList />,
            },
            {
              path: "/metrics",
              element: <Metrics />,
            },
            {
              path: "/settings",
              element: <Settings />,
            },
          ],
        },
      ]);
    }
    return undefined;
  }, [userSettings]);

  const customTheme = useMemo(() => {
    if (!isPending && userSettings) {
      let customTheme = createTheme({
        primaryColor: userSettings.colorScheme,
        defaultGradient: {
          to: userSettings.gradientTo,
          from: userSettings.gradientFrom,
          deg: userSettings.gradientDegrees,
        },
      });

      const color = defaultVariantColorsResolver({
        theme: mergeMantineTheme(DEFAULT_THEME, customTheme),
        variant: userSettings.buttonVariant,
        gradient: {
          from: userSettings.gradientFrom,
          to: userSettings.gradientTo,
          deg: userSettings.gradientDegrees,
        },
        color: userSettings.colorScheme,
      });

      customTheme.components = {
        Pill: {
          styles: {
            root: {
              background: color.background,
              color: color.color,
            },
          },
        },
      };

      return customTheme;
    }
    return undefined;
  }, [userSettings]);

  if (isPending) return;
  if (error) showErrorNotification(error);

  return (
    <MantineProvider defaultColorScheme="dark" theme={customTheme}>
      <ContextMenuProvider>
        <ModalsProvider>
          <Notifications />
          {router && <RouterProvider router={router} />}
        </ModalsProvider>
      </ContextMenuProvider>
    </MantineProvider>
  );
}

export default App;
