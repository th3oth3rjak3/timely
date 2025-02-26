import {
  ActionIcon,
  Card,
  Grid,
  Group,
  Select,
  Slider,
  Stack,
  Switch,
  Table,
  Tabs,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconCheck } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import MyTooltip from "../../components/MyTooltip";
import StyledButton from "../../components/StyledButton";
import useColorPalette from "../../hooks/useColorPalette";
import { TimeSpan } from "../../models/TimeSpan";
import { NotificationSetting } from "../../models/ZodModels";
import { homePageOptions, pageSizeOptions } from "../../state/globalState";
import { toSelectOptions } from "../../utilities/formUtilities";
import { createRange } from "../../utilities/rangeUtilities";
import { toProperCase } from "../../utilities/stringUtilities";
import { useUpdateUserSettings, useUserSettings } from "./settingsService";
import { useTagStore } from "../tags/services/tagService";
import { useTaskStore } from "../tasks/services/tasksService";

/**
 * Settings page.
 */
function Settings() {
  const { data: userSettings } = useUserSettings();
  const queryClient = useQueryClient();
  const { setPage: setTagPage } = useTagStore();
  const { setPage: setTaskPage } = useTaskStore();
  const updateUserSettings = useUpdateUserSettings(queryClient, () => {
    setTagPage(1);
    setTaskPage(1);
  });

  const colorPalette = useColorPalette();
  const [showGradientOptions, setShowGradientOptions] = useState(
    colorPalette.variant === "gradient"
  );
  const [gradientDegrees, setGradientDegrees] = useState(
    colorPalette.gradient.deg
  );
  const [gradientTo, setGradientTo] = useState(colorPalette.gradient.to);
  const [controlledVariant, setControlledVariant] = useState(
    colorPalette.variant
  );
  const [notificationSettings, setNotificationSettings] = useState<
    NotificationSetting[]
  >(userSettings.notificationSettings);

  const notificationSettingsDirty = useMemo(() => {
    return (
      JSON.stringify(userSettings.notificationSettings) !==
      JSON.stringify(notificationSettings)
    );
  }, [notificationSettings]);

  const notificationSettingTableRows = notificationSettings.map((setting) => (
    <Table.Tr key={setting.name}>
      <Table.Td>{setting.name}</Table.Td>
      <Table.Td>
        <Switch
          checked={setting.enabled}
          onChange={(event) => {
            let found = notificationSettings.find((s) => s.id === setting.id);
            if (found === undefined) return;
            found = { ...found };
            found.enabled = event.currentTarget.checked;
            const updated = [
              ...notificationSettings.filter((s) => s.id !== found.id),
              found,
            ];
            updated.sort((a, b) => a.name.localeCompare(b.name));
            setNotificationSettings(updated);
          }}
        />
      </Table.Td>
    </Table.Tr>
  ));

  useEffect(() => {
    setNotificationSettings(userSettings?.notificationSettings ?? []);
  }, [userSettings]);

  interface FormUserSettings {
    pageSize: string;
    homePage: string;
    colorScheme: string;
    buttonVariant: string;
    gradientTo: string;
    gradientDegrees?: number;
    navbarOpened: string;
    defaultTimerHours: string;
    defaultTimerMinutes: string;
    defaultTimerSeconds: string;
  }

  const form = useForm<FormUserSettings>({
    mode: "controlled",
    initialValues: {
      ...colorPalette,
      homePage: userSettings.homePage,
      pageSize: userSettings.pageSize.toString(),
      colorScheme: colorPalette.colorName,
      buttonVariant: colorPalette.variant,
      gradientTo: colorPalette.gradient.to,
      gradientDegrees: colorPalette.gradient.deg,
      navbarOpened: userSettings.navbarOpened.toString(),
      defaultTimerHours: TimeSpan.fromSeconds(
        userSettings.defaultTimer
      ).hours.toString(),
      defaultTimerMinutes: TimeSpan.fromSeconds(
        userSettings.defaultTimer
      ).minutes.toString(),
      defaultTimerSeconds: TimeSpan.fromSeconds(
        userSettings.defaultTimer
      ).seconds.toString(),
    },
    initialDirty: {
      pageSize: false,
      homePage: false,
      colorScheme: false,
      buttonVariant: false,
      gradientTo: false,
      gradientDegrees: false,
      navbarOpened: false,
      defaultTimerSeconds: false,
      defaultTimerHours: false,
      defaultTimerMinutes: false,
    },
    initialTouched: {
      pageSize: false,
      homePage: false,
      colorScheme: false,
      buttonVariant: false,
      gradientTo: false,
      gradientDegrees: false,
      navbarOpened: false,
      defaultTimerSeconds: false,
      defaultTimerHours: false,
      defaultTimerMinutes: false,
    },
  });

  async function setSettingsValues(settings: FormUserSettings) {
    const userSettings = {
      ...settings,
      pageSize: Number(settings.pageSize),
      gradientFrom: settings.colorScheme,
      gradientTo,
      gradientDegrees: gradientDegrees ?? 0,
      navbarOpened: settings.navbarOpened === "true",
      notificationSettings: notificationSettings,
      defaultTimer: TimeSpan.add(
        TimeSpan.fromHours(Number(settings.defaultTimerHours)),
        TimeSpan.fromMinutes(Number(settings.defaultTimerMinutes)),
        TimeSpan.fromSeconds(Number(settings.defaultTimerSeconds))
      ).totalSeconds,
    };
    await updateUserSettings.mutateAsync(userSettings);
    form.resetDirty();
  }

  function resetForm() {
    form.reset();
    form.resetDirty();
    form.resetTouched();
    setGradientTo(colorPalette.gradient.to);
    setGradientDegrees(colorPalette.gradient.deg);
    setControlledVariant(colorPalette.variant);
    setNotificationSettings(userSettings.notificationSettings);
    if (colorPalette.variant === "gradient") {
      setShowGradientOptions(true);
    } else {
      setShowGradientOptions(false);
    }
  }

  const isDirty = useMemo(() => {
    const controlledVariantChanged = controlledVariant !== colorPalette.variant;
    const gradientDegreesChanged =
      gradientDegrees !== colorPalette.gradient.deg;
    const gradientToChanged = gradientTo !== colorPalette.gradient.to;
    return (
      form.isDirty() ||
      controlledVariantChanged ||
      gradientDegreesChanged ||
      gradientToChanged ||
      notificationSettingsDirty
    );
  }, [controlledVariant, gradientDegrees, gradientTo, colorPalette, form]);

  const colorOptions = [
    "blue",
    "cyan",
    "dark",
    "grape",
    "gray",
    "green",
    "indigo",
    "lime",
    "orange",
    "pink",
    "red",
    "teal",
    "violet",
    "yellow",
  ];
  const buttonVariants = [
    "filled",
    "gradient",
    "light",
    "subtle",
    "outline",
    "transparent",
    "white",
  ];

  const gradientSelector: JSX.Element = (
    <Card>
      <Card.Section>
        <Group justify="center">
          <Text m="lg">Secondary Color</Text>
        </Group>
        <Group gap="sm" justify="center" px="sm">
          {colorOptions.map((opt) => (
            <MyTooltip
              label={toProperCase(opt)}
              colorPalette={colorPalette}
              color={opt}
              key={`color-option-${opt}`}
            >
              <ActionIcon
                size="lg"
                my="sm"
                color={opt}
                onClick={() => setGradientTo(opt)}
              >
                {gradientTo === opt ? <IconCheck size={24} /> : null}
              </ActionIcon>
            </MyTooltip>
          ))}
        </Group>
      </Card.Section>
    </Card>
  );

  const gradientDegreeSlider: JSX.Element = (
    <Slider
      min={0}
      max={360}
      onChange={setGradientDegrees}
      value={gradientDegrees}
      label={(value) => `${value}°`}
      marks={[
        { value: 90, label: "90°" },
        { value: 180, label: "180°" },
        { value: 270, label: "270°" },
      ]}
      step={10}
      mb="sm"
    />
  );

  return (
    <Stack m={25}>
      <form onSubmit={form.onSubmit(setSettingsValues)}>
        <Tabs defaultValue="general">
          {/* orientation="vertical" placement="right" > */}
          <Tabs.List grow>
            <Tabs.Tab value="general">General</Tabs.Tab>
            <Tabs.Tab value="appearance">Appearance</Tabs.Tab>
            <Tabs.Tab value="notifications">Notifications</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="general">
            <Stack my="md">
              <Grid gutter="lg" grow>
                <Grid.Col span={6}>
                  <Select
                    label="Home Page"
                    data={homePageOptions}
                    {...form.getInputProps("homePage")}
                    allowDeselect={false}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Select
                    label="Page Size"
                    data={toSelectOptions(
                      pageSizeOptions,
                      pageSizeOptions.map((opt) => opt.toString())
                    )}
                    {...form.getInputProps("pageSize")}
                    allowDeselect={false}
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Select
                    label="Start With Navbar Open"
                    data={toSelectOptions([true, false], ["True", "False"])}
                    {...form.getInputProps("navbarOpened")}
                    allowDeselect={false}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <Select
                    label="Timer Hours"
                    data={createRange(0, 23).map((v) => v.toString())}
                    {...form.getInputProps("defaultTimerHours")}
                    allowDeselect={false}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <Select
                    label="Timer Minutes"
                    data={createRange(0, 59).map((v) => v.toString())}
                    {...form.getInputProps("defaultTimerMinutes")}
                    allowDeselect={false}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <Select
                    label="Timer Seconds"
                    data={createRange(0, 59).map((v) => v.toString())}
                    {...form.getInputProps("defaultTimerSeconds")}
                    allowDeselect={false}
                  />
                </Grid.Col>
              </Grid>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="appearance">
            <Stack my="md">
              <Grid gutter="lg" grow>
                <Grid.Col span={12}>
                  <StyledButton
                    color={form.getValues().colorScheme}
                    variant={form.getValues().buttonVariant}
                    type="button"
                    label="Sample Button"
                    gradient={{
                      from: form.getValues().colorScheme,
                      to: gradientTo,
                      deg: gradientDegrees,
                    }}
                    tooltipLabel="Sample Tooltip"
                    tooltipPosition="right"
                    tooltipColor={form.getValues().colorScheme}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Select
                    label="Color"
                    data={toSelectOptions(
                      colorOptions,
                      colorOptions.map((opt) => toProperCase(opt))
                    )}
                    {...form.getInputProps("colorScheme")}
                    allowDeselect={false}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Select
                    label="Button Style"
                    data={toSelectOptions(
                      buttonVariants,
                      buttonVariants.map((opt) => toProperCase(opt))
                    )}
                    {...form.getInputProps("buttonVariant")}
                    allowDeselect={false}
                    onChange={(value) => {
                      if (value === "gradient") {
                        setShowGradientOptions(true);
                      } else {
                        setShowGradientOptions(false);
                      }
                      setControlledVariant(value ?? "");
                      form.setValues({ buttonVariant: value ?? "" });
                    }}
                    value={controlledVariant}
                  />
                </Grid.Col>
                {showGradientOptions ? (
                  <Grid.Col span={12}>{gradientSelector}</Grid.Col>
                ) : null}
                {showGradientOptions ? (
                  <Grid.Col span={12}>{gradientDegreeSlider}</Grid.Col>
                ) : null}
              </Grid>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="notifications">
            <Stack my="md">
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Notification</Table.Th>
                    <Table.Th>Enabled</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{notificationSettingTableRows}</Table.Tbody>
              </Table>
            </Stack>
          </Tabs.Panel>
        </Tabs>

        <Group mt={20}>
          <StyledButton
            type="submit"
            label="Submit"
            disabled={!isDirty}
            tooltipLabel="Save Updated Settings"
            tooltipPosition="right"
          />
          <StyledButton
            type="reset"
            label="Reset"
            disabled={!isDirty}
            onClick={resetForm}
            tooltipLabel="Reset Changes"
            tooltipPosition="right"
          />
        </Group>
      </form>
    </Stack>
  );
}

export default Settings;
