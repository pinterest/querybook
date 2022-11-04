import React from 'react';
import ReactJson, { ReactJsonViewProps, ThemeObject } from 'react-json-view';

const ReactJsonTheme: ThemeObject = {
    base00: 'transparent', // background
    base01: 'var(--text)', // not used
    base02: 'var(--color-accent-dark)', // vertical lines, null value frame
    base03: 'var(--text)', // not used
    base04: 'var(--text-light)', // number of items
    base05: 'var(--text)', // not used
    base06: 'var(--text)', // not used
    base07: 'var(--color-accent-dark)', // struct keys, curly brackets, colon
    base08: 'var(--text)', // not used
    base09: 'var(--text)', // string value, ellipsis
    base0A: 'var(--color-accent-lightest)', // null value text
    base0B: 'var(--text)', // not used
    base0C: 'var(--color-accent-dark)', // array indices
    base0D: 'var(--color-accent-dark)', // collapse
    base0E: 'var(--color-accent-dark)', // expand
    base0F: 'var(--text)', // int value
};

interface IProps {
    json: any;
}

export const Json: React.FC<IProps & Partial<ReactJsonViewProps>> = ({
    json,
    ...props
}) => (
    <ReactJson
        collapsed={1} // keep first level expanded by default
        displayDataTypes={false}
        enableClipboard={false}
        name={false}
        quotesOnKeys={false}
        src={json}
        theme={ReactJsonTheme}
        {...props}
    />
);
