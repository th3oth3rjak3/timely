import {AppShell, Group, ScrollArea, Text} from "@mantine/core";
import {IconChevronsLeft, IconMaximize, IconMenu3, IconMinimize, IconMinus, IconX,} from "@tabler/icons-react";
import {getCurrentWindow} from "@tauri-apps/api/window";
import {useEffect, useState} from "react";
import {Outlet} from "react-router-dom";
import StyledActionIcon from "../components/StyledActionIcon";
import {useUserSettings} from "../features/settings/settingsService";
import useGlobalTimer from "../features/timer/hooks/useGlobalTimer";
import Navbar from "./Navbar";

function MainLayout() {
  const {data: userSettings} = useUserSettings();

  /** An app store dispatch function to update store values. */

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
    const unsubscribe = getCurrentWindow().onResized(() => {
      updateMaximized();
    });

    return () => {
      unsubscribe.then((u) => u());
    };
  }, []);

  /** Close the current window and shut down the application. */
  const closeWindow = async () => await getCurrentWindow().close();

  /** Minimize the window to the task bar. */
  const hideWindow = async () => await getCurrentWindow().minimize();

  /** Toggle the window maximized state. */
  const toggleMaximize = async () => await getCurrentWindow().toggleMaximize();

  if (!userSettings) return;

  const [navOpened, setNavOpened] = useState(userSettings.navbarOpened);

  return (
    <AppShell
      header={{height: 48}}
      navbar={{
        width: 200,
        breakpoint: "sm",
        collapsed: {desktop: !navOpened, mobile: !navOpened},
      }}
      padding={0}
    >
      <AppShell.Header data-tauri-drag-region>
        <Group h="100%" px="md" align="center" data-tauri-drag-region>
          <StyledActionIcon
            onClick={() => setNavOpened(!navOpened)}
            size={28}
            tooltipLabel={navOpened ? "Close Menu" : "Open Menu"}
            tooltipPosition="right"
          >
            {navOpened ? <IconChevronsLeft/> : <IconMenu3/>}
          </StyledActionIcon>
          <Group
            justify="space-between"
            align="center"
            style={{flex: 1}}
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
                <IconMinus/>
              </StyledActionIcon>
              <StyledActionIcon
                onClick={toggleMaximize}
                size={28}
                tooltipLabel={maximized ? "Restore" : "Maximize"}
                tooltipPosition="left"
              >
                {maximized ? <IconMinimize/> : <IconMaximize/>}
              </StyledActionIcon>
              <StyledActionIcon
                onClick={closeWindow}
                size={28}
                tooltipLabel="Exit"
                tooltipPosition="left"
              >
                <IconX/>
              </StyledActionIcon>
            </Group>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md" maw="200px">
        <ScrollArea offsetScrollbars scrollHideDelay={0} scrollbarSize={6}>
          <Navbar closeNavMenu={() => setNavOpened(false)}/>
        </ScrollArea>
      </AppShell.Navbar>
      <AppShell.Main>
        <ScrollArea
          offsetScrollbars
          scrollHideDelay={0}
          scrollbarSize={6}
          h="calc(100vh - var(--app-shell-header-height, 0px))"
        >
          <Outlet/>
        </ScrollArea>
      </AppShell.Main>
    </AppShell>
  );
}

export default MainLayout;
