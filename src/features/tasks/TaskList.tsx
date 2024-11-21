import {
  Group,
  Modal,
  MultiSelect,
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
import {
  IconArrowBackUp,
  IconCancel,
  IconCheck,
  IconEdit,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { ContextMenuContent, useContextMenu } from "mantine-contextmenu";
import { DataTable } from "mantine-datatable";
import { useEffect, useMemo, useState } from "react";
import DateFilter from "../../components/DateFilter.tsx";
import StyledActionIcon from "../../components/StyledActionIcon.tsx";
import StyledButton from "../../components/StyledButton.tsx";
import useColorPalette from "../../hooks/useColorPalette.tsx";
import useWindowSize from "../../hooks/useWindowSize.tsx";
import { TaskStatus } from "../../models/TaskStatus.ts";
import { TimelyAction } from "../../models/TauriAction.ts";
import { TimeSpan } from "../../models/TimeSpan.ts";
import { useAppDispatch, useAppSelector } from "../../redux/hooks.ts";
import {
  setCurrentTaskPage,
  setTaskPageSize,
  setTaskSearchParams,
  setTaskSortStatus,
} from "../../redux/reducers/settingsSlice.ts";
import {
  getDayOnlyProps,
  maybeDate,
  maybeFormattedDate,
} from "../../utilities/dateUtilities.ts";
import { validateLength } from "../../utilities/formUtilities.ts";
import { showSuccessNotification } from "../../utilities/notificationUtilities";
import useTagService from "../tags/hooks/useTagService.tsx";
import { Tag } from "../tags/types/Tag.ts";
import useFetchTasks from "./hooks/useFetchTasks.tsx";
import useTaskService from "./hooks/useTaskService.tsx";
import TagFilter from "./TagFilter.tsx";
import TaskDetail from "./TaskDetail.tsx";
import { NewTask, Task } from "./types/Task.ts";

function TaskList() {
  //#region State

  const { showContextMenu, hideContextMenu } = useContextMenu();
  const userSettings = useAppSelector((state) => state.settings.userSettings);
  const colorPalette = useColorPalette();

  /** The globally set number of items per page in the application. */
  const pageSize = useAppSelector(
    (state) => state.settings.taskListSettings.params.pageSize
  );

  /** The globally set choices for how many items per page can be chosen. */
  const pageSizeOptions = useAppSelector(
    (state) => state.settings.taskListSettings.pageSizeOptions
  );

  const statusOptions = useAppSelector(
    (state) => state.settings.taskListSettings.statusOptions
  );
  const taskSearchParams = useAppSelector(
    (state) => state.settings.taskListSettings.params
  );
  const [newFormOpened, newFormActions] = useDisclosure(false);
  const [editFormOpened, editFormActions] = useDisclosure(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [newTaskTags, setNewTaskTags] = useState<Tag[]>([]);
  const editTags = useMemo(() => {
    return taskToEdit === null ? [] : taskToEdit.tags.map((t) => t.value);
  }, [taskToEdit]);

  /** An app store dispatch function to update store values. */
  const dispatch = useAppDispatch();

  const sortStatus = useAppSelector(
    (state) => state.settings.taskListSettings.sortStatus
  );

  const [loading, setLoading] = useState(true);

  const { tasks, recordCount, tagOptions, fetchAllData } =
    useFetchTasks(taskSearchParams);
  const { windowWidth } = useWindowSize();
  const {
    createTask,
    startTask,
    editTask,
    cancelTask,
    pauseTask,
    resumeTask,
    restoreTask,
    deleteTask,
    finishTask,
    reopenTask,
  } = useTaskService(colorPalette, userSettings, recordCount, fetchAllData);

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
      status: "Todo",
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
      status: "Todo",
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
    dispatch(
      setTaskSearchParams({
        ...taskSearchParams,
        page: 1,
        queryString: value ?? null,
      })
    );
  }

  function updateSelectedStatuses(statuses: string[]) {
    dispatch(
      setTaskSearchParams({
        ...taskSearchParams,
        page: 1,
        statuses: statuses.map((st) => st as TaskStatus),
      })
    );
  }

  /** Set the page size and reset the current page to 1 to avoid a page with no values being displayed. */
  function updatePageSize(size: number) {
    dispatch(setCurrentTaskPage(1));
    dispatch(setTaskPageSize(size));
  }

  function updateCurrentPage(page: number) {
    dispatch(setCurrentTaskPage(page));
  }

  function getContextMenuItems(task: Task): ContextMenuContent {
    const startTaskItem = {
      key: "start-task",
      title: "Start Task",
      icon: <IconPlayerPlay size={16} />,
      onClick: () => startTask(task),
    };

    const pauseTaskItem = {
      key: "pause-task",
      title: "Pause Task",
      icon: <IconPlayerPause size={16} />,
      onClick: () => pauseTask(task),
    };

    const resumeTaskItem = {
      key: "resume-task",
      title: "Resume Task",
      icon: <IconPlayerPlay size={16} />,
      onClick: () => resumeTask(task),
    };

    const finishTaskItem = {
      key: "finish-task",
      title: "Finish Task",
      icon: <IconCheck size={16} />,
      onClick: () => finishTask(task),
    };

    const reopenTaskItem = {
      key: "reopen-task",
      title: "Reopen Task",
      icon: <IconArrowBackUp size={16} />,
      onClick: () => reopenTask(task),
    };

    const cancelTaskItem = {
      key: "cancel-task",
      title: "Cancel Task",
      icon: <IconCancel size={16} />,
      onClick: () => cancelTask(task),
    };

    const restoreTaskItem = {
      key: "restore-task",
      title: "Restore Task",
      icon: <IconArrowBackUp size={16} />,
      onClick: () => restoreTask(task),
    };

    const deleteTaskItem = {
      key: "delete-task",
      title: "Delete Task",
      icon: <IconTrash size={16} />,
      onClick: () => deleteTask(task),
    };

    const editTaskItem = {
      key: "edit-task",
      title: "Edit Task",
      icon: <IconEdit size={16} />,
      onClick: () => beginEditingTask(task),
    };

    let status = task.status.toLowerCase();

    if (status === "todo") {
      return [startTaskItem, editTaskItem, cancelTaskItem, deleteTaskItem];
    }

    if (status === "doing") {
      return [
        pauseTaskItem,
        finishTaskItem,
        editTaskItem,
        cancelTaskItem,
        deleteTaskItem,
      ];
    }

    if (status === "done") {
      return [reopenTaskItem, deleteTaskItem];
    }

    if (status === "paused") {
      return [
        resumeTaskItem,
        finishTaskItem,
        editTaskItem,
        cancelTaskItem,
        deleteTaskItem,
      ];
    }

    if (status === "cancelled") {
      return [restoreTaskItem, deleteTaskItem];
    }

    return [];
  }

  const onValidNewTaskSubmit = async (newTask: NewTask) => {
    const newItem = { ...newTask };
    if (!!newTask.estimatedDuration && newTask.estimatedDuration !== null) {
      newItem.estimatedDuration = TimeSpan.fromHours(
        newTask.estimatedDuration
      ).totalSeconds;
    }
    newItem.tags = newTaskTags;
    await createTask(newItem);
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
    if (
      !!editedTask.estimatedDuration &&
      editedTask.estimatedDuration !== null
    ) {
      updatedItem.estimatedDuration = TimeSpan.fromHours(
        editedTask.estimatedDuration
      ).totalSeconds;
    }

    updatedItem.elapsedDuration = TimeSpan.fromHours(
      editedTask.elapsedDuration
    ).totalSeconds;

    await editTask(taskToEdit, updatedItem);
  };

  const beginEditingTask = (task: Task) => {
    setTaskToEdit({ ...task });
    editForm.setValues({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      scheduledStartDate: maybeDate(task.scheduledStartDate),
      scheduledCompleteDate: maybeDate(task.scheduledCompleteDate),
      actualStartDate: maybeDate(task.actualStartDate),
      actualCompleteDate: maybeDate(task.actualCompleteDate),
      estimatedDuration:
        TimeSpan.tryFromSeconds(task.estimatedDuration)?.totalHours ?? null,
      elapsedDuration: TimeSpan.fromSeconds(task.elapsedDuration).totalHours,
      comments: task.comments,
      tags: task.tags ?? editTags,
    });
    editFormActions.open();
  };

  const { tryFindTagByName, createNewTag, addTagToTask, removeTagFromTask } =
    useTagService(userSettings, colorPalette, tagOptions.length);

  async function removeTagByName(tagName: string) {
    const maybeTag = tryFindTagByName(tagName, tagOptions);
    if (!maybeTag) return;
    setNewTaskTags(newTaskTags.filter((t) => t.value !== tagName));
  }

  async function addTagByName(tagName: string) {
    let tag = tryFindTagByName(tagName, tagOptions);
    if (!tag) {
      tag = await createNewTag(tagName);
      if (!tag) return;
    }

    setNewTaskTags([...newTaskTags, tag]);
  }

  async function removeTagByNameToEditForm(tagName: string) {
    const maybeTag = tryFindTagByName(tagName, tagOptions);
    if (!maybeTag || !taskToEdit) return;
    removeTagFromTask(taskToEdit.id, maybeTag);
    await fetchAllData();
  }

  async function addTagByNameToEditForm(tagName: string) {
    let tag = tryFindTagByName(tagName, tagOptions);
    if (!tag) {
      tag = await createNewTag(tagName);
      if (!tag) return;
    }
    if (taskToEdit !== null) {
      addTagToTask(taskToEdit.id, tag);
      await fetchAllData();
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
        <TextInput
          label="Title"
          description="Search for tasks which contain the specified text"
          placeholder="Search..."
          leftSection={<IconSearch size={16} />}
          rightSection={
            <StyledActionIcon
              size="sm"
              variant="transparent"
              color="dimmed"
              onClick={() => updateDescriptionQuery("")}
            >
              <IconX size={14} />
            </StyledActionIcon>
          }
          value={taskSearchParams.queryString || ""}
          onChange={(e) => updateDescriptionQuery(e.currentTarget.value)}
        />
      ),
      filtering:
        taskSearchParams.queryString !== null &&
        taskSearchParams.queryString !== "",
      ellipsis: false,
    },
    {
      accessor: "status",
      width: windowWidth < 800 ? "100px" : "15vw",
      sortable: true,
      filter: (
        <MultiSelect
          label="Status"
          description="Show all tasks with any of the selected statuses"
          data={statusOptions}
          value={taskSearchParams.statuses}
          placeholder="Search statuses..."
          onChange={(statuses) => updateSelectedStatuses(statuses)}
          leftSection={<IconSearch size={16} />}
          searchable
          maw={300}
          hidePickedOptions
          nothingFoundMessage="Such empty..."
        />
      ),
      filtering:
        !!taskSearchParams.statuses &&
        taskSearchParams.statuses.length !== statusOptions.length,
    },
    {
      accessor: "scheduledStartDate",
      width: windowWidth < 800 ? "115px" : "15vw",
      title: "Start By",
      sortable: true,
      render: (record: Task) =>
        maybeFormattedDate(record.scheduledStartDate, "MM/DD/YYYY"),
      filter: (
        <DateFilter
          filter={useAppSelector(
            (state) => state.settings.taskListSettings.params.startByFilter
          )}
          onRangeChanged={(value) =>
            dispatch(
              setTaskSearchParams({ ...taskSearchParams, startByFilter: value })
            )
          }
        />
      ),
      filtering: taskSearchParams.startByFilter !== null,
    },
    {
      accessor: "scheduledCompleteDate",
      width: windowWidth < 800 ? "115px" : "15vw",
      title: "Due By",
      sortable: true,
      render: (record: Task) =>
        maybeFormattedDate(record.scheduledCompleteDate, "MM/DD/YYYY"),
      filter: (
        <DateFilter
          filter={useAppSelector(
            (state) => state.settings.taskListSettings.params.dueByFilter
          )}
          onRangeChanged={(value) =>
            dispatch(
              setTaskSearchParams({ ...taskSearchParams, dueByFilter: value })
            )
          }
        />
      ),
      filtering: taskSearchParams.dueByFilter !== null,
    },
  ];

  //#endregion

  //#region Effects
  useEffect(() => {
    fetchAllData().then(() => setLoading(false));
  }, [taskSearchParams]);
  //#endregion

  //#region Component
  return (
    <Stack m={25}>
      <Group justify="space-between">
        <Text size="xl">Tasks</Text>
        <Group>
          <TagFilter
            tagOptions={tagOptions}
            onFilter={(selection) =>
              dispatch(
                setTaskSearchParams({
                  ...taskSearchParams,
                  page: 1,
                  tags: selection.tags?.map((t) => t.value) ?? null,
                  tagOperation: selection.tagOperation,
                })
              )
            }
          />
          <StyledActionIcon
            onClick={() => newFormActions.open()}
            tooltipLabel="Create New Task"
            tooltipPosition="left"
          >
            <IconPlus />
          </StyledActionIcon>
          <StyledActionIcon
            onClick={() =>
              fetchAllData().then(() =>
                showSuccessNotification(
                  TimelyAction.RefreshTasks,
                  userSettings,
                  "So fresh."
                )
              )
            }
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
          records={tasks}
          page={taskSearchParams.page}
          totalRecords={recordCount}
          recordsPerPage={pageSize}
          onPageChange={(page) => updateCurrentPage(page)}
          recordsPerPageOptions={pageSizeOptions}
          onRecordsPerPageChange={(size) => updatePageSize(size)}
          key={"id"}
          sortStatus={sortStatus}
          onSortStatusChange={(status) => dispatch(setTaskSortStatus(status))}
          paginationActiveBackgroundColor={colorPalette.background}
          paginationActiveTextColor={
            userSettings.buttonVariant === "filled" ||
            userSettings.buttonVariant === "gradient"
              ? "white"
              : colorPalette.color
          }
          rowExpansion={{
            content: ({ record }) => {
              return (
                <TaskDetail
                  task={record}
                  tagOptions={tagOptions}
                  userSettings={userSettings}
                  onStarted={startTask}
                  onPaused={pauseTask}
                  onFinished={finishTask}
                  onResumed={resumeTask}
                  onRestored={restoreTask}
                  onCancelled={cancelTask}
                  onReopened={reopenTask}
                  onEdited={beginEditingTask}
                  onDeleted={deleteTask}
                  onCommentChanged={fetchAllData}
                  onTagsChanged={fetchAllData}
                  onHistoryChanged={fetchAllData}
                />
              );
            },
          }}
          minHeight={tasks.length === 0 ? 200 : undefined}
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
