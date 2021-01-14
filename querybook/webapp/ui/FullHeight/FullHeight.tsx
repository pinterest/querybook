import styled from 'styled-components';

export interface IFullHeightProps {
    flex?: false | 'column' | 'row';
}

export const FullHeight = styled.div<IFullHeightProps>`
    height: 100%;

    ${({ flex = false }) =>
        flex
            ? `
        display: flex;
        flex-direction: ${flex};
    `
            : ''};
`;
