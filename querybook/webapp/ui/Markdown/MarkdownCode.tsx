import React, { useMemo } from 'react';
import styled from 'styled-components';

import { ThemedCodeHighlight } from 'ui/CodeHighlight/ThemedCodeHighlight';
import { CopyButton } from 'ui/CopyButton/CopyButton';

const languageToCodemirrorLanguage = {
    sql: 'text/x-hive',
    py: 'text/x-python',
    js: 'text/javascript',
    text: 'text/plain',
};

const StyledMarkdownCode = styled.div.attrs({ className: 'MarkdownCode' })`
    position: relative;
    .CopyButton {
        position: absolute;
        top: 6px;
        right: 6px;
        padding: 0;
        visibility: hidden;
    }

    &:hover .CopyButton {
        visibility: visible;
    }

    .CodeHighlight {
        padding: 12px 16px;
    }
`;

export const MarkdownCode: React.FC<{
    className: string;
    children: string;
}> = ({ className, children }) => {
    const language = useMemo(() => {
        let lang = 'text';
        if (className && className.startsWith('lang-')) {
            lang = className.replace('lang-', '');
        }
        return (
            languageToCodemirrorLanguage[lang] ??
            languageToCodemirrorLanguage.text
        );
    }, [className]);

    return (
        <StyledMarkdownCode>
            <ThemedCodeHighlight value={children} language={language} />{' '}
            <CopyButton copyText={children} theme="text" />
        </StyledMarkdownCode>
    );
};
