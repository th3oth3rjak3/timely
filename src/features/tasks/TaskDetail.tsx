import { Grid, Group, Textarea, TextInput } from "@mantine/core";
import { IconArrowBackUp, IconCancel, IconCheck, IconEdit, IconPlayerPauseFilled, IconPlayerPlayFilled, IconTrash } from "@tabler/icons-react";
import dayjs from "dayjs";
import StyledButton from "../../components/StyledButton";
import { TimeSpan } from "../../models/TimeSpan";
import { UserSettings } from "../settings/UserSettings";
import { Tag } from "../tags/types/Tag";
import CommentDetails from "./CommentDetails";
import TagDetails from "./TagDetails";
import { Task } from "./types/Task";

export type TaskDetailParams = {
  task: Task;
  tagOptions: Tag[];
  userSettings: UserSettings;
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
};

/**
 * Build the task detail section for the expanded list row.
 * @param task - The task to show the details for.
 * @returns A JSX element.
 */
function TaskDetail(props: TaskDetailParams): JSX.Element {
  const buttons = (statusDescription: string): JSX.Element => {
    const status = statusDescription.toLowerCase();

    const startButton = (
      <StyledButton
        size="compact-sm"
        label="Start"
        onClick={() => props.onStarted(props.task)}
        tooltipLabel="Start Task"
        tooltipPosition="top"
        leftSection={<IconPlayerPlayFilled size={14} />}
      />
    );

    const pauseButton = (
      <StyledButton
        size="compact-sm"
        label="Pause"
        onClick={() => props.onPaused(props.task)}
        tooltipLabel="Pause Task"
        tooltipPosition="top"
        leftSection={<IconPlayerPauseFilled size={14} />}
      />
    );

    const resumeButton = (
      <StyledButton
        size="compact-sm"
        label="Resume"
        onClick={() => props.onResumed(props.task)}
        tooltipLabel="Resume Task"
        tooltipPosition="top"
        leftSection={<IconPlayerPlayFilled size={14} />}
      />
    );

    const cancelButton = (
      <StyledButton
        size="compact-sm"
        label="Cancel"
        onClick={() => props.onCancelled(props.task)}
        tooltipLabel="Cancel Task"
        tooltipPosition="top"
        leftSection={<IconCancel size={14} />}
      />
    );

    const finishButton = (
      <StyledButton
        size="compact-sm"
        label="Finish"
        onClick={() => props.onFinished(props.task)}
        tooltipLabel="Finish Task"
        tooltipPosition="top"
        leftSection={<IconCheck size={14} />}
      />
    );

    const restoreButton = (
      <StyledButton
        size="compact-sm"
        label="Restore"
        onClick={() => props.onRestored(props.task)}
        tooltipLabel="Restore Cancelled Task"
        tooltipPosition="top"
        leftSection={<IconArrowBackUp size={14} />}
      />
    );

    const reopenButton = (
      <StyledButton
        size="compact-sm"
        label="Reopen"
        onClick={() => props.onFinished(props.task)}
        tooltipLabel="Reopen Finished Task"
        tooltipPosition="top"
        leftSection={<IconArrowBackUp size={14} />}
      />
    );

    const deleteButton = (
      <StyledButton
        size="compact-sm"
        label="Delete"
        onClick={() => props.onDeleted(props.task)}
        tooltipLabel="Delete Task"
        tooltipPosition="top"
        leftSection={<IconTrash size={14} />}
      />
    );

    const editButton = (
      <StyledButton
        size="compact-sm"
        label="Edit"
        onClick={() => props.onEdited(props.task)}
        tooltipLabel="Edit Task"
        tooltipPosition="top"
        leftSection={<IconEdit size={14} />}
      />
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
  };

  return (
    <Grid p="sm">
      <Grid.Col span={12}>
        <Textarea
          label="Description"
          value={props.task.description}
          autosize
          readOnly
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <TextInput value={props.task.status} label="Status" readOnly />
      </Grid.Col>
      <Grid.Col span={4}>
        <TextInput
          value={
            props.task.estimatedDuration !== null
              ? TimeSpan.fromSeconds(props.task.estimatedDuration).toString()
              : "Not Estimated"
          }
          label="Estimated Duration"
          readOnly
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <TextInput
          value={TimeSpan.fromSeconds(props.task.elapsedDuration).toString()}
          label="Elapsed Duration"
          readOnly
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <TextInput
          label="Scheduled Start Date"
          value={
            props.task.scheduledStartDate !== null
              ? dayjs(props.task.scheduledStartDate).format("MM/DD/YYYY")
              : "Not Scheduled"
          }
          readOnly
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <TextInput
          label="Scheduled Complete Date"
          value={
            props.task.scheduledCompleteDate !== null
              ? dayjs(props.task.scheduledCompleteDate).format("MM/DD/YYYY")
              : "Not Scheduled"
          }
          readOnly
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <TextInput
          label="Actual Start Date"
          value={
            props.task.actualStartDate !== null
              ? dayjs(props.task.actualStartDate).format("MM/DD/YYYY")
              : "Not Started"
          }
          readOnly
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <TextInput
          label="Actual Complete Date"
          value={
            props.task.actualCompleteDate !== null
              ? dayjs(props.task.actualCompleteDate).format("MM/DD/YYYY")
              : "Not Completed"
          }
          readOnly
        />
      </Grid.Col>
      <Grid.Col span={12}>
        {
          <TagDetails
            task={props.task}
            onTagsChanged={props.onTagsChanged}
            tagOptions={props.tagOptions}
            readOnly={true}
          />
        }
      </Grid.Col>
      <Grid.Col span={12}>
        <CommentDetails
          task={props.task}
          onCommentChanged={props.onCommentChanged}
        />
      </Grid.Col>
      <Grid.Col span={12}>
        <Group gap={6}>{buttons(props.task.status)}</Group>
      </Grid.Col>
    </Grid>
  );
}

export default TaskDetail;