import { ActionIcon, AppShell, Burger, Group, ScrollArea, Text, useMantineTheme } from "@mantine/core";
import { IconMaximize, IconMinimize, IconMinus, IconX } from "@tabler/icons-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import MyTooltip from "../components/MyTooltip";
import useColorService from "../features/settings/hooks/useColorService";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { closeNavbar, toggleNavbar } from "../redux/reducers/settingsSlice";
import Navbar from "./Navbar";


function MainLayout() {
    /** An app store dispatch function to update store values. */
    const navOpened = useAppSelector(state => state.settings.navbarOpen);
    const dispatch = useAppDispatch();
    const theme = useMantineTheme();
    const userSettings = useAppSelector(state => state.settings.userSettings);
    const { colorPalette } = useColorService(theme, userSettings);

    const [maximized, setMaximized] = useState(false);

    /** Update the currently maximized state. */
    const updateMaximized = () =>
        getCurrentWindow()
            .isMaximized()
            .then(max => setMaximized(max));

    useEffect(() => {
        updateMaximized();
        //navHandler.open();
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
            padding={0}
        >
            <AppShell.Header data-tauri-drag-region>
                <Group h="100%" px="md" align="center" data-tauri-drag-region>
                    <MyTooltip label={navOpened ? "Close Menu" : "Open Menu"} position="right" colorPalette={colorPalette}>
                        <Burger
                            opened={navOpened}
                            onClick={() => dispatch(toggleNavbar())}
                            size={18}
                            color={colorPalette.color}
                            bg={colorPalette.background}
                            style={{ borderRadius: 4 }}
                            lineSize={2}
                        />
                    </MyTooltip>
                    <Group justify="space-between" align="center" style={{ flex: 1 }} data-tauri-drag-region>
                        <Text size="xl">Timely</Text>
                        <Group justify="flex-end" gap={10} data-tauri-drag-region>
                            <MyTooltip label="Minimize" position="left" colorPalette={colorPalette}>
                                <ActionIcon onClick={hideWindow} variant={colorPalette.variant} size={28} color={colorPalette.colorName}>
                                    <IconMinus />
                                </ActionIcon>
                            </MyTooltip>
                            <MyTooltip label={maximized ? "Restore" : "Maximize"} position="left" colorPalette={colorPalette}>
                                <ActionIcon onClick={toggleMaximize} variant={colorPalette.variant} size={28} color={colorPalette.colorName}>
                                    {maximized ? <IconMinimize /> : <IconMaximize />}
                                </ActionIcon>
                            </MyTooltip>
                            <MyTooltip label="Exit" position="left" colorPalette={colorPalette}>
                                <ActionIcon onClick={closeWindow} variant={colorPalette.variant} size={28} color={colorPalette.colorName}>
                                    <IconX />
                                </ActionIcon>
                            </MyTooltip>
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
                <ScrollArea offsetScrollbars scrollHideDelay={0} scrollbarSize={6} h="calc(100vh - var(--app-shell-header-height, 0px))">
                    <Outlet />
                </ScrollArea>
            </AppShell.Main>
        </AppShell >
    );
}

export default MainLayout;