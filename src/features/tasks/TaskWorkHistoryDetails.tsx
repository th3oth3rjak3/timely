import { Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { FormErrors, useForm } from "@mantine/form";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import dayjs from "dayjs";
import { sortBy } from "lodash";
import { ContextMenuContent, useContextMenu } from "mantine-contextmenu";
import {
  DataTable,
  DataTableColumn,
  DataTableSortStatus,
} from "mantine-datatable";
import { useMemo, useState } from "react";
import StyledActionIcon from "../../components/StyledActionIcon";
import StyledButton from "../../components/StyledButton";
import useColorPalette from "../../hooks/useColorPalette";
import { TaskStatus } from "../../models/TaskStatus";
import { TimeSpan } from "../../models/TimeSpan";
import { Task, TaskWorkHistory } from "../../models/ZodModels";
import { pageSizeOptions } from "../../state/globalState";
import { getDayOnlyProps } from "../../utilities/dateUtilities";
import { useUserSettings } from "../settings/settingsService";
import {
  useAddWorkHistory,
  useDeleteWorkHistory,
  useEditWorkHistory,
} from "./services/workHistoryService";
import { EditTaskWorkHistory, NewTaskWorkHistory } from "./types/Task";

export interface TaskWorkHistoryProps {
  task: Task;
  onHistoryChanged: () => void;
}

function TaskWorkHistoryDetails(props: TaskWorkHistoryProps) {
  const { data: userSettings } = useUserSettings();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(userSettings.pageSize);
  const [sortStatus, setSortStatus] = useState<
    DataTableSortStatus<TaskWorkHistory>
  >({
    columnAccessor: "startDate",
    direction: "desc",
  });
  const [newWorkHistoryFormOpened, newWorkHistoryFormActions] =
    useDisclosure(false);
  const [editWorkHistoryFormOpened, editWorkHistoryFormActions] =
    useDisclosure(false);
  const colorPalette = useColorPalette();
  const { showContextMenu, hideContextMenu } = useContextMenu();
  const isTouchScreen = useMediaQuery("(pointer: coarse)");
  const isDisabled = useMemo(() => {
    return props.task.status === TaskStatus.Doing;
  }, [props.task]);

  const columns: DataTableColumn<TaskWorkHistory>[] = [
    {
      accessor: "startDate",
      title: "Start Date",
      sortable: true,
      render: (history) =>
        dayjs(history.startDate)
          .startOf("second")
          .format("MM/DD/YYYY hh:mm:ss A"),
      sortKey: "startDate",
    },
    {
      accessor: "endDate",
      title: "End Date",
      sortable: true,
      render: (history) =>
        dayjs(history.endDate)
          .startOf("second")
          .format("MM/DD/YYYY hh:mm:ss A"),
      sortKey: "endDate",
    },
    {
      accessor: "elapsedDuration",
      title: "Elapsed Duration",
      render: (history) =>
        TimeSpan.fromSeconds(history.elapsedDuration).toString(),
    },
  ];

  const records = useMemo(() => {
    if (sortStatus.direction === "desc") {
      return sortBy(
        props.task.workHistory,
        sortStatus.columnAccessor
      ).reverse();
    }
    return sortBy(props.task.workHistory, sortStatus.columnAccessor);
  }, [props, sortStatus]);

  const addWorkHistory = useAddWorkHistory(userSettings);
  const editWorkHistory = useEditWorkHistory(userSettings);
  const deleteWorkHistory = useDeleteWorkHistory(userSettings);

  const newWorkHistoryForm = useForm<NewTaskWorkHistory>({
    mode: "controlled",
    initialValues: {
      taskId: props.task.id,
      startDate: dayjs().startOf("second").toDate(),
      endDate: dayjs().startOf("second").toDate(),
    },
    validateInputOnChange: true,
    validateInputOnBlur: true,
    validate: (item) => {
      const errors: FormErrors = {
        startDate: null,
        endDate: null,
      };
      if (item.startDate >= item.endDate) {
        errors.startDate = "Start Date must be before End Date.";
        errors.endDate = "End Date must be after Start Date.";
      }

      return errors;
    },
  });

  async function addNewWorkHistory(values: typeof newWorkHistoryForm.values) {
    newWorkHistoryFormActions.close();
    values.startDate = dayjs(values.startDate).startOf("second").toDate();
    values.endDate = dayjs(values.endDate).startOf("second").toDate();
    await addWorkHistory.mutateAsync(values);
    newWorkHistoryForm.reset();
    props.onHistoryChanged();
  }

  function closeNewForm() {
    newWorkHistoryFormActions.close();
    newWorkHistoryForm.reset();
  }

  const editWorkHistoryForm = useForm<EditTaskWorkHistory>({
    mode: "controlled",
    initialValues: {
      id: 0,
      taskId: props.task.id,
      startDate: dayjs().startOf("second").toDate(),
      endDate: dayjs().startOf("second").toDate(),
    },
    validateInputOnChange: true,
    validate: (item) => {
      const errors: FormErrors = {
        startDate: null,
        endDate: null,
      };
      if (item.startDate >= item.endDate) {
        errors.startDate = "Start Date must be before End Date.";
        errors.endDate = "End Date must be after Start Date.";
      }

      return errors;
    },
  });

  async function updateWorkHistory(values: typeof editWorkHistoryForm.values) {
    editWorkHistoryFormActions.close();
    values.startDate = dayjs(values.startDate).startOf("second").toDate();
    values.endDate = dayjs(values.endDate).startOf("second").toDate();
    await editWorkHistory.mutateAsync(values);
    editWorkHistoryForm.reset();
    props.onHistoryChanged();
  }

  function closeEditForm() {
    editWorkHistoryFormActions.close();
    editWorkHistoryForm.reset();
  }

  function beginEditingWorkHistory(workHistory: TaskWorkHistory) {
    editWorkHistoryForm.setValues({
      id: workHistory.id,
      taskId: workHistory.taskId,
      startDate: dayjs(workHistory.startDate).startOf("second").toDate(),
      endDate: dayjs(workHistory.endDate).startOf("second").toDate(),
    });
    editWorkHistoryFormActions.open();
  }

  async function deleteWorkHistoryItem(id: number) {
    setPage(1);
    await deleteWorkHistory.mutateAsync(id);
    props.onHistoryChanged();
  }

  const openDeleteModal = (history: TaskWorkHistory) =>
    modals.openConfirmModal({
      title: "Delete Work History",
      children: <Text>Are you sure you want to delete this history?</Text>,
      confirmProps: {
        variant: colorPalette.variant,
        color: colorPalette.colorName,
        gradient: colorPalette.gradient,
      },
      cancelProps: {
        variant: colorPalette.variant,
        gradient: colorPalette.gradient,
      },
      labels: { confirm: "Confirm", cancel: "Deny" },
      onCancel: () => {},
      onConfirm: () => deleteWorkHistoryItem(history.id),
    });

  function getContextMenuItems(history: TaskWorkHistory): ContextMenuContent {
    const editHistory = {
      key: "edit-history",
      title: "Edit History",
      icon: <IconEdit size={16} />,
      disabled: isDisabled,
      onClick: () => beginEditingWorkHistory(history),
    };

    const deleteHistory = {
      key: "delete-history",
      title: "Delete History",
      icon: <IconTrash size={16} />,
      disabled: isDisabled,
      onClick: () => openDeleteModal(history),
    };

    return [editHistory, deleteHistory];
  }

  return (
    <Stack gap={5}>
      <Group justify="space-between">
        <Text size="sm">Work History</Text>
        <StyledActionIcon
          tooltipLabel="Add Work History"
          tooltipPosition="left"
          size="sm"
          onClick={newWorkHistoryFormActions.open}
          disabled={isDisabled}
          disabledLabel="Pause Task Before Editing"
        >
          <IconPlus />
        </StyledActionIcon>
      </Group>
      <DataTable
        withTableBorder
        withColumnBorders
        highlightOnHover
        columns={columns}
        records={records}
        onPageChange={(change) => setPage(change)}
        recordsPerPageOptions={pageSizeOptions}
        recordsPerPage={pageSize}
        onRecordsPerPageChange={(size) => setPageSize(size)}
        page={page}
        totalRecords={props.task.workHistory.length ?? 0}
        minHeight={props.task.workHistory.length === 0 ? 200 : undefined}
        noRecordsText="No Work History"
        sortStatus={sortStatus}
        onSortStatusChange={(status) => setSortStatus(status)}
        onRowContextMenu={({ record, event }) =>
          showContextMenu(getContextMenuItems(record))(event)
        }
        paginationActiveBackgroundColor={colorPalette.background}
        paginationActiveTextColor={
          userSettings.buttonVariant === "filled" ||
          userSettings.buttonVariant === "gradient"
            ? "white"
            : colorPalette.color
        }
        onScroll={hideContextMenu}
        textSelectionDisabled={isTouchScreen}
        paginationSize="xs"
      />
      <Modal
        opened={newWorkHistoryFormOpened}
        onClose={closeNewForm}
        title="Add Work History"
        closeOnClickOutside={false}
        closeOnEscape={false}
      >
        <form onSubmit={newWorkHistoryForm.onSubmit(addNewWorkHistory)}>
          <Stack>
            <DateTimePicker
              withSeconds
              valueFormat="MM/DD/YYYY hh:mm:ss A"
              label="Start Date"
              {...newWorkHistoryForm.getInputProps("startDate")}
              key={newWorkHistoryForm.key("startDate")}
              getDayProps={getDayOnlyProps(
                newWorkHistoryForm.getValues().startDate,
                colorPalette
              )}
            />
            <DateTimePicker
              withSeconds
              valueFormat="MM/DD/YYYY hh:mm:ss A"
              label="End Date"
              {...newWorkHistoryForm.getInputProps("endDate")}
              key={newWorkHistoryForm.key("endDate")}
              getDayProps={getDayOnlyProps(
                newWorkHistoryForm.getValues().endDate,
                colorPalette
              )}
            />
            <TextInput
              label="Elapsed Duration"
              value={TimeSpan.fromDates(
                newWorkHistoryForm.getValues().startDate,
                newWorkHistoryForm.getValues().endDate
              ).toString()}
              readOnly={true}
            />
            <Group>
              <StyledButton
                type="submit"
                label="Save"
                tooltipLabel="Save Work History"
              />
            </Group>
          </Stack>
        </form>
      </Modal>
      <Modal
        opened={editWorkHistoryFormOpened}
        onClose={closeEditForm}
        title="Edit Work History"
        closeOnClickOutside={false}
        closeOnEscape={false}
      >
        <form onSubmit={editWorkHistoryForm.onSubmit(updateWorkHistory)}>
          <Stack>
            <DateTimePicker
              withSeconds
              valueFormat="MM/DD/YYYY hh:mm:ss A"
              label="Start Date"
              {...editWorkHistoryForm.getInputProps("startDate")}
              key={editWorkHistoryForm.key("startDate")}
              getDayProps={getDayOnlyProps(
                editWorkHistoryForm.getValues().startDate,
                colorPalette
              )}
            />
            <DateTimePicker
              withSeconds
              valueFormat="MM/DD/YYYY hh:mm:ss A"
              label="End Date"
              {...editWorkHistoryForm.getInputProps("endDate")}
              key={editWorkHistoryForm.key("endDate")}
              getDayProps={getDayOnlyProps(
                editWorkHistoryForm.getValues().endDate,
                colorPalette
              )}
            />
            <TextInput
              label="Elapsed Duration"
              value={TimeSpan.fromDates(
                editWorkHistoryForm.getValues().startDate,
                editWorkHistoryForm.getValues().endDate
              ).toString()}
              readOnly={true}
            />
            <Group>
              <StyledButton
                type="submit"
                label="Save"
                tooltipLabel="Save Work History"
              />
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}

export default TaskWorkHistoryDetails;
