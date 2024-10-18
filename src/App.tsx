import '@mantine/charts/styles.css';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import 'mantine-datatable/styles.css';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import Settings from './features/settings/Settings';
import TasksList from './features/tasks/TaskList';
import Timer from './features/timer/Timer';
import MainLayout from './layout/MainLayout';
import { useAppSelector } from './redux/hooks';

function App() {

  // TODO: get user settings here to decide which page is set to home.

  const rootRoute = useAppSelector(state => state.settings.rootRoute);

  const router = createBrowserRouter([
    {
      path: "/",
      element: <MainLayout />,
      children: [
        {
          path: "",
          element: <Navigate to={rootRoute} />
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
  ])

  return (
    <MantineProvider defaultColorScheme="dark" >
      <ModalsProvider>
        <Notifications />
        <RouterProvider router={router} />
      </ModalsProvider>
    </MantineProvider>
  );
}

export default App;