import { Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import {
  IconEdit,
  IconPlus,
  IconSearch,
  IconTrash,
  IconTrashX,
  IconX,
} from "@tabler/icons-react";
import { ContextMenuContent, useContextMenu } from "mantine-contextmenu";
import { DataTable } from "mantine-datatable";
import { useEffect, useMemo, useRef } from "react";

import { modals } from "@mantine/modals";
import { useQueryClient } from "@tanstack/react-query";
import StyledActionIcon from "../../components/StyledActionIcon";
import StyledButton from "../../components/StyledButton";
import useColorPalette from "../../hooks/useColorPalette";
import { TimelyAction } from "../../models/TauriAction";
import { Tag } from "../../models/ZodModels";
import { pageSizeOptions } from "../../state/globalState";
import { findLastPage } from "../../utilities/dataTableUtilities";
import { validateLength } from "../../utilities/formUtilities";
import { useUserSettings } from "../settings/settingsService";
import {
  TagLike,
  useCreateNewTag,
  useDeleteManyTags,
  useDeleteTag,
  useEditTag,
  useSearchForTags,
  useTagStore,
} from "./services/tagService";
import { TagSearchParams, tagSearchParams } from "./types/TagSearchParams";

interface NewTag {
  value: string;
}

function TagsList() {
  const page = useTagStore((store) => store.page);
  const setPage = useTagStore((store) => store.setPage);
  const pageSize = useTagStore((store) => store.pageSize);
  const setPageSize = useTagStore((store) => store.setPageSize);
  const sortStatus = useTagStore((store) => store.sortStatus);
  const setSortStatus = useTagStore((store) => store.setSortStatus);
  const queryString = useTagStore((store) => store.queryString);
  const setQueryString = useTagStore((store) => store.setQueryString);
  const selectedRecords = useTagStore((store) => store.selectedTags);
  const setSelectedRecords = useTagStore((store) => store.setSelectedTags);

  const params = useMemo(() => {
    return tagSearchParams(
      page,
      pageSize,
      queryString ?? undefined,
      sortStatus.columnAccessor,
      sortStatus.direction
    );
  }, [page, pageSize, queryString, sortStatus]);

  const queryClient = useQueryClient();

  const isTouchScreen = useMediaQuery("(pointer: coarse)");

  const { data: userSettings, isPending: settingsPending } = useUserSettings();
  const {
    data: tags,
    isPending: tagsPending,
    refetch,
  } = useSearchForTags(params);

  const loading = useMemo(() => {
    return tagsPending || settingsPending;
  }, [tagsPending, settingsPending]);

  const colorPalette = useColorPalette();

  const [newFormOpened, newFormActions] = useDisclosure(false);
  const [editFormOpened, editFormActions] = useDisclosure(false);

  const { showContextMenu, hideContextMenu } = useContextMenu();

  const prevPageRef = useRef(page);
  const prevPageSizeRef = useRef(pageSize);

  const lastPage = useMemo(() => {
    return findLastPage(tags.totalItemCount - 1, pageSize);
  }, [tags, pageSize]);

  // Clear the selected records when the page changes
  // so that the user doesn't have hidden records on another page that they
  // don't know about or can't clear easily.
  useEffect(() => {
    if (prevPageRef.current !== page || prevPageSizeRef.current !== pageSize) {
      // Reset selected records only if page or pageSize has changed
      setSelectedRecords([]);
    }

    // Update the refs with the current values
    prevPageRef.current = page;
    prevPageSizeRef.current = pageSize;
  }, [page, pageSize, setSelectedRecords]);

  const validators = {
    value: (value?: string | null) =>
      validateLength({ fieldName: "Tag", value, minValue: 1, maxValue: 25 }),
  };

  const editForm = useForm<Tag>({
    mode: "uncontrolled",
    validate: validators,
    validateInputOnChange: true,
    validateInputOnBlur: true,
  });

  const newForm = useForm<NewTag>({
    mode: "uncontrolled",
    validate: validators,
    validateInputOnChange: true,
    validateInputOnBlur: true,
    initialValues: {
      value: "",
    },
  });

  function closeNewForm() {
    newFormActions.close();
    newForm.reset();
  }

  function closeEditForm() {
    editFormActions.close();
    editForm.reset();
  }

  const beginEditingTag = (tag: Tag) => {
    editForm.setValues({
      id: tag.id,
      value: tag.value,
    });
    editFormActions.open();
  };

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

  function handleDeleteManyDataFetch(tagList: TagLike[]) {
    if (pageShouldChangeAfterDeleteMany(tagList, tags.totalItemCount, params)) {
      const lastPage = findLastPage(
        tags.totalItemCount - tagList.length,
        pageSize
      );
      setPage(lastPage);
    } else {
      refetch();
    }
  }

  function handleDataFetch(tag: TagLike, action: TimelyAction) {
    if (pageShouldChange(tag, action, tags.totalItemCount, params)) {
      setPage(lastPage);
    } else {
      refetch();
    }
  }

  const deleteTag = useDeleteTag(userSettings, queryClient, handleDataFetch);
  const deleteManyTags = useDeleteManyTags(
    userSettings,
    handleDeleteManyDataFetch,
    queryClient
  );
  const createTag = useCreateNewTag(userSettings, queryClient);
  const editTag = useEditTag(userSettings, handleDataFetch);

  function handleDeleteOneRequested(tag: Tag) {
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
      onConfirm: () => deleteTag.mutateAsync(tag),
    });
  }

  function handleDeleteManyRequested(tags: Tag[]) {
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
      onConfirm: () => deleteManyTags.mutateAsync(tags),
    });
  }

  function getContextMenuItems(tag: Tag): ContextMenuContent {
    const deleteTagItem = {
      key: "delete-tag",
      title: "Delete Tag",
      icon: <IconTrash size={16} />,
      onClick: () => handleDeleteOneRequested(tag),
    };

    const editTagItem = {
      key: "edit-tag",
      title: "Edit Tag",
      icon: <IconEdit size={16} />,
      onClick: () => beginEditingTag(tag),
    };

    return [editTagItem, deleteTagItem];
  }

  function updateTagQuery(value: string | null) {
    setPage(1);
    setQueryString(value);
  }

  function updatePageSize(size: number) {
    setPage(1);
    setPageSize(size);
  }

  const onValidNewTagSubmit = async (newTag: NewTag) => {
    await createTag.mutateAsync(newTag.value);
    newForm.reset();
    newFormActions.close();
  };

  const onValidEditTagSubmit = async (editedTag: Tag) => {
    const updatedItem = { ...editedTag };
    editForm.reset();
    editForm.clearErrors();
    editFormActions.close();
    await editTag.mutateAsync(updatedItem);
  };

  function deleteSelectedTags() {
    handleDeleteManyRequested(selectedRecords);
    setSelectedRecords([]);
  }

  const columns = [
    {
      accessor: "value",
      title: "Tag Name",
      sortable: true,
      filter: (
        <TextInput
          label="Tag"
          description="Search for tags which contain the specified text"
          placeholder="Search..."
          leftSection={<IconSearch size={16} />}
          rightSection={
            <StyledActionIcon
              size="sm"
              variant="transparent"
              color="dimmed"
              onClick={() => updateTagQuery("")}
            >
              <IconX size={14} />
            </StyledActionIcon>
          }
          value={queryString || ""}
          onChange={(e) => updateTagQuery(e.currentTarget.value)}
        />
      ),
      filtering: queryString !== null && queryString !== "",
      ellipsis: false,
    },
  ];

  if (loading) return;

  return (
    <Stack m={25}>
      <Group justify="space-between">
        <Text size="xl">Tags</Text>
        <Group>
          {selectedRecords.length > 0 ? (
            <StyledActionIcon
              onClick={deleteSelectedTags}
              tooltipLabel="Delete Selected Tags"
              tooltipPosition="left"
            >
              <IconTrashX />
            </StyledActionIcon>
          ) : null}
          <StyledActionIcon
            onClick={() => newFormActions.open()}
            tooltipLabel="Create New Tag"
            tooltipPosition="left"
          >
            <IconPlus />
          </StyledActionIcon>
        </Group>
      </Group>
      {loading ? (
        <></>
      ) : (
        <DataTable
          textSelectionDisabled={isTouchScreen}
          onRowContextMenu={({ record, event }) =>
            showContextMenu(getContextMenuItems(record))(event)
          }
          onScroll={hideContextMenu}
          withTableBorder
          withColumnBorders
          fz="sm"
          columns={columns}
          records={tags.data}
          page={page}
          totalRecords={tags.totalItemCount}
          recordsPerPage={pageSize}
          onPageChange={setPage}
          recordsPerPageOptions={pageSizeOptions}
          onRecordsPerPageChange={(size) => updatePageSize(size)}
          key={"id"}
          sortStatus={sortStatus}
          onSortStatusChange={setSortStatus}
          paginationSize="xs"
          paginationActiveBackgroundColor={colorPalette.background}
          paginationActiveTextColor={
            userSettings?.buttonVariant === "filled" ||
            userSettings?.buttonVariant === "gradient"
              ? "white"
              : colorPalette.color
          }
          minHeight={tags.data.length === 0 ? 200 : undefined}
          noRecordsText="No Tags"
          selectedRecords={selectedRecords}
          onSelectedRecordsChange={setSelectedRecords}
        />
      )}
      <Modal
        opened={newFormOpened}
        onClose={closeNewForm}
        title="New Tag"
        closeOnClickOutside={false}
        closeOnEscape={false}
      >
        <form onSubmit={newForm.onSubmit(onValidNewTagSubmit, console.log)}>
          <Stack gap="sm">
            <TextInput
              withAsterisk
              label="Tag"
              key={newForm.key("value")}
              {...newForm.getInputProps("value")}
            />
          </Stack>
          <Group justify="flex-end" mt="md">
            <StyledButton
              label="Submit"
              type="submit"
              disabled={!newForm.isValid()}
              tooltipLabel="Submit New Tag"
            />
          </Group>
        </form>
      </Modal>
      <Modal
        opened={editFormOpened}
        title="Edit Tag"
        onClose={closeEditForm}
        closeOnClickOutside={false}
        closeOnEscape={false}
      >
        <form onSubmit={editForm.onSubmit(onValidEditTagSubmit)}>
          <Stack gap="sm">
            <TextInput
              withAsterisk
              label="Tag"
              key={editForm.key("value")}
              {...editForm.getInputProps("value")}
            />
          </Stack>
          <Group justify="flex-end" mt="md">
            <StyledButton
              type="submit"
              label="Submit"
              disabled={!editForm.isValid()}
              tooltipLabel="Submit Updated Tag"
            />
          </Group>
        </form>
      </Modal>
    </Stack>
  );
}

export default TagsList;
