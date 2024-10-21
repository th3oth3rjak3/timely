import useTauri from "../../../hooks/useTauri";
import { Tag } from "../types/Task";

const useTagService = () => {

    const { invoke } = useTauri();

    const getAllTags = async () => {
        return await invoke<Tag[]>({ command: "get_all_tags" });
    }

    const tryFindTagByName = (tagName: string, options: Tag[]): Tag | undefined => {
        const found = options.filter(tag => tag.value === tagName);
        if (found.length > 0) {
            return found[0];
        }
    }

    const createNewTag = async (tagName: string) => {
        return invoke<Tag>({
            command: "add_new_tag",
            params: { newTag: tagName },
        });
    }

    const addTagToTask = async (taskId: number, tag: Tag) => {
        await invoke<void>({
            command: "add_tag_to_task",
            params: { taskId, tagId: tag.id },
            successMessage: "Successfully added tag."
        });
    }


    const removeTagFromTask = async (taskId: number, tag: Tag) => {
        invoke<void>({
            command: "remove_tag_from_task",
            params: { taskId, tagId: tag.id },
            successMessage: "Successfully removed tag.",
        });
    }

    return {
        getAllTags,
        tryFindTagByName,
        createNewTag,
        addTagToTask,
        removeTagFromTask,
    };
}

export default useTagService;