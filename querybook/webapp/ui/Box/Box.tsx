import styled from 'styled-components';

export const Box = styled.div.attrs({
    className: 'Box',
})`
    background-color: var(--bg-color);
    box-shadow: var(--box-shadow);
    padding: 18px;
    border-radius: var(--border-radius);
`;
