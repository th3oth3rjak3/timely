import { ActionIcon, Button, Group, Modal, Stack, Text, TextInput, useMantineTheme } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { IconEdit, IconPlus, IconSearch, IconTrash, IconX } from "@tabler/icons-react";
import { ContextMenuContent, useContextMenu } from "mantine-contextmenu";
import { DataTable } from "mantine-datatable";
import { useEffect, useState } from "react";
import MyTooltip from "../../components/MyTooltip";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { setCurrentTagPage, setTagPageSize, setTagSearchParams, setTagSortStatus } from "../../redux/reducers/settingsSlice";
import { validateLength } from "../../utilities/formUtilities";
import useColorService from "../settings/hooks/useColorService";
import useFetchTags from "./hooks/useFetchTags";
import useTagService from "./hooks/useTagService";
import { NewTag, Tag } from "./types/Tag";

function TagsList() {

    const tagSearchParams = useAppSelector(state => state.settings.tagListSettings.params);
    const pageSize = useAppSelector(state => state.settings.tagListSettings.params.pageSize);
    const pageSizeOptions = useAppSelector(state => state.settings.tagListSettings.pageSizeOptions);
    const sortStatus = useAppSelector(state => state.settings.tagListSettings.sortStatus);
    const [loading, setLoading] = useState(true);
    const isTouchScreen = useMediaQuery('(pointer: coarse)');

    const { tags, recordCount, fetchTags } = useFetchTags(tagSearchParams);
    const theme = useMantineTheme();
    const userSettings = useAppSelector(state => state.settings.userSettings);
    const { colorPalette } = useColorService(theme, userSettings);

    const [newFormOpened, newFormActions] = useDisclosure(false);
    const [editFormOpened, editFormActions] = useDisclosure(false);

    const { showContextMenu, hideContextMenu } = useContextMenu();
    const dispatch = useAppDispatch();
    const { deleteTag, createNewTag, editTag } = useTagService(fetchTags);

    useEffect(() => {
        fetchTags().then(() => setLoading(false));
    }, [tagSearchParams]);


    const validators = {
        value: (value?: string | null) => validateLength({ fieldName: "Tag", value, minValue: 1, maxValue: 25 }),
    }

    const editForm = useForm<Tag>({
        mode: 'uncontrolled',
        validate: validators,
        validateInputOnChange: true,
        validateInputOnBlur: true,
    });

    const newForm = useForm<NewTag>({
        mode: 'uncontrolled',
        validate: validators,
        validateInputOnChange: true,
        validateInputOnBlur: true,
        initialValues: {
            value: ""
        }
    });

    function closeNewForm() {
        newFormActions.close();
        newForm.reset();
    }

    function closeEditForm() {
        editFormActions.close();
        editForm.reset();
    }

    const beginEditingTag = (tag: Tag) => {
        editForm.setValues({
            id: tag.id,
            value: tag.value,
        });
        editFormActions.open();
    }


    function getContextMenuItems(tag: Tag): ContextMenuContent {
        const deleteTagItem = {
            key: 'delete-tag',
            title: 'Delete Tag',
            icon: <IconTrash size={16} />,
            onClick: () => deleteTag(tag),
        };

        const editTagItem = {
            key: 'edit-tag',
            title: 'Edit Tag',
            icon: <IconEdit size={16} />,
            onClick: () => beginEditingTag(tag)
        }

        return [
            editTagItem,
            deleteTagItem,
        ];
    }

    function updateTagQuery(value: string | null) {
        dispatch(setTagSearchParams({
            ...tagSearchParams,
            page: 1,
            queryString: value ?? null,
        }))
    }

    function updatePageSize(size: number) {
        dispatch(setCurrentTagPage(1));
        dispatch(setTagPageSize(size));
    }

    const onValidNewTagSubmit = async (newTag: NewTag) => {
        await createNewTag(newTag.value);
        newForm.reset();
        newFormActions.close();
    }

    const onValidEditTagSubmit = async (editedTag: Tag) => {
        const updatedItem = { ...editedTag };
        editForm.reset();
        editForm.clearErrors();
        editFormActions.close();
        await editTag(updatedItem);
    }

    const columns = [
        {
            accessor: "value",
            title: "Tag Name",
            sortable: true,
            filter: (
                <TextInput label="Tag"
                    description="Search for tags which contain the specified text"
                    placeholder="Search..."
                    leftSection={<IconSearch size={16} />}
                    rightSection={
                        <ActionIcon size="sm" variant="transparent" c="dimmed" onClick={() => updateTagQuery("")}>
                            <IconX size={14} />
                        </ActionIcon>
                    }
                    value={tagSearchParams.queryString || ""}
                    onChange={(e) => updateTagQuery(e.currentTarget.value)}
                />
            ),
            filtering: tagSearchParams.queryString !== null && tagSearchParams.queryString !== "",
            ellipsis: false,
        }
    ];

    return (
        <Stack m={10}>
            <Group justify="space-between">
                <Text size="xl">Tags</Text>
                <Group>
                    <MyTooltip label="Create New Tag" position="left" colorPalette={colorPalette}>
                        <ActionIcon variant={colorPalette.variant} onClick={() => newFormActions.open()}>
                            <IconPlus />
                        </ActionIcon>
                    </MyTooltip>
                </Group>
            </Group>
            {loading
                ? <></>
                : <DataTable
                    textSelectionDisabled={isTouchScreen}
                    onRowContextMenu={({ record, event }) => showContextMenu(getContextMenuItems(record))(event)}
                    onScroll={hideContextMenu}
                    withTableBorder
                    withColumnBorders
                    fz="sm"
                    columns={columns}
                    records={tags}
                    page={tagSearchParams.page}
                    totalRecords={recordCount}
                    recordsPerPage={pageSize}
                    onPageChange={(page) => dispatch(setCurrentTagPage(page))}
                    recordsPerPageOptions={pageSizeOptions}
                    onRecordsPerPageChange={(size) => updatePageSize(size)}
                    key={"id"}
                    sortStatus={sortStatus}
                    onSortStatusChange={status => dispatch(setTagSortStatus(status))}
                    paginationActiveBackgroundColor={colorPalette.background}
                    paginationActiveTextColor={colorPalette.color}
                    paginationSize="xs"
                />}
            <Modal opened={newFormOpened} onClose={closeNewForm} title="New Tag" closeOnClickOutside={false} closeOnEscape={false}>
                <form onSubmit={newForm.onSubmit(onValidNewTagSubmit, console.log)}>
                    <Stack gap="sm">
                        <TextInput withAsterisk label="Tag" key={newForm.key("value")} {...newForm.getInputProps("value")} />
                    </Stack>
                    <Group justify="flex-end" mt="md">
                        <Button type="submit" variant={colorPalette.variant} color={colorPalette.colorName} disabled={!newForm.isValid()}>Submit</Button>
                    </Group>
                </form>
            </Modal>
            <Modal opened={editFormOpened} title="Edit Tag" onClose={closeEditForm} closeOnClickOutside={false} closeOnEscape={false}>
                <form onSubmit={editForm.onSubmit(onValidEditTagSubmit)}>
                    <Stack gap="sm">
                        <TextInput withAsterisk label="Tag" key={editForm.key("value")} {...editForm.getInputProps("value")} />
                    </Stack>
                    <Group justify="flex-end" mt="md">
                        <Button type="submit" variant={colorPalette.variant} color={colorPalette.colorName} disabled={!editForm.isValid()}>Submit</Button>
                    </Group>
                </form>
            </Modal>
        </Stack>
    );
}

export default TagsList;