import { ActionIcon, Button, Group, MultiSelect, Stack, Text, TextInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconArrowBackUp, IconCancel, IconCheck, IconEdit, IconPlayerPauseFilled, IconPlayerPlayFilled, IconSearch, IconTrashFilled, IconX } from "@tabler/icons-react";
import { invoke } from "@tauri-apps/api/core";
import { DataTable, DataTableSortStatus } from "mantine-datatable";
import { useEffect, useState } from "react";
import NewTaskDialog from "../dialogs/NewTaskDialog.tsx";
import { PagedData } from "../models/PagedData.ts";
import { NewTask, Task } from "../models/Task.ts";
import { taskSearchParams } from "../models/TaskSearchParams.ts";
import { TimeSpan } from "../models/TimeSpan.ts";
import { BG_COLOR, FG_COLOR } from "../utilities/colorUtilities.ts";
import { showErrorNotification, showSuccessNotification } from "../utilities/notificationUtilities.ts";

/**
 * Build the task detail section for the expanded list row.
 * @param task - The task to show the details for.
 * @returns A JSX element.
 */
function taskDetail(task: Task): JSX.Element {
    const buttons = (statusDescription: string): JSX.Element => {
        const status = statusDescription.toLowerCase();

        // TODO: add callback functions to each button.
        const startButton = <Button size="compact-xs" variant="light" color="teal" leftSection={<IconPlayerPlayFilled size={14} />} >Start</Button>;
        const pauseButton = <Button size="compact-xs" variant="light" leftSection={<IconPlayerPauseFilled size={14} />} >Pause</Button>;
        const resumeButton = <Button size="compact-xs" variant="light" color="teal" leftSection={<IconPlayerPlayFilled size={14} />} >Resume</Button>;
        const cancelButton = <Button size="compact-xs" variant="light" color="orange" leftSection={<IconCancel size={14} />}>Cancel</Button>;
        const finishButton = <Button size="compact-xs" variant="light" color="teal" leftSection={<IconCheck size={14} />}>Finish</Button>;
        const restoreButton = <Button size="compact-xs" variant="light" color="violet" leftSection={<IconArrowBackUp size={14} />}>Restore</Button>;
        const reopenButton = <Button size="compact-xs" variant="light" color="violet" leftSection={<IconArrowBackUp size={14} />}>Reopen</Button>;
        const deleteButton = <Button size="compact-xs" variant="light" color="red" leftSection={<IconTrashFilled size={14} />}>Delete</Button>;
        const editButton = <Button size="compact-xs" variant="light" color="cyan" leftSection={<IconEdit size={14} />}>Edit</Button>;

        if (status === "todo") {
            return (
                <>
                    {startButton}
                    {editButton}
                    {cancelButton}
                    {deleteButton}
                </>
            );
        }

        if (status === "doing") {
            return (
                <>
                    {pauseButton}
                    {finishButton}
                    {editButton}
                    {cancelButton}
                    {deleteButton}
                </>
            );
        }

        if (status === "done") {
            return (
                <>
                    {reopenButton}
                    {deleteButton}
                </>
            );
        }

        if (status === "paused") {
            return (
                <>
                    {resumeButton}
                    {editButton}
                    {cancelButton}
                    {deleteButton}
                </>
            );
        }

        if (status === "cancelled") {
            return (
                <>
                    {restoreButton}
                    {deleteButton}
                </>
            );
        }

        return <></>;
    }

    const row = (label: string, content: string): JSX.Element =>
    (
        <Group gap={6} ml={10} key={label}>
            <Text size="xs" w={130}>{label + ":"}</Text>
            <Text size="xs">{content}</Text>
        </Group>
    );

    const rowData = [
        {
            label: "Description",
            content: task.description
        },
        {
            label: "Status",
            content: task.status
        },
        {
            label: "Scheduled Start",
            content: task.scheduledStartDate !== null ? task.scheduledStartDate.toString() : "Not Scheduled"
        },
        {
            label: "Actual Start",
            content: task.actualStartDate !== null ? task.actualStartDate.toString() : "Not Started"
        },
        {
            label: "Scheduled Complete",
            content: task.scheduledCompleteDate !== null ? task.scheduledCompleteDate.toString() : "Not Scheduled",
        },
        {
            label: "Actual Complete",
            content: task.actualCompleteDate !== null ? task.actualCompleteDate.toString() : "Not Completed",
        },
        {
            label: "Estimated",
            content: task.estimatedDuration !== null ? TimeSpan.fromSeconds(task.estimatedDuration).toString() : "Not Estimated",
        },
        {
            label: "Elapsed",
            content: TimeSpan.fromSeconds(task.elapsedDuration).toString()
        }

    ];

    return (
        <Stack gap={4} my={10}>
            {rowData.map(({ label, content }) => row(label, content))}
            <Group gap={6} ml={10} mt={10}>
                {buttons(task.status)}
            </Group>
        </Stack>
    );
}

