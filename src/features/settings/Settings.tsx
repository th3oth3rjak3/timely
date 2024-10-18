/**
 * TODO: 
 *  - Get user settings from database - belongs in the application component.
 *  - Store user settings in database whenever they're changed here.
 *  - Update the redux store when values change.
 */

import { Button, Grid, Group, Select, Stack, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { invoke } from "@tauri-apps/api/core";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { setHomePage, setPageSize } from "../../redux/reducers/settingsSlice";
import { toSelectOptions } from "../../utilities/formUtilities";
import { showErrorNotification, showSuccessNotification } from "../../utilities/notificationUtilities";


/**
 * Settings page.
 */
function Settings() {

    type Settings = {
        pageSize: string;
        homePage: string;
    }

    const pageSize = useAppSelector(state => state.settings.pageSize);
    const pageSizeOptions = useAppSelector(state => state.settings.pageSizeOptions);
    const homePage = useAppSelector(state => state.settings.homePage);
    const homePageOptions = useAppSelector(state => state.settings.homePageOptions);

    const dispatch = useAppDispatch();

    const form = useForm({
        mode: 'controlled',
        initialValues: { pageSize: pageSize.toString(), homePage: homePage } as Settings,
        initialDirty: { pageSize: false, homePage: false },
        initialTouched: { pageSize: false, homePage: false }
    });

    function setSettingsValues(settings: Settings) {
        dispatch(setHomePage(settings.homePage));
        dispatch(setPageSize(Number(settings.pageSize)));

        invoke<void>("update_user_settings", { settings })
            .then(() => showSuccessNotification("Successfully updated settings."))
            .catch((err: string) => showErrorNotification("updating user settings", err));
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