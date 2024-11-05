import '@mantine/charts/styles.css';
import '@mantine/core/styles.css';
import '@mantine/core/styles.layer.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/notifications/styles.css';
import 'mantine-contextmenu/styles.css';
import 'mantine-contextmenu/styles.layer.css';
import 'mantine-datatable/styles.css';
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App";
import reduxStore from "./redux/store";


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider store={reduxStore} >
      <App />
    </Provider>
  </React.StrictMode>,
);