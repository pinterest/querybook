import React, {
    useState,
    useContext,
    useCallback,
    useRef,
    useImperativeHandle,
    useMemo,
} from 'react';
import { throttle } from 'lodash';
import classNames from 'classnames';

import { IconButton } from 'ui/Button/IconButton';
import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';
import { Button } from 'ui/Button/Button';
import { matchKeyPress } from 'lib/utils/keyboard';
import { ISearchOptions } from 'const/searchAndReplace';
import { SearchAndReplaceContext } from 'context/searchAndReplace';

import './SearchAndReplaceBar.scss';

export interface ISearchAndReplaceBarProps {
    onHide: () => any;

    onSearchStringChange: (s: string) => any;
    onSearchOptionsChange: (options: ISearchOptions) => any;
    moveResultIndex: (delta: number) => Promise<any>;

    onReplaceStringChange: (s: string) => any;
    onReplace: (all?: boolean) => any;
}

export interface ISearchAndReplaceBarHandles {
    focus(): void;
}

export const SearchAndReplaceBar = React.forwardRef<
    ISearchAndReplaceBarHandles,
    ISearchAndReplaceBarProps
>(
    (
        {
            onHide,
            onSearchStringChange,
            onReplaceStringChange,
            moveResultIndex,
            onReplace,
            onSearchOptionsChange,
        },
        ref
    ) => {
        const [showReplace, setShowReplace] = useState(false);
        const {
            searchState: {
                searchString,
                searchResults,
                replaceString,
                currentSearchResultIndex,
                searchOptions,
            },
        } = useContext(SearchAndReplaceContext);
        const searchInputRef = useRef<HTMLInputElement>(null);
        const replaceInputRef = useRef<HTMLInputElement>(null);
        const focusSearchInput = useCallback(() => {
            // To prevent the case when typing in search and then tab to go to replace
            // but then searching would then refocus to search input
            if (document.activeElement !== replaceInputRef.current) {
                searchInputRef.current?.focus();
            }
        }, []);

        // Throttling because if you press enter to focus it
        // might edit the cells underneath.
        const onEnterPressThrottled = useMemo(
            () =>
                throttle(() => {
                    moveResultIndex(1).then(() => {
                        focusSearchInput();
                    });
                }, 50),
            [moveResultIndex]
        );

        const onKeyDown = useCallback(
            (evt: React.KeyboardEvent) => {
                if (matchKeyPress(evt, 'Enter') && !evt.repeat) {
                    evt.stopPropagation();
                    onEnterPressThrottled();
                }
            },
            [moveResultIndex]
        );

        useImperativeHandle(ref, () => ({
            focus: () => {
                focusSearchInput();
            },
        }));

        const searchRow = (
            <div className="flex-row ">
                <div className="datadoc-search-input">
                    <DebouncedInput
                        value={searchString}
                        onChange={onSearchStringChange}
                        inputProps={{
                            autoFocus: true,
                            onKeyDown,
                            ref: searchInputRef,
                        }}
                    />
                    <TextToggleButton
                        text="Aa"
                        value={searchOptions.matchCase}
                        onChange={(matchCase) =>
                            onSearchOptionsChange({
                                ...searchOptions,
                                matchCase,
                            })
                        }
                        tooltip="Match Case"
                    />
                    <TextToggleButton
                        text=".*"
                        value={searchOptions.useRegex}
                        onChange={(useRegex) =>
                            onSearchOptionsChange({
                                ...searchOptions,
                                useRegex,
                            })
                        }
                        tooltip="Use Regex"
                    />
                </div>

                <span className="position-info ml4 mr8">
                    {searchResults.length
                        ? `${currentSearchResultIndex + 1} of ${
                              searchResults.length
                          }`
                        : 'No results'}
                </span>

                <IconButton
                    icon="arrow-up"
                    noPadding
                    onClick={() => moveResultIndex(-1)}
                />
                <IconButton
                    icon="arrow-down"
                    noPadding
                    onClick={() => moveResultIndex(1)}
                />
                <IconButton
                    className={'ml8'}
                    noPadding
                    icon="x"
                    onClick={onHide}
                />
            </div>
        );
        const replaceRow = showReplace && (
            <div className="flex-row mt4">
                <div className="datadoc-search-input">
                    <DebouncedInput
                        value={replaceString}
                        onChange={onReplaceStringChange}
                        inputProps={{ ref: replaceInputRef }}
                    />
                </div>

                <Button
                    icon="repeat"
                    type="inlineText"
                    borderless
                    aria-label="Replace"
                    data-balloon-pos="down"
                    small
                    onClick={() => onReplace()}
                />
                <Button
                    icon="repeat"
                    title="All"
                    type="inlineText"
                    borderless
                    aria-label="Replace all"
                    data-balloon-pos="down"
                    small
                    onClick={() => onReplace(true)}
                />
            </div>
        );

        return (
            <div className="SearchAndReplaceBar flex-row p4">
                <IconButton
                    noPadding
                    icon={showReplace ? 'chevron-down' : 'chevron-right'}
                    onClick={() => setShowReplace(!showReplace)}
                />
                <div>
                    {searchRow}
                    {replaceRow}
                </div>
            </div>
        );
    }
);

const TextToggleButton: React.FC<{
    value: boolean;
    onChange: (v: boolean) => any;
    text: string;
    tooltip: string;
}> = ({ value, onChange, text, tooltip }) => {
    const className = classNames({
        TextToggleButton: true,
        active: value,
        mh4: true,
    });
    return (
        <span
            className={className}
            onClick={() => onChange(!value)}
            aria-label={tooltip}
            data-balloon-pos="down"
        >
            {text}
        </span>
    );
};
