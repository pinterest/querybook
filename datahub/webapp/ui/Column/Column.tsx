import styled from 'styled-components';

export const Columns = styled.div.attrs({
    className: 'Columns',
})`
    display: flex;
    margin-left: -12px;
    margin-right: -12px;
    margin-top: -12px;

    .columns:last-child {
        margin-bottom: -12px;
    }
    .columns:not(:last-child) {
        margin-bottom: 12px;
    }
`;

export const Column = styled.div.attrs({
    className: 'Column',
})`
    display: block;
    flex-basis: 0;
    flex-grow: 1;
    flex-shrink: 1;
    padding: 12px;
`;
