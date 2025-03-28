import {Divider, Group, Modal, Stack, Text, Textarea} from "@mantine/core";
import {useForm} from "@mantine/form";
import {useDisclosure} from "@mantine/hooks";
import {modals} from "@mantine/modals";
import {IconEdit, IconPlus, IconTrash} from "@tabler/icons-react";
import dayjs from "dayjs";
import StyledActionIcon from "../../components/StyledActionIcon";
import StyledButton from "../../components/StyledButton";
import useColorPalette from "../../hooks/useColorPalette";
import {Comment, Task} from "../../models/ZodModels";
import {useUserSettings} from "../settings/settingsService";
import {useAddComment, useDeleteComment, useEditComment,} from "./services/commentService";

export interface CommentDetailsProps {
  task: Task;
  onCommentChanged: () => void;
}

function CommentDetails(props: CommentDetailsProps) {
  const colorPalette = useColorPalette();
  const {data: userSettings} = useUserSettings();

  const addComment = useAddComment(userSettings);
  const editComment = useEditComment(userSettings);
  const deleteComment = useDeleteComment(userSettings);

  const [editModalOpened, editModalActions] = useDisclosure(false);
  const [newModalOpened, newModalActions] = useDisclosure(false);

  const newCommentForm = useForm({
    mode: "controlled",
    initialValues: {
      comment: "",
    },
    validateInputOnBlur: true,
    validateInputOnChange: true,
    validate: {
      comment: (comment) =>
        !!comment && comment.trim().length > 0
          ? null
          : "Comment must not be empty",
    },
  });

  const editCommentForm = useForm({
    mode: "controlled",
    initialValues: {
      comment: "",
      id: -1,
    },
    validateInputOnBlur: true,
    validateInputOnChange: true,
    validate: {
      comment: (comment) =>
        !!comment && comment.trim().length > 0
          ? null
          : "Comment must not be empty",
    },
  });

  const openEditCommentModal = (comment: Comment) => {
    editCommentForm.setValues({comment: comment.message, id: comment.id});
    editModalActions.open();
  };

  const openDeleteModal = (comment: Comment) =>
    modals.openConfirmModal({
      title: "Delete Comment",
      children: <Text>Are you sure you want to delete this comment?</Text>,
      confirmProps: {
        variant: colorPalette.variant,
        color: "red",
        gradient: {...colorPalette.gradient, from: "red"},
      },
      cancelProps: {
        variant: colorPalette.variant,
        gradient: colorPalette.gradient,
      },
      labels: {confirm: "Confirm", cancel: "Deny"},
      onCancel: () => {
      },
      onConfirm: () => deleteComment.mutateAsync(comment.id),
    });

  async function addNewComment(values: typeof newCommentForm.values) {
    newCommentForm.reset();
    newModalActions.close();
    await addComment.mutateAsync({
      taskId: props.task.id,
      message: values.comment,
    });
    props.onCommentChanged();
  }

  async function editExistingComment(comment: typeof editCommentForm.values) {
    editCommentForm.reset();
    editModalActions.close();
    await editComment.mutateAsync({
      commentId: comment.id,
      message: comment.comment,
    });
    props.onCommentChanged();
  }

  function commentRow(comment: Comment, withDivider: boolean): JSX.Element {
    return (
      <Stack gap={3} key={comment.id}>
        <Text size="sm" style={{whiteSpace: "pre-line"}}>
          {comment.message}
        </Text>
        <Group>
          <Text size="xs" style={{fontStyle: "italic"}}>
            {"Created: " +
              dayjs(comment.created).format("MM/DD/YYYY hh:mm:ss A")}
          </Text>
          {comment.modified !== null ? (
            <Text size="xs" style={{fontStyle: "italic"}}>
              {"Modified: " +
                dayjs(comment.modified).format("MM/DD/YYYY hh:mm:ss A")}
            </Text>
          ) : null}
          <StyledActionIcon
            size="xs"
            onClick={() => openEditCommentModal(comment)}
            tooltipLabel="Edit Comment"
            tooltipPosition="left"
          >
            <IconEdit/>
          </StyledActionIcon>
          <StyledActionIcon
            size="xs"
            onClick={() => openDeleteModal(comment)}
            tooltipLabel="Delete Comment"
            tooltipPosition="left"
          >
            <IconTrash/>
          </StyledActionIcon>
        </Group>
        {withDivider ? <Divider mt="sm"/> : null}
      </Stack>
    );
  }

  return (
    <Stack gap={10}>
      <Group>
        <Text size="sm">Comments</Text>
        <StyledActionIcon
          size="xs"
          onClick={newModalActions.open}
          tooltipLabel="Add Comment"
          tooltipPosition="right"
        >
          <IconPlus/>
        </StyledActionIcon>
      </Group>
      {props.task.comments.length == 0 ? (
        <Text size="xs">No Comments</Text>
      ) : (
        props.task.comments.map((comment, i) =>
          commentRow(comment, i < props.task.comments.length - 1)
        )
      )}
      <Modal
        opened={newModalOpened}
        onClose={newModalActions.close}
        title="Add New Comment"
        closeOnClickOutside={false}
        closeOnEscape={false}
      >
        <form onSubmit={newCommentForm.onSubmit(addNewComment)}>
          <Stack>
            <Textarea
              label="Comment"
              {...newCommentForm.getInputProps("comment")}
              key={newCommentForm.key("comment")}
              autosize
              maxRows={10}
            />
            <Group>
              <StyledButton
                type="submit"
                label="Save"
                tooltipLabel="Save Comment"
              />
            </Group>
          </Stack>
        </form>
      </Modal>
      <Modal
        opened={editModalOpened}
        onClose={editModalActions.close}
        title="Edit Comment"
        closeOnClickOutside={false}
        closeOnEscape={false}
      >
        <form onSubmit={editCommentForm.onSubmit(editExistingComment)}>
          <Stack>
            <Textarea
              label="Comment"
              {...editCommentForm.getInputProps("comment")}
              key={editCommentForm.key("comment")}
              autosize
              maxRows={10}
            />
            <Group>
              <StyledButton
                type="submit"
                label="Save"
                tooltipLabel="Save Comment"
              />
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}

export default CommentDetails;
