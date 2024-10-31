export type Comment = {
    id: number;
    taskId: number;
    message: string;
    created: Date;
    modified: Date | null;
}