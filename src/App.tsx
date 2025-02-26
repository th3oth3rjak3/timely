import {
  createTheme,
  DEFAULT_THEME,
  defaultVariantColorsResolver,
  MantineProvider,
  mergeMantineTheme,
} from "@mantine/core";
import { useEffect, useMemo } from "react";
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
import {
  isDefaultSettings,
  useUserSettings,
} from "./features/settings/settingsService";
import { useTagStore } from "./features/tags/services/tagService";
import TagsList from "./features/tags/TagsList";
import { useTaskStore } from "./features/tasks/services/tasksService";
import TaskList from "./features/tasks/TaskList";
import { useTimerStore } from "./features/timer/services/timerService";
import Timer from "./features/timer/Timer";
import MainLayout from "./layout/MainLayout";
import { TimeSpan } from "./models/TimeSpan";
import { showErrorNotification } from "./utilities/notificationUtilities";

function App() {
  const { error, data: userSettings } = useUserSettings();
  const setTaskPageSize = useTaskStore((store) => store.setPageSize);
  const setTagPageSize = useTagStore((store) => store.setPageSize);
  const setDefaultTimer = useTimerStore((store) => store.setDefaultTimer);

  useEffect(() => {
    setDefaultTimer(TimeSpan.fromSeconds(userSettings.defaultTimer));
  }, [userSettings]);

  useEffect(() => {
    // Disable the right click menu to hide browser things.
    if (import.meta.env.PROD) {
      window.onload = function () {
        document.addEventListener("contextmenu", (event) => {
          event.preventDefault();
        });
      };
    }
  }, []);

  const router = useMemo(() => {
    if (!isDefaultSettings(userSettings)) {
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
    if (!isDefaultSettings(userSettings)) {
      const customTheme = createTheme({
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

  if (isDefaultSettings(userSettings)) return;
  if (error) showErrorNotification(error);

  if (router !== undefined) {
    setTaskPageSize(userSettings.pageSize);
    setTagPageSize(userSettings.pageSize);

    return (
      <MantineProvider defaultColorScheme="dark" theme={customTheme}>
        <ContextMenuProvider>
          <ModalsProvider>
            <Notifications />
            <RouterProvider router={router} />
          </ModalsProvider>
        </ContextMenuProvider>
      </MantineProvider>
    );
  }

  return null;
}

export default App;
