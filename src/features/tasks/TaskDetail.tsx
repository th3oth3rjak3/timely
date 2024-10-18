import { Button, Group, Stack, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconArrowBackUp, IconCancel, IconCheck, IconEdit, IconPlayerPauseFilled, IconPlayerPlayFilled, IconTrashFilled } from "@tabler/icons-react";
import dayjs from "dayjs";
import { ReactNode } from "react";
import { TimeSpan } from "../../models/TimeSpan";
import { Task } from "./Task";

export type TaskDetailParams = {
    task: Task;
    onStarted: (task: Task) => void;
    onPaused: (task: Task) => void;
    onResumed: (task: Task) => void;
    onFinished: (task: Task) => void;
    onReopened: (task: Task) => void;
    onCancelled: (task: Task) => void;
    onRestored: (task: Task) => void;
    onEdited: (task: Task) => void;
    onDeleted: (task: Task) => void;
}

/**
 * Build the task detail section for the expanded list row.
 * @param task - The task to show the details for.
 * @returns A JSX element.
 */
function TaskDetail(props: TaskDetailParams): JSX.Element {

    const buttons = (statusDescription: string): JSX.Element => {

        const openCancelModal = () => modals.openConfirmModal({
            title: 'Cancel Task',
            children: (
                <Text>Are you sure you want to cancel this task?</Text>
            ),
            labels: { confirm: "Confirm", cancel: "Deny" },
            confirmProps: { variant: "light", color: "cyan" },
            cancelProps: { variant: "light", color: "indigo" },
            onCancel: () => { },
            onConfirm: () => props.onCancelled(props.task)
        });

        const openDeleteModal = () => modals.openConfirmModal({
            title: "Delete Task",
            children: (
                <Text>Are you sure you want to delete this task?</Text>
            ),
            confirmProps: { variant: "light", color: "cyan" },
            cancelProps: { variant: "light", color: "indigo" },
            labels: { confirm: "Confirm", cancel: "Deny" },
            onCancel: () => { },
            onConfirm: () => props.onDeleted(props.task)
        });

        const status = statusDescription.toLowerCase();

        const startButton = <Button size="compact-xs" variant="light" color="teal" leftSection={<IconPlayerPlayFilled size={14} />} onClick={() => props.onStarted(props.task)}>Start</Button>;
        const pauseButton = <Button size="compact-xs" variant="light" leftSection={<IconPlayerPauseFilled size={14} />} onClick={() => props.onPaused(props.task)}>Pause</Button>;
        const resumeButton = <Button size="compact-xs" variant="light" color="teal" leftSection={<IconPlayerPlayFilled size={14} />} onClick={() => props.onResumed(props.task)}>Resume</Button>;
        const cancelButton = <Button size="compact-xs" variant="light" color="orange" leftSection={<IconCancel size={14} />} onClick={() => openCancelModal()}>Cancel</Button>;
        const finishButton = <Button size="compact-xs" variant="light" color="teal" leftSection={<IconCheck size={14} />} onClick={() => props.onFinished(props.task)}>Finish</Button>;
        const restoreButton = <Button size="compact-xs" variant="light" color="violet" leftSection={<IconArrowBackUp size={14} />} onClick={() => props.onRestored(props.task)}>Restore</Button>;
        const reopenButton = <Button size="compact-xs" variant="light" color="violet" leftSection={<IconArrowBackUp size={14} />} onClick={() => props.onReopened(props.task)}>Reopen</Button>;
        const deleteButton = <Button size="compact-xs" variant="light" color="red" leftSection={<IconTrashFilled size={14} />} onClick={() => openDeleteModal()}>Delete</Button>;
        const editButton = <Button size="compact-xs" variant="light" color="cyan" leftSection={<IconEdit size={14} />} onClick={() => props.onEdited(props.task)}>Edit</Button>;

        if (status === "todo") {
            return (
                <>
                    {startButton}
                    {editButton}
                    {cancelButton}
                    {deleteButton}
                </>
            );
        }

        if (status === "doing") {
            return (
                <>
                    {pauseButton}
                    {finishButton}
                    {editButton}
                    {cancelButton}
                    {deleteButton}
                </>
            );
        }

        if (status === "done") {
            return (
                <>
                    {reopenButton}
                    {deleteButton}
                </>
            );
        }

        if (status === "paused") {
            return (
                <>
                    {resumeButton}
                    {finishButton}
                    {editButton}
                    {cancelButton}
                    {deleteButton}
                </>
            );
        }

        if (status === "cancelled") {
            return (
                <>
                    {restoreButton}
                    {deleteButton}
                </>
            );
        }

        return <></>;
    }

    const row = (label: string, content: ReactNode): JSX.Element =>
    (
        <Group gap={6} ml={10} key={label}>
            <Text size="xs" w={130}>{label + ":"}</Text>
            <Text size="xs">{content}</Text>
        </Group>
    );

    const rowData = [
        {
            label: "Description",
            content: <span style={{ whiteSpace: "pre-wrap" }}>{props.task.description}</span>,
        },
        {
            label: "Status",
            content: props.task.status
        },
        {
            label: "Scheduled Start",
            content: props.task.scheduledStartDate !== null ? dayjs(props.task.scheduledStartDate).format("MM/DD/YYYY") : "Not Scheduled"
        },
        {
            label: "Scheduled Complete",
            content: props.task.scheduledCompleteDate !== null ? dayjs(props.task.scheduledCompleteDate).format("MM/DD/YYYY") : "Not Scheduled",
        },
        {
            label: "Actual Start",
            content: props.task.actualStartDate !== null ? dayjs(props.task.actualStartDate).format("MM/DD/YYYY") : "Not Started"
        },
        {
            label: "Actual Complete",
            content: props.task.actualCompleteDate !== null ? dayjs(props.task.actualCompleteDate).format("MM/DD/YYYY") : "Not Completed",
        },
        {
            label: "Estimated",
            content: props.task.estimatedDuration !== null ? TimeSpan.fromSeconds(props.task.estimatedDuration).toString() : "Not Estimated",
        },
        {
            label: "Elapsed",
            content: TimeSpan.fromSeconds(props.task.elapsedDuration).toString()
        }

    ];

    return (
        <Stack gap={4} my={10}>
            {rowData.map(({ label, content }) => row(label, content))}
            <Group gap={6} ml={10} mt={10}>
                {buttons(props.task.status)}
            </Group>
        </Stack>
    );
}

export default TaskDetail;