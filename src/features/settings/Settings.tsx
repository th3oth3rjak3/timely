import { Button, Grid, Group, Select, Stack, Text, useMantineTheme } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAppSelector } from "../../redux/hooks";
import { toSelectOptions } from "../../utilities/formUtilities";
import { toProperCase } from "../../utilities/stringUtilities";
import useColorService from "./hooks/useColorService";
import useSettingsService from "./hooks/useSettingsService";


/**
 * Settings page.
 */
function Settings() {
    const { updateUserSettings } = useSettingsService();


    type Settings = {
        pageSize: string;
        homePage: string;
        colorScheme: string;
    }

    const userSettings = useAppSelector(state => state.settings.userSettings);
    const pageSizeOptions = useAppSelector(state => state.settings.taskListSettings.pageSizeOptions);
    const homePageOptions = useAppSelector(state => state.settings.homePageOptions);

    const theme = useMantineTheme();
    const { colorPalette } = useColorService(theme, userSettings);


    const form = useForm<Settings>({
        mode: 'controlled',
        initialValues: { pageSize: userSettings.pageSize.toString(), homePage: userSettings.homePage, colorScheme: userSettings.colorScheme },
        initialDirty: { pageSize: false, homePage: false, colorScheme: false },
        initialTouched: { pageSize: false, homePage: false, colorScheme: false }
    });

    async function setSettingsValues(settings: Settings) {
        await updateUserSettings(settings, () => form.resetDirty());
    }

    function resetForm() {
        form.reset();
    }

    const colorOptions = ["blue", "cyan", "grape", "gray", "green", "indigo", "lime", "orange", "pink", "red", "teal", "violet", "yellow"];

    return (
        <Stack m={10}>
            <Group justify="space-between">
                <Text size="lg">Settings</Text>
            </Group>
            <form onSubmit={form.onSubmit(setSettingsValues)}>
                <Stack>
                    <Grid gutter="lg" grow>
                        <Grid.Col span={6}>
                            <Select label="Home Page" data={homePageOptions} {...form.getInputProps('homePage')} allowDeselect={false} />
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Select
                                label="Page Size"
                                data={toSelectOptions(pageSizeOptions, pageSizeOptions.map(opt => opt.toString()))}
                                {...form.getInputProps("pageSize")}
                                allowDeselect={false}
                            />
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Select
                                label="Color"
                                data={toSelectOptions(colorOptions, colorOptions.map(opt => toProperCase(opt)))}
                                {...form.getInputProps("colorScheme")}
                                allowDeselect={false}
                            />
                        </Grid.Col>
                    </Grid>
                    <Group mt={20}>
                        <Button type="submit" variant={colorPalette.variant} disabled={!form.isDirty()}>Submit</Button>
                        <Button type="reset" variant={colorPalette.variant} color="red" disabled={!form.isDirty()} onClick={resetForm}>Reset</Button>
                    </Group>
                </Stack>
            </form>
        </Stack>
    );
}

export default Settings;