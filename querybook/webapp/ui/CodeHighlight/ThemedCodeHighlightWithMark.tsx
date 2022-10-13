import React from 'react';
import { useSelector } from 'react-redux';

import { getCodeEditorTheme } from 'lib/utils';
import type { IStoreState } from 'redux/store/types';

import { CodeHighlightWithMark, IProps } from './CodeHighlightWithMark';

export const ThemedCodeHighlightWithMark: React.FC<
    Omit<IProps, 'theme' | 'language'>
> = (props) => {
    const editorTheme = useSelector((state: IStoreState) =>
        getCodeEditorTheme(state.user.computedSettings.theme)
    );

    return (
        <CodeHighlightWithMark
            theme={editorTheme}
            language={'text/x-hive'}
            {...props}
        />
    );
};
