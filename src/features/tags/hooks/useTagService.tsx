import { Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useMemo } from "react";
import useColorPalette from "../../../hooks/useColorPalette";
import useTauri from "../../../hooks/useTauri";
import { PagedData } from "../../../models/PagedData";
import { TimelyAction } from "../../../models/TauriAction";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { setCurrentTagPage } from "../../../redux/reducers/settingsSlice";
import { findLastPage } from "../../../utilities/dataTableUtilities";
import { TagSearchParams } from "../types/TagSearchParams";
import { Tag } from "../../../models/ZodModels";

const useTagService = (
  recordCount: number,
  fetchAllTags?: () => Promise<void> | void
) => {
  const { invoke } = useTauri();
  const userSettings = useAppSelector((state) => state.settings.userSettings);
  const colorPalette = useColorPalette();
  const tagSearchParams = useAppSelector(
    (state) => state.settings.tagListSettings.params
  );
  const dispatch = useAppDispatch();

  const lastPage = useMemo(() => {
    return findLastPage(recordCount - 1, tagSearchParams.pageSize);
  }, [recordCount, tagSearchParams]);

  interface TagLike {
    value: string;
  }

  const pageShouldChange = (
    tag: TagLike,
    action: TimelyAction,
    recordCount: number,
    tagSearchParams: TagSearchParams
  ): boolean => {
    const remainder = recordCount % tagSearchParams.pageSize;
    const lastItemOnThePage = remainder === 1 && tagSearchParams.page > 1;

    switch (action) {
      case TimelyAction.DeleteTag:
        return lastItemOnThePage;
      case TimelyAction.EditTag:
        return (
          lastItemOnThePage &&
          tagSearchParams.queryString !== null &&
          !tag.value.includes(tagSearchParams.queryString)
        );
      default:
        return false;
    }
  };

  const pageShouldChangeAfterDeleteMany = (
    tags: TagLike[],
    recordCount: number,
    tagSearchParams: TagSearchParams
  ): boolean => {
    const remainder = recordCount % tagSearchParams.pageSize;
    return remainder < tags.length && tagSearchParams.page > 1;
  };

  const handleDeleteManyDataFetch =
    (tags: TagLike[], callback: () => void): (() => void) =>
    async () => {
      if (pageShouldChangeAfterDeleteMany(tags, recordCount, tagSearchParams)) {
        const lastPage = findLastPage(
          recordCount - tags.length,
          tagSearchParams.pageSize
        );
        dispatch(setCurrentTagPage(lastPage));
      } else {
        await fetchAllTags?.();
      }
      callback();
    };

  const handleDataFetch =
    (tag: TagLike, action: TimelyAction): (() => void) =>
    async () => {
      if (pageShouldChange(tag, action, recordCount, tagSearchParams)) {
        dispatch(setCurrentTagPage(lastPage));
      } else {
        await fetchAllTags?.();
      }
    };

  const getAllTags = async () => {
    return await invoke<Tag[]>({ command: "get_all_tags" });
  };

  const tryFindTagByName = (tagName: string, options: Tag[]): Tag | null => {
    const found = options.filter((tag) => tag.value === tagName);
    if (found.length > 0) {
      return found[0];
    }

    return null;
  };

  const createNewTag = async (tagName: string) => {
    return invoke<Tag>({
      command: "add_new_tag",
      params: { newTag: tagName },
      successMessage: "New tag created successfully.",
      notificationType: TimelyAction.AddNewTag,
      userSettings,
      callback: fetchAllTags,
    });
  };

  const addTagToTask = async (taskId: number, tag: Tag) => {
    await invoke<void>({
      command: "add_tag_to_task",
      params: { taskId, tagId: tag.id },
      successMessage: "Successfully added tag.",
      notificationType: TimelyAction.AddTagToTask,
      userSettings,
    });
  };

  const removeTagFromTask = async (taskId: number, tag: Tag) => {
    invoke<void>({
      command: "remove_tag_from_task",
      params: { taskId, tagId: tag.id },
      successMessage: "Successfully removed tag.",
      notificationType: TimelyAction.RemoveTagFromTask,
      userSettings,
    });
  };

  const deleteTag = async (tag: Tag) => {
    modals.openConfirmModal({
      title: "Delete Tag",
      children: (
        <Text>{`Are you sure you want to delete tag: ${tag.value}?`}</Text>
      ),
      confirmProps: {
        variant: colorPalette.variant,
        color: colorPalette.colorName,
        gradient: colorPalette.gradient,
      },
      cancelProps: {
        variant: colorPalette.variant,
        color: colorPalette.colorName,
        gradient: colorPalette.gradient,
      },
      labels: { confirm: "Confirm", cancel: "Deny" },
      onCancel: () => {},
      onConfirm: async () =>
        await invoke<void>({
          command: "delete_tag",
          params: { tagId: tag.id },
          successMessage: "Successfully deleted tag.",
          notificationType: TimelyAction.DeleteTag,
          userSettings,
          callback: handleDataFetch(tag, TimelyAction.DeleteTag),
        }),
    });
  };

  const deleteManyTags = async (tags: Tag[], callback: () => void) => {
    modals.openConfirmModal({
      title: "Delete Tags",
      children: (
        <Text>{`Are you sure you want to delete ${tags.length} tag${
          tags.length === 1 ? "" : "s"
        }?`}</Text>
      ),
      confirmProps: {
        variant: colorPalette.variant,
        color: colorPalette.colorName,
        gradient: colorPalette.gradient,
      },
      cancelProps: {
        variant: colorPalette.variant,
        color: colorPalette.colorName,
        gradient: colorPalette.gradient,
      },
      labels: { confirm: "Confirm", cancel: "Deny" },
      onCancel: () => {},
      onConfirm: async () =>
        await invoke<void>({
          command: "delete_many_tags",
          params: { tagIds: tags.map((t) => t.id) },
          successMessage: `Successfully deleted ${tags.length} tag${
            tags.length === 1 ? "" : "s"
          }.`,
          notificationType: TimelyAction.DeleteTag,
          userSettings,
          callback: handleDeleteManyDataFetch(tags, callback),
        }),
    });
  };

  const searchForTags = async (params: TagSearchParams) => {
    return await invoke<PagedData<Tag>>({
      command: "get_tags",
      params: { params },
    });
  };

  const editTag = async (params: Tag) => {
    return await invoke<void>({
      command: "edit_tag",
      params: { tag: params },
      successMessage: "Updated tag successfully.",
      notificationType: TimelyAction.EditTag,
      userSettings,
      callback: handleDataFetch(params, TimelyAction.EditTag),
    });
  };

  return {
    searchForTags,
    getAllTags,
    tryFindTagByName,
    createNewTag,
    addTagToTask,
    removeTagFromTask,
    deleteTag,
    deleteManyTags,
    editTag,
  };
};

export default useTagService;