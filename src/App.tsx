import { Router } from "@remix-run/router";
import { useEffect, useState } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import './App.css';
import useSettingsService from './features/settings/hooks/useSettingsService';
import * as Mantine from './mantine';
import * as Pages from './pages';
import { useAppDispatch, useAppSelector } from './redux/hooks';
import { setNavbar, setUserSettings } from './redux/reducers/settingsSlice';

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
              element: <Pages.MainLayout />,
              children: [
                {
                  path: "",
                  element: <Navigate to={userSettings.homePage} />
                },
                {
                  path: "/timer",
                  element: <Pages.Timer />
                },
                {
                  path: "/tasks",
                  element: <Pages.TasksList />
                },
                {
                  path: "/tags",
                  element: <Pages.TagsList />
                },
                {
                  path: "/settings",
                  element: <Pages.Settings />
                }
              ]
            }
          ]);

          setRouter(browserRouter);
        }
      })
  }, []);

  const theme = Mantine.createTheme({
    primaryColor: userSettings.colorScheme,
    defaultGradient: {
      to: userSettings.gradientTo,
      from: userSettings.gradientFrom,
      deg: userSettings.gradientDegrees
    }
  });

  if (!!router) {
    return (
      <Mantine.MantineProvider defaultColorScheme="dark" theme={theme}>
        <Mantine.ContextMenuProvider>
          <Mantine.ModalsProvider>
            <Mantine.Notifications />
            <RouterProvider router={router} />
          </Mantine.ModalsProvider>
        </Mantine.ContextMenuProvider>
      </Mantine.MantineProvider>
    );
  }

  return (
    <Mantine.MantineProvider defaultColorScheme="dark" theme={theme}>
      <Mantine.ContextMenuProvider>
        <Mantine.ModalsProvider>
          <Mantine.Notifications />
        </Mantine.ModalsProvider>
      </Mantine.ContextMenuProvider>
    </Mantine.MantineProvider>
  );

}

export default App;