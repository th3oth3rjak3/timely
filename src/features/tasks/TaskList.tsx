import { ActionIcon, Group, MultiSelect, Stack, Text, TextInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconRefresh, IconSearch, IconX } from "@tabler/icons-react";
import { invoke } from "@tauri-apps/api/core";
import { DataTable, DataTableSortStatus } from "mantine-datatable";
import { useEffect, useState } from "react";
import MyTooltip from "../../components/MyTooltip.tsx";
import { PagedData } from "../../models/PagedData.ts";
import { useAppDispatch, useAppSelector } from "../../redux/hooks.ts";
import { setPageSize } from "../../redux/reducers/settingsSlice.ts";
import { BG_COLOR, FG_COLOR } from "../../utilities/colorUtilities.ts";
import { maybeFormattedDate } from "../../utilities/dateUtilities.ts";
import { showErrorNotification, showSuccessNotification } from "../../utilities/notificationUtilities.ts";
import EditTaskDialog from "./EditTaskDialog.tsx";
import NewTaskDialog from "./NewTaskDialog.tsx";
import { EditTask, NewTask, Tag, Task } from "./Task.ts";
import TaskDetail from "./TaskDetail.tsx";
import { taskSearchParams, TaskSearchParams } from "./TaskSearchParams.ts";


