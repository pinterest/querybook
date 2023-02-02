import clsx from 'clsx';
import React from 'react';

import { matchKeyPress } from 'lib/utils/keyboard';
import { IconButton } from 'ui/Button/IconButton';
import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';
import { Icon } from 'ui/Icon/Icon';

import './SearchBar.scss';

export interface ISearchBarProps {
    className?: string;
    value: string;
    isSearching?: boolean;
    onSearch?: (value: string) => any;
    placeholder?: string;
    inputClassName?: string;

    hasIcon?: boolean;
    transparent?: boolean;
    autoFocus?: boolean;
    delayMethod?: 'throttle' | 'debounce';

    hasClearSearch?: boolean;
}

export const SearchBar: React.FunctionComponent<ISearchBarProps> = ({
    value,

    isSearching = false,
    onSearch = null,
    placeholder = 'Search',

    hasIcon = false,
    autoFocus = false,
    delayMethod = 'debounce',

    hasClearSearch = false,

    className,
    inputClassName,
    transparent,
}) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    React.useEffect(() => {
        if (autoFocus) {
            // setTimeout is needed to make the focus work
            // otherwise the component
            setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
        }
    }, []);

    const onSearchRequest = () => {
        if (onSearch) {
            onSearch(value);
        }
    };

    const onKeyDown = (event: React.KeyboardEvent) => {
        if (matchKeyPress(event, 'Enter')) {
            onSearchRequest();
        }
    };

    const searchIcon = hasIcon ? (
        <span className="SearchIcon">
            <Icon name={isSearching ? 'Loading' : 'Search'} />
        </span>
    ) : null;

    const searchBarClassName = clsx({
        SearchBar: true,
        [className]: Boolean(className),
        transparent,
    });

    const clearSearchButton =
        !searchIcon && hasClearSearch && value ? (
            <IconButton
                icon="X"
                onClick={() => onSearch('')}
                className="SearchIcon"
                noPadding
            />
        ) : null;

    return (
        <div className={searchBarClassName}>
            <DebouncedInput
                debounceMethod={delayMethod}
                onChange={onSearch}
                value={value}
                transparent={transparent}
                inputProps={{
                    placeholder,
                    className: clsx({
                        [inputClassName]: !!inputClassName,
                    }),
                    type: 'text',
                    onKeyDown,
                    ref: inputRef,
                }}
            />
            {searchIcon}
            {clearSearchButton}
        </div>
    );
};
