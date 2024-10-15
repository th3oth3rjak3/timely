/** Filter the records to find the ones which belong to a given page. */
export function getRecordsByPage<T>(page: number, pageSize: number, records: T[]): T[] {
    const from = (page - 1) * pageSize;
    const to = page * pageSize;
    return records.slice(from, to);
}

export function getSqlColumnFromPropertyName(propertyName: string): string {
    const wordRegex = /[A-Z]?[a-z]+|[0-9]+|[A-Z]+(?![a-z])/g;
    const result = propertyName.match(wordRegex);
    return result?.map(word => word.toLowerCase()).join("_") ?? propertyName;
}