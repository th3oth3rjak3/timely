export function getSqlColumnFromPropertyName(propertyName: string): string {
  const wordRegex = /[A-Z]?[a-z]+|[0-9]+|[A-Z]+(?![a-z])/g;
  const result = propertyName.match(wordRegex);
  return result?.map(word => word.toLowerCase()).join("_") ?? propertyName;
}

export function findLastPage(totalItemCount: number, pageSize: number): number {
  const leftover = totalItemCount % pageSize;
  const pages = Math.floor(totalItemCount / pageSize);
  const calculated = leftover > 0 ? pages + 1 : pages;
  return Math.max(calculated, 1);
}