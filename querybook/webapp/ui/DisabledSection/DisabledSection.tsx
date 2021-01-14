import styled from 'styled-components';

interface IDisabledSectionProps {
    disabled: boolean;
}

export const DisabledSection = styled.div<IDisabledSectionProps>`
    ${({ disabled = true }: IDisabledSectionProps) =>
        disabled &&
        `
    cursor: no-drop;
    pointer-events: none;
`};
`;
