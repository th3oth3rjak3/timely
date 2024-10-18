
export type SelectOption = {
    value: string;
    label: string;
}

export interface Stringer {
    toString: () => string;
}

export function toSelectOptions<T extends Stringer>(values: T[], labels: string[]): SelectOption[] {
    return values.map((v, i) => {
        return { label: labels[i], value: v.toString() };
    });
}