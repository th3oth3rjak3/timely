import { ActionIcon, Group, MultiSelect, Stack, Text, TextInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconRefresh, IconSearch, IconX } from "@tabler/icons-react";
import { DataTable, DataTableSortStatus } from "mantine-datatable";
import { useEffect, useState } from "react";
import MyTooltip from "../../components/MyTooltip.tsx";
import useWindowSize from "../../hooks/useWindowSize.tsx";
import { useAppDispatch, useAppSelector } from "../../redux/hooks.ts";
import { setPageSize } from "../../redux/reducers/settingsSlice.ts";
import { BG_COLOR, FG_COLOR } from "../../utilities/colorUtilities.ts";
import { maybeFormattedDate } from "../../utilities/dateUtilities.ts";
import { showSuccessNotification } from "../../utilities/notificationUtilities.ts";
import EditTaskDialog from "./EditTaskDialog.tsx";
import useFetchTasks from "./hooks/useFetchTasks.tsx";
import useTaskSearchParams from "./hooks/useTaskSearchParams.tsx";
import useTaskService from "./hooks/useTaskService.tsx";
import NewTaskDialog from "./NewTaskDialog.tsx";
import TaskDetail from "./TaskDetail.tsx";
import { Task } from "./types/Task.ts";


function TaskList() {

    //#region State

    /** The globally set number of items per page in the application. */
    const pageSize = useAppSelector(state => state.settings.pageSize);

    /** The globally set choices for how many items per page can be chosen. */
    const pageSizeOptions = useAppSelector(state => state.settings.pageSizeOptions);

    /** An app store dispatch function to update store values. */
    const dispatch = useAppDispatch();

    // The current page the user is viewing (1 based).
    const [page, setPage] = useState(1); // TODO: appselector

    // The query input for the description filter.
    const [descriptionQuery, setDescriptionQuery] = useState<string>(""); // TODO: appselector
    const [debouncedDescriptionQuery] = useDebouncedValue(descriptionQuery, 200); // TODO: appselector

    /** The list of all statuses available to choose from. */
    const statuses = ["Todo", "Doing", "Done", "Paused", "Cancelled"]; //  TODO: appselector

    // The list of currently selected statuses by the user.
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["Todo", "Doing", "Paused"]); // TODO: appselector

    // The current sort status.
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Task>>({
        columnAccessor: 'scheduledCompleteDate',
        direction: 'asc',
    }) // TODO: appselector

    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);

    const searchParams = useTaskSearchParams(
        page,
        pageSize,
        selectedStatuses,
        debouncedDescriptionQuery,
        sortStatus
    );

    const { tasks, recordCount, tagOptions, fetchAllData } = useFetchTasks(searchParams);
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
        reopenTask
    } = useTaskService(fetchAllData);

    //#endregion

    //#region Functions

    function openEditDialog(task: Task) {
        setTaskToEdit(task);
        setEditDialogOpen(true);
    }

    /** Set the page size and reset the current page to 1 to avoid a page with no values being displayed. */
    function updatePageSize(size: number) {
        setPage(1);
        dispatch(setPageSize(size));
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
            width: windowWidth < 800 ? "100px" : "15vw",
            sortable: true,
            filter: (
                <MultiSelect
                    label="Status"
                    description="Show all tasks with any of the selected statuses"
                    data={statuses}
                    value={selectedStatuses}
                    placeholder="Search statuses..."
                    onChange={setSelectedStatuses}
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
            width: windowWidth < 800 ? "115px" : "15vw",
            title: "Start By",
            sortable: true,
            render: (record: Task) => maybeFormattedDate(record.scheduledStartDate, 'MM/DD/YYYY'),
            filter: (<></>),
        },
        {
            accessor: "scheduledCompleteDate",
            width: windowWidth < 800 ? "115px" : "15vw",
            title: "Due By",
            sortable: true,
            render: (record: Task) => maybeFormattedDate(record.scheduledCompleteDate, 'MM/DD/YYYY'),
            filter: (<></>),
        },
    ];

    //#endregion

    //#region Effects
    useEffect(() => {
        fetchAllData().then(() => setLoading(false));
    }, [searchParams]);
    //#endregion

    //#region Component
    return (
        <Stack m={10}>
            {taskToEdit === null
                ? null
                : <EditTaskDialog
                    task={taskToEdit}
                    onValidSubmit={(task) => editTask(taskToEdit, task, () => setTaskToEdit(null))}
                    isOpen={editDialogOpen}
                    onClosed={() => setTaskToEdit(null)} />
            }
            <Group justify="space-between">
                <Text size="xl">Tasks</Text>
                <Group>
                    <NewTaskDialog onValidSubmit={createTask} />
                    <MyTooltip label="Refresh Tasks" position="left">
                        <ActionIcon variant="light" color="cyan" onClick={() => fetchAllData().then(() => showSuccessNotification("So fresh."))}>
                            <IconRefresh />
                        </ActionIcon>
                    </MyTooltip>
                </Group>
            </Group>
            {loading
                ? <></>
                : <DataTable
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
                                    onCommentChanged={fetchAllData}
                                    onTagsChanged={fetchAllData} />
                            );
                        }
                    }}
                    paginationActiveBackgroundColor={BG_COLOR}
                    paginationActiveTextColor={FG_COLOR}
                    paginationSize="xs"
                />}
        </Stack>
    );

    //#endregion
}

export default TaskList;