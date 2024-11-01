import { Button, Grid, Group, Textarea, TextInput } from "@mantine/core";
import { IconArrowBackUp, IconCancel, IconCheck, IconEdit, IconPlayerPauseFilled, IconPlayerPlayFilled, IconTrash } from "@tabler/icons-react";
import dayjs from "dayjs";
import MyTooltip from "../../components/MyTooltip";
import { TimeSpan } from "../../models/TimeSpan";
import { ColorPalette } from "../settings/hooks/useColorService";
import { Tag } from "../tags/types/Tag";
import CommentDetails from "./CommentDetails";
import TagDetails from "./TagDetails";
import { Task } from "./types/Task";

export type TaskDetailParams = {
    task: Task;
    tagOptions: Tag[],
    colorPalette: ColorPalette,
    onStarted: (task: Task) => void;
    onPaused: (task: Task) => void;
    onResumed: (task: Task) => void;
    onFinished: (task: Task) => void;
    onReopened: (task: Task) => void;
    onCancelled: (task: Task) => void;
    onRestored: (task: Task) => void;
    onEdited: (task: Task) => void;
    onDeleted: (task: Task) => void;
    onCommentChanged: () => void;
    onTagsChanged: () => void;
}

/**
 * Build the task detail section for the expanded list row.
 * @param task - The task to show the details for.
 * @returns A JSX element.
 */
function TaskDetail(props: TaskDetailParams): JSX.Element {
    const buttons = (statusDescription: string): JSX.Element => {

        const status = statusDescription.toLowerCase();

        const startButton = (
            <MyTooltip label="Start Task" colorPalette={props.colorPalette}>
                <Button size="compact-sm" variant={props.colorPalette.variant} color={props.colorPalette.colorName} leftSection={<IconPlayerPlayFilled size={14} />} onClick={() => props.onStarted(props.task)}>Start</Button>
            </MyTooltip>
        );


        const pauseButton = (
            <MyTooltip label="Pause Task" colorPalette={props.colorPalette}>
                <Button size="compact-sm" variant={props.colorPalette.variant} color={props.colorPalette.colorName} leftSection={<IconPlayerPauseFilled size={14} />} onClick={() => props.onPaused(props.task)}>Pause</Button>
            </MyTooltip>
        );


        const resumeButton = (
            <MyTooltip label="Resume Task" colorPalette={props.colorPalette}>
                <Button size="compact-sm" variant={props.colorPalette.variant} color={props.colorPalette.colorName} leftSection={<IconPlayerPlayFilled size={14} />} onClick={() => props.onResumed(props.task)}>Resume</Button>
            </MyTooltip>
        );


        const cancelButton = (
            <MyTooltip label="Cancel Task" colorPalette={props.colorPalette}>
                <Button size="compact-sm" variant={props.colorPalette.variant} color={props.colorPalette.colorName} leftSection={<IconCancel size={14} />} onClick={() => props.onCancelled(props.task)}>Cancel</Button>
            </MyTooltip>
        );


        const finishButton = (
            <MyTooltip label="Finish Task" colorPalette={props.colorPalette}>
                <Button size="compact-sm" variant={props.colorPalette.variant} color={props.colorPalette.colorName} leftSection={<IconCheck size={14} />} onClick={() => props.onFinished(props.task)}>Finish</Button>
            </MyTooltip>
        );


        const restoreButton = (
            <MyTooltip label="Restore Cancelled Task" colorPalette={props.colorPalette}>
                <Button size="compact-sm" variant={props.colorPalette.variant} color={props.colorPalette.colorName} leftSection={<IconArrowBackUp size={14} />} onClick={() => props.onRestored(props.task)}>Restore</Button>
            </MyTooltip>
        );

        const reopenButton = (
            <MyTooltip label="Reopen Finished Task" colorPalette={props.colorPalette}>
                <Button size="compact-sm" variant={props.colorPalette.variant} color={props.colorPalette.colorName} leftSection={<IconArrowBackUp size={14} />} onClick={() => props.onReopened(props.task)}>Reopen</Button>
            </MyTooltip>
        );

        const deleteButton = (
            <MyTooltip label="Delete Task" colorPalette={props.colorPalette}>
                <Button size="compact-sm" variant={props.colorPalette.variant} color={props.colorPalette.colorName} leftSection={<IconTrash size={14} />} onClick={() => props.onDeleted(props.task)}>Delete</Button>
            </MyTooltip>
        );

        const editButton = (
            <MyTooltip label="Edit Task" colorPalette={props.colorPalette}>
                <Button size="compact-sm" variant={props.colorPalette.variant} color={props.colorPalette.colorName} leftSection={<IconEdit size={14} />} onClick={() => props.onEdited(props.task)}>Edit</Button>
            </MyTooltip>
        );

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

    return (
        <Grid p="sm">
            <Grid.Col span={12}>
                <Textarea label="Description" value={props.task.description} autosize readOnly />
            </Grid.Col>
            <Grid.Col span={4}>
                <TextInput value={props.task.status} label="Status" readOnly />
            </Grid.Col>
            <Grid.Col span={4}>
                <TextInput value={props.task.estimatedDuration !== null ? TimeSpan.fromSeconds(props.task.estimatedDuration).toString() : "Not Estimated"} label="Estimated Duration" readOnly />
            </Grid.Col>
            <Grid.Col span={4}>
                <TextInput value={TimeSpan.fromSeconds(props.task.elapsedDuration).toString()} label="Elapsed Duration" readOnly />
            </Grid.Col>
            <Grid.Col span={6}>
                <TextInput label="Scheduled Start Date" value={props.task.scheduledStartDate !== null ? dayjs(props.task.scheduledStartDate).format("MM/DD/YYYY") : "Not Scheduled"} readOnly />
            </Grid.Col>
            <Grid.Col span={6}>
                <TextInput label="Scheduled Complete Date" value={props.task.scheduledCompleteDate !== null ? dayjs(props.task.scheduledCompleteDate).format("MM/DD/YYYY") : "Not Scheduled"} readOnly />
            </Grid.Col>
            <Grid.Col span={6}>
                <TextInput label="Actual Start Date" value={props.task.actualStartDate !== null ? dayjs(props.task.actualStartDate).format("MM/DD/YYYY") : "Not Started"} readOnly />
            </Grid.Col>
            <Grid.Col span={6}>
                <TextInput label="Actual Complete Date" value={props.task.actualCompleteDate !== null ? dayjs(props.task.actualCompleteDate).format("MM/DD/YYYY") : "Not Completed"} readOnly />
            </Grid.Col>
            <Grid.Col span={12}>{<TagDetails task={props.task} onTagsChanged={props.onTagsChanged} tagOptions={props.tagOptions} colorPalette={props.colorPalette} />}</Grid.Col>
            <Grid.Col span={12}>
                <CommentDetails task={props.task} onCommentChanged={props.onCommentChanged} colorPalette={props.colorPalette} />
            </Grid.Col>
            <Grid.Col span={12}>
                <Group gap={6}>
                    {buttons(props.task.status)}
                </Group>
            </Grid.Col>
        </Grid>
    );
}

export default TaskDetail;