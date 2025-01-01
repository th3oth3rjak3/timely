import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { DataTableSortStatus } from "mantine-datatable";
import { create } from "zustand";
import { PagedData } from "../../../models/PagedData";
import { TimelyAction } from "../../../models/TauriAction";
import {
  PagedTagData,
  Tag,
  TagArray,
  UserSettings,
} from "../../../models/ZodModels";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../../utilities/notificationUtilities";
import { tryMap } from "../../../utilities/nullableUtilities";
import { TagSearchParams } from "../types/TagSearchParams";

export interface TagLike {
  value: string;
}

export interface TagStore {
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (pageSize: number) => void;
  sortStatus: DataTableSortStatus<Tag>;
  setSortStatus: (sortStatus: DataTableSortStatus<Tag>) => void;
  queryString: string | null;
  setQueryString: (query: string | null) => void;
  selectedTags: Tag[];
  setSelectedTags: (tags: Tag[]) => void;
}

export const useTagStore = create<TagStore>((set) => ({
  page: 1,
  setPage: (page: number) => set({ page }),
  pageSize: 5,
  setPageSize: (pageSize: number) => set({ pageSize }),
  sortStatus: { columnAccessor: "value", direction: "asc" },
  setSortStatus: (sortStatus: DataTableSortStatus<Tag>) => set({ sortStatus }),
  queryString: null,
  setQueryString: (queryString: string | null) => set({ queryString }),
  selectedTags: [],
  setSelectedTags: (selectedTags: Tag[]) => set({ selectedTags }),
}));

export function tryFindTagByName(tagName: string, options: Tag[]): Tag | null {
  const found = options.filter((tag) => tag.value === tagName);
  if (found.length > 0) {
    return found[0];
  }

  return null;
}

export function useGetAllTags() {
  return useQuery({
    queryKey: ["getAllTags"],
    queryFn: async (): Promise<Tag[]> => {
      const tags = await invoke("get_all_tags");
      return tryMap(tags, TagArray.parse) ?? [];
    },
    initialData: [],
  });
}

export function useCreateNewTag(
  userSettings: UserSettings,
  queryClient: QueryClient
) {
  return useMutation({
    mutationFn: async (tagName: string) => {
      const tag = await invoke("add_new_tag", { newTag: tagName });
      return tryMap(tag, Tag.parse);
    },
    onSuccess: async () => {
      showSuccessNotification(
        TimelyAction.AddNewTag,
        userSettings,
        "Successfully added tag."
      );
      await queryClient.invalidateQueries({ queryKey: "getAllTags" });
      await queryClient.invalidateQueries({ queryKey: "searchForTags" });
    },
    onError: (error) => showErrorNotification(error),
  });
}

export function useAddTagToTask(userSettings: UserSettings) {
  return useMutation({
    mutationFn: async (input: { taskId: number; tag: Tag }) => {
      const { taskId, tag } = input;
      await invoke("add_tag_to_task", { taskId, tagId: tag.id });
    },
    onSuccess: () => {
      showSuccessNotification(
        TimelyAction.AddTagToTask,
        userSettings,
        "Successfully added tag."
      );
    },
    onError: (error) => showErrorNotification(error),
  });
}

export function useRemoveTagFromTask(userSettings: UserSettings) {
  return useMutation({
    mutationFn: async (input: { taskId: number; tag: Tag }) => {
      const { taskId, tag } = input;
      await invoke("remove_tag_from_task", { taskId, tagId: tag.id });
    },
    onSuccess: () => {
      showSuccessNotification(
        TimelyAction.RemoveTagFromTask,
        userSettings,
        "Successfully removed tag."
      );
    },
    onError: (error) => showErrorNotification(error),
  });
}

export function useDeleteTag(
  userSettings: UserSettings,
  queryClient: QueryClient
) {
  return useMutation({
    mutationFn: async (tag: Tag) => {
      await invoke("delete_tag", { tagId: tag.id });
    },
    onSuccess: async () => {
      showSuccessNotification(
        TimelyAction.DeleteTag,
        userSettings,
        "Successfully deleted tag."
      );
      await queryClient.invalidateQueries({ queryKey: ["searchForTags"] });
      await queryClient.invalidateQueries({ queryKey: ["getAllTags"] });
    },
    onError: (error) => showErrorNotification(error),
  });
}

export function useDeleteManyTags(
  userSettings: UserSettings,
  queryClient: QueryClient
) {
  return useMutation({
    mutationFn: async (tags: Tag[]) => {
      await invoke("delete_many_tags", { tagIds: tags.map((t) => t.id) });
    },
    onSuccess: async (_, tags) => {
      showSuccessNotification(
        TimelyAction.DeleteTag,
        userSettings,
        `Successfully deleted ${tags.length} tag${
          tags.length === 1 ? "" : "s"
        }.`
      );
      await queryClient.invalidateQueries({ queryKey: ["searchForTags"] });
      await queryClient.invalidateQueries({ queryKey: ["getAllTags"] });
    },
    onError: (error) => showErrorNotification(error),
  });
}

export function useSearchForTags(params: TagSearchParams) {
  return useQuery({
    queryKey: ["searchForTags", params],
    queryFn: async () => {
      const pagedData = await invoke<PagedData<Tag>>("get_tags", { params });
      if (pagedData) {
        return PagedTagData.parse(pagedData);
      }

      return {
        data: [],
        totalItemCount: 0,
      };
    },
    initialData: {
      data: [],
      totalItemCount: 0,
    },
  });
}

export function useEditTag(
  userSettings: UserSettings,
  queryClient: QueryClient
) {
  return useMutation({
    mutationFn: async (tag: Tag) => {
      await invoke("edit_tag", { tag });
    },
    onSuccess: async () => {
      showSuccessNotification(
        TimelyAction.EditTag,
        userSettings,
        "Updated tag successfully."
      );
      await queryClient.invalidateQueries({ queryKey: ["searchForTags"] });
      await queryClient.invalidateQueries({ queryKey: ["getAllTags"] });
    },
    onError: (error) => showErrorNotification(error),
  });
}
