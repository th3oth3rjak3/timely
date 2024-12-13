export function fromNullable<T>(value: T | null | undefined): T | null {
  if (value === undefined || value === null) {
    return null;
  }
  return value;
}

export function tryMap<T, U>(
  value: T | null | undefined,
  fn: (input: T) => U
): U | null {
  const nullableValue = fromNullable(value);
  if (nullableValue == null) {
    return null;
  }

  return fn(nullableValue);
}
