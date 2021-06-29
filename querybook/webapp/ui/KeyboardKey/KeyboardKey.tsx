import styled from 'styled-components';
import { isOSX } from 'lib/utils/keyboard';
import React, { useMemo } from 'react';

const StyledKeyboardKey = styled.span.attrs({
    className: 'KeyboardKey mr4',
})`
    cursor: default;
    border: var(--border);
    border-radius: var(--border-radius);
    background-color: var(--bg-color);
    padding: 4px 12px;
    font-family: var(--family-monospace);
    font-size: var(--small-text-size);
    text-transform: lowercase;
`;

const SpecialKeyToSymbol = {
    OSX: {
        cmd: '⌘',
        alt: '⌥',
        enter: '⏎',
    },
    Windows: {
        cmd: 'Ctrl',
        enter: '⏎',
    },
};

export const KeyboardKey: React.FC<{
    className?: string;
    value: string;
}> = ({ value, className }) => {
    const mappedKey = useMemo(() => {
        const lowerKey = value.toLowerCase();
        const specialKeyMap = isOSX
            ? SpecialKeyToSymbol.OSX
            : SpecialKeyToSymbol.Windows;
        return lowerKey in specialKeyMap ? specialKeyMap[lowerKey] : lowerKey;
    }, [value]);
    return (
        <StyledKeyboardKey className={className}>{mappedKey}</StyledKeyboardKey>
    );
};
