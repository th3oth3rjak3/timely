import useTauri from "../../../hooks/useTauri";
import { TimelyAction } from "../../../models/TauriAction";
import { UserSettings } from "../../../models/ZodModels";
import { EditTaskWorkHistory, NewTaskWorkHistory } from "../types/Task";

const useWorkHistoryService = (userSettings: UserSettings) => {
  const { invoke } = useTauri();

  const addWorkHistory = async (history: NewTaskWorkHistory) => {
    await invoke<void>({
      command: "add_task_work_history",
      params: { newTaskWorkHistory: history },
      successMessage: "Added new work history successfully.",
      notificationType: TimelyAction.AddNewWorkHistory,
      userSettings,
    });
  };

  const editWorkHistory = async (history: EditTaskWorkHistory) => {
    await invoke<void>({
      command: "edit_task_work_history",
      params: { editTaskWorkHistory: history },
      successMessage: "Updated work history successfully.",
      notificationType: TimelyAction.EditWorkHistory,
      userSettings,
    });
  };

  const deleteWorkHistory = async (historyId: number) => {
    await invoke<void>({
      command: "delete_task_work_history",
      params: { historyId },
      successMessage: "Deleted work history successfully.",
      notificationType: TimelyAction.DeleteWorkHistory,
      userSettings,
    });
  };

  return {
    addWorkHistory,
    editWorkHistory,
    deleteWorkHistory,
  };
};

export default useWorkHistoryService;
