// withOutline.js

import { useMemo, useEffect } from '@storybook/addons';
import { PARAM_KEY, ThemeOptions, ThemeToClassName } from './const';

const withTheme = (StoryFn, context) => {
    const { globals } = context;
    const theme = globals[PARAM_KEY] || ThemeOptions[0];

    const body = useMemo(() => {
        return document.body;
    }, [context.id]);

    useEffect(() => {
        body.className = '';

        const className = ThemeToClassName[theme];
        if (className) {
            body.classList.add(className);
        }

        return () => {
            body.className = '';
        };
    }, [body, theme, context.id]);

    return StoryFn();
};

export const decorators = [withTheme];
