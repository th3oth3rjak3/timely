import { MultiSelect } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { SelectOption } from "../utilities/formUtilities";

export interface MultiSelectFilterProps<T extends SelectOption> {
  options: T[];
  initialSelections: T[];
  label?: string;
  description?: string;
  placeholder?: string;
  onFiltered: (selected: T[]) => void | Promise<void>;
}

function MultiSelectFilter<T extends SelectOption>(
  props: MultiSelectFilterProps<T>
) {
  const [selectedItems, setSelectedItems] = useState<T[]>([
    ...props.initialSelections,
  ]);

  const [options] = useState<T[]>([...props.options]);

  const updateSelectedItems = (values: string[]) => {
    const newValues = options.filter((o) => values.includes(o.value));
    setSelectedItems([...newValues]);
    props.onFiltered([...newValues]);
  };

  const mappedValues = useMemo(() => {
    return selectedItems.map((i) => i.value);
  }, [selectedItems]);

  const clearFilter = () => {
    setSelectedItems([]);
    props.onFiltered([]);
  };

  return (
    <MultiSelect
      comboboxProps={{ withinPortal: false }}
      label={props.label}
      description={props.description}
      data={options}
      value={mappedValues}
      onChange={updateSelectedItems}
      placeholder={props.placeholder}
      leftSection={<IconSearch size={16} />}
      searchable
      clearable
      onClear={() => clearFilter()}
      maw={300}
      hidePickedOptions
      nothingFoundMessage="Such empty..."
    />
  );
}

export default MultiSelectFilter;
