import {Group, Stack, TagsInput} from "@mantine/core";
import {DatePickerInput} from "@mantine/dates";
import {FormErrors, useForm} from "@mantine/form";
import StyledButton from "../../components/StyledButton";
import useColorPalette from "../../hooks/useColorPalette";
import {Tag} from "../../models/ZodModels";
import {getDayOnlyProps} from "../../utilities/dateUtilities";
import {FilterFormInputs, MetricsFilterCriteria} from "./types";

export interface MetricsFilterProps {
  filterInputs: FilterFormInputs;
  tagOptions: Tag[];
  onFilterCleared: () => void;
  onFilterApplied: (inputs: MetricsFilterCriteria) => void;
}

function MetricsFilter({
  filterInputs,
  tagOptions,
  onFilterApplied,
  onFilterCleared,
}: MetricsFilterProps) {
  const colorPalette = useColorPalette();
  const filterForm = useForm<FilterFormInputs>({
    mode: "controlled",
    initialValues: {
      startDate: filterInputs.startDate,
      endDate: filterInputs.endDate,
      tags: filterInputs.tags,
    },
    validateInputOnChange: true,
    validateInputOnBlur: true,
    validate: (item) => {
      const errors: FormErrors = {
        startDate: null,
        endDate: null,
      };
      if (item.startDate === null || item.startDate === undefined) {
        errors.startDate = "Start Date is required.";
      }
      if (item.endDate === null || item.endDate === undefined) {
        errors.endDate = "End Date is required";
      }

      if (
        item.startDate !== null &&
        item.startDate !== undefined &&
        item.endDate !== undefined &&
        item.endDate !== null &&
        item.startDate >= item.endDate
      ) {
        errors.startDate = "Start Date must be before End Date.";
        errors.endDate = "End Date must be after Start Date.";
      }

      if (item.tags === null || item.tags === undefined) {
        errors.tags = "Tags are required.";
      }

      if (item.tags?.length === 0) {
        errors.tags = "Tags must not be empty.";
      }

      return errors;
    },
  });

  const clearFilters = () => {
    filterForm.reset();
    onFilterCleared();
  };

  const applyFilters = (values: typeof filterForm.values) => {
    if (
      values.endDate !== undefined &&
      values.endDate !== null &&
      values.startDate !== undefined &&
      values.startDate !== null &&
      values.tags !== undefined &&
      values.tags !== null
    ) {
      onFilterApplied({
        startDate: values.startDate,
        endDate: values.endDate,
        tags: tagOptions.filter((tagOption) =>
          values.tags?.includes(tagOption.value)
        ),
      });
    }
  };

  return (
    <form onSubmit={filterForm.onSubmit(applyFilters)}>
      <Stack align="center" justify="space-around" gap="xl" h="100%" w="100%">
        <DatePickerInput
          label="Start Date"
          w="300"
          getDayProps={getDayOnlyProps(
            filterForm.getValues().startDate ?? null,
            colorPalette
          )}
          {...filterForm.getInputProps("startDate")}
          key={filterForm.key("startDate")}
          highlightToday
        />
        <DatePickerInput
          label="End Date"
          w="300"
          getDayProps={getDayOnlyProps(
            filterForm.getValues().endDate ?? null,
            colorPalette
          )}
          {...filterForm.getInputProps("endDate")}
          key={filterForm.key("endDate")}
          highlightToday
        />
        <Stack gap="lg" align="center">
          <TagsInput
            w="300"
            label="Selected Tags"
            data={tagOptions}
            {...filterForm.getInputProps("tags")}
            key={filterForm.key("tags")}
          />
          <Group align="space-between">
            <StyledButton
              label="Apply"
              type="submit"
              tooltipLabel="Apply Filters"
              tooltipPosition="top"
            />
            <StyledButton
              label="Clear"
              type="button"
              onClick={clearFilters}
              tooltipLabel="Clear Filters"
              tooltipPosition="top"
            />
          </Group>
        </Stack>
      </Stack>
    </form>
  );
}

export default MetricsFilter;
