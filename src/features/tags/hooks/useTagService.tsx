import { Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import useTauri from "../../../hooks/useTauri";
import { PagedData } from "../../../models/PagedData";
import { Tag } from "../types/Tag";
import { TagSearchParams } from "../types/TagSearchParams";

const useTagService = (fetchAllTags?: () => Promise<void> | void) => {

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
            successMessage: "New tag created successfully.",
            callback: fetchAllTags
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

    const deleteTag = async (tag: Tag) => {
        modals.openConfirmModal({
            title: "Delete Tag",
            children: (
                <Text>{`Are you sure you want to delete tag: ${tag.value}?`}</Text>
            ),
            confirmProps: { variant: "light", color: "cyan" },
            cancelProps: { variant: "light", color: "indigo" },
            labels: { confirm: "Confirm", cancel: "Deny" },
            onCancel: () => { },
            onConfirm: async () => await invoke<void>({
                command: "delete_tag",
                params: { tagId: tag.id },
                successMessage: "Successfully deleted tag.",
                callback: fetchAllTags,
            })
        });

    }

    const searchForTags = async (params: TagSearchParams) => {
        return await invoke<PagedData<Tag>>({
            command: "get_tags",
            params: { params },
        });
    }

    const editTag = async (params: Tag) => {
        return await invoke<void>({
            command: "edit_tag",
            params: { tag: params },
            successMessage: "Updated tag successfully.",
            callback: fetchAllTags,
        });
    }

    return {
        searchForTags,
        getAllTags,
        tryFindTagByName,
        createNewTag,
        addTagToTask,
        removeTagFromTask,
        deleteTag,
        editTag,
    };
}

export default useTagService;