import {
  Group,
  Modal,
  NumberInput,
  Stack,
  TagsInput,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import {
  IconArrowBackUp,
  IconCancel,
  IconCheck,
  IconEdit,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconTrashX,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { ContextMenuContent, useContextMenu } from "mantine-contextmenu";
import { DataTable } from "mantine-datatable";
import { useEffect, useMemo, useRef, useState } from "react";
import DateFilter from "../../components/DateFilter.tsx";
import MultiSelectFilter from "../../components/MultiSelectFilter.tsx";
import StyledActionIcon from "../../components/StyledActionIcon.tsx";
import StyledButton from "../../components/StyledButton.tsx";
import TextFilter from "../../components/TextFilter.tsx";
import useColorPalette from "../../hooks/useColorPalette.tsx";
import useWindowSize from "../../hooks/useWindowSize.tsx";
import { TaskStatus } from "../../models/TaskStatus.ts";
import { TimelyAction } from "../../models/TauriAction.ts";
import { TimeSpan } from "../../models/TimeSpan.ts";
import { Tag, Task } from "../../models/ZodModels.ts";
import { pageSizeOptions } from "../../state/globalState.ts";
import { findLastPage } from "../../utilities/dataTableUtilities.ts";
import {
  getDayOnlyProps,
  maybeFormattedDate,
} from "../../utilities/dateUtilities.ts";
import {
  SelectOption,
  toSelectOptions,
  validateLength,
} from "../../utilities/formUtilities.ts";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../utilities/notificationUtilities";
import { useUserSettings } from "../settings/settingsService.ts";
import {
  tryFindTagByName,
  useAddTagToTask,
  useCreateNewTag,
  useGetAllTags,
  useRemoveTagFromTask,
} from "../tags/services/tagService.ts";
import QuickFilterComponent, {
  TagFilterSelection,
} from "./QuickFilterComponent.tsx";
import {
  TaskLike,
  useCancelTask,
  useCreateTask,
  useDeleteManyTasks,
  useDeleteTask,
  useEditTask,
  useFinishTask,
  usePauseTask,
  useReopenTask,
  useRestoreTask,
  useResumeTask,
  useSearchTasks,
  useStartTask,
  useTaskStore,
} from "./services/tasksService.ts";
import TaskDetail from "./TaskDetail.tsx";
import { NewTask } from "./types/Task.ts";
import {
  FilterName,
  QuickFilter,
  TaskSearchParams,
  taskSearchParams,
} from "./types/TaskSearchParams.ts";

function TaskList() {
  //#region State

  const queryClient = useQueryClient();

  const { data: userSettings } = useUserSettings();
  const { data: tagOptions, refetch: refetchTags } = useGetAllTags();

  const colorPalette = useColorPalette();

  const page = useTaskStore((store) => store.page);
  const setPage = useTaskStore((store) => store.setPage);
  const pageSize = useTaskStore((store) => store.pageSize);
  const setPageSize = useTaskStore((store) => store.setPageSize);
  const query = useTaskStore((store) => store.query);
  const setQuery = useTaskStore((store) => store.setQuery);
  const selectedStatuses = useTaskStore((store) => store.selectedStatuses);
  const setSelectedStatuses = useTaskStore(
    (store) => store.setSelectedStatuses
  );
  const sortStatus = useTaskStore((store) => store.sortStatus);
  const setSortStatus = useTaskStore((store) => store.setSortStatus);
  const startByFilter = useTaskStore((store) => store.startByFilter);
  const setStartByFilter = useTaskStore((store) => store.setStartByFilter);
  const dueByFilter = useTaskStore((store) => store.dueByFilter);
  const setDueByFilter = useTaskStore((store) => store.setDueByFilter);
  const quickFilter = useTaskStore((store) => store.quickFilter);
  const setQuickFilter = useTaskStore((store) => store.setQuickFilter);
  const selectedTasks = useTaskStore((store) => store.selectedTasks);
  const setSelectedTasks = useTaskStore((store) => store.setSelectedTasks);

  const prevPageRef = useRef(page);
  const prevPageSizeRef = useRef(pageSize);

  useEffect(() => {
    if (prevPageRef.current !== page || prevPageSizeRef.current !== pageSize) {
      // Reset selected records only if page or pageSize has changed
      setSelectedTasks([]);
    }

    // Update the refs with the current values
    prevPageRef.current = page;
    prevPageSizeRef.current = pageSize;
  }, [page, pageSize, setSelectedTasks]);

  const params = useMemo(() => {
    return taskSearchParams(
      page,
      pageSize,
      selectedStatuses,
      query,
      sortStatus.columnAccessor,
      sortStatus.direction,
      startByFilter,
      dueByFilter,
      quickFilter
    );
  }, [
    page,
    pageSize,
    query,
    selectedStatuses,
    sortStatus,
    startByFilter,
    dueByFilter,
    quickFilter,
  ]);

  const { showContextMenu, hideContextMenu } = useContextMenu();
  const {
    data: tasks,
    isPending: loading,
    status,
    error,
    refetch,
  } = useSearchTasks(params);

  if (status === "error" && error !== null) {
    showErrorNotification(error);
  }

  const lastPage = useMemo(() => {
    return findLastPage(tasks.totalItemCount - 1, pageSize);
  }, [pageSize, tasks]);

  const pageShouldChangeAfterDeleteMany = (
    tasks: TaskLike[],
    recordCount: number,
    taskSearchParams: TaskSearchParams
  ): boolean => {
    const remainder = recordCount % taskSearchParams.pageSize;
    return remainder < tasks.length && taskSearchParams.page > 1;
  };

  const handleDeleteManyDataFetch =
    (taskList: TaskLike[]): (() => Promise<void>) =>
    async () => {
      if (
        pageShouldChangeAfterDeleteMany(taskList, tasks.totalItemCount, params)
      ) {
        const lastPage = findLastPage(
          tasks.totalItemCount - taskList.length,
          pageSize
        );
        setPage(lastPage);
      } else {
        await refreshTasks();
      }
    };

  const handleDataFetch =
    (task: TaskLike, action: TimelyAction): (() => Promise<void>) =>
    async () => {
      if (pageShouldChange(task, action, tasks.totalItemCount, params)) {
        setPage(lastPage);
      } else {
        await refreshTasks();
      }
    };

  const pageShouldChange = (
    task: TaskLike,
    action: TimelyAction,
    recordCount: number,
    taskSearchParams: TaskSearchParams
  ): boolean => {
    const remainder = recordCount % taskSearchParams.pageSize;
    const lastItemOnThePage = remainder === 1 && taskSearchParams.page > 1;

    switch (action) {
      case TimelyAction.CancelTask:
        return (
          lastItemOnThePage &&
          !taskSearchParams.statuses.includes(TaskStatus.Cancelled)
        );
      case TimelyAction.DeleteTask:
        return lastItemOnThePage;
      case TimelyAction.StartTask:
      case TimelyAction.ResumeTask:
      case TimelyAction.ReopenFinishedTask:
        return (
          lastItemOnThePage &&
          !taskSearchParams.statuses.includes(TaskStatus.Doing)
        );
      case TimelyAction.PauseTask:
        return (
          lastItemOnThePage &&
          !taskSearchParams.statuses.includes(TaskStatus.Paused)
        );
      case TimelyAction.FinishTask:
        return (
          lastItemOnThePage &&
          !taskSearchParams.statuses.includes(TaskStatus.Done)
        );
      case TimelyAction.RestoreCancelledTask:
        return (
          lastItemOnThePage &&
          ((task.elapsedDuration !== null &&
            task.elapsedDuration > 0 &&
            !taskSearchParams.statuses.includes(TaskStatus.Paused) &&
            task.actualStartDate !== null) ||
            (task.elapsedDuration === 0 &&
              !taskSearchParams.statuses.includes(TaskStatus.Todo)))
        );
      case TimelyAction.EditTask:
        return (
          lastItemOnThePage &&
          taskSearchParams.queryString !== null &&
          !(
            task.title.includes(taskSearchParams.queryString) ||
            task.description.includes(taskSearchParams.queryString)
          )
        );
      default:
        return false;
    }
  };

  const startTask = useStartTask(userSettings, handleDataFetch, queryClient);
  const pauseTask = usePauseTask(userSettings, handleDataFetch, queryClient);
  const createTask = useCreateTask(userSettings, queryClient);
  const resumeTask = useResumeTask(userSettings, handleDataFetch, queryClient);
  const finishTask = useFinishTask(userSettings, handleDataFetch, queryClient);
  const cancelTask = useCancelTask(userSettings, handleDataFetch, queryClient);
  const restoreTask = useRestoreTask(
    userSettings,
    handleDataFetch,
    queryClient
  );
  const deleteTask = useDeleteTask(userSettings, handleDataFetch, queryClient);
  const deleteManyTasks = useDeleteManyTasks(
    userSettings,
    handleDeleteManyDataFetch,
    queryClient
  );
  const reopenTask = useReopenTask(userSettings, handleDataFetch, queryClient);

  const createNewTag = useCreateNewTag(userSettings, queryClient);
  const addTagToTask = useAddTagToTask(userSettings);
  const removeTagFromTask = useRemoveTagFromTask(userSettings);

  const statusOptions = [
    TaskStatus.Todo,
    TaskStatus.Doing,
    TaskStatus.Done,
    TaskStatus.Paused,
    TaskStatus.Cancelled,
  ];

  const [newFormOpened, newFormActions] = useDisclosure(false);
  const [editFormOpened, editFormActions] = useDisclosure(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const editTask = useEditTask(
    userSettings,
    taskToEdit,
    handleDataFetch,
    queryClient
  );

  const [newTaskTags, setNewTaskTags] = useState<Tag[]>([]);
  const editTags = useMemo(() => {
    return taskToEdit === null ? [] : taskToEdit.tags.map((t) => t.value);
  }, [taskToEdit]);

  const { windowWidth } = useWindowSize();

  const isTouchScreen = useMediaQuery("(pointer: coarse)");

  const validators = {
    description: (value?: string | null) =>
      validateLength({
        fieldName: "Description",
        value,
        minValue: 1,
        maxValue: 2000,
      }),
    title: (value?: string | null) =>
      validateLength({ fieldName: "Title", value, minValue: 1, maxValue: 100 }),
  };

  const editForm = useForm<Task>({
    mode: "controlled",
    validate: validators,
    validateInputOnChange: true,
    validateInputOnBlur: true,
    initialValues: {
      id: 0,
      actualStartDate: null,
      actualCompleteDate: null,
      title: "",
      description: "",
      status: "To Do",
      scheduledStartDate: null,
      scheduledCompleteDate: null,
      estimatedDuration: null,
      tags: [],
      comments: [],
      workHistory: [],
      elapsedDuration: 0,
    },
  });

  const newForm = useForm<NewTask>({
    mode: "controlled",
    validate: validators,
    validateInputOnChange: true,
    validateInputOnBlur: true,
    initialValues: {
      title: "",
      description: "",
      status: "To Do",
      scheduledStartDate: null,
      scheduledCompleteDate: null,
      estimatedDuration: null,
      tags: [],
    },
  });

  //#endregion

  //#region Functions

  function closeNewForm() {
    newFormActions.close();
    newForm.reset();
  }

  function closeEditForm() {
    editFormActions.close();
    editForm.reset();
    setTaskToEdit(null);
  }

  function updateDescriptionQuery(value: string | null) {
    let updated: string | null = value;

    if (value?.trim().length === 0) {
      updated = null;
    }

    setQuery(updated);
  }

  function updateSelectedStatuses(statuses: SelectOption[]) {
    setPage(1);
    setSelectedStatuses(statuses.map((st) => st.value as TaskStatus));
  }

  /** Set the page size and reset the current page to 1 to avoid a page with no values being displayed. */
  function updatePageSize(size: number) {
    setPage(1);
    setPageSize(size);
  }

  async function refreshTasks() {
    await refetch();
    await refetchTags();
    showSuccessNotification(
      TimelyAction.RefreshTasks,
      userSettings,
      "So fresh."
    );
  }

  function handleCancelRequested(task: Task) {
    modals.openConfirmModal({
      title: "Cancel Task",
      children: <Text>Are you sure you want to cancel this task?</Text>,
      labels: { confirm: "Confirm", cancel: "Deny" },
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
      onCancel: () => {},
      onConfirm: async () => cancelTask.mutateAsync(task),
    });
  }

  function handleDeleteOneRequested(task: Task) {
    modals.openConfirmModal({
      title: "Delete Task",
      children: <Text>Are you sure you want to delete this task?</Text>,
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
      onConfirm: async () => deleteTask.mutateAsync(task),
    });
  }

  function handleDeleteManyRequested(tasks: Task[]) {
    modals.openConfirmModal({
      title: "Delete Tasks",
      children: (
        <Text>{`Are you sure you want to delete ${tasks.length} task${
          tasks.length == 1 ? "" : "s"
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
      onConfirm: async () => {
        await deleteManyTasks.mutateAsync(tasks);
        setSelectedTasks([]);
      },
    });
  }

  function getContextMenuItems(task: Task): ContextMenuContent {
    const startTaskItem = {
      key: "start-task",
      title: "Start Task",
      icon: <IconPlayerPlay size={16} />,
      onClick: () => startTask.mutateAsync(task),
    };

    const pauseTaskItem = {
      key: "pause-task",
      title: "Pause Task",
      icon: <IconPlayerPause size={16} />,
      onClick: () => pauseTask.mutateAsync(task),
    };

    const resumeTaskItem = {
      key: "resume-task",
      title: "Resume Task",
      icon: <IconPlayerPlay size={16} />,
      onClick: () => resumeTask.mutateAsync(task),
    };

    const finishTaskItem = {
      key: "finish-task",
      title: "Finish Task",
      icon: <IconCheck size={16} />,
      onClick: () => finishTask.mutateAsync(task),
    };

    const reopenTaskItem = {
      key: "reopen-task",
      title: "Reopen Task",
      icon: <IconArrowBackUp size={16} />,
      onClick: () => reopenTask.mutateAsync(task),
    };

    const cancelTaskItem = {
      key: "cancel-task",
      title: "Cancel Task",
      icon: <IconCancel size={16} />,
      onClick: () => handleCancelRequested(task),
    };

    const restoreTaskItem = {
      key: "restore-task",
      title: "Restore Task",
      icon: <IconArrowBackUp size={16} />,
      onClick: () => restoreTask.mutateAsync(task),
    };

    const deleteTaskItem = {
      key: "delete-task",
      title: "Delete Task",
      icon: <IconTrash size={16} />,
      onClick: () => handleDeleteOneRequested(task),
    };

    const editTaskItem = {
      key: "edit-task",
      title: "Edit Task",
      icon: <IconEdit size={16} />,
      onClick: () => beginEditingTask(task),
    };

    if (task.status === TaskStatus.Todo) {
      return [startTaskItem, editTaskItem, cancelTaskItem, deleteTaskItem];
    }

    if (task.status === TaskStatus.Doing) {
      return [
        pauseTaskItem,
        finishTaskItem,
        editTaskItem,
        cancelTaskItem,
        deleteTaskItem,
      ];
    }

    if (task.status === TaskStatus.Done) {
      return [reopenTaskItem, deleteTaskItem];
    }

    if (task.status === TaskStatus.Paused) {
      return [
        resumeTaskItem,
        finishTaskItem,
        editTaskItem,
        cancelTaskItem,
        deleteTaskItem,
      ];
    }

    if (task.status === TaskStatus.Cancelled) {
      return [restoreTaskItem, deleteTaskItem];
    }

    return [];
  }

  const onValidNewTaskSubmit = async (newTask: NewTask) => {
    const newItem = { ...newTask };
    if (newTask.estimatedDuration) {
      newItem.estimatedDuration = TimeSpan.fromHours(
        newTask.estimatedDuration
      ).totalSeconds;
    }
    newItem.tags = newTaskTags;
    await createTask.mutateAsync(newItem);
    newForm.reset();
    newFormActions.close();
    setNewTaskTags([]);
  };

  const onValidEditTaskSubmit = async (editedTask: Task) => {
    const updatedItem = { ...editedTask };
    setTaskToEdit(null);
    editForm.reset();
    editForm.clearErrors();
    editFormActions.close();
    if (editedTask.estimatedDuration) {
      updatedItem.estimatedDuration = TimeSpan.fromHours(
        editedTask.estimatedDuration
      ).totalSeconds;
    }

    updatedItem.elapsedDuration = TimeSpan.fromHours(
      editedTask.elapsedDuration
    ).totalSeconds;

    await editTask.mutateAsync(updatedItem);
  };

  const beginEditingTask = (task: Task) => {
    setTaskToEdit({ ...task });
    editForm.setValues({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      scheduledStartDate: task.scheduledStartDate,
      scheduledCompleteDate: task.scheduledCompleteDate,
      actualStartDate: task.actualStartDate,
      actualCompleteDate: task.actualCompleteDate,
      estimatedDuration:
        TimeSpan.tryFromSeconds(task.estimatedDuration)?.totalHours ?? null,
      elapsedDuration: TimeSpan.fromSeconds(task.elapsedDuration).totalHours,
      comments: task.comments,
      tags: task.tags ?? editTags,
    });
    editFormActions.open();
  };

  async function removeTagByName(tagName: string) {
    const maybeTag = tryFindTagByName(tagName, tagOptions);
    if (!maybeTag) return;
    setNewTaskTags(newTaskTags.filter((t) => t.value !== tagName));
  }

  async function addTagByName(tagName: string) {
    let tag = tryFindTagByName(tagName, tagOptions);
    if (!tag) {
      tag = await createNewTag.mutateAsync(tagName);
      await refetchTags();
      if (!tag) return;
    }

    setNewTaskTags([...newTaskTags, tag]);
  }

  async function removeTagByNameToEditForm(tagName: string) {
    const maybeTag = tryFindTagByName(tagName, tagOptions);
    if (!maybeTag || !taskToEdit) return;
    await removeTagFromTask.mutateAsync({
      taskId: taskToEdit.id,
      tag: maybeTag,
    });
    await refreshTasks();
  }

  async function addTagByNameToEditForm(tagName: string) {
    let tag = tryFindTagByName(tagName, tagOptions);
    if (!tag) {
      tag = await createNewTag.mutateAsync(tagName);
      if (!tag) return;
    }
    if (taskToEdit !== null) {
      await addTagToTask.mutateAsync({ taskId: taskToEdit.id, tag });
      await refreshTasks();
    }
  }

  function updateTagFilter(
    filterName: FilterName | null,
    selection: TagFilterSelection
  ) {
    if (filterName === FilterName.Tagged) {
      setPage(1);
      setQuickFilter(
        QuickFilter.tagged(
          selection.tags?.map((t) => t.value) ?? null,
          selection.tagFilter
        )
      );
    } else if (filterName === null) {
      setPage(1);
      setQuickFilter(null);
    } else {
      setPage(1);
      setQuickFilter(new QuickFilter(filterName));
    }
  }

  //#endregion

  //#region Configuration

  /** The column configuration for the tasks table. */
  const columns = [
    {
      accessor: "title",
      sortable: true,
      filter: (
        <TextFilter
          label="Title/Description"
          description="Search the title and description"
          placeholder="Search..."
          initialValue={query}
          onFiltered={updateDescriptionQuery}
        />
      ),
      filtering: params.queryString !== null && params.queryString !== "",
      ellipsis: false,
    },
    {
      accessor: "status",
      width: windowWidth < 800 ? "100px" : "15vw",
      sortable: true,
      filter: (
        <MultiSelectFilter<SelectOption>
          label="Status"
          description="Show all tasks with any of the selected statuses"
          placeholder="Search statuses..."
          options={toSelectOptions(statusOptions, statusOptions)}
          initialSelections={toSelectOptions(params.statuses, params.statuses)}
          onFiltered={updateSelectedStatuses}
        />
      ),
      filtering:
        !!params.statuses && params.statuses.length !== statusOptions.length,
    },
    {
      accessor: "scheduledStartDate",
      width: windowWidth < 800 ? "115px" : "15vw",
      title: "Start By",
      sortable: true,
      render: (record: Task) =>
        maybeFormattedDate(record.scheduledStartDate, "MM/DD/YYYY"),
      filter: (
        <DateFilter filter={startByFilter} onRangeChanged={setStartByFilter} />
      ),
      filtering: params.startByFilter !== null,
    },
    {
      accessor: "scheduledCompleteDate",
      width: windowWidth < 800 ? "115px" : "15vw",
      title: "Due By",
      sortable: true,
      render: (record: Task) =>
        maybeFormattedDate(record.scheduledCompleteDate, "MM/DD/YYYY"),
      filter: (
        <DateFilter filter={dueByFilter} onRangeChanged={setDueByFilter} />
      ),
      filtering: params.dueByFilter !== null,
    },
  ];

  //#endregion

  //#region Component
  return (
    <Stack m={25}>
      <Group justify="space-between">
        <Text size="xl">Tasks</Text>
        <Group>
          {selectedTasks.length > 0 ? (
            <StyledActionIcon
              tooltipLabel="Delete Selected Tasks"
              tooltipPosition="left"
              onClick={() => handleDeleteManyRequested(selectedTasks)}
            >
              <IconTrashX />
            </StyledActionIcon>
          ) : null}
          <QuickFilterComponent
            selectedFilter={quickFilter}
            tagOptions={tagOptions}
            onFilter={updateTagFilter}
          />
          <StyledActionIcon
            onClick={() => newFormActions.open()}
            tooltipLabel="Create New Task"
            tooltipPosition="left"
          >
            <IconPlus />
          </StyledActionIcon>
          <StyledActionIcon
            onClick={refreshTasks}
            tooltipLabel="Refresh Tasks"
            tooltipPosition="left"
          >
            <IconRefresh />
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
          records={tasks.data}
          page={page}
          onPageChange={setPage}
          totalRecords={tasks.totalItemCount}
          recordsPerPage={pageSize}
          recordsPerPageOptions={pageSizeOptions}
          onRecordsPerPageChange={updatePageSize}
          key={"id"}
          sortStatus={sortStatus}
          onSortStatusChange={setSortStatus}
          paginationActiveBackgroundColor={colorPalette.background}
          paginationActiveTextColor={
            userSettings.buttonVariant === "filled" ||
            userSettings.buttonVariant === "gradient"
              ? "white"
              : colorPalette.color
          }
          selectedRecords={selectedTasks}
          onSelectedRecordsChange={setSelectedTasks}
          rowExpansion={{
            content: ({ record }) => {
              return (
                <TaskDetail
                  task={record}
                  tagOptions={tagOptions}
                  onStarted={startTask.mutateAsync}
                  onPaused={pauseTask.mutateAsync}
                  onResumed={resumeTask.mutateAsync}
                  onFinished={finishTask.mutateAsync}
                  onReopened={reopenTask.mutateAsync}
                  onCancelled={handleCancelRequested}
                  onRestored={restoreTask.mutateAsync}
                  onEdited={beginEditingTask}
                  onDeleted={handleDeleteOneRequested}
                  onCommentChanged={refetch}
                  onTagsChanged={refetch}
                  onHistoryChanged={refetch}
                />
              );
            },
          }}
          minHeight={tasks.data.length === 0 ? 200 : undefined}
          noRecordsText="No Tasks"
          paginationSize="xs"
        />
      )}
      <Modal
        opened={newFormOpened}
        onClose={closeNewForm}
        title="New Task"
        closeOnClickOutside={false}
        closeOnEscape={false}
      >
        <form onSubmit={newForm.onSubmit(onValidNewTaskSubmit)}>
          <Stack gap="sm">
            <TextInput
              withAsterisk
              label="Title"
              key={newForm.key("title")}
              {...newForm.getInputProps("title")}
            />
            <Textarea
              withAsterisk
              label="Description"
              key={newForm.key("description")}
              {...newForm.getInputProps("description")}
              autosize
            />
            <TextInput
              label="Status"
              key={newForm.key("status")}
              {...newForm.getInputProps("status")}
              readOnly
            />
            <DateInput
              valueFormat="MM/DD/YYYY"
              highlightToday={true}
              clearable
              defaultValue={dayjs()}
              getDayProps={getDayOnlyProps(
                newForm.getValues().scheduledStartDate,
                colorPalette
              )}
              label="Start By"
              key={newForm.key("scheduledStartDate")}
              {...newForm.getInputProps("scheduledStartDate")}
            />
            <DateInput
              valueFormat="MM/DD/YYYY"
              highlightToday={true}
              clearable
              defaultValue={dayjs()}
              getDayProps={getDayOnlyProps(
                newForm.getValues().scheduledCompleteDate,
                colorPalette
              )}
              label="Due By"
              key={newForm.key("scheduledCompleteDate")}
              {...newForm.getInputProps("scheduledCompleteDate")}
            />
            <NumberInput
              label="Estimated Duration (Hours)"
              key={newForm.key("estimatedDuration")}
              {...newForm.getInputProps("estimatedDuration")}
              suffix=" hour(s)"
              decimalScale={1}
            />
            <TagsInput
              label="Tags"
              data={tagOptions}
              defaultValue={[]}
              key={newForm.key("tags")}
              {...newForm.getInputProps("tags")}
              onRemove={(tagName) => removeTagByName(tagName)}
              onOptionSubmit={(tagName) => addTagByName(tagName)}
              acceptValueOnBlur={false}
            />
          </Stack>
          <Group justify="flex-end" mt="md">
            <StyledButton
              type="submit"
              label="Submit"
              disabled={!newForm.isValid()}
              tooltipLabel="Save New Task"
            />
          </Group>
        </form>
      </Modal>
      <Modal
        opened={editFormOpened}
        title="Edit Task"
        onClose={closeEditForm}
        closeOnClickOutside={false}
        closeOnEscape={false}
      >
        <form onSubmit={editForm.onSubmit(onValidEditTaskSubmit)}>
          <Stack gap="sm">
            <TextInput
              withAsterisk
              label="Title"
              key={editForm.key("title")}
              {...editForm.getInputProps("title")}
            />
            <Textarea
              withAsterisk
              label="Description"
              key={editForm.key("description")}
              {...editForm.getInputProps("description")}
              autosize
            />
            <TextInput
              label="Status"
              key={editForm.key("status")}
              {...editForm.getInputProps("status")}
              readOnly
            />
            <DateInput
              valueFormat="MM/DD/YYYY"
              highlightToday={true}
              clearable
              defaultValue={editForm.getValues().scheduledStartDate}
              getDayProps={getDayOnlyProps(
                editForm.getValues().scheduledStartDate,
                colorPalette
              )}
              label="Start By"
              key={editForm.key("scheduledStartDate")}
              {...editForm.getInputProps("scheduledStartDate")}
            />
            <DateInput
              valueFormat="MM/DD/YYYY"
              highlightToday={true}
              clearable
              defaultValue={editForm.getValues().scheduledCompleteDate}
              getDayProps={getDayOnlyProps(
                editForm.getValues().scheduledCompleteDate,
                colorPalette
              )}
              label="Due By"
              key={editForm.key("scheduledCompleteDate")}
              {...editForm.getInputProps("scheduledCompleteDate")}
            />
            <DateInput
              valueFormat="MM/DD/YYYY"
              highlightToday={true}
              clearable
              defaultValue={editForm.getValues().actualStartDate}
              getDayProps={getDayOnlyProps(
                editForm.getValues().actualStartDate,
                colorPalette
              )}
              label="Started On"
              key={editForm.key("actualStartDate")}
              {...editForm.getInputProps("actualStartDate")}
              readOnly={true}
            />
            <DateInput
              valueFormat="MM/DD/YYYY"
              highlightToday={true}
              clearable
              defaultValue={editForm.getValues().actualCompleteDate}
              getDayProps={getDayOnlyProps(
                editForm.getValues().actualCompleteDate,
                colorPalette
              )}
              label="Finished On"
              key={editForm.key("actualCompleteDate")}
              {...editForm.getInputProps("actualCompleteDate")}
              readOnly={true}
            />
            <NumberInput
              label="Estimated Duration"
              key={editForm.key("estimatedDuration")}
              {...editForm.getInputProps("estimatedDuration")}
              suffix=" hour(s)"
              decimalScale={1}
            />
            <NumberInput
              label="Elapsed Duration"
              key={editForm.key("elapsedDuration")}
              {...editForm.getInputProps("elapsedDuration")}
              suffix=" hour(s)"
              decimalScale={1}
              readOnly={true}
            />
            <TagsInput
              label="Tags"
              data={tagOptions}
              defaultValue={editTags}
              onRemove={(tagName) => removeTagByNameToEditForm(tagName)}
              onOptionSubmit={(tagName) => addTagByNameToEditForm(tagName)}
              acceptValueOnBlur={false}
            />
          </Stack>
          <Group justify="flex-end" mt="md">
            <StyledButton
              type="submit"
              disabled={!editForm.isValid()}
              label="Submit"
              tooltipLabel="Save Edited Task"
            />
          </Group>
        </form>
      </Modal>
    </Stack>
  );
}

//#endregion

export default TaskList;
