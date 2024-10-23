import { ActionIcon, Button, Group, MultiSelect, NumberInput, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDebouncedValue, useMediaQuery } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { IconArrowBackUp, IconCancel, IconCheck, IconEdit, IconPlayerPause, IconPlayerPlay, IconPlus, IconRefresh, IconSearch, IconTrash, IconX } from "@tabler/icons-react";
import { ContextMenuContent, useContextMenu } from "mantine-contextmenu";
import { DataTable, DataTableSortStatus } from "mantine-datatable";
import { useEffect, useState } from "react";
import MyTooltip from "../../components/MyTooltip.tsx";
import useWindowSize from "../../hooks/useWindowSize.tsx";
import { TimeSpan } from "../../models/TimeSpan.ts";
import { useAppDispatch, useAppSelector } from "../../redux/hooks.ts";
import { setPageSize } from "../../redux/reducers/settingsSlice.ts";
import { BG_COLOR, FG_COLOR } from "../../utilities/colorUtilities.ts";
import { maybeDate, maybeFormattedDate } from "../../utilities/dateUtilities.ts";
import { showSuccessNotification } from "../../utilities/notificationUtilities.ts";
import useFetchTasks from "./hooks/useFetchTasks.tsx";
import useTaskSearchParams from "./hooks/useTaskSearchParams.tsx";
import useTaskService from "./hooks/useTaskService.tsx";
import TaskDetail from "./TaskDetail.tsx";
import { NewTask, Task } from "./types/Task.ts";