function TaskList() {

    //#region State

    /** The globally set number of items per page in the application. */
    const pageSize = useAppSelector(state => state.settings.pageSize);

    /** The globally set choices for how many items per page can be chosen. */
    const pageSizeOptions = useAppSelector(state => state.settings.pageSizeOptions);

    /** An app store dispatch function to update store values. */
    const dispatch = useAppDispatch();

    // Tasks are the complete list of tasks from the server query.
    const [tasks, setTasks] = useState<Task[]>([]);

    // The current page the user is viewing (1 based).
    const [page, setPage] = useState(1);

    const [tagOptions, setTagOptions] = useState<Tag[]>([]);

    // The number of total task records.
    const [recordCount, setRecordCount] = useState(0);

    // The query input for the description filter.
    const [descriptionQuery, setDescriptionQuery] = useState<string>("");
    const [debouncedDescriptionQuery] = useDebouncedValue(descriptionQuery, 200);

    /** The list of all statuses available to choose from. */
    const statuses = ["Todo", "Doing", "Done", "Paused", "Cancelled"];

    // The list of currently selected statuses by the user.
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["Todo", "Doing", "Paused"]);

    const [queryStatuses, setQueryStatuses] = useState<string[]>(selectedStatuses);

    // The current sort status.
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Task>>({
        columnAccessor: 'scheduledCompleteDate',
        direction: 'asc',
    })

    // Loading indicator for the data fetch.
    const [loading, setLoading] = useState(true);

    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

    const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);

    //#endregion

    //#region Functions

    function getTagOptions() {
        invoke<Tag[]>("get_all_tags")
            .then((tags) => {
                setTagOptions(tags);
            })
            .catch(err => showErrorNotification("getting tag options", err));
    }

    /** Get tasks from the server to display to the user. */
    function getTasks(params: TaskSearchParams) {
        setLoading(true);

        invoke<PagedData<Task>>("get_tasks", { params })
            .then((pagedData) => {
                setTasks(pagedData.data);
                setRecordCount(pagedData.totalItemCount);
            })
            .catch((err) => showErrorNotification("getting tasks", err))
            .finally(() => setLoading(false));
    }

    /**
     * Create a new task and save it to the database.
     * @param task The new task to create.
     */
    function createTask(task: NewTask) {
        setLoading(true);

        invoke<void>("create_task", { newTask: task })
            .then(() => showSuccessNotification("New task added successfully."))
            .then(() => {
                let params = taskSearchParams(page, pageSize, selectedStatuses, debouncedDescriptionQuery, sortStatus.columnAccessor, sortStatus.direction);
                getTasks(params);
            })
            .catch((err) => showErrorNotification("creating a new task", err))
            .finally(() => setLoading(false));
    }

    function startTask(task: Task) {
        setLoading(true);

        invoke<void>("start_task", { taskId: task.id })
            .then(() => showSuccessNotification("Task started successfully."))
            .then(() => {
                let params = taskSearchParams(page, pageSize, selectedStatuses, debouncedDescriptionQuery, sortStatus.columnAccessor, sortStatus.direction);
                getTasks(params);
            })
            .catch((err) => showErrorNotification("starting a task", err))
            .finally(() => setLoading(false));
    }

    function pauseTask(task: Task) {
        setLoading(true);

        invoke<void>("pause_task", { taskId: task.id })
            .then(() => showSuccessNotification("Task paused successfully."))
            .then(() => {
                let params = taskSearchParams(page, pageSize, selectedStatuses, debouncedDescriptionQuery, sortStatus.columnAccessor, sortStatus.direction);
                getTasks(params);
            })
            .catch((err) => showErrorNotification("pausing a task", err))
            .finally(() => setLoading(false));
    }

    function resumeTask(task: Task) {
        setLoading(true);

        invoke<void>("resume_task", { taskId: task.id })
            .then(() => showSuccessNotification("Task resumed successfully."))
            .then(() => {
                let params = taskSearchParams(page, pageSize, selectedStatuses, debouncedDescriptionQuery, sortStatus.columnAccessor, sortStatus.direction);
                getTasks(params);
            })
            .catch((err) => showErrorNotification("resuming a task", err))
            .finally(() => setLoading(false));
    }

    function finishTask(task: Task) {
        setLoading(true);

        invoke<void>("finish_task", { taskId: task.id })
            .then(() => showSuccessNotification("Task finished successfully."))
            .then(() => {
                let params = taskSearchParams(page, pageSize, selectedStatuses, debouncedDescriptionQuery, sortStatus.columnAccessor, sortStatus.direction);
                getTasks(params);
            })
            .catch((err) => showErrorNotification("finishing a task", err))
            .finally(() => setLoading(false));
    }

    function cancelTask(task: Task) {
        setLoading(true);

        invoke<void>("cancel_task", { taskId: task.id })
            .then(() => showSuccessNotification("Task cancelled successfully."))
            .then(() => {
                let params = taskSearchParams(page, pageSize, selectedStatuses, debouncedDescriptionQuery, sortStatus.columnAccessor, sortStatus.direction);
                getTasks(params);
            })
            .catch((err) => showErrorNotification("cancelling a task", err))
            .finally(() => setLoading(false));
    }

    function restoreTask(task: Task) {
        setLoading(true);

        invoke<void>("restore_task", { taskId: task.id })
            .then(() => showSuccessNotification("Task restored successfully."))
            .then(() => {
                let params = taskSearchParams(page, pageSize, selectedStatuses, debouncedDescriptionQuery, sortStatus.columnAccessor, sortStatus.direction);
                getTasks(params);
            })
            .catch((err) => showErrorNotification("restoring a task", err))
            .finally(() => setLoading(false));
    }

    function reopenTask(task: Task) {
        setLoading(true);

        invoke<void>("reopen_task", { taskId: task.id })
            .then(() => showSuccessNotification("Task reopened successfully."))
            .then(() => {
                let params = taskSearchParams(page, pageSize, selectedStatuses, debouncedDescriptionQuery, sortStatus.columnAccessor, sortStatus.direction);
                getTasks(params);
            })
            .catch((err) => showErrorNotification("reopening a task", err))
            .finally(() => setLoading(false));
    }

    function deleteTask(task: Task) {
        setLoading(true);

        invoke<void>("delete_task", { taskId: task.id })
            .then(() => showSuccessNotification("Task deleted successfully."))
            .then(() => {
                let params = taskSearchParams(page, pageSize, selectedStatuses, debouncedDescriptionQuery, sortStatus.columnAccessor, sortStatus.direction);
                getTasks(params);
            })
            .catch((err) => showErrorNotification("deleting a task", err))
            .finally(() => setLoading(false));
    }

    function openEditDialog(task: Task) {
        setTaskToEdit(task);
        setEditDialogOpen(true);
    }

    function editTask(task: EditTask) {
        setLoading(true);

        if (!!taskToEdit && taskToEdit !== null) {
            if (taskToEdit.elapsedDuration === task.elapsedDuration) {
                task.elapsedDuration = null;
            }
        }

        invoke<void>("edit_task", { task })
            .then(() => showSuccessNotification("Task updated successfully."))
            .then(() => {
                let params = taskSearchParams(page, pageSize, selectedStatuses, debouncedDescriptionQuery, sortStatus.columnAccessor, sortStatus.direction);
                getTasks(params);
            })
            .catch((err) => showErrorNotification("editing a task", err))
            .finally(() => setLoading(false));

        setTaskToEdit(null);
    }

    /** Set the page size and reset the current page to 1 to avoid a page with no values being displayed. */
    function updatePageSize(size: number) {
        setPage(1);
        dispatch(setPageSize(size));
    }

    function refreshTasks() {
        const params = taskSearchParams(page, pageSize, selectedStatuses, debouncedDescriptionQuery, sortStatus.columnAccessor, sortStatus.direction);
        getTasks(params);
        getTagOptions();
    }

    //#endregion

    //#region Effects

    // Update task list when query or page changes.
    useEffect(() => {
        let params = taskSearchParams(page, pageSize, selectedStatuses, debouncedDescriptionQuery, sortStatus.columnAccessor, sortStatus.direction);
        getTasks(params);
        getTagOptions();
    }, [debouncedDescriptionQuery, queryStatuses, sortStatus, page, pageSize]);


    //#endregion

    //#region Configuration

    /** The column configuration for the tasks table. */
    const columns = [
        {
            accessor: "description",
            sortable: true,
            filter: (
                <TextInput
                    label="Description"
                    description="Search for tasks which contain the specified text"
                    placeholder="Search descriptions..."
                    leftSection={<IconSearch size={16} />}
                    rightSection={
                        <ActionIcon size="sm" variant="transparent" c="dimmed" onClick={() => setDescriptionQuery("")}>
                            <IconX size={14} />
                        </ActionIcon>
                    }
                    value={descriptionQuery}
                    onChange={(e) => setDescriptionQuery(e.currentTarget.value)}
                />
            ),
            filtering: descriptionQuery !== "",
            ellipsis: false,
        },
        {
            accessor: "status",
            sortable: true,
            filter: (
                <MultiSelect
                    label="Status"
                    description="Show all tasks with any of the selected statuses"
                    data={statuses}
                    value={selectedStatuses}
                    placeholder="Search statuses..."
                    onChange={(values) => { setSelectedStatuses(values); setQueryStatuses(values); }}
                    leftSection={<IconSearch size={16} />}
                    searchable
                    maw={300}
                    hidePickedOptions
                    nothingFoundMessage="Such empty..."
                />
            ),
            filtering: !!selectedStatuses && selectedStatuses.length !== statuses.length,
        },
        {
            accessor: "scheduledStartDate",
            title: "Start By",
            sortable: true,
            render: (record: Task) => maybeFormattedDate(record.scheduledStartDate, 'MM/DD/YYYY')
            // TODO: add a filter for scheduled start date.
        },
        {
            accessor: "scheduledCompleteDate",
            title: "Due By",
            sortable: true,
            render: (record: Task) => maybeFormattedDate(record.scheduledCompleteDate, 'MM/DD/YYYY')
            // TODO: add filter for scheduled complete date.
        },
    ];

    //#endregion

    //#region Component
    return (
        <Stack m={10}>
            {taskToEdit === null ? null : <EditTaskDialog task={taskToEdit} onValidSubmit={editTask} isOpen={editDialogOpen} onClosed={() => setTaskToEdit(null)} />}
            <Group justify="space-between">
                <Text size="lg">Tasks</Text>
                <Group>
                    <NewTaskDialog onValidSubmit={createTask} />
                    <MyTooltip label="Refresh Tasks" position="left">
                        <ActionIcon variant="light" color="cyan" onClick={() => refreshTasks()}>
                            <IconRefresh />
                        </ActionIcon>
                    </MyTooltip>
                </Group>
            </Group>
            <DataTable
                withTableBorder
                fz="sm"
                columns={columns}
                records={tasks}
                page={page}
                totalRecords={recordCount}
                recordsPerPage={pageSize}
                onPageChange={setPage}
                recordsPerPageOptions={pageSizeOptions}
                onRecordsPerPageChange={(size) => updatePageSize(size)}
                key={"id"}
                sortStatus={sortStatus}
                onSortStatusChange={setSortStatus}
                rowExpansion={{
                    content: ({ record }) => {
                        return (
                            <TaskDetail
                                task={record}
                                tagOptions={tagOptions}
                                onStarted={startTask}
                                onPaused={pauseTask}
                                onFinished={finishTask}
                                onResumed={resumeTask}
                                onRestored={restoreTask}
                                onCancelled={cancelTask}
                                onReopened={reopenTask}
                                onEdited={openEditDialog}
                                onDeleted={deleteTask}
                                onCommentChanged={refreshTasks}
                                onTagsChanged={refreshTasks} />
                        );
                    }
                }}
                fetching={loading}
                paginationActiveBackgroundColor={BG_COLOR}
                paginationActiveTextColor={FG_COLOR}
                paginationSize="xs"
            />
        </Stack>
    );

    //#endregion
}

export default TaskList;