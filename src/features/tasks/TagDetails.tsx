import { TagsInput } from "@mantine/core";
import { Tag } from "../tags/types/Tag";
import { Task } from "./types/Task";

export interface TagDetailsProps {
  task: Task;
  tagOptions: Tag[];
  readOnly: boolean;
  onTagsChanged: () => void;
}

function TagDetails(props: TagDetailsProps) {
  /** All tag options mapped to their display value to choose from. */
  const tagOptions = props.tagOptions.map((opt) => opt.value);

  /** The tags that have been selected by the user. */
  const selectedTags = props.task.tags.map((tag) => tag.value);

  return (
    <TagsInput
      label="Tags"
      data={tagOptions}
      value={selectedTags}
      readOnly={props.readOnly}
    />
  );
}

export default TagDetails;
