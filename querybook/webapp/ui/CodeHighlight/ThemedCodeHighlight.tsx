import { getCodeEditorTheme } from 'lib/utils';
import React from 'react';
import { useSelector } from 'react-redux';
import type { IStoreState } from 'redux/store/types';
import { CodeHighlight, ICodeHighlightProps } from './CodeHighlight';

export const ThemedCodeHighlight: React.FC<ICodeHighlightProps> = (props) => {
    const editorTheme = useSelector((state: IStoreState) =>
        getCodeEditorTheme(state.user.computedSettings.theme)
    );

    return (
        <CodeHighlight
            {...props}
            theme={editorTheme}
            language={'text/x-hive'}
        />
    );
};
