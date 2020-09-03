import * as React from 'react';
import { useDispatch } from 'react-redux';

import { ITagItem } from 'const/tag';
import { useDataFetch } from 'hooks/useDataFetch';
import { useEvent } from 'hooks/useEvent';
import { matchKeyPress } from 'lib/utils/keyboard';
import { createTableTagItem } from 'redux/tag/action';
import { Dispatch } from 'redux/store/types';

import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';
import { IconButton } from 'ui/Button/IconButton';

import './CreateDataTableTag.scss';
import { ReactSelectField } from 'ui/FormikField/ReactSelectField';
import { FormField } from 'ui/Form/FormField';

interface IProps {
    tableId: number;
    tags: ITagItem[];
}

export const CreateDataTableTag: React.FunctionComponent<IProps> = ({
    tableId,
    tags,
}) => {
    const dispatch: Dispatch = useDispatch();

    const [tagString, setTagString] = React.useState('');
    const [isAdding, setIsAdding] = React.useState(false);

    const existingTags = React.useMemo(
        () => (tags || []).map((tag) => tag.tag_name),
        [tags]
    );

    const createTag = React.useCallback(
        (tag: string) => dispatch(createTableTagItem(tableId, tag)),
        [tableId]
    );

    const isValid = React.useMemo(() => {
        if (tagString.length === 0) return true;
        const regex = /^[a-z0-9]+$/i;
        const match = tagString.match(regex);
        return Boolean(match && !existingTags.includes(tagString));
    }, [tagString]);

    const {
        data: rawTagSuggestions,
        forceFetch: loadTagSuggestions,
    }: { data: string[]; forceFetch } = useDataFetch({
        url: '/tag/prefix/',
        params: {
            prefix: tagString,
        },
        fetchOnMount: false,
    });

    const tagSuggestions = React.useMemo(() => {
        return (rawTagSuggestions || []).filter(
            (str) => !existingTags.includes(str)
        );
    }, [tagString, rawTagSuggestions, existingTags]);

    React.useEffect(() => {
        if (isAdding) {
            loadTagSuggestions();
        }
    }, [tagString, isAdding]);

    useEvent('keydown', (evt: KeyboardEvent) => {
        if (isAdding) {
            if (matchKeyPress(evt, 'Enter')) {
                onCreateTag();
            } else if (matchKeyPress(evt, 'Esc')) {
                clearCreateState();
            }
        }
    });

    const clearCreateState = React.useCallback(() => {
        setTagString('');
        setIsAdding(false);
    }, []);

    const onCreateTag = React.useCallback(async () => {
        await createTag(tagString);
        clearCreateState();
    }, [tagString]);

    const makeAddDOM = () =>
        isAdding ? (
            <div className="CreateDataTableTag-input flex-row">
                <DebouncedInput
                    value={tagString}
                    onChange={(str) => setTagString(str)}
                    inputProps={{ placeholder: 'alphanumeric only' }}
                    className={isValid ? '' : 'invalid-string'}
                    options={tagSuggestions}
                    optionKey={`data-table-tags-${tableId}`}
                />

                {tagString.length && isValid ? (
                    <IconButton icon="plus" onClick={onCreateTag} size={20} />
                ) : (
                    <IconButton
                        icon="x"
                        onClick={() => setIsAdding(false)}
                        size={20}
                    />
                )}
            </div>
        ) : (
            <IconButton
                icon="plus"
                onClick={() => setIsAdding(true)}
                tooltip="Add tag"
                tooltipPos="right"
                size={20}
            />
        );
    return <div className="CreateDataTableTag flex-row">{makeAddDOM()}</div>;
};
