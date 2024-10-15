import { ActionIcon, Button, Group, Modal, NumberInput, Stack, Textarea, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import MyTooltip from "../components/MyTooltip";
import { NewTask } from "../models/Task";
import { TimeSpan } from "../models/TimeSpan";

type Props = {
    onValidSubmit: (task: NewTask) => void;
};

function NewTaskDialog(props: Props): JSX.Element {
    const [modalOpened, { open, close }] = useDisclosure(false);
    const form = useForm<NewTask>({
        mode: 'uncontrolled',
        initialValues: {
            description: "",
            status: "Todo",
            scheduledStartDate: null,
            scheduledCompleteDate: null,
            estimatedDuration: null,
        },
        validate: {
            description: (value) => value.length > 0 && value.length < 1000 ? null : "Description must be between 1 and 1000 characters"
        }
    });

    const closeModal = () => {
        close();
        form.reset();
    }

    const submitForm = (values: typeof form.values) => {
        if (!!values.estimatedDuration && values.estimatedDuration !== null) {
            values.estimatedDuration = TimeSpan.fromHours(values.estimatedDuration).totalSeconds;
        }
        console.log(values);
        props.onValidSubmit(values);
        close();
        form.reset();
    }

    return (
        <>
            <Modal opened={modalOpened} onClose={closeModal} title="New Task" closeOnClickOutside={false}>
                <form onSubmit={form.onSubmit(submitForm)}>
                    <Stack gap="sm">
                        <Textarea withAsterisk label="Description" key={form.key("description")} {...form.getInputProps("description")} autosize />
                        <TextInput label="Status" key={form.key("status")} {...form.getInputProps("status")} readOnly />
                        <DateInput clearable defaultValue={new Date()} label="Scheduled Start" key={form.key("scheduledStartDate")} {...form.getInputProps("scheduledStartDate")} />
                        <DateInput clearable defaultValue={new Date()} label="Scheduled Complete" key={form.key("scheduledCompleteDate")} {...form.getInputProps("scheduledCompleteDate")} />
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