import React, { useMemo } from 'react';
import styled from 'styled-components';

import { getKeySymbol } from 'lib/utils/keyboard';

const StyledKeyboardKey = styled.span.attrs({
    className: 'KeyboardKey mr4',
})`
    cursor: default;
    border: var(--border);
    border-radius: var(--border-radius-sm);
    background-color: var(--bg-light);
    padding: 4px 12px;
    font-family: var(--font-monospace);
    font-size: var(--small-text-size);
    text-transform: lowercase;
`;

export const KeyboardKey: React.FC<{
    className?: string;
    value: string;
}> = ({ value, className }) => {
    const mappedKey = useMemo(() => getKeySymbol(value), [value]);
    return (
        <StyledKeyboardKey className={className}>{mappedKey}</StyledKeyboardKey>
    );
};
