export interface PagedData<T> {
  page: number;
  pageSize: number;
  totalItemCount: number;
  data: T[];
}
