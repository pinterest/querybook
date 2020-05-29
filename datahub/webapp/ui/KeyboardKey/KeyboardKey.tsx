import styled from 'styled-components';

export const KeyboardKey = styled.span.attrs<{}>({
    className: 'KeyboardKey mr4',
})`
    border: var(--border);
    border-radius: var(--border-radius);
    background-color: var(--bg-color);
    padding: 4px 12px;
    font-family: var(--family-monospace);
    font-size: var(--small-text-size);
    text-transform: lowercase;
`;
