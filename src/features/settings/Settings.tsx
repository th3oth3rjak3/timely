/**
 * TODO: 
 *  - Get user settings from database - belongs in the application component.
 *  - Store user settings in database whenever they're changed here.
 *  - Update the redux store when values change.
 */

import { Group, Stack, Text } from "@mantine/core";


/**
 * Settings page.
 */
function Settings() {

    return (
        <Stack>
            <Group justify="space-between">
                <Text size="lg">Settings</Text>
            </Group>
        </Stack>
    );
}

export default Settings;