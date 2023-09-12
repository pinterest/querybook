import * as React from 'react';

import { useDebounce } from 'hooks/useDebounce';
import { useResource } from 'hooks/useResource';
import {
    makeReactSelectStyle,
    miniReactSelectStyles,
} from 'lib/utils/react-select';
import { TableTagResource } from 'resource/table';
import { SimpleReactSelect } from 'ui/SimpleReactSelect/SimpleReactSelect';

import './TableTagSelect.scss';

interface IProps {
    onSelect: (val: string) => any;
    existingTags?: string[];
    creatable?: boolean;
}

const tagReactSelectStyle = makeReactSelectStyle(true, miniReactSelectStyles);

function isTagValid(val: string, existingTags: string[]) {
    const regex = /^[a-z0-9_ ]{1,255}$/i;
    const match = val.match(regex);
    return Boolean(match && !existingTags.includes(val));
}

export const TableTagSelect: React.FunctionComponent<IProps> = ({
    onSelect,
    existingTags = [],
    creatable = false,
}) => {
    const [tagString, setTagString] = React.useState('');
    const [isTyping, setIsTyping] = React.useState(false);
    const debouncedTagString = useDebounce(tagString, 500);

    const { data: rawTagSuggestions } = useResource(
        React.useCallback(
            () => TableTagResource.search(debouncedTagString),
            [debouncedTagString]
        )
    );

    const tagSuggestions = React.useMemo(
        () =>
            (rawTagSuggestions || []).filter(
                (str) => !existingTags.includes(str)
            ),
        [rawTagSuggestions, existingTags]
    );

    const isValid = React.useMemo(
        () =>
            isTyping ? !tagString || isTagValid(tagString, existingTags) : true,
        [existingTags, tagString, isTyping]
    );

    const handleSelect = React.useCallback(
        (val: string) => {
            const tagVal = val ?? tagString;
            const valid = isTagValid(tagVal, existingTags);
            if (valid) {
                setTagString('');
                onSelect(tagVal);
            }
        },
        [tagString, onSelect, existingTags]
    );

    return (
        <div
            className={
                isValid ? 'TableTagSelect' : 'TableTagSelect invalid-string'
            }
        >
            <SimpleReactSelect
                creatable={creatable}
                value={tagString}
                options={tagSuggestions}
                onChange={(val) => handleSelect(val)}
                selectProps={{
                    onInputChange: (newValue) => setTagString(newValue),
                    placeholder: 'alphanumeric only',
                    styles: tagReactSelectStyle,
                    onFocus: () => setIsTyping(true),
                    onBlur: () => setIsTyping(false),
                    noOptionsMessage: () => null,
                }}
                clearAfterSelect
            />
        </div>
    );
};
