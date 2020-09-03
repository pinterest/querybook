import * as React from 'react';
import { useDispatch } from 'react-redux';

import { ITagItem } from 'const/tag';
import { useDataFetch } from 'hooks/useDataFetch';
import { useEvent } from 'hooks/useEvent';
import { matchKeyPress } from 'lib/utils/keyboard';
import { createTableTagItem } from 'redux/tag/action';
import { Dispatch } from 'redux/store/types';

import { FormField } from 'ui/Form/FormField';
import { IconButton } from 'ui/Button/IconButton';
import { SimpleReactSelect } from 'ui/SimpleReactSelect/SimpleReactSelect';

import './CreateDataTableTag.scss';

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
    // react-select clears selected value on blur
    const [
        preventInputClearOnBlur,
        setPreventInputClearOnBlur,
    ] = React.useState(false);

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
            if (preventInputClearOnBlur) setPreventInputClearOnBlur(false);
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
        if (isValid && tagString.length) {
            await createTag(tagString);
            clearCreateState();
        }
    }, [tagString]);

    const makeAddDOM = () =>
        isAdding ? (
            <div className="CreateDataTableTag-input flex-row">
                <FormField error={isValid ? null : 'invalid input'}>
                    <SimpleReactSelect
                        value={tagString}
                        options={tagSuggestions.map((tag) => ({
                            label: tag,
                            value: tag,
                        }))}
                        onChange={(value) => setTagString(value)}
                        selectProps={{
                            onInputChange: (newValue) => {
                                if (!preventInputClearOnBlur) {
                                    setTagString(newValue);
                                }
                            },
                            onBlur: async () => {
                                await setPreventInputClearOnBlur(true);
                            },
                            placeholder: 'alphanumeric only',
                        }}
                    />
                </FormField>
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
