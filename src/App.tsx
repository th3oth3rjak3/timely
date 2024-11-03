import '@mantine/charts/styles.css';
import { createTheme, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/core/styles.layer.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { Router } from "@remix-run/router";
import 'mantine-contextmenu/styles.css';
import 'mantine-contextmenu/styles.layer.css';
import 'mantine-datatable/styles.css';
import { useEffect, useState } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import Settings from './features/settings/Settings';
import TasksList from './features/tasks/TaskList';
import Timer from './features/timer/Timer';
import MainLayout from './layout/MainLayout';
import { useAppDispatch, useAppSelector } from './redux/hooks';
import { setNavbar, setUserSettings } from './redux/reducers/settingsSlice';

import { ContextMenuProvider } from 'mantine-contextmenu';
import './App.css';
import useSettingsService from './features/settings/hooks/useSettingsService';
import TagsList from './features/tags/TagsList';

function App() {

  const dispatch = useAppDispatch();
  const { getUserSettings } = useSettingsService();
  const [router, setRouter] = useState<Router>();
  const userSettings = useAppSelector(state => state.settings.userSettings);

  useEffect(() => {
    getUserSettings()
      .then((userSettings) => {
        if (!!userSettings && userSettings !== null) {
          dispatch(setUserSettings(userSettings));
          dispatch(setNavbar(userSettings.navbarOpened));

          const browserRouter = createBrowserRouter([
            {
              path: "/",
              element: <MainLayout />,
              children: [
                {
                  path: "",
                  element: <Navigate to={userSettings.homePage} />
                },
                {
                  path: "/timer",
                  element: <Timer />
                },
                {
                  path: "/tasks",
                  element: <TasksList />
                },
                {
                  path: "/tags",
                  element: <TagsList />
                },
                {
                  path: "/settings",
                  element: <Settings />
                }
              ]
            }
          ]);

          setRouter(browserRouter);
        }
      })
  }, []);

  const theme = createTheme({
    primaryColor: userSettings.colorScheme,
    defaultGradient: {
      to: userSettings.gradientTo,
      from: userSettings.gradientFrom,
      deg: userSettings.gradientDegrees
    }
  });

  if (!!router) {
    return (
      <MantineProvider defaultColorScheme="dark" theme={theme}>
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
    <MantineProvider defaultColorScheme="dark" >
      <ContextMenuProvider>
        <ModalsProvider>
          <Notifications />
        </ModalsProvider>
      </ContextMenuProvider>
    </MantineProvider>
  );


}

export default App;