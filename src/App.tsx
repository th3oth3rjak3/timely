import '@mantine/charts/styles.css';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/core/styles.layer.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { Router } from "@remix-run/router";
import { invoke } from '@tauri-apps/api/core'; // TODO: remove this and generate a service
import 'mantine-contextmenu/styles.css';
import 'mantine-contextmenu/styles.layer.css';
import 'mantine-datatable/styles.css';
import { useEffect, useState } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import Settings from './features/settings/Settings';
import { UserSettings } from './features/settings/UserSettings';
import TasksList from './features/tasks/TaskList';
import Timer from './features/timer/Timer';
import MainLayout from './layout/MainLayout';
import { useAppDispatch } from './redux/hooks';
import { setHomePage, setPageSize } from './redux/reducers/settingsSlice';

import { ContextMenuProvider } from 'mantine-contextmenu';
import './App.css';

function App() {

  const dispatch = useAppDispatch();
  const [router, setRouter] = useState<Router>();

  useEffect(() => {
    invoke<UserSettings>("get_user_settings")
      .then((userSettings) => {
        if (!!userSettings && userSettings !== null) {
          dispatch(setPageSize(userSettings.pageSize));
          dispatch(setHomePage(userSettings.homePage));


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


  if (!!router) {
    return (
      <MantineProvider defaultColorScheme="dark" >
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