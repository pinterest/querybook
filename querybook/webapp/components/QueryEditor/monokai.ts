import { monokaiInit } from '@uiw/codemirror-theme-monokai';
import { tags as t } from '@lezer/highlight';

export const CustomMonokaiDarkTheme = monokaiInit({
    settings: {},
    styles: [{ tag: [t.name], color: 'var(--text-dark)' }],
});
