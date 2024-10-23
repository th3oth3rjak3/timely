/**
 * TODO: 
 *  - Get user settings from database - belongs in the application component.
 *  - Store user settings in database whenever they're changed here.
 *  - Update the redux store when values change.
 */

import { Button, Grid, Group, Select, Stack, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAppSelector } from "../../redux/hooks";
import { toSelectOptions } from "../../utilities/formUtilities";
import useSettingsService from "./hooks/useSettingsService";


/**
 * Settings page.
 */
function Settings() {
    const { updateUserSettings } = useSettingsService();

    type Settings = {
        pageSize: string;
        homePage: string;
    }

    const userSettings = useAppSelector(state => state.settings.userSettings);
    const pageSizeOptions = useAppSelector(state => state.settings.pageSizeOptions);
    const homePageOptions = useAppSelector(state => state.settings.homePageOptions);

    const form = useForm<Settings>({
        mode: 'controlled',
        initialValues: { pageSize: userSettings.pageSize.toString(), homePage: userSettings.homePage },
        initialDirty: { pageSize: false, homePage: false },
        initialTouched: { pageSize: false, homePage: false }
    });

    async function setSettingsValues(settings: Settings) {
        await updateUserSettings(settings, () => form.resetDirty());
    }

    function resetForm() {
        form.reset();
    }

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
                    </Grid>
                    <Group mt={20}>
                        <Button type="submit" variant="light" color="cyan" disabled={!form.isDirty()}>Submit</Button>
                        <Button type="reset" variant="light" color="red" disabled={!form.isDirty()} onClick={resetForm}>Reset</Button>
                    </Group>
                </Stack>
            </form>
        </Stack>
    );
}

export default Settings;