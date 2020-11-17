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

const OSXToWindows = {
    '⌘': 'ctrl',
    '⌥': 'alt',
};

export const KeyboardKey: React.FC<{
    className?: string;
    value: string;
}> = ({ value, className }) => {
    const mappedKey = useMemo(
        () => (!isOSX && value in OSXToWindows ? OSXToWindows[value] : value),
        [value]
    );
    return (
        <StyledKeyboardKey className={className}>{mappedKey}</StyledKeyboardKey>
    );
};