function TaskList() {

    //#region State

    const { showContextMenu, hideContextMenu } = useContextMenu();

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
        reopenTask,
    } = useTaskService(fetchAllData);

    const isTouch = useMediaQuery('(pointer: coarse)');

    const editForm = useForm<Task>({
        mode: 'uncontrolled',
        validate: {
            description: (value) => value.length > 0 && value.length < 2000 ? null : "Description must be between 1 and 2000 characters",
            title: (value) => value.length > 0 && value.length < 100 ? null : "Title must be between 1 and 100 characters"
        }
    });

    const newForm = useForm<NewTask>({
        mode: 'uncontrolled',
        validate: {
            description: (value) => value.length > 0 && value.length < 2000 ? null : "Description must be between 1 and 2000 characters",
            title: (value) => value.length > 0 && value.length < 100 ? null : "Title must be between 1 and 100 characters"
        }
    });

    //#endregion

    //#region Functions

    /** Set the page size and reset the current page to 1 to avoid a page with no values being displayed. */
    function updatePageSize(size: number) {
        setPage(1);
        dispatch(setPageSize(size));
    }

    function getContextMenuItems(task: Task): ContextMenuContent {

        const startTaskItem = {
            key: 'start-task',
            title: 'Start Task',
            icon: <IconPlayerPlay size={16} />,
            onClick: () => startTask(task)
        };

        const pauseTaskItem = {
            key: 'pause-task',
            title: 'Pause Task',
            icon: <IconPlayerPause size={16} />,
            onClick: () => pauseTask(task),
        };

        const resumeTaskItem = {
            key: 'resume-task',
            title: 'Resume Task',
            icon: <IconPlayerPlay size={16} />,
            onClick: () => resumeTask(task),
        };

        const finishTaskItem = {
            key: 'finish-task',
            title: 'Finish Task',
            icon: <IconCheck size={16} />,
            onClick: () => finishTask(task),
        };

        const reopenTaskItem = {
            key: 'reopen-task',
            title: 'Reopen Task',
            icon: <IconArrowBackUp size={16} />,
            onClick: () => reopenTask(task),
        };

        const cancelTaskItem = {
            key: 'cancel-task',
            title: 'Cancel Task',
            icon: <IconCancel size={16} />,
            onClick: () => cancelTask(task),
        };

        const restoreTaskItem = {
            key: 'restore-task',
            title: 'Restore Task',
            icon: <IconArrowBackUp size={16} />,
            onClick: () => restoreTask(task),
        };

        const deleteTaskItem = {
            key: 'delete-task',
            title: 'Delete Task',
            icon: <IconTrash size={16} />,
            onClick: () => deleteTask(task),
        };

        const editTaskItem = {
            key: 'edit-task',
            title: 'Edit Task',
            icon: <IconEdit size={16} />,
            onClick: () => beginEditingTask(task)
        }

        let status = task.status.toLowerCase();

        if (status === "todo") {
            return [
                startTaskItem,
                editTaskItem,
                cancelTaskItem,
                deleteTaskItem,
            ];
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
            return [
                reopenTaskItem,
                deleteTaskItem,
            ];
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
            return [
                restoreTaskItem,
                deleteTaskItem,
            ];
        }

        return [];
    }

    const createNewTask = () => {
        const onValidSubmit = async (newTask: NewTask) => {
            const newItem = { ...newTask };
            modals.closeAll();
            if (!!newTask.estimatedDuration && newTask.estimatedDuration !== null) {
                newItem.estimatedDuration = TimeSpan.fromHours(newTask.estimatedDuration).totalSeconds;
            }
            await createTask(newItem);
            newForm.reset();
        }

        openNewModal(onValidSubmit);
    }

    const openNewModal = (callback: (newTask: NewTask) => void) => {
        newForm.setValues({
            title: "",
            description: "",
            status: "Todo",
            scheduledStartDate: null,
            scheduledCompleteDate: null,
            estimatedDuration: null,
        });

        modals.open({
            title: "New Task",
            children: (
                <>
                    <form onSubmit={newForm.onSubmit(callback)}>
                        <Stack gap="sm">
                            <TextInput withAsterisk label="Title" key={newForm.key("title")} {...newForm.getInputProps("title")} />
                            <Textarea withAsterisk label="Description" key={newForm.key("description")} {...newForm.getInputProps("description")} autosize />
                            <TextInput label="Status" key={newForm.key("status")} {...newForm.getInputProps("status")} readOnly />
                            <DateInput
                                valueFormat="MM/DD/YYYY"
                                highlightToday={true}
                                clearable
                                defaultValue={new Date()}
                                label="Start By"
                                key={newForm.key("scheduledStartDate")}
                                {...newForm.getInputProps("scheduledStartDate")} />
                            <DateInput
                                valueFormat="MM/DD/YYYY"
                                highlightToday={true}
                                clearable
                                defaultValue={new Date()}
                                label="Due By"
                                key={newForm.key("scheduledCompleteDate")}
                                {...newForm.getInputProps("scheduledCompleteDate")} />
                            <NumberInput label="Estimated Duration (Hours)" key={newForm.key("estimatedDuration")} {...newForm.getInputProps("estimatedDuration")} suffix=" hour(s)" decimalScale={1} />
                        </Stack>
                        <Group justify="flex-end" mt="md">
                            <Button type="submit" variant="light" color="cyan">Submit</Button>
                        </Group>
                    </form>
                </>
            )
        });
    }

    const beginEditingTask = (task: Task) => {

        const onValidSubmit = async (editedTask: Task) => {
            const updatedItem = { ...editedTask };
            modals.closeAll();
            if (!!editedTask.estimatedDuration && editedTask.estimatedDuration !== null) {
                updatedItem.estimatedDuration = TimeSpan.fromHours(editedTask.estimatedDuration).totalSeconds;
            }

            updatedItem.elapsedDuration = TimeSpan.fromHours(editedTask.elapsedDuration).totalSeconds;

            await editTask(task, updatedItem);
        }

        openEditModal(task, onValidSubmit);
    }


    const openEditModal = (task: Task, callback: (task: Task) => void) => {
        const formInput = {
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            scheduledStartDate: maybeDate(task.scheduledStartDate),
            scheduledCompleteDate: maybeDate(task.scheduledCompleteDate),
            actualStartDate: maybeDate(task.actualStartDate),
            actualCompleteDate: maybeDate(task.actualCompleteDate),
            estimatedDuration: TimeSpan.tryFromSeconds(task.estimatedDuration)?.totalHours ?? null,
            elapsedDuration: TimeSpan.fromSeconds(task.elapsedDuration).totalHours,
            comments: task.comments,
            tags: task.tags
        };

        editForm.setValues(formInput);

        modals.open({
            title: "Edit Task",
            children: (
                <>
                    <form onSubmit={editForm.onSubmit(callback)}>
                        <Stack gap="sm">
                            <TextInput withAsterisk label="Title" key={editForm.key("title")} {...editForm.getInputProps("title")} />
                            <Textarea withAsterisk label="Description" key={editForm.key("description")} {...editForm.getInputProps("description")} autosize />
                            <TextInput label="Status" key={editForm.key("status")} {...editForm.getInputProps("status")} readOnly />
                            <DateInput
                                valueFormat="MM/DD/YYYY"
                                highlightToday={true}
                                clearable
                                defaultValue={editForm.getValues().scheduledStartDate}
                                label="Start By"
                                key={editForm.key("scheduledStartDate")}
                                {...editForm.getInputProps("scheduledStartDate")} />
                            <DateInput
                                valueFormat="MM/DD/YYYY"
                                highlightToday={true}
                                clearable
                                defaultValue={editForm.getValues().scheduledCompleteDate}
                                label="Due By"
                                key={editForm.key("scheduledCompleteDate")}
                                {...editForm.getInputProps("scheduledCompleteDate")} />
                            <DateInput
                                valueFormat="MM/DD/YYYY"
                                highlightToday={true}
                                clearable
                                defaultValue={editForm.getValues().actualStartDate}
                                label="Started On"
                                key={editForm.key("actualStartDate")}
                                {...editForm.getInputProps("actualStartDate")} />
                            <DateInput
                                valueFormat="MM/DD/YYYY"
                                highlightToday={true}
                                clearable
                                defaultValue={editForm.getValues().actualCompleteDate}
                                label="Finished On"
                                key={editForm.key("actualCompleteDate")}
                                {...editForm.getInputProps("actualCompleteDate")} />
                            <NumberInput label="Estimated Duration" key={editForm.key("estimatedDuration")} {...editForm.getInputProps("estimatedDuration")} suffix=" hour(s)" decimalScale={1} />
                            <NumberInput label="Elapsed Duration" key={editForm.key("elapsedDuration")} {...editForm.getInputProps("elapsedDuration")} suffix=" hour(s)" decimalScale={1} />
                        </Stack>
                        <Group justify="flex-end" mt="md">
                            <Button type="submit" variant="light" color="cyan">Submit</Button>
                        </Group>
                    </form>
                </>
            )
        });
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
            <Group justify="space-between">
                <Text size="xl">Tasks</Text>
                <Group>
                    <ActionIcon variant="light" color="cyan" onClick={() => createNewTask()}>
                        <IconPlus />
                    </ActionIcon>
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
                    textSelectionDisabled={isTouch}
                    onRowContextMenu={({ record, event }) => showContextMenu(getContextMenuItems(record))(event)}
                    onScroll={hideContextMenu}
                    withTableBorder
                    withColumnBorders
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
                                    onEdited={beginEditingTask}
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
}
//#endregion


export default TaskList;