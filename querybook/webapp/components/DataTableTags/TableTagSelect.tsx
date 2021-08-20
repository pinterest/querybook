import * as React from 'react';

import {
    makeReactSelectStyle,
    miniReactSelectStyles,
} from 'lib/utils/react-select';
import { matchKeyPress } from 'lib/utils/keyboard';
import { useResource } from 'hooks/useResource';
import { useDebounce } from 'hooks/useDebounce';

import { SimpleReactSelect } from 'ui/SimpleReactSelect/SimpleReactSelect';

import './TableTagSelect.scss';
import { TableTagResource } from 'resource/table';

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
    const debouncedTagString = useDebounce(tagString, 500);

    const { data: rawTagSuggestions } = useResource(
        React.useCallback(() => TableTagResource.search(debouncedTagString), [
            debouncedTagString,
        ])
    );

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
                        // FIXME: this is due to ReactSelect using React 16.4 typedefs
                        const keydownEvent = (evt as unknown) as React.KeyboardEvent;
                        if (matchKeyPress(keydownEvent, 'Enter')) {
                            handleSelect();
                        } else if (matchKeyPress(keydownEvent, 'Esc')) {
                            setTagString('');
                        }
                    },
                }}
                clearAfterSelect
            />
        </div>
    );
};
