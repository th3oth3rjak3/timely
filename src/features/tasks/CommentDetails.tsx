import { ActionIcon, Button, Group, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import dayjs from "dayjs";
import MyTooltip from "../../components/MyTooltip";
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

    const {
        addComment,
        editComment,
        deleteComment
    } = useCommentService();

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
                        <Button type="submit" variant={props.colorPalette.variant} color={props.colorPalette.colorName}>Save</Button>
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
                <form onSubmit={editCommentForm.onSubmit(editExistingComment)}>
                    <Stack>
                        <TextInput label="Comment" {...editCommentForm.getInputProps("comment")} key={editCommentForm.key("comment")} />
                        <Group>
                            <Button type="submit" variant={props.colorPalette.variant} color={props.colorPalette.colorName}>Save</Button>
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
        confirmProps: { variant: props.colorPalette.variant, color: "red" },
        cancelProps: { variant: props.colorPalette.variant, color: props.colorPalette.colorName },
        labels: { confirm: "Confirm", cancel: "Deny" },
        onCancel: () => { },
        onConfirm: () => deleteExistingComment(comment)
    });

    async function addNewComment(values: typeof newCommentForm.values) {
        await addComment(
            props.task.id,
            values.comment,
            () => {
                props.onCommentChanged();
                newCommentForm.reset();
                modals.closeAll();
            }
        );
    }

    async function editExistingComment(comment: typeof editCommentForm.values) {
        await editComment(
            comment.id,
            comment.comment,
            () => {
                props.onCommentChanged();
                editCommentForm.reset();
                modals.closeAll();
            }
        );
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
                    <MyTooltip label="Edit Comment" position="right" colorPalette={props.colorPalette}>
                        <ActionIcon size="xs" variant={props.colorPalette.variant} color={props.colorPalette.colorName} onClick={() => openEditCommentModal(comment)}>
                            <IconEdit />
                        </ActionIcon>
                    </MyTooltip>
                    <MyTooltip label="Delete Comment" position="right" colorPalette={props.colorPalette}>
                        <ActionIcon size="xs" variant={props.colorPalette.variant} color={props.colorPalette.colorName} onClick={() => openDeleteModal(comment)}>
                            <IconTrash />
                        </ActionIcon>
                    </MyTooltip>
                </Group>
            </Stack>
        );
    }

    return (
        <Stack gap={10}>
            <Group>
                <Text size="sm">Comments</Text>
                <MyTooltip label="Add Comment" position="right" colorPalette={props.colorPalette}>
                    <ActionIcon size="xs" variant={props.colorPalette.variant} color={props.colorPalette.colorName} onClick={() => openNewCommentModal()}>
                        <IconPlus />
                    </ActionIcon>
                </MyTooltip>
            </Group>
            {props.task.comments.length == 0 ? <Text size="xs">No Comments</Text> : props.task.comments.map(comment => commentRow(comment))}
        </Stack>
    );
}

export default CommentDetails;