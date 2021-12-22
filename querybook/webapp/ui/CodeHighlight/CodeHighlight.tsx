// Modified from https://github.com/craftzdog/react-codemirror-runmode
import clsx from 'clsx';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import CodeMirror from 'lib/codemirror';
import 'codemirror/lib/codemirror.css';

export interface ICodeHighlightProps extends React.HTMLProps<HTMLDivElement> {
    className?: string;
    theme?: string;
    prefix?: string;
    language?: string;
    height?: string;

    value: string;
}

const CodeHighlightContainer = styled.div.attrs<{
    height: string;
}>({
    className: 'CodeHighlight',
})`
    &.CodeHighlight {
        white-space: pre-wrap;
        height: ${(props) => props.height};
        padding: 8px 16px;
        overflow-y: auto;
        box-shadow: none;
    }
`;

export const CodeHighlight: React.FC<ICodeHighlightProps> = ({
    className = '',
    theme = 'default',
    prefix = 'cm-',
    height = 'auto',
    language = 'text/x-hive',
    value,
    ...props
}) => {
    const styledTokens = useMemo(() => {
        let lastStyle = null;
        let tokenBuffer = '';
        const styledTokens: Array<{ className: string; text: string }> = [];

        const pushStyleToken = (text: string, style: string) =>
            styledTokens.push({
                className: style ? prefix + style : '',
                text,
            });

        CodeMirror.runMode(value, language, (token, style) => {
            if (lastStyle === style) {
                tokenBuffer += token;
            } else {
                if (tokenBuffer.length > 0) {
                    pushStyleToken(tokenBuffer, lastStyle);
                }

                tokenBuffer = token;
                lastStyle = style;
            }
        });
        pushStyleToken(tokenBuffer, lastStyle);

        return styledTokens;
    }, [value, language, prefix]);

    const codeElements = styledTokens.map((token, index) => {
        const { text, className: tokenClassName } = token;

        return (
            <span className={tokenClassName} key={index}>
                {text}
            </span>
        );
    });

    const themeClassName = theme
        .split(' ')
        .map((subtheme) => `${prefix}s-${subtheme}`)
        .join(' ');
    const wrapperClassName = clsx({
        CodeHighlight: true,
        [themeClassName]: true,
        CodeMirror: true,
        [className]: Boolean(className),
    });

    const wrapper = (
        <CodeHighlightContainer
            height={height}
            className={wrapperClassName}
            {...props}
        >
            {codeElements}
        </CodeHighlightContainer>
    );

    return wrapper;
};
