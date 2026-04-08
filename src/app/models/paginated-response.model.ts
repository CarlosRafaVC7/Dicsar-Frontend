export interface PaginatedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isLastPage: boolean;
}

export interface PaginationParams {
  pageNumber: number;
  pageSize: number;
}
