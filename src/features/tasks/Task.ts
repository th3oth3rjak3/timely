/** A task to be completed by the user. */
export type Task = {
    /** The unique id of the task. */
    id: number;
    /** The descriptive text explaining the work to be done. */
    description: string;
    /** The current working status of the task. */
    status: string;
    /** The date when the task is scheduled to begin. */
    scheduledStartDate: Date | null;
    /** The date when the task is scheduled to end. */
    scheduledCompleteDate: Date | null;
    /** The date the work actually started. */
    actualStartDate: Date | null;
    /** The date the work actually finished. */
    actualCompleteDate: Date | null;
    /** The number of hours the work is estimated to take. */
    estimatedDuration: number | null;
    /** The amount of time in seconds that has been logged against this task. */
    elapsedDuration: number;
    /** Any comments related to the task. */
    comments: Comment[]

    // TODO: add comments array to this model
}

export type Comment = {
    id: number;
    taskId: number;
    message: string;
    created: Date;
    modified: Date | null;
}

export type NewTask = {
    description: string;
    status: string;
    scheduledStartDate: Date | null;
    scheduledCompleteDate: Date | null;
    estimatedDuration: number | null;
}

export type EditTask = {
    /** The unique id of the task. */
    id: number;
    /** The descriptive text explaining the work to be done. */
    description: string;
    /** The current working status of the task. */
    status: string;
    /** The date when the task is scheduled to begin. */
    scheduledStartDate: Date | null;
    /** The date when the task is scheduled to end. */
    scheduledCompleteDate: Date | null;
    /** The date the work actually started. */
    actualStartDate: Date | null;
    /** The date the work actually finished. */
    actualCompleteDate: Date | null;
    /** The number of hours the work is estimated to take. */
    estimatedDuration: number | null;
    /** The amount of time in seconds that has been logged against this task. */
    elapsedDuration: number | null;
}