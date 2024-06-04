import { throttle } from 'lodash';
import React, {
    useCallback,
    useContext,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';

import { ISearchOptions } from 'const/searchAndReplace';
import { SearchAndReplaceContext } from 'context/searchAndReplace';
import { useEvent } from 'hooks/useEvent';
import { KeyMap, matchKeyMap, matchKeyPress } from 'lib/utils/keyboard';
import { Button, TextButton } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import { TextToggleButton } from 'ui/Button/TextToggleButton';
import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';

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
        const lastActiveElementRef = useRef<HTMLElement | Element>(
            document.activeElement
        );
        const selfRef = useRef<HTMLDivElement>(null);
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
            const activeElement = document.activeElement;
            if (
                activeElement !== replaceInputRef.current &&
                activeElement !== searchInputRef.current
            ) {
                // To prevent the case when typing in search and then tab to go to replace
                // but then searching would then refocus to search input
                searchInputRef.current?.focus();
                lastActiveElementRef.current = activeElement;
            }
        }, []);
        const handleHide = useCallback(() => {
            onHide();
            if (
                lastActiveElementRef.current &&
                lastActiveElementRef.current !== document.body
            ) {
                (lastActiveElementRef.current as HTMLElement).focus();
            }
        }, [onHide]);
        useEvent(
            'focusin',
            (e: FocusEvent) => {
                const activeElement = e.target as HTMLElement;
                if (
                    activeElement !== replaceInputRef.current &&
                    activeElement !== searchInputRef.current
                ) {
                    lastActiveElementRef.current = activeElement;
                }
            },
            {
                element: document,
            }
        );

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
                let handled = true;
                if (matchKeyPress(evt, 'Enter') && !evt.repeat) {
                    onEnterPressThrottled();
                } else if (matchKeyMap(evt, KeyMap.dataDoc.openSearch)) {
                    focusSearchInput();
                } else if (matchKeyMap(evt, KeyMap.dataDoc.closeSearch)) {
                    handleHide();
                } else {
                    handled = false;
                }

                if (handled) {
                    evt.stopPropagation();
                    evt.preventDefault();
                }
            },
            [moveResultIndex, handleHide]
        );

        useImperativeHandle(ref, () => ({
            focus: () => {
                focusSearchInput();
            },
        }));

        const noPrevRes = React.useMemo(
            () => searchResults.length <= 1,
            [searchResults.length]
        );
        const noNextRes = React.useMemo(
            () => searchResults.length <= 1,
            [searchResults.length]
        );

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
                        className="flex-center mr8"
                    />
                </div>
                <div className="data-doc-search-buttons">
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
                        className="ml16"
                    />
                </div>
                <span className="position-info mh12">
                    {searchResults.length
                        ? `${
                              searchResults.length > currentSearchResultIndex
                                  ? currentSearchResultIndex + 1
                                  : '?'
                          } of ${searchResults.length}`
                        : 'No results'}
                </span>
                <IconButton
                    icon="ArrowUp"
                    noPadding
                    onClick={() => moveResultIndex(-1)}
                    tooltip={noPrevRes ? null : 'Previous Result'}
                    tooltipPos="down"
                    size={16}
                    disabled={noPrevRes}
                />
                <IconButton
                    icon="ArrowDown"
                    noPadding
                    onClick={() => moveResultIndex(1)}
                    tooltip={noNextRes ? null : 'Next Result'}
                    tooltipPos="down"
                    size={16}
                    className="ml4"
                    disabled={noNextRes}
                />
                <IconButton
                    className="ml16"
                    noPadding
                    icon="X"
                    onClick={handleHide}
                    tooltip="Exit"
                    tooltipPos="right"
                    size={16}
                />
            </div>
        );

        const replaceRow = showReplace && (
            <div className="flex-row mt4">
                <div className="datadoc-search-input">
                    <DebouncedInput
                        value={replaceString}
                        onChange={onReplaceStringChange}
                        inputProps={{
                            ref: replaceInputRef,
                            onKeyDown,
                            placeholder: 'Replace',
                        }}
                        className="flex-center mr8"
                    />
                </div>
                <TextButton
                    icon="Repeat"
                    aria-label="Replace"
                    data-balloon-pos="down"
                    size="small"
                    onClick={() => onReplace()}
                />
                <Button
                    icon="Repeat"
                    title="All"
                    aria-label="Replace all"
                    data-balloon-pos="down"
                    size="small"
                    theme="text"
                    onClick={() => onReplace(true)}
                />
            </div>
        );

        return (
            <div className="SearchAndReplaceBar flex-row p8" ref={selfRef}>
                <IconButton
                    noPadding
                    icon={showReplace ? 'ChevronDown' : 'ChevronRight'}
                    onClick={() => setShowReplace(!showReplace)}
                    className="expand-icon m4"
                />
                <div>
                    {searchRow}
                    {replaceRow}
                </div>
            </div>
        );
    }
);
