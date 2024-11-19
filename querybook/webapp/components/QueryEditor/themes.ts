import { monokaiInit } from '@uiw/codemirror-theme-monokai';
import { tags as t } from '@lezer/highlight';
import { xcodeLightInit } from '@uiw/codemirror-theme-xcode';

export const CustomMonokaiDarkTheme = monokaiInit({
    settings: {},
    styles: [
        { tag: [t.name], color: 'var(--text-dark)' },
        { tag: [t.constant(t.name), t.standard(t.name)], color: '#FD971F' },
    ],
});

export const CustomXcodeTheme = xcodeLightInit({
    settings: {
        background: 'var(--bg-color)',
        gutterBackground: 'var(--bg-color)',
    },
    styles: [
        { tag: [t.special(t.propertyName)], color: '#005cc5' },
        { tag: [t.constant(t.name), t.standard(t.name)], color: '#D23423' },
        { tag: [t.number], color: '#098658' },
    ],
});