/** Get tasks from the server to display to the user. */
async function getTasksAsync(
    page: number,
    pageSize: number,
    statuses: string[],
    query?: string,
    sortField?: string,
    sortDirection?: string
): Promise<PagedData<Task>> {
    return await invoke<PagedData<Task>>("get_tasks", { params: taskSearchParams(page, pageSize, statuses, query, sortField, sortDirection) });
}

async function createTaskAsync(
    task: NewTask,
    page: number,
    pageSize: number,
    statuses: string[],
    query?: string,
    sortField?: string,
    sortDirection?: string
): Promise<PagedData<Task>> {
    return await invoke<PagedData<Task>>("create_task", {
        params: taskSearchParams(page, pageSize, statuses, query, sortField, sortDirection),
        newTask: task,
    });
}

function Tasks() {

    // Tasks are the complete list of tasks from the server query.
    const [tasks, setTasks] = useState<Task[]>([]);

    // The current page the user is viewing (1 based).
    const [page, setPage] = useState(1);

    // The number of items per page.
    const [pageSize, setPageSize] = useState(10);

    // The number of total task records.
    const [recordCount, setRecordCount] = useState(0);

    // The query input for the description filter.
    const [descriptionQuery, setDescriptionQuery] = useState<string>("");
    const [debouncedDescriptionQuery] = useDebouncedValue(descriptionQuery, 200);

    /** The list of all statuses available to choose from. */
    const statuses = ["Todo", "Doing", "Done", "Paused", "Cancelled"];

    // The list of currently selected statuses by the user.
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["Todo", "Doing", "Done", "Paused", "Cancelled"]);

    const [queryStatuses, setQueryStatuses] = useState<string[]>(selectedStatuses);

    // The current sort status.
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Task>>({
        columnAccessor: 'scheduledCompleteDate',
        direction: 'asc',
    })

    // Loading indicator for the data fetch.
    const [loading, setLoading] = useState(true);

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
            filtering: descriptionQuery !== ""
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
            filtering: !!selectedStatuses && selectedStatuses.length !== statuses.length
        },
        {
            accessor: "scheduledCompleteDate",
            sortable: true,
            // TODO: add filter for scheduled complete date.
        }
    ];

    const updateStateAfterTaskFetch = (pagedData: PagedData<Task>) => {
        setTasks(pagedData.data);
        setRecordCount(pagedData.totalItemCount);
    }

    const updatePageSize = (size: number) => {
        setPage(1);
        setPageSize(size);
    }

    // When the tasks list changes, set the total number of tasks.
    // Also update the records to show since the order could have changed.
    useEffect(() => {
        getTasksAsync(
            page,
            pageSize,
            selectedStatuses,
            debouncedDescriptionQuery,
            sortStatus.columnAccessor,
            sortStatus.direction)
            .then(updateStateAfterTaskFetch)
            .catch((err) => showErrorNotification("getting tasks", err))
            .finally(() => setLoading(false));
    }, [debouncedDescriptionQuery, queryStatuses, sortStatus, page, pageSize]);

    const submitNewTask = (newTask: NewTask) => {
        setLoading(true);

        createTaskAsync(
            newTask,
            page,
            pageSize,
            selectedStatuses,
            debouncedDescriptionQuery,
            sortStatus.columnAccessor,
            sortStatus.direction)
            .then(updateStateAfterTaskFetch)
            .then(() => showSuccessNotification("New task added successfully."))
            .catch((err) => showErrorNotification("creating new task", err))
            .finally(() => setLoading(false));
    }

    return (
        <Stack>
            <Group justify="space-between">
                <Text size="lg">Tasks</Text>
                <NewTaskDialog onValidSubmit={submitNewTask} />
            </Group>
            <DataTable
                withTableBorder
                fz="xs"
                columns={columns}
                records={tasks}
                page={page}
                totalRecords={recordCount}
                recordsPerPage={pageSize}
                onPageChange={setPage}
                recordsPerPageOptions={[1, 10, 25, 50, 100]}
                onRecordsPerPageChange={(size) => updatePageSize(size)}
                key={"id"}
                sortStatus={sortStatus}
                onSortStatusChange={setSortStatus}
                rowExpansion={{ content: ({ record }) => taskDetail(record) }}
                fetching={loading}
                paginationActiveBackgroundColor={BG_COLOR}
                paginationActiveTextColor={FG_COLOR}
                paginationSize="xs"
            />
        </Stack>
    );
}

export default Tasks;