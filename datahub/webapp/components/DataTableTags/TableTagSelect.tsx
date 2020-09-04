import * as React from 'react';

import {
    makeReactSelectStyle,
    miniReactSelectStyles,
} from 'lib/utils/react-select';
import { matchKeyPress } from 'lib/utils/keyboard';
import { useDataFetch } from 'hooks/useDataFetch';
import { useEvent } from 'hooks/useEvent';

import { SimpleReactSelect } from 'ui/SimpleReactSelect/SimpleReactSelect';

import './TableTagSelect.scss';

interface IProps {
    onSelect: (val: string) => any;
    isValidCheck?: (val: string) => boolean;
    existingTags?: string[];
}

const tagReactSelectStyle: {} = makeReactSelectStyle(
    true,
    miniReactSelectStyles
);

export const TableTagSelect: React.FunctionComponent<IProps> = ({
    onSelect,
    isValidCheck,
    existingTags = [],
}) => {
    const [tagString, setTagString] = React.useState('');
    const [isTyping, setIsTyping] = React.useState(false);

    const { data: rawTagSuggestions }: { data: string[] } = useDataFetch({
        url: '/tag/keyword/',
        params: {
            keyword: tagString,
        },
    });

    const tagSuggestions = React.useMemo(() => {
        return (rawTagSuggestions || []).filter(
            (str) => !existingTags.includes(str)
        );
    }, [rawTagSuggestions, existingTags]);

    const isValid = React.useMemo(() => {
        return isTyping
            ? isValidCheck
                ? isValidCheck(tagString)
                : true
            : true;
    }, [isValidCheck, tagString]);

    useEvent('keydown', (evt: KeyboardEvent) => {
        if (isTyping) {
            if (matchKeyPress(evt, 'Enter')) {
                handleSelect();
            } else if (matchKeyPress(evt, 'Esc')) {
                clearCreateState();
            }
        }
    });

    const handleSelect = React.useCallback(
        (val?) => {
            const tagVal = val ?? tagString;
            if (isValid) {
                setIsTyping(false);
                onSelect(tagVal);
                clearCreateState();
            }
        },
        [tagString]
    );

    const clearCreateState = React.useCallback(() => {
        setTagString('');
        setIsTyping(false);
    }, []);

    return (
        <div
            className={
                isValid ? 'TableTagSelect' : 'TableTagSelect invalid-string'
            }
            onClick={() => setIsTyping(true)}
        >
            <SimpleReactSelect
                value={tagString}
                options={tagSuggestions.map((tag) => ({
                    label: tag,
                    value: tag,
                }))}
                onChange={(val) => handleSelect(val)}
                selectProps={{
                    onInputChange: (newValue) => setTagString(newValue),
                    placeholder: 'alphanumeric only',
                    styles: tagReactSelectStyle,
                    onFocus: () => setIsTyping(true),
                }}
            />
        </div>
    );
};
