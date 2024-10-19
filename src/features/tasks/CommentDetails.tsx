import { ActionIcon, Button, Group, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { invoke } from "@tauri-apps/api/core";
import dayjs from "dayjs";
import MyTooltip from "../../components/MyTooltip";
import { showErrorNotification, showSuccessNotification } from "../../utilities/notificationUtilities";
import { Comment, Task } from "./Task";

type Props = {
    task: Task
    onCommentChanged: () => void;
}

function CommentDetails(props: Props) {

    const newCommentForm = useForm({
        mode: "uncontrolled",
        initialValues: {
            comment: ""
        },
        validate: {
            comment: (comment) => !!comment && comment !== null && comment.trim().length > 0 ? null : "Comment must not be empty"
        }
    })

    const editCommentForm = useForm({
        mode: "uncontrolled",
        initialValues: {
            comment: "",
            id: -1,
        },
        validate: {
            comment: (comment) => !!comment && comment !== null && comment.trim().length > 0 ? null : "Comment must not be empty"
        }
    })

    const openNewCommentModal = () => modals.open({
        title: 'Add New Comment',
        closeOnClickOutside: false,
        closeOnEscape: false,
        children: (
            <form onSubmit={newCommentForm.onSubmit(addNewComment)}>
                <Stack>
                    <TextInput label="Comment" {...newCommentForm.getInputProps("comment")} key={newCommentForm.key("comment")} />
                    <Group>
                        <Button type="submit" variant="light" color="cyan">Save</Button>
                    </Group>
                </Stack>
            </form>
        )
    });

    const openEditCommentModal = (comment: Comment) => {
        editCommentForm.setValues({ comment: comment.message, id: comment.id });
        modals.open({
            title: 'Edit Comment',
            closeOnClickOutside: false,
            closeOnEscape: false,
            children: (
                <form onSubmit={editCommentForm.onSubmit(editComment)}>
                    <Stack>
                        <TextInput label="Comment" {...editCommentForm.getInputProps("comment")} key={editCommentForm.key("comment")} />
                        <Group>
                            <Button type="submit" variant="light" color="cyan">Save</Button>
                        </Group>
                    </Stack>
                </form>
            )
        });
    }

    const openDeleteModal = (comment: Comment) => modals.openConfirmModal({
        title: "Delete Comment",
        children: (
            <Text>Are you sure you want to delete this comment?</Text>
        ),
        confirmProps: { variant: "light", color: "cyan" },
        cancelProps: { variant: "light", color: "indigo" },
        labels: { confirm: "Confirm", cancel: "Deny" },
        onCancel: () => { },
        onConfirm: () => deleteComment(comment)
    });

    function addNewComment(values: typeof newCommentForm.values) {
        invoke<void>("add_comment", { comment: { taskId: props.task.id, message: values.comment } })
            .then(() => {
                showSuccessNotification("Added comment successfully.");
                props.onCommentChanged();
                newCommentForm.reset();
                modals.closeAll();
            })
            .catch((err: string) => showErrorNotification("adding new comment", err));
    }

    function editComment(comment: typeof editCommentForm.values) {
        invoke<void>("update_comment", { comment: { id: comment.id, message: comment.comment } })
            .then(() => {
                showSuccessNotification("Updated comment successfully.");
                props.onCommentChanged();
                editCommentForm.reset();
                modals.closeAll();
            })
            .catch((err: string) => showErrorNotification("updating comment", err));
    }

    function deleteComment(comment: Comment) {
        invoke<void>("delete_comment", { id: comment.id })
            .then(() => {
                showSuccessNotification("Deleted comment successfully.");
                props.onCommentChanged();
            })
            .catch(err => showErrorNotification("deleting comment", err));
    }


    function commentRow(comment: Comment): JSX.Element {
        return (
            <Stack gap={3} key={comment.id}>
                <Text size="sm">{comment.message}</Text>
                <Group>
                    <Text size="xs" style={{ fontStyle: "italic" }}>{"Created: " + dayjs(comment.created).format("MM/DD/YYYY hh:mm:ss A")}</Text>
                    {comment.modified !== null ? <Text size="xs" style={{ fontStyle: "italic" }}>{"Modified: " + dayjs(comment.modified).format("MM/DD/YYYY hh:mm:ss A")}</Text> : null}
                    <MyTooltip label="Edit Comment" position="top">
                        <ActionIcon size="xs" variant="light" color="cyan" onClick={() => openEditCommentModal(comment)}>
                            <IconEdit />
                        </ActionIcon>
                    </MyTooltip>
                    <MyTooltip label="Delete Comment" position="top">
                        <ActionIcon size="xs" variant="light" color="red" onClick={() => openDeleteModal(comment)}>
                            <IconTrash />
                        </ActionIcon>
                    </MyTooltip>
                </Group>
            </Stack>
        );
    }

    return (
        <Stack m="sm" gap={10}>
            <Group>
                <Text size="sm">Comments</Text>
                <MyTooltip label="Add Comment" position="right">
                    <ActionIcon size="xs" variant="light" color="cyan" onClick={() => openNewCommentModal()}>
                        <IconPlus />
                    </ActionIcon>
                </MyTooltip>
            </Group>
            {props.task.comments.length == 0 ? <Text size="xs">No Comments</Text> : props.task.comments.map(comment => commentRow(comment))}
        </Stack>
    );
}

export default CommentDetails;