// OutlineSelector.js

import React, { memo } from 'react';
import {
    Icons,
    IconButton,
    WithTooltip,
    TooltipLinkList,
} from '@storybook/components';
import { useGlobals } from '@storybook/api';
import { PARAM_KEY, ThemeOptions } from './const';

function getDisplayedItems(selectedTheme, onSelection) {
    return ThemeOptions.map((theme) => ({
        id: theme,
        title: theme,
        value: theme,
        active: theme === selectedTheme,
        onClick: () => onSelection(theme),
    }));
}

function useGlobalThemeState() {
    const [globals, updateGlobals] = useGlobals();
    const theme = globals[PARAM_KEY] || ThemeOptions[0];

    const setTheme = React.useCallback(
        (newTheme) =>
            updateGlobals({
                [PARAM_KEY]: newTheme,
            }),
        [updateGlobals]
    );

    return [theme, setTheme];
}

export const ThemeSelector = memo(() => {
    const [theme, setTheme] = useGlobalThemeState();

    return (
        <>
            <WithTooltip
                placement="top"
                trigger="click"
                closeOnClick
                tooltip={({ onHide }) => {
                    return (
                        <TooltipLinkList
                            links={getDisplayedItems(theme, (newTheme) => {
                                setTheme(newTheme);
                                onHide();
                            })}
                        />
                    );
                }}
            >
                <IconButton key="theme" title="Change component theme">
                    <Icons icon="paintbrush" /> {theme}
                </IconButton>
            </WithTooltip>
        </>
    );
});
