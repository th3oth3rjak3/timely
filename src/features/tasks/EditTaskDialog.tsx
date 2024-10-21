import { Button, Group, Modal, NumberInput, Stack, Textarea, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { TimeSpan } from "../../models/TimeSpan";
import { maybeDate } from "../../utilities/dateUtilities";
import { Task } from "./types/Task";

type Props = {
    task: Task,
    isOpen: boolean,
    onValidSubmit: (task: Task) => void;
    onClosed: () => void;
}

function EditTaskDialog(props: Props) {

    const [modalOpened] = useDisclosure(props.isOpen);
    const form = useForm<Task>({
        mode: 'controlled',
        initialValues: {
            id: props.task.id,
            title: props.task.title,
            description: props.task.description,
            status: props.task.status,
            scheduledStartDate: maybeDate(props.task.scheduledStartDate),
            scheduledCompleteDate: maybeDate(props.task.scheduledCompleteDate),
            actualStartDate: maybeDate(props.task.actualStartDate),
            actualCompleteDate: maybeDate(props.task.actualCompleteDate),
            estimatedDuration: TimeSpan.tryFromSeconds(props.task.estimatedDuration)?.totalHours ?? null,
            elapsedDuration: TimeSpan.fromSeconds(props.task.elapsedDuration).totalHours,
            comments: props.task.comments,
            tags: props.task.tags
        },
        validate: {
            description: (value) => value.length > 0 && value.length < 2000 ? null : "Description must be between 1 and 2000 characters",
            title: (value) => value.length > 0 && value.length < 100 ? null : "Title must be between 1 and 100 characters"
        }
    });

    const closeModal = () => {
        props.onClosed();
        form.reset();
    }

    const submitForm = (values: typeof form.values) => {
        if (!!values.estimatedDuration && values.estimatedDuration !== null) {
            values.estimatedDuration = TimeSpan.fromHours(values.estimatedDuration).totalSeconds;
        }

        values.elapsedDuration = TimeSpan.fromHours(values.elapsedDuration).totalSeconds;
        props.onValidSubmit(values);
        form.reset();
    }

    return (
        <>
            <Modal opened={modalOpened} onClose={closeModal} title="Edit Task" closeOnClickOutside={false} closeOnEscape={false}>
                <form onSubmit={form.onSubmit(submitForm)}>
                    <Stack gap="sm">
                        <TextInput withAsterisk label="Title" key={form.key("title")} {...form.getInputProps("title")} />
                        <Textarea withAsterisk label="Description" key={form.key("description")} {...form.getInputProps("description")} autosize />
                        <TextInput label="Status" key={form.key("status")} {...form.getInputProps("status")} readOnly />
                        <DateInput
                            valueFormat="MM/DD/YYYY"
                            highlightToday={true}
                            clearable
                            defaultValue={form.getValues().scheduledStartDate}
                            label="Start By"
                            key={form.key("scheduledStartDate")}
                            {...form.getInputProps("scheduledStartDate")} />
                        <DateInput
                            valueFormat="MM/DD/YYYY"
                            highlightToday={true}
                            clearable
                            defaultValue={form.getValues().scheduledCompleteDate}
                            label="Due By"
                            key={form.key("scheduledCompleteDate")}
                            {...form.getInputProps("scheduledCompleteDate")} />
                        <DateInput
                            valueFormat="MM/DD/YYYY"
                            highlightToday={true}
                            clearable
                            defaultValue={form.getValues().actualStartDate}
                            label="Started On"
                            key={form.key("actualStartDate")}
                            {...form.getInputProps("actualStartDate")} />
                        <DateInput
                            valueFormat="MM/DD/YYYY"
                            highlightToday={true}
                            clearable
                            defaultValue={form.getValues().actualCompleteDate}
                            label="Finished On"
                            key={form.key("actualCompleteDate")}
                            {...form.getInputProps("actualCompleteDate")} />
                        <NumberInput label="Estimated Duration" key={form.key("estimatedDuration")} {...form.getInputProps("estimatedDuration")} suffix=" hour(s)" decimalScale={1} />
                        <NumberInput label="Elapsed Duration" key={form.key("elapsedDuration")} {...form.getInputProps("elapsedDuration")} suffix=" hour(s)" decimalScale={1} />
                    </Stack>
                    <Group justify="flex-end" mt="md">
                        <Button type="submit" variant="light" color="cyan">Submit</Button>
                    </Group>
                </form>
            </Modal>
        </>
    );
}

export default EditTaskDialog;