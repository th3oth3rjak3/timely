import { ActionIcon, AppShell, Burger, Group, ScrollArea, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconMaximize, IconMinimize, IconMinus, IconX } from "@tabler/icons-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import MyTooltip from "../components/MyTooltip";
import { BG_COLOR, FG_COLOR } from "../utilities/colorUtilities";
import Navbar from "./Navbar";



function MainLayout() {
    const [navOpened, navHandler] = useDisclosure();
    const [maximized, setMaximized] = useState(false);

    /** Update the currently maximized state. */
    const updateMaximized = () =>
        getCurrentWindow()
            .isMaximized()
            .then(max => setMaximized(max));

    useEffect(() => {
        updateMaximized();
        navHandler.open();
        const unlisten = getCurrentWindow().onResized((_) => {
            updateMaximized();
        });

        return () => {
            unlisten.then(u => u());
        }
    }, []);

    /** Close the current window and shut down the application. */
    const closeWindow = async (_: React.MouseEvent) => await getCurrentWindow().close();

    /** Minimize the window to the task bar. */
    const hideWindow = async (_: React.MouseEvent) => await getCurrentWindow().minimize();

    /** Toggle the window maximized state. */
    const toggleMaximize = async (_: React.MouseEvent) => await getCurrentWindow().toggleMaximize();

    return (
        <AppShell
            header={{ height: 48 }}
            navbar={{ width: 200, breakpoint: "sm", collapsed: { desktop: !navOpened, mobile: !navOpened } }}
            padding="md"
        >
            <AppShell.Header data-tauri-drag-region>
                <Group h="100%" px="md" align="center" data-tauri-drag-region>
                    <MyTooltip label={navOpened ? "Close Menu" : "Open Menu"} position="right">
                        <Burger
                            opened={navOpened}
                            onClick={navHandler.toggle}
                            size={18}
                            color={FG_COLOR}
                            bg={BG_COLOR}
                            style={{ borderRadius: 4 }}
                            lineSize={2}
                        />
                    </MyTooltip>
                    <Group justify="space-between" align="center" style={{ flex: 1 }} data-tauri-drag-region>
                        <Text size="xl">Timely</Text>
                        <Group justify="flex-end" gap={10} data-tauri-drag-region>
                            <MyTooltip label="Minimize" position="left">
                                <ActionIcon onClick={hideWindow} variant="light" size={28} color="cyan">
                                    <IconMinus />
                                </ActionIcon>
                            </MyTooltip>
                            <MyTooltip label={maximized ? "Restore" : "Maximize"} position="left">
                                <ActionIcon onClick={toggleMaximize} variant="light" size={28} color="cyan">
                                    {maximized ? <IconMinimize /> : <IconMaximize />}
                                </ActionIcon>
                            </MyTooltip>
                            <MyTooltip label="Exit" position="left">
                                <ActionIcon onClick={closeWindow} variant="light" size={28} color="cyan">
                                    <IconX />
                                </ActionIcon>
                            </MyTooltip>
                        </Group>
                    </Group>
                </Group>

            </AppShell.Header>
            <AppShell.Navbar p="md" maw="200px">
                <ScrollArea offsetScrollbars scrollHideDelay={0} scrollbarSize={6}>
                    <Navbar closeNavMenu={navHandler.close} />
                </ScrollArea>
            </AppShell.Navbar>
            <AppShell.Main>
                <ScrollArea offsetScrollbars scrollHideDelay={0} scrollbarSize={6} h="calc(100vh - var(--app-shell-header-height, 0px) - 32px)">
                    <Outlet />
                </ScrollArea>
            </AppShell.Main>
        </AppShell >
    );
}

export default MainLayout;