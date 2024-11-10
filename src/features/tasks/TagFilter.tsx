import { Group, Modal, Select, Stack, TagsInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconFilter, IconFilterFilled } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import StyledActionIcon from "../../components/StyledActionIcon";
import StyledButton from "../../components/StyledButton";
import { useAppSelector } from "../../redux/hooks";
import { Tag } from "../tags/types/Tag";

export type TagFilterProps = {
  tagOptions: Tag[];
  onFilter: (tags: Tag[] | null) => void;
};

function TagFilter(props: TagFilterProps) {
  const [isOpen, tagFilter] = useDisclosure(false);
  const [selectedTags, setSelectedTags] = useState<string[] | null>(null);
  const [filterOption, setFilterOption] = useState<string | null>("Untagged");
  const globalTags = useAppSelector(
    (state) => state.settings.taskListSettings.params.tags
  );

  const [errors, setErrors] = useState({
    tags: "",
    options: "",
  });

  const isFiltered = useMemo(() => {
    return globalTags !== null;
  }, [globalTags]);

  const validators = {
    tags: (value: string[] | null, option: string | null) => {
      if (option === "Tagged") {
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
    tagFilter.close();
    setSelectedTags(null);
    setFilterOption("Untagged");
    props.onFilter(null);
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
      filterOption === "Tagged"
        ? props.tagOptions.filter((t) => selectedTags?.includes(t.value))
        : [];
    tagFilter.close();
    props.onFilter(tags);
  }

  return (
    <Stack>
      <StyledActionIcon
        onClick={() => tagFilter.open()}
        tooltipLabel="Filter By Tags"
        tooltipPosition="left"
      >
        {isFiltered ? <IconFilterFilled /> : <IconFilter />}
      </StyledActionIcon>
      <Modal
        title="Filter By Tags"
        opened={isOpen}
        onClose={() => tagFilter.close()}
        closeOnClickOutside={false}
        closeOnEscape={false}
      >
        <Stack>
          <Select
            label="Option"
            data={["Tagged", "Untagged"]}
            allowDeselect={false}
            value={filterOption}
            onChange={(option) => {
              if (option !== null) {
                setFilterOption(option);
              }
            }}
            error={errors["options"]}
          />
          {filterOption === "Tagged" ? (
            <TagsInput
              label="Selected Tags"
              data={props.tagOptions?.map((opt) => opt.value)}
              value={selectedTags ?? undefined}
              onChange={(tags) => setSelectedTags(tags)}
              error={errors["tags"]}
            />
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
              disabled={globalTags === null}
            />
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

export default TagFilter;
