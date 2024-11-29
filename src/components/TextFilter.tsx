import { Stack, TextInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconSearch, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import StyledActionIcon from "./StyledActionIcon";

export interface TextFilterProps {
  initialValue?: string | null;
  label?: string;
  description?: string;
  placeholder?: string;
  debounce?: number;
  onFiltered: (value: string | null) => void | Promise<void>;
}

function TextFilter(props: TextFilterProps) {
  const [searchText, setSearchText] = useState<string | undefined>(
    props.initialValue ?? ""
  );

  const [debouncedSearchText] = useDebouncedValue(
    searchText,
    props.debounce ?? 500
  );

  useEffect(() => {
    props.onFiltered(debouncedSearchText ?? null);
  }, [debouncedSearchText]);

  const clearSearchValue = () => {
    setSearchText("");
    props.onFiltered(null);
  };

  return (
    <Stack>
      <TextInput
        label={props.label}
        description={props.description}
        placeholder={props.placeholder ?? "Search..."}
        leftSection={<IconSearch size={16} />}
        rightSection={
          <StyledActionIcon
            size="sm"
            variant="transparent"
            color="dimmed"
            onClick={clearSearchValue}
          >
            <IconX size={14} />
          </StyledActionIcon>
        }
        value={searchText}
        onChange={(e) => setSearchText(e.currentTarget.value)}
      />
    </Stack>
  );
}

export default TextFilter;
