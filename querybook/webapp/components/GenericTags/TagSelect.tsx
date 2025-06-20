import {
    makeReactSelectStyle,
    miniReactSelectStyles,
} from '../../lib/utils/react-select';
import * as React from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { useResource } from '../../hooks/useResource';
import { DataDocTagResource } from '../../resource/dataDoc';
import { SimpleReactSelect } from '../../ui/SimpleReactSelect/SimpleReactSelect';
import { TableTagResource } from '../../resource/table';

interface IProps {
    onSelect: (val: string) => any;
    existingTags?: string[];
    creatable?: boolean;
    tagType: string;
}

const tagReactSelectStyle = makeReactSelectStyle(true, miniReactSelectStyles);

function isTagValid(val: string, existingTags: string[]) {
    const regex = /^[a-z0-9_ ]{1,255}$/i;
    const match = val.match(regex);
    return Boolean(match && !existingTags.includes(val));
}

export const TagSelect: React.FunctionComponent<IProps> = ({
    onSelect,
    existingTags = [],
    creatable = false,
    tagType,
}) => {
    const [tagString, setTagString] = React.useState('');
    const [isTyping, setIsTyping] = React.useState(false);
    const debouncedTagString = useDebounce(tagString, 500);

    let resource;
    let className;
    if (tagType === 'DataDoc') {
        resource = DataDocTagResource;
        className = 'DataDocTagSelect';
    } else if (tagType === 'Table') {
        resource = TableTagResource;
        className = 'TableTagSelect';
    }

    const { data: rawTagSuggestions } = useResource(
        React.useCallback(
            () => resource.search(debouncedTagString),
            [debouncedTagString]
        )
    );

    const tagSuggestions = React.useMemo(
        () =>
            ((rawTagSuggestions as string[]) || []).filter(
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
        <div className={isValid ? className : className + ' invalid-string'}>
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
