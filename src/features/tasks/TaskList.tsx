import { ActionIcon, Button, Group, Modal, MultiSelect, NumberInput, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { IconArrowBackUp, IconCancel, IconCheck, IconEdit, IconPlayerPause, IconPlayerPlay, IconPlus, IconRefresh, IconSearch, IconTrash, IconX } from "@tabler/icons-react";
import { ContextMenuContent, useContextMenu } from "mantine-contextmenu";
import { DataTable } from "mantine-datatable";
import { useEffect, useState } from "react";
import MyTooltip from "../../components/MyTooltip.tsx";
import useWindowSize from "../../hooks/useWindowSize.tsx";
import { TimeSpan } from "../../models/TimeSpan.ts";
import { useAppDispatch, useAppSelector } from "../../redux/hooks.ts";
import { setCurrentPage, setPageSize, setSortStatus, setTaskSearchParams } from "../../redux/reducers/settingsSlice.ts";
import { BG_COLOR, FG_COLOR } from "../../utilities/colorUtilities.ts";
import { maybeDate, maybeFormattedDate } from "../../utilities/dateUtilities.ts";
import { validateLength } from "../../utilities/formUtilities.ts";
import { showSuccessNotification } from "../../utilities/notificationUtilities.ts";
import useFetchTasks from "./hooks/useFetchTasks.tsx";
import useTaskService from "./hooks/useTaskService.tsx";
import TaskDetail from "./TaskDetail.tsx";
import { NewTask, Task } from "./types/Task.ts";

function TaskList() {

    //#region State

    const { showContextMenu, hideContextMenu } = useContextMenu();

    /** The globally set number of items per page in the application. */
    const pageSize = useAppSelector(state => state.settings.taskListSettings.params.pageSize);

    /** The globally set choices for how many items per page can be chosen. */
    const pageSizeOptions = useAppSelector(state => state.settings.taskListSettings.pageSizeOptions);

    const statusOptions = useAppSelector(state => state.settings.taskListSettings.statusOptions);
    const taskSearchParams = useAppSelector(state => state.settings.taskListSettings.params);
    const [newFormOpened, newFormActions] = useDisclosure(false);
    const [editFormOpened, editFormActions] = useDisclosure(false);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

    /** An app store dispatch function to update store values. */
    const dispatch = useAppDispatch();

    const sortStatus = useAppSelector(state => state.settings.taskListSettings.sortStatus);

    const [loading, setLoading] = useState(true);

    const { tasks, recordCount, tagOptions, fetchAllData } = useFetchTasks(taskSearchParams);
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

    const validators = {
        description: (value?: string | null) => validateLength({ fieldName: "Description", value, minValue: 1, maxValue: 2000 }),
        title: (value?: string | null) => validateLength({ fieldName: "Title", value, minValue: 1, maxValue: 100 }),
    }

    const editForm = useForm<Task>({
        mode: 'uncontrolled',
        validate: validators,
        validateInputOnChange: true,
        validateInputOnBlur: true,
    });

    const newForm = useForm<NewTask>({
        mode: 'uncontrolled',
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
        }
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
        dispatch(setTaskSearchParams({
            ...taskSearchParams,
            page: 1,
            queryString: value ?? null,
        }))
    }

    function updateSelectedStatuses(statuses: string[]) {
        dispatch(setTaskSearchParams({
            ...taskSearchParams,
            page: 1,
            statuses: statuses
        }));
    }

    /** Set the page size and reset the current page to 1 to avoid a page with no values being displayed. */
    function updatePageSize(size: number) {
        dispatch(setCurrentPage(1));
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

    const onValidNewTaskSubmit = async (newTask: NewTask) => {
        const newItem = { ...newTask };
        if (!!newTask.estimatedDuration && newTask.estimatedDuration !== null) {
            newItem.estimatedDuration = TimeSpan.fromHours(newTask.estimatedDuration).totalSeconds;
        }
        await createTask(newItem);
        newForm.reset();
        newFormActions.close();
    }

    const onValidEditTaskSubmit = async (editedTask: Task) => {
        const updatedItem = { ...editedTask };
        setTaskToEdit(null);
        editForm.reset();
        editForm.clearErrors();
        editFormActions.close();
        if (!!editedTask.estimatedDuration && editedTask.estimatedDuration !== null) {
            updatedItem.estimatedDuration = TimeSpan.fromHours(editedTask.estimatedDuration).totalSeconds;
        }

        updatedItem.elapsedDuration = TimeSpan.fromHours(editedTask.elapsedDuration).totalSeconds;

        await editTask(taskToEdit, updatedItem);
    }

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
            estimatedDuration: TimeSpan.tryFromSeconds(task.estimatedDuration)?.totalHours ?? null,
            elapsedDuration: TimeSpan.fromSeconds(task.elapsedDuration).totalHours,
            comments: task.comments,
            tags: task.tags
        });
        editFormActions.open();
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
                        <ActionIcon size="sm" variant="transparent" c="dimmed" onClick={() => updateDescriptionQuery("")}>
                            <IconX size={14} />
                        </ActionIcon>
                    }
                    value={taskSearchParams.queryString || ""}
                    onChange={(e) => updateDescriptionQuery(e.currentTarget.value)}
                />
            ),
            filtering: taskSearchParams.queryString !== null && taskSearchParams.queryString !== "",
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
            filtering: !!taskSearchParams.statuses && taskSearchParams.statuses.length !== statusOptions.length,
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
    }, [taskSearchParams]);
    //#endregion

    //#region Component
    return (
        <Stack m={10}>
            <Group justify="space-between">
                <Text size="xl">Tasks</Text>
                <Group>
                    <ActionIcon variant="light" color="cyan" onClick={() => newFormActions.open()}>
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
                    page={taskSearchParams.page}
                    totalRecords={recordCount}
                    recordsPerPage={pageSize}
                    onPageChange={(page) => dispatch(setCurrentPage(page))}
                    recordsPerPageOptions={pageSizeOptions}
                    onRecordsPerPageChange={(size) => updatePageSize(size)}
                    key={"id"}
                    sortStatus={sortStatus}
                    onSortStatusChange={status => dispatch(setSortStatus(status))}
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
            <Modal opened={newFormOpened} onClose={closeNewForm} title="New Task" closeOnClickOutside={false} closeOnEscape={false}>
                <form onSubmit={newForm.onSubmit(onValidNewTaskSubmit, console.log)}>
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
                        <Button type="submit" variant="light" color="cyan" disabled={!newForm.isValid()}>Submit</Button>
                    </Group>
                </form>
            </Modal>
            <Modal opened={editFormOpened} title="Edit Task" onClose={closeEditForm} closeOnClickOutside={false} closeOnEscape={false}>
                <form onSubmit={editForm.onSubmit(onValidEditTaskSubmit)}>
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
            </Modal>
        </Stack>
    );
}
//#endregion


export default TaskList;