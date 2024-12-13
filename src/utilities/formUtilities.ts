
export interface SelectOption {
  value: string;
  label: string;
}

export interface Stringer {
  toString: () => string;
}

export function toSelectOptions<T extends Stringer>(
  values: T[],
  labels: string[]
): SelectOption[] {
  return values.map((v, i) => {
    return { label: labels[i], value: v.toString() };
  });
}

function lengthLessThanOrEqual(
  maxValue: number,
  value?: string | null
): boolean {
  if (!value || value === null) return false;
  return value.length <= maxValue;
}

function lengthGreaterThanOrEqual(
  minValue: number,
  value: string | null | undefined
): boolean {
  if (!value || value === null) return false;
  return value.length >= minValue;
}

function lengthBetween(
  value: string | null | undefined,
  minValue: number,
  maxValue: number
): boolean {
  return (
    lengthLessThanOrEqual(maxValue, value) &&
    lengthGreaterThanOrEqual(minValue, value)
  );
}

function notNullOrUndefined(value: string | null | undefined): boolean {
  return !!value && value !== null;
}

export interface LengthValidation {
  /** The name of the field to validate. */
  fieldName: string;
  /** The value to validate. */
  value?: string | null;
  /** The minimum length. */
  minValue?: number;
  /** The maximum length. */
  maxValue?: number;
}

/** Validate the length of an input string. When valid, this function returns null, otherwise an error string. */
export function validateLength({ fieldName, value, minValue, maxValue }: LengthValidation): string | null {
    if (minValue !== null && minValue !== undefined && maxValue !== null && maxValue !== undefined) {
        const valid = lengthBetween(value, minValue, maxValue);
        if (!valid) return `${fieldName} must be between ${minValue} and ${maxValue} characters in length.`;
        return null
    } else if (minValue !== null && minValue !== undefined) {
        const valid = lengthGreaterThanOrEqual(minValue, value);
        if (!valid) return `${fieldName} must be greater than ${minValue} characters in length.`;
        return null;
    } else if (maxValue !== null && maxValue !== undefined) {
        const valid = lengthLessThanOrEqual(maxValue, value);
        if (!valid) return `${fieldName} must be less than ${maxValue} characters in length.`;
        return null;
    } else {
        const valid = notNullOrUndefined(value);
        if (!valid) return `${fieldName} must be a valid string.`;
        return null;
    }
}