import styled from 'styled-components';

export const Divider = styled.hr<{
    marginTop?: string;
    marginBottom?: string;
    color?: string;
    height?: string;
}>`
    margin-top: ${(props) => (props.marginTop ? props.marginTop : '16px')};
    margin-bottom: ${(props) =>
        props.marginBottom ? props.marginBottom : '12px'};
    height: ${(props) => (props.height ? props.height : '2px')};
    background-color: ${(props) =>
        props.color ? props.color : 'var(--color-accent-bg)'};
`;
