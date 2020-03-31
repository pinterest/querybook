// Modified from https://github.com/craftzdog/react-codemirror-runmode
import { decorate } from 'core-decorators';
import classNames from 'classnames';
import React from 'react';
import memoizeOne from 'memoize-one';
import styled from 'styled-components';

import CodeMirror from 'lib/codemirror';
import 'codemirror/lib/codemirror.css';

interface IProps {
    className?: string;
    theme?: string;
    prefix?: string;
    inline?: boolean;
    language?: string;

    value: string;
}

const CodeHighlightContainer = styled.div.attrs({
    className: 'CodeHighlight',
})`
    white-space: pre-wrap;
    height: auto;
    padding: 8px 16px;
    overflow-y: scroll;
    box-shadow: none !important;
`;

export class CodeHighlight extends React.PureComponent<IProps> {
    public static defaultProps: Partial<IProps> = {
        prefix: 'cm-',
        className: '',
        theme: 'default',
        inline: false,
    };

    @decorate(memoizeOne)
    public getStyledTokens(value: string, language: string, prefix: string) {
        let lastStyle = null;
        let tokenBuffer = '';
        const styledTokens = [];

        const pushStyleToken = (str, style) =>
            styledTokens.push({
                className: style ? prefix + style : '',
                string: str,
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
    }

    public render() {
        const {
            className,
            theme,
            inline,
            language,
            prefix,
            value,
        } = this.props;

        const styledTokens = this.getStyledTokens(value, language, prefix);

        const codeElements = styledTokens.map((token, index) => {
            const { string: str, className: tokenClassName } = token;

            return (
                <span className={tokenClassName} key={index}>
                    {str}
                </span>
            );
        });

        const themeClassName = theme
            .split(' ')
            .map((subtheme) => `${prefix}s-${subtheme}`)
            .join(' ');
        const wrapperClassName = classNames({
            CodeHighlight: true,
            [themeClassName]: true,
            CodeMirror: true,
            [className]: Boolean(className),
            inline,
        });

        const wrapper = inline ? (
            <code className={wrapperClassName}>{codeElements}</code>
        ) : (
            <CodeHighlightContainer className={wrapperClassName}>
                {codeElements}
            </CodeHighlightContainer>
        );

        return wrapper;
    }
}
