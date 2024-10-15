// import { invoke } from "@tauri-apps/api/core";
// import "./App.css";
import '@mantine/charts/styles.css';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import 'mantine-datatable/styles.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import Home from './routes/Home';
import Tasks from './routes/Tasks';
import Timer from './routes/Timer';

function App() {

  const router = createBrowserRouter([
    {
      path: "/",
      element: <MainLayout />,
      children: [
        {
          path: "",
          element: <Home />
        },
        {
          path: "/timer",
          element: <Timer />
        },
        {
          path: "/tasks",
          element: <Tasks />
        }
      ]
    }
  ])

  return (
    <MantineProvider defaultColorScheme="dark" >
      <Notifications />
      <RouterProvider router={router} />
    </MantineProvider>
  );
}

export default App;