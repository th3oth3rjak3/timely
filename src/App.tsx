import {
  createTheme,
  DEFAULT_THEME,
  defaultVariantColorsResolver,
  MantineProvider,
  mergeMantineTheme,
} from "@mantine/core";
import { Router } from "@remix-run/router";
import { useEffect, useState } from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import "./App.css";
import useSettingsService from "./features/settings/hooks/useSettingsService";

import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { ContextMenuProvider } from "mantine-contextmenu";
import * as Pages from "./pages";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import { setNavbar, setUserSettings } from "./redux/reducers/settingsSlice";

function App() {
  const dispatch = useAppDispatch();
  const { getUserSettings } = useSettingsService();
  const [router, setRouter] = useState<Router>();
  const userSettings = useAppSelector((state) => state.settings.userSettings);
  useEffect(() => {
    getUserSettings().then((userSettings) => {
      if (!!userSettings && userSettings !== null) {
        dispatch(setUserSettings(userSettings));
        dispatch(setNavbar(userSettings.navbarOpened));

        const browserRouter = createBrowserRouter([
          {
            path: "/",
            element: <Pages.MainLayout />,
            children: [
              {
                path: "",
                element: <Navigate to={userSettings.homePage} />,
              },
              {
                path: "/timer",
                element: <Pages.Timer />,
              },
              {
                path: "/tasks",
                element: <Pages.TasksList />,
              },
              {
                path: "/tags",
                element: <Pages.TagsList />,
              },
              {
                path: "/settings",
                element: <Pages.Settings />,
              },
            ],
          },
        ]);

        setRouter(browserRouter);
      }
    });
  }, []);

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

  if (!!router) {
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

  return (
    <MantineProvider defaultColorScheme="dark" theme={customTheme}>
      <ContextMenuProvider>
        <ModalsProvider>
          <Notifications />
        </ModalsProvider>
      </ContextMenuProvider>
    </MantineProvider>
  );
}

export default App;
