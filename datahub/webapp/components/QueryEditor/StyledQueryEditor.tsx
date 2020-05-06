import styled from 'styled-components';

export interface IStyledQueryEditorProps {
    fontSize?: string;
    height?: 'auto' | 'full' | 'fixed';
}

export const StyledQueryEditor = styled.div.attrs({
    className: 'QueryEditor',
})<IStyledQueryEditorProps>`
    .CodeMirror {
        ${({ fontSize }) => (fontSize ? `font-size: ${fontSize};` : '')};
    }

    ${({ height }) =>
        height === 'full'
            ? `
        &,
        .react-codemirror2,
        .CodeMirror,
        .CodeMirror-scroll,
        .CodeMirror-sizer,
        .CodeMirror-gutter,
        .CodeMirror-gutters,
        .CodeMirror-linenumber {
            height: 100%;
        }
    `
            : height === 'auto'
            ? `
        .CodeMirror {
            height: auto;
        }
    `
            : ''}
`;
