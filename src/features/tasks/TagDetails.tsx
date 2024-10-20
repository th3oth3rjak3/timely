import { TagsInput } from "@mantine/core";
import { invoke } from "@tauri-apps/api/core";
import { showErrorNotification, showSuccessNotification } from "../../utilities/notificationUtilities";
import { Tag, Task } from "./Task";

type Props = {
    task: Task;
    tagOptions: Tag[];
    onTagsChanged: () => void;
}

function TagDetails(props: Props) {

    const tagOptions = props.tagOptions.map(opt => opt.value);

    function removeTagByName(tagName: string) {
        const tagIds = props.tagOptions.filter(tag => tag.value === tagName).map(tag => tag.id);
        if (tagIds.length < 1) return;

        invoke<void>("remove_tag_from_task", { taskId: props.task.id, tagId: tagIds[0] })
            .then(() => {
                showSuccessNotification("Successfully removed tag.");
                props.onTagsChanged();
            })
            .catch((err: string) => showErrorNotification("removing tag from task", err));
    }

    function addTagToTask(tagId: number) {
        invoke<void>("add_tag_to_task", { taskId: props.task.id, tagId })
            .then(() => {
                showSuccessNotification("Successfully added tag.");
            })
            .catch(err => showErrorNotification("adding tag to task", err));
    }

    function addTagByName(tagName: string) {
        const tagIds = props.tagOptions.filter(tag => tag.value === tagName).map(tag => tag.id);
        if (tagIds.length < 1) {
            invoke<Tag>("add_new_tag", { newTag: tagName })
                .then((tag) => {
                    addTagToTask(tag.id);
                    props.onTagsChanged();
                })
                .catch(err => showErrorNotification("creating new task", err));
        } else {
            addTagToTask(tagIds[0]);
        }

        props.onTagsChanged();
    }

    return (
        <TagsInput
            label="Tags"
            data={tagOptions}
            value={props.task.tags.map(t => t.value)}
            onRemove={(tagName) => removeTagByName(tagName)}
            onOptionSubmit={(tagName) => addTagByName(tagName)}
            acceptValueOnBlur={false}
        />
    );
}

export default TagDetails;