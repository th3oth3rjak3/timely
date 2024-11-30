import {
  Group,
  Modal,
  Radio,
  Select,
  Stack,
  TagsInput,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconFilter, IconFilterFilled } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import StyledActionIcon from "../../components/StyledActionIcon";
import StyledButton from "../../components/StyledButton";
import useColorPalette from "../../hooks/useColorPalette";
import { useAppSelector } from "../../redux/hooks";
import { SelectOption } from "../../utilities/formUtilities";
import { splitAtUpperCase } from "../../utilities/stringUtilities";
import { Tag } from "../tags/types/Tag";
import { FilterName } from "./types/TaskSearchParams";

export type TagFilterProps = {
  tagOptions: Tag[];
  onFilter: (
    filterName: FilterName | null,
    selections: TagFilterSelection
  ) => void;
};

export type TagFilterSelection = {
  tags: Tag[] | null;
  tagFilter: string | null;
};

function QuickFilterComponent(props: TagFilterProps) {
  const [isOpen, tagFilterActions] = useDisclosure(false);
  const [selectedTags, setSelectedTags] = useState<string[] | null>(null);
  const [filterOption, setFilterOption] = useState<FilterName | null>(null);

  const isFiltered = useAppSelector(
    (state) => state.settings.taskListSettings.params.quickFilter !== null
  );

  const colorPalette = useColorPalette();

  const [errors, setErrors] = useState({
    tags: "",
    options: "",
  });

  const [tagFilter, setTagFilter] = useState<string>("all");

  const filterOptions: SelectOption[] = Object.entries(FilterName)
    .map(
      ([key, value]) =>
        ({ label: splitAtUpperCase(key), value } as SelectOption)
    )
    .slice()
    .sort((a, b) => a.value.localeCompare(b.value));

  const validators = {
    tags: (value: string[] | null, option: string | null) => {
      if (option === "tagged") {
        return value !== null && value.length > 0
          ? null
          : "Choose at least one tag";
      }

      return null;
    },
    options: (value: string | null) =>
      value !== null ? null : "Select an option.",
  };

  function handleClearFilters() {
    tagFilterActions.close();
    setSelectedTags(null);
    setFilterOption(null);
    props.onFilter(null, { tags: null, tagFilter: null });
  }

  const isValid = useMemo(() => {
    return validateForm();
  }, [selectedTags, filterOption]);

  function validateForm() {
    const tagsValid = validators.tags(selectedTags, filterOption);
    const optionsValid = validators.options(filterOption);

    setErrors({ tags: tagsValid ?? "", options: optionsValid ?? "" });

    return tagsValid === null && optionsValid === null;
  }

  function handleFilterSubmit() {
    if (!isValid) {
      return;
    }

    const tags =
      filterOption === FilterName.Tagged
        ? props.tagOptions.filter((t) => selectedTags?.includes(t.value))
        : [];
    tagFilterActions.close();
    props.onFilter(filterOption, { tags, tagFilter });
  }

  return (
    <Stack>
      <StyledActionIcon
        onClick={() => tagFilterActions.open()}
        tooltipLabel="Choose Quick Filters"
        tooltipPosition="left"
      >
        {isFiltered ? <IconFilterFilled /> : <IconFilter />}
      </StyledActionIcon>
      <Modal
        title="Choose Quick Filters"
        opened={isOpen}
        onClose={() => tagFilterActions.close()}
        closeOnClickOutside={false}
        closeOnEscape={false}
      >
        <Stack>
          <Select
            label="Quick Filter Option"
            data={filterOptions}
            allowDeselect={false}
            value={filterOption}
            onChange={(option) => {
              if (option !== null) {
                setFilterOption(option as FilterName);
              }
            }}
            error={errors["options"]}
          />
          {filterOption === FilterName.Tagged ? (
            <>
              <TagsInput
                label="Selected Tags"
                data={props.tagOptions?.map((opt) => opt.value)}
                value={selectedTags ?? undefined}
                onChange={(tags) => setSelectedTags(tags)}
                error={errors["tags"]}
              />
              <Radio.Group value={tagFilter} onChange={setTagFilter}>
                <Group>
                  <Tooltip
                    label="Tasks with any of the selected tags"
                    color={colorPalette.colorName}
                  >
                    <Radio label="Any" value="any"></Radio>
                  </Tooltip>
                  <Tooltip
                    label="Tasks with all of the selected tags"
                    color={colorPalette.colorName}
                  >
                    <Radio label="All" value="all"></Radio>
                  </Tooltip>
                </Group>
              </Radio.Group>
            </>
          ) : null}
          <Group justify="center">
            <StyledButton
              type="button"
              label="Filter"
              onClick={() => handleFilterSubmit()}
              disabled={!isValid}
            />
            <StyledButton
              type="button"
              label="Clear"
              onClick={() => handleClearFilters()}
              disabled={!isFiltered && filterOption === null}
            />
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

export default QuickFilterComponent;
