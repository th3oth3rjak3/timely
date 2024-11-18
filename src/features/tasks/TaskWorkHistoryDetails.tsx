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
import { useEffect, useState } from "react";
import StyledActionIcon from "../../components/StyledActionIcon";
import StyledButton from "../../components/StyledButton";
import useColorPalette from "../../hooks/useColorPalette";
import { TimeSpan } from "../../models/TimeSpan";
import { useAppSelector } from "../../redux/hooks";
import { getDayProps } from "../../utilities/dateUtilities";
import useWorkHistoryService from "./hooks/useWorkHistoryService";
import {
  EditTaskWorkHistory,
  NewTaskWorkHistory,
  Task,
  TaskWorkHistory,
} from "./types/Task";

type TaskWorkHistoryProps = {
  task: Task;
  onHistoryChanged: () => void;
};

function TaskWorkHistoryDetails(props: TaskWorkHistoryProps) {
  const userSettings = useAppSelector((state) => state.settings.userSettings);
  const pageSizeOptions = useAppSelector(
    (state) => state.settings.taskListSettings.pageSizeOptions
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(userSettings.pageSize);
  const [sortStatus, setSortStatus] = useState<
    DataTableSortStatus<TaskWorkHistory>
  >({
    columnAccessor: "startDate",
    direction: "desc",
  });
  const data = sortBy(props.task.workHistory, "startDate");
  const [records, setRecords] = useState(data.reverse()); // Start with records sorted descending by startDate
  const [newWorkHistoryFormOpened, newWorkHistoryFormActions] =
    useDisclosure(false);
  const [editWorkHistoryFormOpened, editWorkHistoryFormActions] =
    useDisclosure(false);
  const colorPalette = useColorPalette();
  const { showContextMenu, hideContextMenu } = useContextMenu();
  const isTouchScreen = useMediaQuery("(pointer: coarse)");

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

  useEffect(() => {
    const data = sortBy(
      props.task.workHistory,
      sortStatus.columnAccessor
    ) as TaskWorkHistory[];
    setRecords(sortStatus.direction === "desc" ? data.reverse() : data);
  }, [props.task, sortStatus]);

  const { addWorkHistory, editWorkHistory, deleteWorkHistory } =
    useWorkHistoryService(userSettings);

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
      let errors: FormErrors = {
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
    await addWorkHistory(values);
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
      let errors: FormErrors = {
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
    await editWorkHistory(values);
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
    await deleteWorkHistory(id);
    props.onHistoryChanged();
  }

  const openDeleteModal = (history: TaskWorkHistory) =>
    modals.openConfirmModal({
      title: "Delete Work History",
      children: <Text>Are you sure you want to delete this history?</Text>,
      confirmProps: {
        variant: colorPalette.variant,
        color: "red",
        gradient: { ...colorPalette.gradient, from: "red" },
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
      onClick: () => beginEditingWorkHistory(history),
    };

    const deleteHistory = {
      key: "delete-history",
      title: "Delete History",
      icon: <IconTrash size={16} />,
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
        onScroll={hideContextMenu}
        textSelectionDisabled={isTouchScreen}
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
              getDayProps={getDayProps(
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
              getDayProps={getDayProps(
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
              getDayProps={getDayProps(
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
              getDayProps={getDayProps(
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
