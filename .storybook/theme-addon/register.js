import React from 'react';
import { addons, types } from '@storybook/addons';
import { ADDON_ID } from './const';
import { ThemeSelector } from './themeSelector';

addons.register(ADDON_ID, () => {
    addons.add(ADDON_ID, {
        title: 'Outline',
        type: types.TOOL,
        match: ({ viewMode }) =>
            !!(viewMode && viewMode.match(/^(story|docs)$/)),
        render: () => <ThemeSelector />,
    });
});
