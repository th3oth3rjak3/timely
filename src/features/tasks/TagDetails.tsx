import { TagsInput } from "@mantine/core";
import useTagService from "./hooks/useTagService";
import { Tag, Task } from "./types/Task";

type Props = {
    task: Task;
    tagOptions: Tag[];
    onTagsChanged: () => void;
}

function TagDetails(props: Props) {

    const {
        tryFindTagByName,
        removeTagFromTask,
        createNewTag,
        addTagToTask,
    } = useTagService();

    /** All tag options mapped to their display value to choose from. */
    const tagOptions = props.tagOptions.map(opt => opt.value);

    /** The tags that have been selected by the user. */
    const selectedTags = props.task.tags.map(tag => tag.value);

    async function removeTagByName(tagName: string) {
        const maybeTag = tryFindTagByName(tagName, props.tagOptions);
        if (!maybeTag) return;
        await removeTagFromTask(props.task.id, maybeTag)
        props.onTagsChanged();
    }

    async function addTagByName(tagName: string) {
        let tag = tryFindTagByName(tagName, props.tagOptions);
        if (!tag) {
            tag = await createNewTag(tagName);
            if (!tag) return;
        }

        await addTagToTask(props.task.id, tag);
        props.onTagsChanged();
    }

    return (
        <TagsInput
            label="Tags"
            data={tagOptions}
            value={selectedTags}
            onRemove={(tagName) => removeTagByName(tagName)}
            onOptionSubmit={(tagName) => addTagByName(tagName)}
            acceptValueOnBlur={false}
        />
    );
}

export default TagDetails;