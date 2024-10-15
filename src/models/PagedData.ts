export type PagedData<T> = {
    page: number,
    pageSize: number,
    totalItemCount: number,
    data: T[]
}