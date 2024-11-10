import { AppShell, Group, ScrollArea, Text } from "@mantine/core";
import {
  IconMaximize,
  IconMenu3,
  IconMinimize,
  IconMinus,
  IconX,
} from "@tabler/icons-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import StyledActionIcon from "../components/StyledActionIcon";
import useGlobalTimer from "../features/timer/hooks/useGlobalTimer";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { closeNavbar, toggleNavbar } from "../redux/reducers/settingsSlice";
import Navbar from "./Navbar";

function MainLayout() {
  /** An app store dispatch function to update store values. */
  const navOpened = useAppSelector((state) => state.settings.navbarOpen);
  const dispatch = useAppDispatch();
  useGlobalTimer();
  const [maximized, setMaximized] = useState(false);

  /** Update the currently maximized state. */
  const updateMaximized = () =>
    getCurrentWindow()
      .isMaximized()
      .then((max) => setMaximized(max));

  useEffect(() => {
    updateMaximized();
    //navHandler.open();
    const unlisten = getCurrentWindow().onResized((_) => {
      updateMaximized();
    });

    return () => {
      unlisten.then((u) => u());
    };
  }, []);

  /** Close the current window and shut down the application. */
  const closeWindow = async () => await getCurrentWindow().close();

  /** Minimize the window to the task bar. */
  const hideWindow = async () => await getCurrentWindow().minimize();

  /** Toggle the window maximized state. */
  const toggleMaximize = async () => await getCurrentWindow().toggleMaximize();

  return (
    <AppShell
      header={{ height: 48 }}
      navbar={{
        width: 200,
        breakpoint: "sm",
        collapsed: { desktop: !navOpened, mobile: !navOpened },
      }}
      padding={0}
    >
      <AppShell.Header data-tauri-drag-region>
        <Group h="100%" px="md" align="center" data-tauri-drag-region>
          <StyledActionIcon
            onClick={() => dispatch(toggleNavbar())}
            size={28}
            tooltipLabel={navOpened ? "Close Menu" : "Open Menu"}
            tooltipPosition="right"
          >
            {navOpened ? <IconX /> : <IconMenu3 />}
          </StyledActionIcon>
          <Group
            justify="space-between"
            align="center"
            style={{ flex: 1 }}
            data-tauri-drag-region
          >
            <Text size="xl">Timely</Text>
            <Group justify="flex-end" gap={10} data-tauri-drag-region>
              <StyledActionIcon
                onClick={hideWindow}
                size={28}
                tooltipLabel="Minimize"
                tooltipPosition="left"
              >
                <IconMinus />
              </StyledActionIcon>
              <StyledActionIcon
                onClick={toggleMaximize}
                size={28}
                tooltipLabel={maximized ? "Restore" : "Maximize"}
                tooltipPosition="left"
              >
                {maximized ? <IconMinimize /> : <IconMaximize />}
              </StyledActionIcon>
              <StyledActionIcon
                onClick={closeWindow}
                size={28}
                tooltipLabel="Exit"
                tooltipPosition="left"
              >
                <IconX />
              </StyledActionIcon>
            </Group>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md" maw="200px">
        <ScrollArea offsetScrollbars scrollHideDelay={0} scrollbarSize={6}>
          <Navbar closeNavMenu={() => dispatch(closeNavbar())} />
        </ScrollArea>
      </AppShell.Navbar>
      <AppShell.Main>
        <ScrollArea
          offsetScrollbars
          scrollHideDelay={0}
          scrollbarSize={6}
          h="calc(100vh - var(--app-shell-header-height, 0px))"
        >
          <Outlet />
        </ScrollArea>
      </AppShell.Main>
    </AppShell>
  );
}

export default MainLayout;
