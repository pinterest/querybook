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
    height: ${(props) => (props.height ? props.height : '1px')};
    background-color: ${(props) =>
        props.color ? props.color : 'var(--color-invert-3)'};
    margin-left: -4px;
    margin-right: -4px;
`;
