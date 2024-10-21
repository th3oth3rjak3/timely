import { ActionIcon, Button, Group, Modal, NumberInput, Stack, Textarea, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import MyTooltip from "../../components/MyTooltip";
import { TimeSpan } from "../../models/TimeSpan";
import { NewTask } from "./types/Task";

type Props = {
    onValidSubmit: (task: NewTask) => void | Promise<void> | Promise<void | undefined>;
};

function NewTaskDialog(props: Props): JSX.Element {
    const [modalOpened, { open, close }] = useDisclosure(false);
    const form = useForm<NewTask>({
        mode: 'controlled',
        initialValues: {
            title: "",
            description: "",
            status: "Todo",
            scheduledStartDate: null,
            scheduledCompleteDate: null,
            estimatedDuration: null,
        },
        validate: {
            description: (value) => value.length > 0 && value.length < 2000 ? null : "Description must be between 1 and 2000 characters",
            title: (value) => value.length > 0 && value.length < 100 ? null : "Title must be between 1 and 100 characters"
        }
    });

    const closeModal = () => {
        close();
        form.reset();
    }

    const submitForm = async (values: typeof form.values) => {
        if (!!values.estimatedDuration && values.estimatedDuration !== null) {
            values.estimatedDuration = TimeSpan.fromHours(values.estimatedDuration).totalSeconds;
        }
        await props.onValidSubmit(values);
        close();
        form.reset();
    }

    return (
        <>
            <Modal opened={modalOpened} onClose={closeModal} title="New Task" closeOnClickOutside={false} closeOnEscape={false}>
                <form onSubmit={form.onSubmit(submitForm)}>
                    <Stack gap="sm">
                        <TextInput withAsterisk label="Title" key={form.key("title")} {...form.getInputProps("title")} />
                        <Textarea withAsterisk label="Description" key={form.key("description")} {...form.getInputProps("description")} autosize />
                        <TextInput label="Status" key={form.key("status")} {...form.getInputProps("status")} readOnly />
                        <DateInput
                            valueFormat="MM/DD/YYYY"
                            highlightToday={true}
                            clearable
                            defaultValue={new Date()}
                            label="Start By"
                            key={form.key("scheduledStartDate")}
                            {...form.getInputProps("scheduledStartDate")} />
                        <DateInput
                            valueFormat="MM/DD/YYYY"
                            highlightToday={true}
                            clearable
                            defaultValue={new Date()}
                            label="Due By"
                            key={form.key("scheduledCompleteDate")}
                            {...form.getInputProps("scheduledCompleteDate")} />
                        <NumberInput label="Estimated Duration (Hours)" key={form.key("estimatedDuration")} {...form.getInputProps("estimatedDuration")} />
                    </Stack>
                    <Group justify="flex-end" mt="md">
                        <Button type="submit" variant="light" color="cyan">Submit</Button>
                    </Group>
                </form>
            </Modal>
            <MyTooltip label="Add New Task" position="left">
                <ActionIcon onClick={open} variant="light" color="cyan">
                    <IconPlus />
                </ActionIcon>
            </MyTooltip>
        </>
    );
}

export default NewTaskDialog;