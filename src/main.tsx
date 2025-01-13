import "@mantine/charts/styles.css";
import "@mantine/core/styles.css";
import "@mantine/core/styles.layer.css";
import "@mantine/dates/styles.css";
import "@mantine/dropzone/styles.css";
import "@mantine/notifications/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "mantine-contextmenu/styles.css";
import "mantine-contextmenu/styles.layer.css";
import "mantine-datatable/styles.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={true} buttonPosition="bottom-left" />
    </QueryClientProvider>
  </React.StrictMode>
);
