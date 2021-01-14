import styled from 'styled-components';

export const Level = styled.div.attrs<{
    dir: 'left' | 'right';
    margin: number | string;
}>({
    className: 'Level horizontal-space-between ',
})`
    ${(props) =>
        props.dir === 'right' &&
        `
        .LevelItem:only-child {
            margin-left: auto;
        }
    `};

    ${(props) =>
        props.margin &&
        `
        > :not(:first-child) {
            margin-left: ${props.margin}
        }
    `};
`;

export const LevelItem = styled.div.attrs({
    className: 'LevelItem  flex-row',
})``;
