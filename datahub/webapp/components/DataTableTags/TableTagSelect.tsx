import * as React from 'react';

import {
    makeReactSelectStyle,
    miniReactSelectStyles,
} from 'lib/utils/react-select';
import { matchKeyPress } from 'lib/utils/keyboard';
import { useDataFetch } from 'hooks/useDataFetch';
import { useDebounce } from 'hooks/useDebounce';

import { SimpleReactSelect } from 'ui/SimpleReactSelect/SimpleReactSelect';

import './TableTagSelect.scss';

interface IProps {
    onSelect: (val: string) => any;
    isValidCheck?: (val: string) => boolean;
    existingTags?: string[];
}

const tagReactSelectStyle = makeReactSelectStyle(true, miniReactSelectStyles);

export const TableTagSelect: React.FunctionComponent<IProps> = ({
    onSelect,
    isValidCheck,
    existingTags = [],
}) => {
    const [tagString, setTagString] = React.useState('');
    const [isTyping, setIsTyping] = React.useState(false);

    const { data: rawTagSuggestions } = useDataFetch<string[]>({
        url: '/tag/keyword/',
        params: {
            keyword: useDebounce(tagString, 500),
        },
    });

    const tagSuggestions = React.useMemo(
        () =>
            (rawTagSuggestions || []).filter(
                (str) => !existingTags.includes(str)
            ),
        [rawTagSuggestions, existingTags]
    );

    const isValid = React.useMemo(
        () => (isTyping && isValidCheck ? isValidCheck(tagString) : true),
        [isValidCheck, tagString]
    );

    const handleSelect = React.useCallback(
        (val?: string) => {
            const tagVal = val ?? tagString;
            if (isValid) {
                setTagString('');
                onSelect(tagVal);
            }
        },
        [tagString, onSelect]
    );

    return (
        <div
            className={
                isValid ? 'TableTagSelect' : 'TableTagSelect invalid-string'
            }
        >
            <SimpleReactSelect
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
                    onKeyDown: (evt) => {
                        if (matchKeyPress(evt, 'Enter')) {
                            handleSelect();
                        } else if (matchKeyPress(evt, 'Esc')) {
                            setTagString('');
                        }
                    },
                }}
                clearAfterSelect
            />
        </div>
    );
};
