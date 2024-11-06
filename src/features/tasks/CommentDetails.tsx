import { Group, Stack, Text, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import dayjs from "dayjs";
import StyledActionIcon from "../../components/StyledActionIcon";
import StyledButton from "../../components/StyledButton";
import { useAppSelector } from "../../redux/hooks";
import { ColorPalette } from "../settings/hooks/useColorService";
import useCommentService from "./hooks/useCommentService";
import { Comment } from "./types/Comment";
import { Task } from "./types/Task";

type Props = {
    task: Task;
    colorPalette: ColorPalette;
    onCommentChanged: () => void;
}

function CommentDetails(props: Props) {

    const userSettings = useAppSelector(state => state.settings.userSettings);

    const {
        addComment,
        editComment,
        deleteComment
    } = useCommentService(userSettings);

    const newCommentForm = useForm({
      mode: "uncontrolled",
      initialValues: {
        comment: "",
      },
      validate: {
        comment: (comment) =>
          !!comment && comment !== null && comment.trim().length > 0
            ? null
            : "Comment must not be empty",
      },
    });

    const editCommentForm = useForm({
      mode: "uncontrolled",
      initialValues: {
        comment: "",
        id: -1,
      },
      validate: {
        comment: (comment) =>
          !!comment && comment !== null && comment.trim().length > 0
            ? null
            : "Comment must not be empty",
      },
    });

    const openNewCommentModal = () =>
      modals.open({
        title: "Add New Comment",
        onClose: () => newCommentForm.reset(),
        closeOnClickOutside: false,
        closeOnEscape: false,
        children: (
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
                  colorPalette={props.colorPalette}
                  tooltipLabel="Save Comment"
                />
              </Group>
            </Stack>
          </form>
        ),
      });

    const openEditCommentModal = (comment: Comment) => {
      editCommentForm.setValues({ comment: comment.message, id: comment.id });
      modals.open({
        title: "Edit Comment",
        onClose: () => editCommentForm.reset(),
        closeOnClickOutside: false,
        closeOnEscape: false,
        children: (
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
                  colorPalette={props.colorPalette}
                  tooltipLabel="Save Comment"
                />
              </Group>
            </Stack>
          </form>
        ),
      });
    };

    const openDeleteModal = (comment: Comment) =>
      modals.openConfirmModal({
        title: "Delete Comment",
        children: <Text>Are you sure you want to delete this comment?</Text>,
        confirmProps: {
          variant: props.colorPalette.variant,
          color: "red",
          gradient: { ...props.colorPalette.gradient, from: "red" },
        },
        cancelProps: {
          variant: props.colorPalette.variant,
          gradient: props.colorPalette.gradient,
        },
        labels: { confirm: "Confirm", cancel: "Deny" },
        onCancel: () => {},
        onConfirm: () => deleteExistingComment(comment),
      });

    async function addNewComment(values: typeof newCommentForm.values) {
      await addComment(props.task.id, values.comment, () => {
        modals.closeAll();
        newCommentForm.reset();
        props.onCommentChanged();
      });
    }

    async function editExistingComment(comment: typeof editCommentForm.values) {
      await editComment(comment.id, comment.comment, () => {
        modals.closeAll();
        editCommentForm.reset();
        props.onCommentChanged();
      });
    }

    async function deleteExistingComment(comment: Comment) {
        await deleteComment(comment.id, () => props.onCommentChanged());
    }


    function commentRow(comment: Comment): JSX.Element {
        return (
            <Stack gap={3} key={comment.id}>
                <Text size="sm">{comment.message}</Text>
                <Group>
                    <Text size="xs" style={{ fontStyle: "italic" }}>{"Created: " + dayjs(comment.created).format("MM/DD/YYYY hh:mm:ss A")}</Text>
                    {comment.modified !== null ? <Text size="xs" style={{ fontStyle: "italic" }}>{"Modified: " + dayjs(comment.modified).format("MM/DD/YYYY hh:mm:ss A")}</Text> : null}
                    <StyledActionIcon
                        size="xs"
                        onClick={() => openEditCommentModal(comment)}
                        colorPalette={props.colorPalette}
                        tooltipLabel="Edit Comment"
                        tooltipPosition="left"
                    >
                        <IconEdit />
                    </StyledActionIcon>
                    <StyledActionIcon
                        size="xs"
                        onClick={() => openDeleteModal(comment)}
                        colorPalette={props.colorPalette}
                        tooltipLabel="Delete Comment"
                        tooltipPosition="left"
                    >
                        <IconTrash />
                    </StyledActionIcon>
                </Group>
            </Stack>
        );
    }

    return (
        <Stack gap={10}>
            <Group>
                <Text size="sm">Comments</Text>
                <StyledActionIcon
                    size="xs"
                    onClick={() => openNewCommentModal()}
                    colorPalette={props.colorPalette}
                    tooltipLabel="Add Comment"
                    tooltipPosition="right"
                >
                    <IconPlus />
                </StyledActionIcon>
            </Group>
            {props.task.comments.length == 0 ? <Text size="xs">No Comments</Text> : props.task.comments.map(comment => commentRow(comment))}
        </Stack>
    );
}

export default CommentDetails;